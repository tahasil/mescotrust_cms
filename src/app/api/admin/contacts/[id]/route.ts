import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { ContactSubmission } from "@/models";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { isRead?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sub = await ContactSubmission.findById(id).lean();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ContactSubmission.updateOne(
    { _id: id },
    { ...(body.isRead !== undefined && { isRead: body.isRead }) }
  );
  const updated = await ContactSubmission.findById(id).lean();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  await ContactSubmission.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
