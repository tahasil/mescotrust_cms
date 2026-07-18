import { NextResponse } from "next/server";
import { requireEditorOrAdminSession } from "@/lib/socialWallModule/apiGuards";
import { updateSocialWallPostFeatured } from "@/lib/socialWallModule/postsService";
import { invalidatePublicSocialWallFeedCache } from "@/lib/socialWallModule/publicService";
import { toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error, session } = await requireEditorOrAdminSession(req);
  if (error) return error;

  try {
    const body = await req.json();
    const id = toSafeString(params?.id);
    if (!id) {
      return NextResponse.json({ error: "Post id is required" }, { status: 400 });
    }
    const updated = await updateSocialWallPostFeatured(id, body?.featured === true, {
      actor: session?.email || session?.name || "",
    });
    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    invalidatePublicSocialWallFeedCache();
    return NextResponse.json(updated, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to update feature state" },
      { status: 500 },
    );
  }
}
