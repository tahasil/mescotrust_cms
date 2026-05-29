import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { createPreviewToken } from "@/lib/previewToken";

const ACTIVE_PAGE_FILTER = { isDeleted: { $ne: 1 } };
const TTL_SECONDS = 15 * 60;

function getPreviewBaseUrl() {
  const candidate = String(
    process.env.PREVIEW_SITE_URL || process.env.NEXT_PUBLIC_PREVIEW_SITE_URL || "",
  )
    .trim()
    .replace(/\/+$/, "");
  return candidate || null;
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "pages.edit");
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER }).select("_id").lean();
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const token = createPreviewToken(
      {
        kind: "page-preview",
        pageId: String(page._id),
        email: session.email || "",
      },
      { ttlSeconds: TTL_SECONDS },
    );

    return NextResponse.json({
      token,
      expiresAt: new Date(Date.now() + TTL_SECONDS * 1000).toISOString(),
      previewBaseUrl: getPreviewBaseUrl(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
