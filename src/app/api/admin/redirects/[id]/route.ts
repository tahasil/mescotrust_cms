import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Redirect } from "@/models";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { fromPath?: string; toPath?: string; statusCode?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const redir = await Redirect.findById(id).lean();
  if (!redir) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Redirect.updateOne(
    { _id: id },
    {
      ...(body.fromPath !== undefined && { fromPath: body.fromPath }),
      ...(body.toPath !== undefined && { toPath: body.toPath }),
      ...(body.statusCode !== undefined && { statusCode: body.statusCode }),
    }
  );
  const updated = await Redirect.findById(id).lean();
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
  await Redirect.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
