import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id).lean();
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(media);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.alt !== undefined) media.alt = body.alt;
    await media.save();
    return NextResponse.json(media);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      const filePath = path.join(process.cwd(), "public", media.url);
      await unlink(filePath);
    } catch {
      // file may already be deleted
    }

    await Media.findByIdAndDelete(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
