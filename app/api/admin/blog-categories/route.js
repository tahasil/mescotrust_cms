import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import BlogCategory from "@/models/BlogCategory";
import { normalizeSlug } from "@/lib/slug";
import { sanitizePlainText } from "@/lib/security/sanitize";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const categories = await BlogCategory.find().sort({ order: 1, name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, slug: rawSlug, description, order } = body;

    const cleanName = sanitizePlainText(name) || "Unnamed";
    const result = normalizeSlug(rawSlug || cleanName);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await BlogCategory.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 400 });
    }

    const category = await BlogCategory.create({
      name: cleanName,
      slug,
      description: sanitizePlainText(description || ""),
      order: typeof order === "number" ? order : 0,
    });
    return NextResponse.json(category);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
