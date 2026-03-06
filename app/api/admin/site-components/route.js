import { NextResponse } from "next/server";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

/** Read current registry IDs from disk (so list is correct after DELETE without restart). */
function getRegistryIdsFromDisk() {
  try {
    const root = process.cwd();
    const registryPath = path.join(root, "lib", "siteComponentRegistry.js");
    const content = readFileSync(registryPath, "utf8");
    const arrayMatch = content.match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);
    if (!arrayMatch) return [...SITE_COMPONENT_IDS];
    return arrayMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  } catch {
    return [...SITE_COMPONENT_IDS];
  }
}

/** GET: list all site components (registry + custom from DB) with metadata */
export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const allMetas = await SiteComponentMeta.find({}).lean();
    const metaById = {};
    allMetas.forEach((m) => {
      metaById[m.componentId] = m;
    });

    const idsFromRegistry = getRegistryIdsFromDisk();
    const customIds = allMetas.map((m) => m.componentId).filter((id) => !idsFromRegistry.includes(id));
    const allIds = [...new Set([...idsFromRegistry, ...customIds])];

    const list = allIds.map((id, index) => {
      const m = metaById[id];
      const defaultPosition = id === "Header" ? "before" : "after";
      return {
        componentId: id,
        displayName: m?.displayName ?? id,
        global: m?.global ?? false,
        order: m?.order ?? index,
        position: m?.position ?? defaultPosition,
        enabled: m?.enabled !== false,
      };
    });

    list.sort((a, b) => (a.order !== b.order ? a.order - b.order : a.componentId.localeCompare(b.componentId)));

    const filtered = list.filter((item) => item.componentId !== "LatestEvents");
    return NextResponse.json(filtered);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST: create new site component — creates file in components/site/, updates registry and index */
export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const displayName = (body.displayName || "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    // System-generated component ID from display name: no spaces, alphanumeric, unique
    let baseName = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!baseName) {
      return NextResponse.json({ error: "Display name must contain at least one letter or number" }, { status: 400 });
    }
    if (!/^[a-zA-Z]/.test(baseName)) baseName = "C" + baseName;

    await connectDB();
    let componentId = baseName;
    let suffix = 0;
    while (await SiteComponentMeta.findOne({ componentId })) {
      suffix += 1;
      componentId = `${baseName}${suffix}`;
    }
    const global = Boolean(body.global);
    const order = Number(body.order) ?? 0;
    const position = body.position === "after" ? "after" : "before";

    const root = process.cwd();
    const siteDir = path.join(root, "components", "site");
    const componentPath = path.join(siteDir, `${componentId}.js`);

    const componentTemplate = `"use client";

/**
 * Site component: ${componentId} (${displayName}).
 * Add your UI code below.
 */
export default function ${componentId}(props) {
  return (
    <section className="site-component-${componentId.toLowerCase()}" data-component="${componentId}">

    </section>
  );
}
`;

    writeFileSync(componentPath, componentTemplate, "utf8");

    const registryPath = path.join(root, "lib", "siteComponentRegistry.js");
    let registryContent = readFileSync(registryPath, "utf8");
    const arrayMatch = registryContent.match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);
    if (arrayMatch) {
      const ids = arrayMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      if (!ids.includes(componentId)) {
        ids.push(componentId);
        registryContent = registryContent.replace(
          /(SITE_COMPONENT_IDS\s*=\s*\[)[^\]]*(\])/,
          `$1${ids.map((id) => `"${id}"`).join(", ")}$2`
        );
        writeFileSync(registryPath, registryContent, "utf8");
      }
    }

    const indexPath = path.join(root, "components", "site", "index.js");
    let indexContent = readFileSync(indexPath, "utf8");
    const exportLine = `export { default as ${componentId} } from "./${componentId}";`;
    if (!indexContent.includes(exportLine)) {
      indexContent = indexContent.trimEnd() + "\n" + exportLine + "\n";
      writeFileSync(indexPath, indexContent, "utf8");
    }

    const doc = await SiteComponentMeta.create({
      componentId,
      displayName,
      global,
      order,
      position,
      enabled: true,
    });

    return NextResponse.json(doc.toObject ? doc.toObject() : doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
