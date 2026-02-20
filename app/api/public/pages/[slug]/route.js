import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";

export async function GET(req, { params }) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await connectDB();
    const page = await Page.findOne({ slug, status: "published" })
      .populate("layout.componentId")
      .lean();

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const layout = (page.layout || []).map((block) => ({
      ...block,
      baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
      componentId: block.componentId,
    }));

    return NextResponse.json({ ...page, layout });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
