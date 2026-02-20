import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Revision } from "@/models";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const revisions = await Revision.find({ pageId: id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json(revisions);
}
