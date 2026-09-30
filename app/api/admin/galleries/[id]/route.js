import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Gallery from "@/models/Gallery";

export const dynamic = "force-dynamic";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "gallery";
}

function extractYouTubeVideoId(input) {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  return match ? match[1] : trimmed;
}

function normalizeFeatureFlag(value) {
  if (value === true) return 1;
  const num = Number(value);
  if (value === 1 || value === "1" || num === 1) return 1;
  if (value === true || value === "true") return 1;
  return 0;
}

function normalizeGalleryImage(img) {
  if (typeof img === "string") {
    const desktop = img.trim();
    return {
      urlDesktop: desktop,
      url: desktop,
      alt: "",
      feature: 0,
    };
  }
  const desktop =
    img?.urlDesktop != null
      ? String(img.urlDesktop).trim()
      : img?.url != null
        ? String(img.url).trim()
        : img?.src != null
          ? String(img.src).trim()
          : img?.urlMobile != null
            ? String(img.urlMobile).trim()
            : "";
  return {
    urlDesktop: desktop,
    url: desktop,
    alt: img?.alt != null ? String(img.alt).trim() : "",
    feature: normalizeFeatureFlag(img?.feature),
  };
}

function normalizeImageItem(it) {
  const cats = Array.isArray(it?.categories)
    ? it.categories
    : it?.category
      ? [String(it.category).trim()]
      : [];
  const images = Array.isArray(it?.images)
    ? it.images.map(normalizeGalleryImage).filter((img) => img.urlDesktop)
    : [];
  const coverDesktop =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : it?.imageMobile != null
          ? String(it.imageMobile).trim()
          : images[0]?.urlDesktop || "";
  const type = it?.type === "link" ? "link" : "album";
  const linkType = it?.linkType === "external" ? "external" : "internal";
  const linkUrl = it?.linkUrl != null ? String(it.linkUrl).trim() : "";
  return {
    _id: it?._id || new mongoose.Types.ObjectId(),
    title: it?.title != null ? String(it.title).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    imageDesktop: coverDesktop,
    imageMobile: it?.imageMobile != null ? String(it.imageMobile).trim() : "",
    image: coverDesktop,
    images,
    categories: cats.filter((c) => c && c !== "All"),
    type,
    linkType,
    linkUrl,
  };
}

function normalizeVideoItem(it) {
  const cats = Array.isArray(it?.categories)
    ? it.categories
    : it?.category
      ? [String(it.category).trim()]
      : [];
  return {
    _id: it?._id || new mongoose.Types.ObjectId(),
    title: it?.title != null ? String(it.title).trim() : "",
    videoId: extractYouTubeVideoId(it?.videoId),
    categories: cats.filter((c) => c && c !== "All"),
  };
}

async function findGalleryByIdOrShortcode(idOrCode) {
  const query = mongoose.Types.ObjectId.isValid(idOrCode)
    ? { _id: idOrCode }
    : { shortcode: String(idOrCode).toLowerCase() };
  return Gallery.findOne(query);
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Gallery ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findGalleryByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    return NextResponse.json(doc.toObject());
  } catch (err) {
    console.error("[Gallery API GET Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load gallery" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Gallery ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findGalleryByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.name) doc.name = String(body.name).trim();
    if (body.status && ["published", "draft", "archived"].includes(body.status)) {
      doc.status = body.status;
    }
    if (body.description != null) {
      doc.description = String(body.description).trim();
    }

    // Shortcode validation
    if (body.shortcode) {
      const newShortcode = slugify(body.shortcode);
      if (newShortcode !== doc.shortcode) {
        const existing = await Gallery.findOne({
          shortcode: newShortcode,
          _id: { $ne: doc._id },
        }).lean();
        if (existing) {
          return NextResponse.json(
            { error: `Shortcode "${newShortcode}" is already in use by another gallery` },
            { status: 400 },
          );
        }
        doc.shortcode = newShortcode;
      }
    }

    // Slug validation
    if (body.slug) {
      const newSlug = slugify(body.slug);
      if (newSlug !== doc.slug) {
        const existing = await Gallery.findOne({
          slug: newSlug,
          _id: { $ne: doc._id },
        }).lean();
        if (existing) {
          return NextResponse.json(
            { error: `Slug "${newSlug}" is already in use by another gallery` },
            { status: 400 },
          );
        }
        doc.slug = newSlug;
      }
    }

    // Tabs / Categories normalization
    let rawTabs = null;
    if (Array.isArray(body?.tabs) && body.tabs.length > 0) {
      rawTabs = body.tabs;
    } else if (Array.isArray(body?.photoGalleryTabs) && body.photoGalleryTabs.length > 0) {
      rawTabs = body.photoGalleryTabs;
    } else if (Array.isArray(body?.config?.photoGalleryTabs) && body.config.photoGalleryTabs.length > 0) {
      rawTabs = body.config.photoGalleryTabs;
    } else if (Array.isArray(body?.videogalleryTabs) && body.videogalleryTabs.length > 0) {
      rawTabs = body.videogalleryTabs;
    } else if (Array.isArray(body?.config?.videogalleryTabs) && body.config.videogalleryTabs.length > 0) {
      rawTabs = body.config.videogalleryTabs;
    } else if (Array.isArray(body?.tabs)) {
      rawTabs = body.tabs;
    }

    if (rawTabs) {
      const cleaned = [...new Set(rawTabs.map((t) => String(t).trim()).filter(Boolean))];
      doc.tabs = cleaned.length > 0 ? cleaned : ["All"];
    }

    // Items normalization depending on type
    const galleryType = doc.type || "image";
    let rawItems = null;
    if (Array.isArray(body?.items) && body.items.length > 0) {
      rawItems = body.items;
    } else if (galleryType === "image") {
      if (Array.isArray(body?.photoGalleryItems) && body.photoGalleryItems.length > 0) {
        rawItems = body.photoGalleryItems;
      } else if (Array.isArray(body?.config?.photoGalleryItems) && body.config.photoGalleryItems.length > 0) {
        rawItems = body.config.photoGalleryItems;
      } else if (Array.isArray(body?.items)) {
        rawItems = body.items;
      }
    } else {
      if (Array.isArray(body?.videogalleryItems) && body.videogalleryItems.length > 0) {
        rawItems = body.videogalleryItems;
      } else if (Array.isArray(body?.config?.videogalleryItems) && body.config.videogalleryItems.length > 0) {
        rawItems = body.config.videogalleryItems;
      } else if (Array.isArray(body?.items)) {
        rawItems = body.items;
      }
    }

    if (rawItems !== null) {
      if (galleryType === "image") {
        doc.items = rawItems.map(normalizeImageItem);
      } else {
        doc.items = rawItems.map(normalizeVideoItem);
      }
    }

    // Update config payload
    const incomingConfig = body?.config && typeof body.config === "object" ? body.config : {};
    const fullPayload = {
      ...incomingConfig,
      ...body,
    };
    // Clean top-level meta from config
    delete fullPayload.items;
    delete fullPayload.tabs;
    delete fullPayload._id;
    delete fullPayload.id;

    doc.config = {
      ...(doc.config || {}),
      ...fullPayload,
    };
    doc.updatedBy = session?.user?.email || session?.user?.name || "";

    await doc.save();

    return NextResponse.json(doc.toObject());
  } catch (err) {
    console.error("[Gallery API PUT error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update gallery" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Gallery ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findGalleryByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    await Gallery.deleteOne({ _id: doc._id });
    return NextResponse.json({ message: "Gallery deleted successfully", _id: id });
  } catch (err) {
    console.error("[Gallery API DELETE error]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete gallery" }, { status: 500 });
  }
}
