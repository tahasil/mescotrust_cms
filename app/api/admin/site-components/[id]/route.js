import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import Page from "@/models/Page";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

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

/** PUT: update metadata for a site component (displayName, global, order, position) */
export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = (params?.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Invalid component id" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { displayName, global, order, position, enabled } = body;

    await connectDB();
    let doc = await SiteComponentMeta.findOne({ componentId: id });
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
        displayName: id,
        global: false,
        order: SITE_COMPONENT_IDS.indexOf(id),
        position: id === "Header" ? "before" : "after",
        enabled: typeof enabled === "boolean" ? enabled : true,
      });
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
  if (!id) {
    return NextResponse.json(
      { error: "Invalid component id" },
      { status: 400 },
    );
  }
  if (id === "Header" || id === "Footer") {
    return NextResponse.json(
      { error: "Header and Footer cannot be deleted" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const root = process.cwd();
    const registryPath = path.join(root, "lib", "siteComponentRegistry.js");
    const indexPath = path.join(root, "components", "site", "index.js");

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

    // Remove export from components/site/index.js (e.g. "export { default as HeroBanner } from \"./HeroBanner\";")
    let indexContent = readFileSync(indexPath, "utf8");
    const lines = indexContent.split(/\r?\n/);
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("export ")) return true;
      const match = trimmed.match(
        /export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from/,
      );
      return !match || match[1] !== id;
    });
    writeFileSync(
      indexPath,
      filtered
        .join("\n")
        .replace(/\n{2,}/g, "\n")
        .trimEnd() + "\n",
      "utf8",
    );

    // Delete the component file from components/site/
    const componentFilePath = path.join(root, "components", "site", `${id}.js`);
    if (existsSync(componentFilePath)) {
      try {
        unlinkSync(componentFilePath);
      } catch (fileErr) {
        console.warn(
          `[site-components] Could not delete file ${componentFilePath}:`,
          fileErr?.message,
        );
        // Continue — registry/index/pages are already updated; user can delete file manually if locked
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
