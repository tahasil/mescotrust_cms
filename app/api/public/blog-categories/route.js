import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogCategory from "@/models/BlogCategory";

export async function GET() {
  try {
    await connectDB();
    const categories = await BlogCategory.find().sort({ order: 1, name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
