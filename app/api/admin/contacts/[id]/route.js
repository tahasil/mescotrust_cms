import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    await connectDB();
    const doc = await ContactSubmission.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isRead: body.isRead === true },
      { new: true },
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const softDelete = new URL(req.url).searchParams.get("soft") === "true";
    let deleted = false;
    if (softDelete) {
      const result = await ContactSubmission.collection.updateOne(
        {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: { $ne: true },
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: session.email || session.id || "",
          },
        },
      );
      deleted = result.matchedCount > 0;
    } else {
      const doc = await ContactSubmission.findByIdAndDelete(id);
      deleted = Boolean(doc);
    }
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, softDeleted: softDelete });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
