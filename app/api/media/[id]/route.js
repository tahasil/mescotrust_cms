import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import { createReadStream } from "fs";
import { readFile, stat } from "fs/promises";
import { Readable } from "stream";
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
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
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

function resolveAutoFormat(req) {
  const acceptHeader = String(req.headers.get("accept") || "").toLowerCase();
  if (acceptHeader.includes("image/webp")) return "webp";
  if (acceptHeader.includes("image/avif")) return "avif";
  return "original";
}

function resolveRequestedFormat(rawFormat, req) {
  const format = String(rawFormat || "").toLowerCase().trim();
  if (!format || format === "auto") return resolveAutoFormat(req);
  if (format === "jpg" || format === "jpeg") return "original";
  return format;
}

function getRequestedVariant(media, size) {
  const requestedSize = normalizeRequestedSize(size);
  const originalVariant = media?.generatedSizes?.original || null;
  if (!requestedSize) {
    return {
      jpgUrl: String(
        originalVariant?.jpgUrl || media?.originalUrl || media?.url || "",
      ).trim(),
      webpUrl: String(media?.webpUrl || originalVariant?.webpUrl || "").trim(),
      avifUrl: String(media?.avifUrl || originalVariant?.avifUrl || "").trim(),
    };
  }

  const variant = media?.generatedSizes?.[requestedSize] || null;
  if (!variant) return null;

  return {
    jpgUrl: String(
      variant?.jpgUrl || originalVariant?.jpgUrl || media?.originalUrl || "",
    ).trim(),
    webpUrl: String(variant?.webpUrl || media?.webpUrl || "").trim(),
    avifUrl: String(variant?.avifUrl || media?.avifUrl || "").trim(),
  };
}

async function readImageBufferFromSource(media, source, req) {
  const sourceUrl = String(source || "").trim();
  if (!sourceUrl) return null;

  const storageProvider = String(media?.storageProvider || "local").toLowerCase();
  if (storageProvider === "local" && !sourceUrl.startsWith("http")) {
    const storageKey = toStorageKey(sourceUrl);
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
    const target = sourceUrl.startsWith("http")
      ? sourceUrl
      : new URL(sourceUrl, req.url).toString();
    const response = await fetch(target, { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function tryServeRequestedFormatResponse(media, size, format, req) {
  const requestedFormat = normalizeRequestedFormat(format);
  if (!requestedFormat) return null;
  if (!isRasterImageMimeType(media?.mimeType)) return null;

  const variant = getRequestedVariant(media, size);
  if (!variant) return null;

  const storedRequestedUrl =
    requestedFormat === "webp" ? variant.webpUrl : variant.avifUrl;
  if (storedRequestedUrl) return null;

  const conversionSource =
    variant.jpgUrl ||
    (requestedFormat === "webp" ? variant.avifUrl : variant.webpUrl);
  if (!conversionSource) return null;

  const sourceBuffer = await readImageBufferFromSource(media, conversionSource, req);
  if (!sourceBuffer) return null;

  const targetMimeType =
    requestedFormat === "webp" ? "image/webp" : "image/avif";
  const sourceMimeType = resolveContentType(conversionSource, media?.mimeType);

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

async function tryServeFromLocalStorage(media, selectedUrl, req) {
  if (String(media?.storageProvider || "local").toLowerCase() !== "local") return null;

  const storageKey = toStorageKey(selectedUrl);
  if (!storageKey) return null;

  const adapter = getStorageAdapter("local");
  if (typeof adapter?.toAbsolutePath !== "function") return null;

  const absolutePath = adapter.toAbsolutePath(storageKey);
  try {
    const fileSize = (await stat(absolutePath)).size;
    const contentType = resolveContentType(storageKey, media?.mimeType);
    const rangeHeader = String(req?.headers?.get("range") || "").trim();
    const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };

    if (contentType.startsWith("video/") && rangeMatch) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
      const requestedEnd = rangeMatch[2] ? Number(rangeMatch[2]) : fileSize - 1;
      const end = Math.min(requestedEnd, fileSize - 1);
      if (!Number.isInteger(start) || start < 0 || start >= fileSize || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: { ...headers, "Content-Range": `bytes */${fileSize}` },
        });
      }
      const contentLength = end - start + 1;
      const stream = Readable.toWeb(createReadStream(absolutePath, { start, end }));
      return new NextResponse(stream, {
        status: 206,
        headers: {
          ...headers,
          "Content-Length": String(contentLength),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        },
      });
    }

    const stream = Readable.toWeb(createReadStream(absolutePath));
    return new NextResponse(stream, {
      status: 200,
      headers: { ...headers, "Content-Length": String(fileSize) },
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
    const rawFormat = String(searchParams.get("format") || "auto").trim();
    const format = resolveRequestedFormat(rawFormat, req);

    const formatResponse = await tryServeRequestedFormatResponse(
      media,
      size,
      format,
      req,
    );
    if (formatResponse) return formatResponse;

    const url = pickVariantUrl(media, size, format);
    if (!url) return NextResponse.json({ error: "No media file found" }, { status: 404 });

    const localFileResponse = await tryServeFromLocalStorage(media, url, req);
    if (localFileResponse) return localFileResponse;

    const target = url.startsWith("http")
      ? url
      : new URL(url, req.url).toString();
    return NextResponse.redirect(target, 307);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
