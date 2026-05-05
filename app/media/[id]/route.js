import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import { readFile } from "fs/promises";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import { getStorageAdapter } from "@/lib/storage";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

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

function toStorageKey(urlOrKey) {
  const value = String(urlOrKey || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return "";
  return value.replace(/^\/+/, "");
}

function resolveContentType(urlOrKey, fallbackType) {
  const ext = path.extname(String(urlOrKey || "").toLowerCase());
  return MIME_BY_EXT[ext] || fallbackType || "application/octet-stream";
}

async function tryServeFromLocalStorage(media, selectedUrl) {
  if (String(media?.storageProvider || "local").toLowerCase() !== "local") return null;

  const storageKey = toStorageKey(selectedUrl);
  if (!storageKey) return null;

  const adapter = getStorageAdapter("local");
  if (typeof adapter?.toAbsolutePath !== "function") return null;

  const absolutePath = adapter.toAbsolutePath(storageKey);
  try {
    const fileBuffer = await readFile(absolutePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": resolveContentType(storageKey, media?.mimeType),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
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

    const localFileResponse = await tryServeFromLocalStorage(media, url);
    if (localFileResponse) return localFileResponse;

    const target = url.startsWith("http")
      ? url
      : new URL(url, req.url).toString();
    return NextResponse.redirect(target, 307);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
