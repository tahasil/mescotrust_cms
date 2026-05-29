import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";

function invalidId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

export async function PATCH(req, { params }) {
  const session = await requirePermission(req, "submissions.edit");
  if (session instanceof NextResponse) return session;

  try {
    const submissionId = String(params?.submissionId || "");
    if (invalidId(submissionId)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const nextReadValue = body?.isRead === true;

    await connectDB();
    const updated = await Form.findOneAndUpdate(
      { "submissions._id": submissionId },
      { $set: { "submissions.$.isRead": nextReadValue } },
      { new: true },
    ).select({ _id: 1, formKey: 1, name: 1, submissions: { $elemMatch: { _id: submissionId } } });

    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      formKey: updated.formKey,
      formName: updated.name,
      submission: Array.isArray(updated.submissions) ? updated.submissions[0] || null : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update submission" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "submissions.delete");
  if (session instanceof NextResponse) return session;

  try {
    const submissionId = String(params?.submissionId || "");
    if (invalidId(submissionId)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
    }

    await connectDB();
    const result = await Form.updateOne(
      { "submissions._id": submissionId },
      { $pull: { submissions: { _id: submissionId } } },
    );

    if (!result || result.modifiedCount < 1) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete submission" }, { status: 500 });
  }
}
