import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale");
    const filter = { slug, status: "published" };
    if (locale) filter.locale = locale;

    await connectDB();
    const page = await Page.findOne(filter)
      .populate("layout.componentId")
      .lean();

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const layout = (page.layout || []).map((block) => ({
      ...block,
      baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
      componentId: block.componentId,
    }));

    return NextResponse.json(
      { ...page, layout },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
