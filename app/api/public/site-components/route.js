import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

/** GET: list global site components in render order (before + after). Public, no auth. */
export async function GET() {
  try {
    await connectDB();
    const metas = await SiteComponentMeta.find({
      componentId: { $in: SITE_COMPONENT_IDS },
      global: true,
    })
      .sort({ position: 1, order: 1 })
      .lean();

    const before = metas.filter((m) => m.position === "before").map((m) => m.componentId);
    const after = metas.filter((m) => m.position === "after").map((m) => m.componentId);

    return NextResponse.json({ before, after });
  } catch (err) {
    return NextResponse.json({ before: [], after: [] });
  }
}
