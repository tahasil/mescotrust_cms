import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import {
  filterLayoutValidationErrors,
  validateLayoutProps,
} from "@/lib/validateLayout";
import { syncMediaUsageForPage } from "@/lib/media/usageTracker";
import { sanitizeVideoPlayingLayout } from "@/lib/videoPlayingImageValidation";
import { sanitizePhotoGalleryLayout } from "@/lib/photoGalleryImageValidation";
import { sanitizePlainText } from "@/lib/security/sanitize";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;
    const includeTotalParam = String(searchParams.get("includeTotal") || "").toLowerCase();
    const includeTotal = !(includeTotalParam === "0" || includeTotalParam === "false");
    const fieldsParam = String(searchParams.get("fields") || "").trim();

    let selectedFields = null;
    if (fieldsParam && fieldsParam !== "all" && fieldsParam !== "*") {
      const requested = fieldsParam
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
      if (!requested.includes("_id")) requested.unshift("_id");
      if (requested.length > 0) selectedFields = requested.join(" ");
    } else if (fieldsParam === "summary") {
      selectedFields = "_id title slug status updatedAt locale";
    }

    await connectDB();
    const pagesQuery = Page.find().sort({ updatedAt: -1 }).skip(skip).limit(limit);
    if (selectedFields) pagesQuery.select(selectedFields);

    const [pages, total] = await Promise.all([
      pagesQuery.lean(),
      includeTotal ? Page.countDocuments() : Promise.resolve(null),
    ]);

    const payload = {
      items: pages,
      page,
      limit,
    };
    if (includeTotal) {
      payload.total = total;
      payload.totalPages = Math.ceil(total / limit);
    }
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { title, slug: rawSlug, status, layout, meta, locale } = body;

    const cleanTitle = sanitizePlainText(title) || "Untitled";
    const result = normalizeSlug(rawSlug || cleanTitle);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Page.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
    }

    const safeLayout = Array.isArray(layout)
      ? sanitizePhotoGalleryLayout(sanitizeVideoPlayingLayout(layout))
      : [];

    if (safeLayout.length > 0) {
      const validationErrors = await validateLayoutProps(safeLayout);
      const blockingValidationErrors = filterLayoutValidationErrors(
        validationErrors,
        { nonBlockingBaseComponents: ["PhotoGallery"] },
      );
      if (blockingValidationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${blockingValidationErrors.join("; ")}` }, { status: 400 });
      }
    }

    const cleanMeta = meta && typeof meta === "object" ? {
      ...meta,
      metaTitle: sanitizePlainText(meta.metaTitle),
      metaDescription: sanitizePlainText(meta.metaDescription),
      metaKeywords: sanitizePlainText(meta.metaKeywords),
    } : {};

    const page = await Page.create({
      title: cleanTitle,
      slug,
      status: status || "draft",
      layout: safeLayout,
      meta: cleanMeta,
      ...(locale && { locale }),
      createdBy: session.email || "",
      updatedBy: session.email || "",
    });
    await syncMediaUsageForPage(page);
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
