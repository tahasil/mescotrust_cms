import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { buildPublishedSlugFilter, toPublishedPageShape } from "@/lib/pagePublication";

export async function GET(req, { params }) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale");
    const filter = buildPublishedSlugFilter(slug, locale);

    await connectDB();
    const page = await Page.findOne(filter)
      .populate("layout.componentId")
      .populate("publishedLayout.componentId")
      .lean();

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const livePage = toPublishedPageShape(page);

    const layout = (livePage.layout || []).map((block) => ({
      ...block,
      baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
      componentId: block.componentId,
    }));

    return NextResponse.json({ ...livePage, layout });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
