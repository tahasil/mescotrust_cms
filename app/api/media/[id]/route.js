import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";

function pickVariantUrl(media, size, format) {
  const variant = size && media?.generatedSizes?.[size] ? media.generatedSizes[size] : null;
  const fallback = variant?.jpgUrl || media?.originalUrl || media?.url || "";
  const avif = variant?.avifUrl || media?.avifUrl || "";
  const webp = variant?.webpUrl || media?.webpUrl || "";

  const fmt = String(format || "auto").toLowerCase();
  if (fmt === "avif") return avif || webp || fallback;
  if (fmt === "webp") return webp || avif || fallback;
  if (fmt === "original") return fallback;
  return avif || webp || fallback;
}

export async function GET(req, { params }) {
  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id).lean();
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const size = String(searchParams.get("size") || "").trim();
    const format = String(searchParams.get("format") || "auto").trim();
    const url = pickVariantUrl(media, size, format);
    if (!url) return NextResponse.json({ error: "No media file found" }, { status: 404 });

    const target = url.startsWith("http")
      ? url
      : new URL(url, req.url).toString();
    return NextResponse.redirect(target, 307);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
