import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import { ALLOWED_UPLOAD_MIME_TYPES } from "@/lib/media/constants";
import { getMediaSettings } from "@/lib/media/settings";
import { optimizeAndStoreUpload } from "@/lib/media/processor";

function sanitizeOriginalName(name) {
  return String(name || "upload")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    const altText = formData.get("altText");
    const title = formData.get("title");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(String(file.type || "").toLowerCase())) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = sanitizeOriginalName(file.name) || `media-${id}${path.extname(file.name || "")}`;
    const settings = await getMediaSettings();
    const storageProvider = process.env.MEDIA_STORAGE_PROVIDER || "local";
    const optimized = await optimizeAndStoreUpload({
      buffer,
      mimeType: file.type,
      originalName,
      mediaId: String(media._id),
      settings,
      storageProvider,
    });

    media.title = title !== null && title !== undefined ? String(title) : media.title;
    media.altText =
      altText !== null && altText !== undefined ? String(altText) : media.altText;
    media.alt = media.altText || media.alt;
    media.filename = optimized.filename || media.filename;
    media.fileName = optimized.fileName || media.fileName || media.filename;
    media.originalName = file.name || media.originalName;
    media.mimeType = file.type || media.mimeType;
    media.ext = optimized.ext || media.ext;
    media.storageProvider = optimized.storageProvider || media.storageProvider || "local";
    media.storageKey = optimized.storageKey || media.storageKey;
    media.publicUrl = optimized.publicUrl || `/media/${media._id}`;
    media.url = optimized.url || media.url;
    media.originalUrl = optimized.originalUrl || media.originalUrl || media.url;
    media.webpUrl = optimized.webpUrl || "";
    media.avifUrl = optimized.avifUrl || "";
    media.size = optimized.size || media.size;
    media.originalSize = optimized.originalSize || media.originalSize || media.size;
    media.optimizedSize = optimized.optimizedSize || media.optimizedSize || media.size;
    media.savingsPercentage = optimized.savingsPercentage || 0;
    media.width = optimized.width || media.width || 0;
    media.height = optimized.height || media.height || 0;
    media.generatedSizes = optimized.generatedSizes || {};
    media.status = optimized.status || "ready";
    media.errorMessage = optimized.errorMessage || "";
    media.updatedBy = session.email || session.name || "";

    await media.save();
    return NextResponse.json(media);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
