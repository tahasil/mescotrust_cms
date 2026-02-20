import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Page, PageContent, Revision } from "@/models";
import { toSlug, isValidSlug } from "@/utils/slug";
import { validatePageContent } from "@/lib/validatePageContent";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const page = await Page.findById(id).lean() as { _id: unknown; [k: string]: unknown } | null;
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const content = await PageContent.findOne({ pageId: id }).lean() as { _id: unknown; [k: string]: unknown } | null;
  return NextResponse.json({ ...page, id: String(page._id), content: content ? { ...content, id: String(content._id) } : null });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: {
    title?: string;
    slug?: string;
    status?: string;
    isHomePage?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    contentJSON?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const page = await Page.findById(id).lean() as { title?: string; slug?: string } | null;
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug =
    body.slug !== undefined
      ? (body.slug.trim() ? toSlug(body.slug) : toSlug((body.title ?? page.title) ?? ""))
      : (page.slug ?? "");

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Invalid or reserved slug" },
      { status: 400 }
    );
  }

  const existing = await Page.findOne({ slug, _id: { $ne: new mongoose.Types.ObjectId(id) } }).lean();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  if (body.isHomePage) {
    await Page.updateMany({ _id: { $ne: id } }, { isHomePage: false });
  }

  await Page.updateOne(
    { _id: id },
    {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.slug !== undefined && { slug }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.isHomePage !== undefined && { isHomePage: body.isHomePage }),
      ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
      ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
    }
  );

  if (body.contentJSON !== undefined) {
    const validation = await validatePageContent(body.contentJSON);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid content", details: validation.errors },
        { status: 400 }
      );
    }
    const content = await PageContent.findOne({ pageId: id }).lean() as { _id: unknown; contentJSON?: string; version?: number } | null;
    if (content) {
      await Revision.create({
        pageId: id,
        contentJSON: content.contentJSON ?? "",
        version: content.version ?? 0,
        createdBy: auth.session.user?.id,
      });
      await PageContent.updateOne(
        { _id: content._id },
        {
          contentJSON: body.contentJSON,
          version: (content.version ?? 0) + 1,
        }
      );
    }
  }

  const result = await Page.findById(id).lean() as { _id: unknown; [k: string]: unknown } | null;
  const resultContent = await PageContent.findOne({ pageId: id }).lean() as { _id: unknown; [k: string]: unknown } | null;
  return NextResponse.json({
    ...result,
    id: result ? String(result._id) : id,
    content: resultContent ? { ...resultContent, id: String(resultContent._id) } : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  await Page.findByIdAndDelete(id);
  await PageContent.deleteOne({ pageId: id });
  return NextResponse.json({ ok: true });
}
