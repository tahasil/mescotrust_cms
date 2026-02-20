import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BlogCategory } from "@/models";

export async function GET() {
  await connectDB();
  const list = await BlogCategory.find().sort({ order: 1, name: 1 }).lean();
  return NextResponse.json(list);
}
