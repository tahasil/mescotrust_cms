import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const mediaId = String(searchParams.get("mediaId") || "");
  if (!mongoose.Types.ObjectId.isValid(mediaId)) {
    return NextResponse.json({ error: "Invalid mediaId" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(mediaId).select("usedIn title").lean();
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      mediaId,
      title: media.title || "",
      usedIn: Array.isArray(media.usedIn) ? media.usedIn : [],
      count: Array.isArray(media.usedIn) ? media.usedIn.length : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
