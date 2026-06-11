import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import { readFile } from "fs/promises";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import { getStorageAdapter } from "@/lib/storage";
import mediaDelivery from "@/lib/media/delivery";

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

function getSharpOrNull() {
  try {
    // eslint-disable-next-line global-require
    return require("sharp");
  } catch {
    return null;
  }
}

function isRasterImageMimeType(mimeType) {
  const mime = String(mimeType || "").toLowerCase().trim();
  return (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/avif"
  );
}

const { normalizeRequestedFormat, normalizeRequestedSize, pickVariantUrl } =
  mediaDelivery;

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

async function readOriginalImageBuffer(media, req) {
  const source = String(media?.originalUrl || media?.url || "").trim();
  if (!source) return null;

  if (String(media?.storageProvider || "local").toLowerCase() === "local") {
    const storageKey = toStorageKey(source);
    if (storageKey) {
      const adapter = getStorageAdapter("local");
      if (typeof adapter?.toAbsolutePath === "function") {
        try {
          return await readFile(adapter.toAbsolutePath(storageKey));
        } catch {}
      }
    }
  }

  try {
    const target = source.startsWith("http")
      ? source
      : new URL(source, req.url).toString();
    const response = await fetch(target, { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function tryServeOriginalFormatResponse(media, size, format, req) {
  const requestedFormat = normalizeRequestedFormat(format);
  const hasExplicitSize = Boolean(normalizeRequestedSize(size));
  if (!requestedFormat || hasExplicitSize) return null;
  if (!isRasterImageMimeType(media?.mimeType)) return null;

  const sourceBuffer = await readOriginalImageBuffer(media, req);
  if (!sourceBuffer) return null;

  const sourceMimeType = String(media?.mimeType || "").toLowerCase().trim();
  const targetMimeType =
    requestedFormat === "webp" ? "image/webp" : "image/avif";

  try {
    if (sourceMimeType === targetMimeType) {
      return new NextResponse(sourceBuffer, {
        status: 200,
        headers: {
          "Content-Type": targetMimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const sharp = getSharpOrNull();
    if (!sharp) return null;

    const pipeline = sharp(sourceBuffer, { failOn: "none" }).rotate();
    if (requestedFormat === "webp") {
      pipeline.webp({ quality: 85, effort: 4 });
    } else {
      pipeline.avif({ quality: 75, effort: 4 });
    }
    const { data } = await pipeline.toBuffer({ resolveWithObject: true });

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": targetMimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
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

    const originalFormatResponse = await tryServeOriginalFormatResponse(
      media,
      size,
      format,
      req,
    );
    if (originalFormatResponse) return originalFormatResponse;

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
