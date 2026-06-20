import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { filterGlobalComponentIdsForPath } from "@/lib/routeComponentRules";

/** GET: list global site components in render order (before + after). Public, no auth. Uses sitecomponentmetas. */
export async function GET() {
  try {
    await connectDB();
    const registryIds = getRegistryIdsFromDisk();
    const metas = await SiteComponentMeta.find({
      componentId: { $in: registryIds },
      global: true,
    })
      .sort({ position: 1, order: 1 })
      .lean();

    const before = filterGlobalComponentIdsForPath(
      metas.filter((m) => m.position === "before").map((m) => m.componentId),
    );
    const after = filterGlobalComponentIdsForPath(
      metas.filter((m) => m.position === "after").map((m) => m.componentId),
    );

    return NextResponse.json({ before, after });
  } catch (err) {
    return NextResponse.json({ before: [], after: [] });
  }
}
