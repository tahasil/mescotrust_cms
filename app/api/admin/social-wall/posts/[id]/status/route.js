import { NextResponse } from "next/server";
import { requireEditorOrAdminSession } from "@/lib/socialWallModule/apiGuards";
import { updateSocialWallPostStatus } from "@/lib/socialWallModule/postsService";
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
    const updated = await updateSocialWallPostStatus(id, body?.status, {
      actor: session?.email || session?.name || "",
      note: body?.note,
    });
    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    invalidatePublicSocialWallFeedCache();
    return NextResponse.json(updated, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    if (toSafeString(err?.message).startsWith("INVALID_STATUS_TRANSITION")) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: err?.message || "Failed to update status" },
      { status: 500 },
    );
  }
}
