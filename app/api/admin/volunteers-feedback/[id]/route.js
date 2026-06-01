import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import VolunteersFeedbackSubmission from "@/models/VolunteersFeedbackSubmission";

function invalidIdResponse() {
  return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidIdResponse();

    await connectDB();
    const doc = await VolunteersFeedbackSubmission.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidIdResponse();

    const body = await req.json();
    const update = {};
    if (body?.isRead !== undefined) update.isRead = body.isRead === true;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectDB();
    const doc = await VolunteersFeedbackSubmission.findByIdAndUpdate(id, update, {
      new: true,
    });
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
    const id = params?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidIdResponse();

    await connectDB();
    const doc = await VolunteersFeedbackSubmission.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
