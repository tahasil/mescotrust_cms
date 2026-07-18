import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import Media from "@/models/Media";
import { getStorageAdapter } from "@/lib/storage";
import { getMediaSettings } from "@/lib/media/settings";
import {
  isImageMimeType,
  optimizeExistingMediaFromDisk,
} from "@/lib/media/processor";

const ALLOWED_ACTIONS = new Set([
  "delete",
  "optimize",
  "convert",
  "export_metadata",
]);

function toStorageKey(urlOrKey) {
  const value = String(urlOrKey || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return "";
  return value.replace(/^\/+/, "");
}

function collectPotentialStorageKeys(media) {
  const keys = new Set();
  const push = (v) => {
    const k = toStorageKey(v);
    if (k) keys.add(k);
  };

  push(media.storageKey);
  push(media.url);
  push(media.originalUrl);
  push(media.webpUrl);
  push(media.avifUrl);

  const sizes = media.generatedSizes || {};
  for (const name of Object.keys(sizes)) {
    const size = sizes[name] || {};
    push(size.jpgUrl);
    push(size.webpUrl);
    push(size.avifUrl);
  }

  return Array.from(keys);
}

function applyOptimizedPatch(media, optimized, updatedBy) {
  media.status = optimized.status || "ready";
  media.errorMessage = optimized.errorMessage || "";
  media.storageProvider = optimized.storageProvider || media.storageProvider || "local";
  media.storageKey = optimized.storageKey || media.storageKey || "";
  media.fileName = optimized.fileName || media.fileName || media.filename;
  media.filename = optimized.filename || media.filename || media.fileName;
  media.ext = optimized.ext || media.ext || "";
  media.mimeType = optimized.mimeType || media.mimeType;
  media.url = optimized.url || media.url;
  media.publicUrl =
    optimized.publicUrl ||
    media.publicUrl ||
    `/media/${media._id}?size=original&format=auto`;
  media.originalUrl = optimized.originalUrl || media.originalUrl || media.url;
  media.webpUrl = optimized.webpUrl || "";
  media.avifUrl = optimized.avifUrl || "";
  media.width = optimized.width || media.width || 0;
  media.height = optimized.height || media.height || 0;
  media.originalWidth = optimized.originalWidth || media.originalWidth || 0;
  media.originalHeight = optimized.originalHeight || media.originalHeight || 0;
  media.cropX = optimized.cropX || 0;
  media.cropY = optimized.cropY || 0;
  media.cropWidth = optimized.cropWidth || 0;
  media.cropHeight = optimized.cropHeight || 0;
  media.finalWidth = optimized.finalWidth || media.finalWidth || media.width || 0;
  media.finalHeight = optimized.finalHeight || media.finalHeight || media.height || 0;
  media.size = optimized.size || media.size || 0;
  media.originalSize = optimized.originalSize || media.originalSize || media.size || 0;
  media.optimizedSize = optimized.optimizedSize || media.optimizedSize || media.size || 0;
  media.savingsPercentage = optimized.savingsPercentage || 0;
  media.generatedSizes = optimized.generatedSizes || {};
  media.updatedBy = updatedBy;
}

function toResponseItem(item) {
  const doc = item?.toObject ? item.toObject() : item;
  return {
    ...doc,
    alt: doc?.altText || doc?.alt || "",
    url: doc?.url || doc?.originalUrl || "",
  };
}

async function deleteMediaDocument(media, { force = false, session }) {
  const usedIn = Array.isArray(media.usedIn) ? media.usedIn : [];
  if (force && !isAdmin(session)) {
    return { ok: false, code: "FORBIDDEN", message: "Force delete requires admin role" };
  }
  if (!force && usedIn.length > 0) {
    return {
      ok: false,
      code: "MEDIA_IN_USE",
      message: "Media is currently in use",
      usedIn,
    };
  }

  const adapter = getStorageAdapter(media.storageProvider || "local");
  const keys = collectPotentialStorageKeys(media);
  for (const key of keys) {
    await adapter.deleteFile({ storageKey: key }).catch(() => {});
  }

  await media.deleteOne();
  return { ok: true };
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const force = Boolean(body.force);
    const ids = Array.isArray(body.ids)
      ? Array.from(
          new Set(
            body.ids
              .map((id) => String(id || "").trim())
              .filter(Boolean),
          ),
        )
      : [];

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: `Invalid action. Allowed: ${Array.from(ALLOWED_ACTIONS).join(", ")}` },
        { status: 400 },
      );
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "No media IDs provided" }, { status: 400 });
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: "Maximum 200 media IDs per request" }, { status: 400 });
    }

    const invalidIds = new Set(
      ids.filter((id) => !mongoose.Types.ObjectId.isValid(id)),
    );
    const validIds = ids.filter((id) => !invalidIds.has(id));

    await connectDB();
    const mediaDocs = await Media.find({ _id: { $in: validIds } });
    const docMap = new Map(mediaDocs.map((doc) => [String(doc._id), doc]));

    if (action === "export_metadata") {
      const items = ids
        .filter((id) => !invalidIds.has(id))
        .map((id) => docMap.get(id))
        .filter(Boolean)
        .map((doc) => toResponseItem(doc));
      return NextResponse.json({
        action,
        summary: {
          requested: ids.length,
          exported: items.length,
          invalid: invalidIds.size,
        },
        items,
      });
    }

    let settings = null;
    let storageProvider = "local";
    if (action === "optimize" || action === "convert") {
      settings = await getMediaSettings();
      storageProvider = process.env.MEDIA_STORAGE_PROVIDER || "local";
    }

    const results = [];
    const updatedItems = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of ids) {
      if (invalidIds.has(id)) {
        failed += 1;
        results.push({ id, status: "failed", code: "INVALID_ID", message: "Invalid media ID" });
        continue;
      }

      const media = docMap.get(id);
      if (!media) {
        failed += 1;
        results.push({ id, status: "failed", code: "NOT_FOUND", message: "Media not found" });
        continue;
      }

      try {
        if (action === "delete") {
          const deleted = await deleteMediaDocument(media, { force, session });
          if (!deleted.ok) {
            failed += 1;
            results.push({
              id,
              status: "failed",
              code: deleted.code || "DELETE_FAILED",
              message: deleted.message || "Delete failed",
              usedIn: deleted.usedIn || [],
            });
            continue;
          }
          success += 1;
          results.push({ id, status: "success", message: "Deleted" });
          continue;
        }

        if (!isImageMimeType(media.mimeType)) {
          skipped += 1;
          results.push({
            id,
            status: "skipped",
            code: "NON_OPTIMIZABLE",
            message: "Skipped non-optimizable media type",
          });
          continue;
        }

        if (action === "convert" && media.webpUrl && media.avifUrl) {
          skipped += 1;
          results.push({
            id,
            status: "skipped",
            code: "ALREADY_CONVERTED",
            message: "WebP and AVIF are already available",
          });
          continue;
        }

        if (
          action === "convert" &&
          String(media.mimeType || "").toLowerCase() === "image/gif"
        ) {
          skipped += 1;
          results.push({
            id,
            status: "skipped",
            code: "GIF_CONVERSION_SKIPPED",
            message: "GIF conversion skipped to preserve animation",
          });
          continue;
        }

        const optimized = await optimizeExistingMediaFromDisk({
          media: media.toObject(),
          settings,
          storageProvider,
        });
        applyOptimizedPatch(
          media,
          optimized,
          session.email || session.name || "system-media-bulk",
        );
        await media.save();

        success += 1;
        updatedItems.push(toResponseItem(media));
        results.push({ id, status: "success", message: "Processed" });
      } catch (err) {
        failed += 1;
        media.status = "failed";
        media.errorMessage = err?.message || "Processing failed";
        media.updatedBy = session.email || session.name || "";
        await media.save().catch(() => {});
        results.push({
          id,
          status: "failed",
          code: "PROCESSING_FAILED",
          message: err?.message || "Processing failed",
        });
      }
    }

    return NextResponse.json({
      action,
      summary: {
        requested: ids.length,
        success,
        failed,
        skipped,
      },
      results,
      items: updatedItems,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
