import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Page, PageContent } from "@/models";
import { toSlug, isValidSlug } from "@/utils/slug";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const pages = await Page.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json(pages.map((p) => ({ ...p, id: String(p._id) })));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { title: string; slug?: string; status?: string; isHomePage?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.title);
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Invalid or reserved slug" },
      { status: 400 }
    );
  }
  const existing = await Page.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  if (body.isHomePage) {
    await Page.updateMany({}, { isHomePage: false });
  }
  const page = await Page.create({
    title: body.title || "Untitled",
    slug,
    status: body.status ?? "draft",
    isHomePage: body.isHomePage ?? false,
  });
  await PageContent.create({
    pageId: page._id,
    contentJSON: JSON.stringify({ sections: [], modals: [], overlays: [] }),
  });
  return NextResponse.json({ ...page.toObject(), id: String(page._id) });
}
