import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findById(id).populate("layout.componentId").lean();
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const { title, slug: rawSlug, status, layout, meta, locale } = body;

    await connectDB();
    const page = await Page.findById(id);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Page.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
      }
      page.slug = result.slug;
    }
    if (title !== undefined) page.title = title;
    if (status !== undefined) page.status = status;
    if (Array.isArray(layout)) {
      const validationErrors = await validateLayoutProps(layout);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${validationErrors.join("; ")}` }, { status: 400 });
      }
      page.layout = layout;
    }
    if (meta !== undefined) page.meta = meta;
    if (locale !== undefined) page.locale = locale;
    page.updatedBy = session.email || "";

    await page.save();
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findByIdAndDelete(id);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
