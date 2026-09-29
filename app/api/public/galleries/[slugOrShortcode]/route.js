import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Gallery from "@/models/Gallery";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  let param = String(params?.slugOrShortcode || "").trim().toLowerCase();
  if (param.startsWith("gallery:")) {
    param = param.replace(/^gallery:/, "");
  }
  if (!param) {
    return NextResponse.json({ error: "Gallery identifier is required" }, { status: 400 });
  }

  try {
    await connectDB();

    const query = mongoose.Types.ObjectId.isValid(param)
      ? { $or: [{ _id: param }, { shortcode: param }, { slug: param }] }
      : { $or: [{ shortcode: param }, { slug: param }] };

    const doc = await Gallery.findOne(query).lean();
    if (!doc) {
      return NextResponse.json(
        { error: `Gallery "${param}" not found` },
        { status: 404 },
      );
    }

    if (doc.status === "archived") {
      return NextResponse.json({ error: "Gallery is archived" }, { status: 404 });
    }

    // Merge config with top-level attributes to construct component-ready props
    const galleryType = doc.type || "image";
    const baseConfig = doc.config || {};

    const formattedPayload = {
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      shortcode: doc.shortcode,
      type: galleryType,
      status: doc.status,
      description: doc.description || "",
      tabs: Array.isArray(doc.tabs) ? doc.tabs : ["All"],
      items: Array.isArray(doc.items) ? doc.items : [],
      config: baseConfig,
      // Provide pre-mapped props depending on gallery type
      ...(galleryType === "image"
        ? {
            photoGalleryMainTitle: baseConfig.photoGalleryMainTitle || doc.name,
            photoGallerySubTitle: baseConfig.photoGallerySubTitle || doc.description || "Gallery",
            photoGalleryTabs: Array.isArray(doc.tabs) && doc.tabs.length > 0 ? doc.tabs : ["All"],
            photoGalleryItems: Array.isArray(doc.items) ? doc.items : [],
            ...baseConfig,
          }
        : {
            videogalleryMainTitle: baseConfig.videogalleryMainTitle || doc.name,
            videogallerySubTitle: baseConfig.videogallerySubTitle || doc.description || "Video Gallery",
            videogalleryTabs: Array.isArray(doc.tabs) && doc.tabs.length > 0 ? doc.tabs : ["All"],
            videogalleryItems: Array.isArray(doc.items) ? doc.items : [],
            ...baseConfig,
          }),
    };

    return NextResponse.json(formattedPayload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Public Gallery API error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load gallery" }, { status: 500 });
  }
}
