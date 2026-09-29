import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import CareerSubmission from "@/models/CareerSubmission";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    await connectDB();
    const submission = await CareerSubmission.findById(id).lean();
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const body = await req.json();
    await connectDB();

    const updateFields = {};
    if (typeof body.isRead === "boolean") updateFields.isRead = body.isRead;
    if (body.status && ["new", "reviewed", "shortlisted", "rejected", "archived"].includes(body.status)) {
      updateFields.status = body.status;
    }

    const updated = await CareerSubmission.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    await connectDB();
    const submission = await CareerSubmission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.resume?.filename) {
      const filePath = path.join(process.cwd(), "public", "uploads", "careers", submission.resume.filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // File may already be deleted
      }
    }

    await CareerSubmission.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Submission deleted successfully." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
