import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Page, PageContent } from "@/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectDB();
  const { slug } = await params;
  const page = await Page.findOne({ slug, status: "published" }).lean();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const content = await PageContent.findOne({ pageId: page._id }).lean();
  return NextResponse.json({ ...page, content: content ?? null });
}
