import { NextResponse } from "next/server";
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

async function generateUniqueShortcode(name, currentId = null) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const query = { shortcode: candidate };
    if (currentId) query._id = { $ne: currentId };
    const existing = await Gallery.findOne(query).lean();
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim();
    const type = (searchParams.get("type") || "").trim().toLowerCase();
    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortcode: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (type && ["image", "video"].includes(type)) {
      filter.type = type;
    }
    if (status && ["published", "draft", "archived"].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      Gallery.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gallery.countDocuments(filter),
    ]);

    const transformed = items.map((doc) => ({
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      shortcode: doc.shortcode,
      type: doc.type || "image",
      status: doc.status || "published",
      description: doc.description || "",
      tabsCount: Array.isArray(doc.tabs) ? doc.tabs.length : 0,
      itemsCount: Array.isArray(doc.items) ? doc.items.length : 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      items: transformed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error("[Gallery Admin API GET error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load galleries" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();

    const body = await req.json();
    const rawName = String(body?.name || "").trim();
    const rawType = String(body?.type || "image").trim().toLowerCase();

    if (!rawName) {
      return NextResponse.json({ error: "Gallery name is required" }, { status: 400 });
    }

    if (!["image", "video"].includes(rawType)) {
      return NextResponse.json(
        { error: 'Invalid gallery type. Must be either "image" or "video"' },
        { status: 400 },
      );
    }

    const rawShortcode = body?.shortcode ? slugify(body.shortcode) : await generateUniqueShortcode(rawName);
    const rawSlug = body?.slug ? slugify(body.slug) : rawShortcode;

    // Validate shortcode uniqueness
    const existingShortcode = await Gallery.findOne({ shortcode: rawShortcode }).lean();
    if (existingShortcode) {
      return NextResponse.json(
        { error: `Shortcode "${rawShortcode}" is already in use by another gallery` },
        { status: 400 },
      );
    }

    // Validate slug uniqueness
    const existingSlug = await Gallery.findOne({ slug: rawSlug }).lean();
    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug "${rawSlug}" is already in use by another gallery` },
        { status: 400 },
      );
    }

    const defaultTabs = ["All", "Education", "Medical", "Events", "Community"];
    const starterItems = rawType === "image"
      ? [
          {
            title: "Sample Album",
            description: "",
            date: "",
            imageDesktop: "",
            imageMobile: "",
            image: "",
            images: [],
            categories: ["Education"],
            type: "album",
            linkType: "internal",
            linkUrl: "",
          },
        ]
      : [
          {
            title: "Sample Video",
            videoId: "",
            categories: ["Education"],
          },
        ];

    const initialConfig = rawType === "image"
      ? {
          photoGalleryMainTitle: rawName,
          photoGallerySubTitle: "Gallery",
          photoGalleryTabs: defaultTabs,
          photoGalleryItems: starterItems,
          photoGalleryTabAlignment: "center",
          photoGalleryLimitEnabled: false,
          photoGalleryLimitCount: 6,
        }
      : {
          videogalleryMainTitle: rawName,
          videogallerySubTitle: "Video Gallery",
          videogalleryTabs: defaultTabs,
          videogalleryItems: starterItems,
          videogalleryTabAlignment: "center",
          videogalleryLimitEnabled: false,
          videogalleryLimitCount: 6,
        };

    const doc = await Gallery.create({
      name: rawName,
      slug: rawSlug,
      shortcode: rawShortcode,
      type: rawType,
      status: body?.status === "draft" ? "draft" : "published",
      description: String(body?.description || "").trim(),
      tabs: defaultTabs,
      items: starterItems,
      config: initialConfig,
      createdBy: session?.user?.email || session?.user?.name || "",
      updatedBy: session?.user?.email || session?.user?.name || "",
    });

    return NextResponse.json(
      {
        _id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        shortcode: doc.shortcode,
        type: doc.type,
        status: doc.status,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[Gallery Admin API POST error]:", err);
    return NextResponse.json({ error: err.message || "Failed to create gallery" }, { status: 500 });
  }
}
