import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

/** PUT: update metadata for a site component (displayName, global, order, position) */
export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = (params?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid component id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { displayName, global, order, position } = body;

    await connectDB();
    let doc = await SiteComponentMeta.findOne({ componentId: id });
    const isInRegistry = SITE_COMPONENT_IDS.includes(id);
    if (!doc) {
      if (!isInRegistry) {
        return NextResponse.json({ error: "Unknown component id" }, { status: 400 });
      }
      doc = await SiteComponentMeta.create({
        componentId: id,
        displayName: id,
        global: false,
        order: SITE_COMPONENT_IDS.indexOf(id),
        position: id === "Header" ? "before" : "after",
      });
    }

    if (typeof displayName === "string") doc.displayName = displayName.trim() || id;
    if (typeof global === "boolean") doc.global = global;
    if (typeof order === "number") doc.order = order;
    if (position === "before" || position === "after") doc.position = position;

    await doc.save();
    const out = await SiteComponentMeta.findOne({ componentId: id }).lean();
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
