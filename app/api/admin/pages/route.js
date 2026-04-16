import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";
import { syncMediaUsageForPage } from "@/lib/media/usageTracker";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    await connectDB();
    const [pages, total] = await Promise.all([
      Page.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Page.countDocuments(),
    ]);
    return NextResponse.json({ items: pages, total, page, totalPages: Math.ceil(total / limit) });
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

    const result = normalizeSlug(rawSlug || title);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Page.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
    }

    if (Array.isArray(layout) && layout.length > 0) {
      const validationErrors = await validateLayoutProps(layout);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${validationErrors.join("; ")}` }, { status: 400 });
      }
    }

    const page = await Page.create({
      title: title || "Untitled",
      slug,
      status: status || "draft",
      layout: Array.isArray(layout) ? layout : [],
      meta: meta || {},
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
