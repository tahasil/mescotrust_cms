import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Gallery from "@/models/Gallery";
import Component from "@/models/Component";
import Media from "@/models/Media";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function text(value) {
  return value == null ? "" : String(value).trim();
}

function getCover(item) {
  const direct = text(item?.imageDesktop || item?.image || item?.imageMobile);
  if (direct) return direct;
  const first = Array.isArray(item?.images) ? item.images[0] : null;
  return text(first?.urlDesktop || first?.url || first?.src || first?.urlMobile);
}

function getMediaId(url) {
  const match = text(url).match(/\/media\/([a-f\d]{24})(?:[/?#]|$)/i);
  return match?.[1] && mongoose.Types.ObjectId.isValid(match[1]) ? match[1] : "";
}

function getLegacyTimestamp(url) {
  const fileName = text(url).split(/[?#]/)[0].split("/").pop() || "";
  const match = fileName.match(/^(\d{13})/);
  const value = match ? Number(match[1]) : 0;
  return Number.isFinite(value) ? value : 0;
}

function mediaDates(media, fallback) {
  const updatedAt = media?.updatedAt ? new Date(media.updatedAt).getTime() : 0;
  const createdAt = media?.createdAt ? new Date(media.createdAt).getTime() : 0;
  return {
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : fallback,
    createdAt: Number.isFinite(createdAt) && createdAt > 0 ? createdAt : fallback,
  };
}

export async function GET() {
  try {
    await connectDB();

    // 1. Primary source: Dedicated Gallery module (/admin/gallery -> models/Gallery)
    let galleryDoc = await Gallery.findOne({
      type: "image",
      status: { $in: ["published", "draft"] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    let items = Array.isArray(galleryDoc?.items) && galleryDoc.items.length > 0
      ? galleryDoc.items
      : [];

    // 2. Fallback source: PhotoGallery site component
    if (items.length === 0) {
      const fallbackComponent = await Component.findOne({ baseComponent: "PhotoGallery" })
        .sort({ updatedAt: -1 })
        .lean();
      if (Array.isArray(fallbackComponent?.defaultProps?.photoGalleryItems)) {
        items = fallbackComponent.defaultProps.photoGalleryItems;
      }
    }

    const seen = new Set();
    const collected = [];

    items.forEach((item, sourceIndex) => {
      const coverUrl = getCover(item);
      if (coverUrl && !seen.has(coverUrl)) {
        seen.add(coverUrl);
        collected.push({
          url: coverUrl,
          alt: text(item?.title || item?.description || "Gallery image"),
          sourceIndex,
        });
      }

      // Also collect photos within each album for a rich photo feed
      if (Array.isArray(item?.images)) {
        item.images.forEach((img) => {
          const imgUrl = text(img?.urlDesktop || img?.url || img?.src || img?.urlMobile);
          if (imgUrl && !seen.has(imgUrl)) {
            seen.add(imgUrl);
            collected.push({
              url: imgUrl,
              alt: text(img?.alt || item?.title || "Gallery image"),
              sourceIndex,
            });
          }
        });
      }
    });

    const ids = collected.map((item) => getMediaId(item.url)).filter(Boolean);
    const urls = collected.map((item) => item.url);

    const media = collected.length
      ? await Media.find({
          $or: [
            ...(ids.length > 0 ? [{ _id: { $in: ids } }] : []),
            { publicUrl: { $in: urls } },
            { url: { $in: urls } },
            { originalUrl: { $in: urls } },
            { webpUrl: { $in: urls } },
            { avifUrl: { $in: urls } },
          ],
        })
          .select("_id publicUrl url originalUrl webpUrl avifUrl createdAt updatedAt")
          .lean()
      : [];

    const mediaByKey = new Map();
    media.forEach((item) => {
      [
        String(item._id),
        item.publicUrl,
        item.url,
        item.originalUrl,
        item.webpUrl,
        item.avifUrl,
      ]
        .map(text)
        .filter(Boolean)
        .forEach((key) => mediaByKey.set(key, item));
    });

    const images = collected
      .map((item) => {
        const mediaItem = mediaByKey.get(getMediaId(item.url)) || mediaByKey.get(item.url);
        const legacyTimestamp = getLegacyTimestamp(item.url);
        const dates = mediaDates(mediaItem, legacyTimestamp);
        return {
          url: item.url,
          alt: item.alt,
          updatedAt: dates.updatedAt,
          createdAt: dates.createdAt,
          legacyTimestamp,
          sourceIndex: item.sourceIndex,
        };
      })
      .sort(
        (a, b) =>
          b.updatedAt - a.updatedAt ||
          b.createdAt - a.createdAt ||
          b.legacyTimestamp - a.legacyTimestamp ||
          a.sourceIndex - b.sourceIndex,
      )
      .slice(0, 16)
      .map(({ url, alt }) => ({ url, alt }));

    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("[LatestImageGallery] Failed to load gallery images:", error);
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
