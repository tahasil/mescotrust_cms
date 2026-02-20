import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Revision, PageContent } from "@/models";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id: pageId, revisionId } = await params;
  const revision = await Revision.findOne({ _id: revisionId, pageId }).lean() as { contentJSON: string } | null;
  if (!revision) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const content = await PageContent.findOne({ pageId }).lean() as { version?: number } | null;
  if (!content) return NextResponse.json({ error: "Page content not found" }, { status: 404 });
  await PageContent.updateOne(
    { pageId },
    {
      contentJSON: revision.contentJSON,
      version: (content.version ?? 0) + 1,
    }
  );
  return NextResponse.json({ ok: true, contentJSON: revision.contentJSON });
}
