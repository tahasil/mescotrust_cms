import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, unlinkSync, existsSync, rmSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import Page from "@/models/Page";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

const COMPONENT_ID_RE = /^[A-Za-z][A-Za-z0-9]*$/;
const APPEARANCE_ONLY_IDS = new Set(["Header", "Footer"]);
const LATEST_NEWS_ID = "LatestNews";
const LEGACY_LATEST_NEWS_ID = "LatestEvents1";

function canonicalComponentId(id) {
  return id === LEGACY_LATEST_NEWS_ID ? LATEST_NEWS_ID : id;
}

function metadataQuery(id) {
  return id === LATEST_NEWS_ID
    ? { componentId: { $in: [LATEST_NEWS_ID, LEGACY_LATEST_NEWS_ID] } }
    : { componentId: id };
}

function isValidComponentId(value) {
  return COMPONENT_ID_RE.test(String(value || ""));
}

function resolveWithin(baseDir, ...segments) {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, ...segments);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error("Unsafe filesystem path");
  }
  return resolved;
}

/** Remove blocks with baseComponent === componentId from layout (and from nested Section layouts). */
function filterLayoutBlocks(layout, componentId) {
  if (!Array.isArray(layout)) return [];
  return layout
    .filter((block) => (block?.baseComponent || "") !== componentId)
    .map((block) => {
      if (
        block?.baseComponent === "Section" &&
        Array.isArray(block?.props?.layout)
      ) {
        return {
          ...block,
          props: {
            ...block.props,
            layout: filterLayoutBlocks(block.props.layout, componentId),
          },
        };
      }
      return block;
    });
}

/** GET: fetch one site component metadata by componentId */
export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const requestedId = (params?.id || "").trim();
  const id = canonicalComponentId(requestedId);
  if (!id || !isValidComponentId(id)) {
    return NextResponse.json({ error: "Invalid component id" }, { status: 400 });
  }
  if (APPEARANCE_ONLY_IDS.has(id)) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const doc = await SiteComponentMeta.findOne(metadataQuery(id))
      .sort({ componentId: -1 })
      .lean();
    const isInRegistry = SITE_COMPONENT_IDS.includes(id);
    if (!doc && !isInRegistry) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const defaultPosition = "after";
    const defaultOrder = Math.max(0, SITE_COMPONENT_IDS.indexOf(id));
    const fallbackDisplayName =
      id === "OurImpact"
        ? "Our Impact"
        : id === "VolunteerMesco"
          ? "Volunteer Mesco"
        : id === LATEST_NEWS_ID
          ? "Latest News"
          : id;
    const payload = {
      componentId: id,
      displayName:
        id === LATEST_NEWS_ID &&
        (!doc?.displayName ||
          doc.displayName === LEGACY_LATEST_NEWS_ID ||
          doc.displayName === "Latest Events")
          ? "Latest News"
          : doc?.displayName || fallbackDisplayName,
      global: doc?.global ?? false,
      order: doc?.order ?? defaultOrder,
      position: doc?.position || defaultPosition,
      enabled: doc?.enabled !== false,
    };
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** PUT: update metadata for a site component (displayName, global, order, position) */
export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const requestedId = (params?.id || "").trim();
  const id = canonicalComponentId(requestedId);
  if (!id || !isValidComponentId(id)) {
    return NextResponse.json(
      { error: "Invalid component id" },
      { status: 400 },
    );
  }
  if (APPEARANCE_ONLY_IDS.has(id)) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { displayName, global, order, position, enabled } = body;

    await connectDB();
    let doc = await SiteComponentMeta.findOne(metadataQuery(id)).sort({
      componentId: -1,
    });
    const isInRegistry = SITE_COMPONENT_IDS.includes(id);
    if (!doc) {
      if (!isInRegistry) {
        return NextResponse.json(
          { error: "Unknown component id" },
          { status: 400 },
        );
      }
      doc = await SiteComponentMeta.create({
        componentId: id,
        displayName:
          id === "OurImpact"
            ? "Our Impact"
            : id === LATEST_NEWS_ID
              ? "Latest News"
              : id,
        global: false,
        order: SITE_COMPONENT_IDS.indexOf(id),
        position: "after",
        enabled: typeof enabled === "boolean" ? enabled : true,
      });
    }

    if (
      id === LATEST_NEWS_ID &&
      doc.componentId === LEGACY_LATEST_NEWS_ID
    ) {
      doc.componentId = LATEST_NEWS_ID;
    }

    if (typeof displayName === "string")
      doc.displayName = displayName.trim() || id;
    if (typeof global === "boolean") doc.global = global;
    if (typeof order === "number") doc.order = order;
    if (position === "before" || position === "after") doc.position = position;
    if (typeof enabled === "boolean") doc.enabled = enabled;

    await doc.save();
    const out = await SiteComponentMeta.findOne({ componentId: id }).lean();
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE: remove site component — removes from registry, index, deletes file and DB meta */
export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = (params?.id || "").trim();
  if (!id || !isValidComponentId(id)) {
    return NextResponse.json(
      { error: "Invalid component id" },
      { status: 400 },
    );
  }
  if (APPEARANCE_ONLY_IDS.has(id)) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const root = process.cwd();
    const registryPath = resolveWithin(root, "lib", "siteComponentRegistry.js");
    const siteDir = resolveWithin(root, "components", "site");
    const indexPath = resolveWithin(siteDir, "index.js");

    // Remove from lib/siteComponentRegistry.js
    let registryContent = readFileSync(registryPath, "utf8");
    const arrayMatch = registryContent.match(
      /SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/,
    );
    if (arrayMatch) {
      const ids = arrayMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
        .filter((existingId) => existingId !== id);
      registryContent = registryContent.replace(
        /(SITE_COMPONENT_IDS\s*=\s*\[)[^\]]*(\])/,
        `$1${ids.map((existingId) => `"${existingId}"`).join(", ")}$2`,
      );
      writeFileSync(registryPath, registryContent, "utf8");
    }

    // Remove export, import EditForm, and EDITABLE_SITE_EDIT_FORMS entry from components/site/index.js
    let indexContent = readFileSync(indexPath, "utf8");
    indexContent = indexContent
      .split(/\r?\n/)
      .filter((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("export ") && trimmed.includes(` from "./${id}/"`)) return false;
        if (trimmed.startsWith("export ") && trimmed.includes(` from "./${id}";`)) return false;
        const exportMatch = trimmed.match(/export\s*\{\s*default\s+as\s+(\w+)/);
        if (exportMatch && exportMatch[1] === id) return false;
        if (trimmed.includes(`import ${id}EditForm from "./${id}/EditForm"`)) return false;
        return true;
      })
      .join("\n");
    indexContent = indexContent.replace(
      new RegExp(`\\s*${id}:\\s*${id}EditForm,?\\n?`, "g"),
      "",
    );
    writeFileSync(
      indexPath,
      indexContent.replace(/\n{2,}/g, "\n").trimEnd() + "\n",
      "utf8",
    );

    // Delete component: folder (new 3-file structure) or single file (legacy)
    const componentFolder = resolveWithin(siteDir, id);
    const componentFile = resolveWithin(siteDir, `${id}.js`);
    if (existsSync(componentFolder)) {
      try {
        rmSync(componentFolder, { recursive: true });
      } catch (fileErr) {
        console.warn(`[site-components] Could not delete folder ${componentFolder}:`, fileErr?.message);
      }
    } else if (existsSync(componentFile)) {
      try {
        unlinkSync(componentFile);
      } catch (fileErr) {
        console.warn(`[site-components] Could not delete file ${componentFile}:`, fileErr?.message);
      }
    }

    // Remove this component from all pages' layout (top-level and inside Section blocks)
    const pages = await Page.find({}).lean();
    for (const page of pages) {
      const layout = page?.layout;
      if (!Array.isArray(layout) || layout.length === 0) continue;
      const newLayout = filterLayoutBlocks(layout, id);
      if (newLayout.length !== layout.length) {
        await Page.updateOne(
          { _id: page._id },
          { $set: { layout: newLayout } },
        );
      }
    }

    await SiteComponentMeta.deleteOne({ componentId: id });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
