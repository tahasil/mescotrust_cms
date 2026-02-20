import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Component, PageContent } from "@/models";
import { toSlug } from "@/utils/slug";

async function countPagesUsingComponent(nameOrSlug: string): Promise<number> {
  const pages = await PageContent.find({}).select("contentJSON").lean() as Array<{ contentJSON?: string }>;
  let count = 0;
  for (const p of pages) {
    try {
      const data = JSON.parse(p.contentJSON || "{}");
      const sections = data.sections ?? [];
      const hasComponent = sections.some(
        (s: { component?: string }) => s.component === nameOrSlug
      );
      if (hasComponent) count++;
    } catch {
      // ignore
    }
  }
  return count;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const component = await Component.findById(id).lean() as Record<string, unknown> & { name?: string } | null;
  if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const usageCount = await countPagesUsingComponent(component.name ?? "");
  return NextResponse.json({ ...component, usageCount });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: {
    name?: string;
    slug?: string;
    category?: string;
    schemaJSON?: string;
    defaultPropsJSON?: string;
    isActive?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const component = await Component.findById(id).lean() as { slug?: string } | null;
  if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.slug !== undefined) {
    const slug = body.slug.trim() ? toSlug(body.slug) : (component.slug ?? "");
    const existing = await Component.findOne({ slug, _id: { $ne: new mongoose.Types.ObjectId(id) } }).lean();
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }
  }

  await Component.updateOne(
    { _id: id },
    {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() ? toSlug(body.slug) : undefined }),
      ...(body.category !== undefined && { category: body.category.trim() }),
      ...(body.schemaJSON !== undefined && { schemaJSON: body.schemaJSON }),
      ...(body.defaultPropsJSON !== undefined && { defaultPropsJSON: body.defaultPropsJSON }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    }
  );
  const updated = await Component.findById(id).lean();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const component = await Component.findById(id).lean() as { name?: string } | null;
  if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const usageCount = await countPagesUsingComponent(component.name ?? "");
  if (usageCount > 0) {
    return NextResponse.json(
      { error: `${usageCount} page(s) use this component. Deactivate instead or remove from pages first.` },
      { status: 400 }
    );
  }
  await Component.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
