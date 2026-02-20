import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Page } from "@/models";

export async function GET() {
  await connectDB();
  const pages = await Page.find({ status: "published" })
    .select("title slug isHomePage seoTitle seoDescription")
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json(pages.map((p) => ({ ...p, id: String(p._id) })));
}
