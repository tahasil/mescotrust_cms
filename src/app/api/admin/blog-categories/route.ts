import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { BlogCategory } from "@/models";
import { toSlug } from "@/utils/slug";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await BlogCategory.find().sort({ order: 1, name: 1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { name: string; slug?: string; description?: string; order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.name || "category");
  const cat = await BlogCategory.create({
    name: body.name ?? "Category",
    slug,
    description: body.description ?? null,
    order: body.order ?? 0,
  });
  return NextResponse.json(cat);
}
