import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Component } from "@/models";
import { toSlug } from "@/utils/slug";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const components = await Component.find().sort({ category: 1, name: 1 }).lean();
  return NextResponse.json(components.map((c) => ({ ...c, id: String(c._id) })));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: {
    name: string;
    slug?: string;
    category: string;
    schemaJSON: string;
    defaultPropsJSON?: string;
    isSystemComponent?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.name || "component");
  const existing = await Component.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  const component = await Component.create({
    name: body.name?.trim() || "Component",
    slug,
    category: body.category?.trim() || "General",
    schemaJSON: body.schemaJSON ?? "[]",
    defaultPropsJSON: body.defaultPropsJSON ?? null,
    isSystemComponent: body.isSystemComponent ?? false,
    isActive: true,
  });
  return NextResponse.json(component);
}
