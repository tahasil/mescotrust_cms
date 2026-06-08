import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import { canAccessFormBuilder } from "@/lib/forms/access";
import { normalizeText } from "@/lib/forms/submissionUtils";

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toDetail(doc) {
  return {
    _id: doc._id,
    formId: doc.formId,
    schemaVersion: doc.schemaVersion,
    isRead: Boolean(doc.isRead),
    isDeleted: Boolean(doc.isDeleted),
    source: doc.source || "",
    pagePath: doc.pagePath || "",
    fieldSnapshot: doc.fieldSnapshot || {},
    payloadByFieldKey: doc.payloadByFieldKey || {},
    payloadByFieldNameSnapshot: doc.payloadByFieldNameSnapshot || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt || null,
    deletedBy: doc.deletedBy || "",
  };
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    const submissionId = normalizeText(params?.submissionId);
    if (!formId || !submissionId) {
      return NextResponse.json({ error: "formId and submissionId are required" }, { status: 400 });
    }
    if (!isValidObjectId(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const form = await Form.findOne({ formId }, { _id: 1 }).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const submission = await FormSubmission.findOne(
      { _id: submissionId, formId, isDeleted: { $ne: true } },
      {
        _id: 1,
        formId: 1,
        schemaVersion: 1,
        isRead: 1,
        isDeleted: 1,
        source: 1,
        pagePath: 1,
        fieldSnapshot: 1,
        payloadByFieldKey: 1,
        payloadByFieldNameSnapshot: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: 1,
        deletedBy: 1,
      },
    ).lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(toDetail(submission), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load submission" },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    const submissionId = normalizeText(params?.submissionId);
    if (!formId || !submissionId) {
      return NextResponse.json({ error: "formId and submissionId are required" }, { status: 400 });
    }
    if (!isValidObjectId(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    if (typeof body?.isRead !== "boolean") {
      return NextResponse.json({ error: "Only isRead boolean is supported" }, { status: 400 });
    }

    const submission = await FormSubmission.findOneAndUpdate(
      { _id: submissionId, formId, isDeleted: { $ne: true } },
      { $set: { isRead: body.isRead } },
      { new: true },
    ).lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(toDetail(submission));
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to update submission" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    const submissionId = normalizeText(params?.submissionId);
    if (!formId || !submissionId) {
      return NextResponse.json({ error: "formId and submissionId are required" }, { status: 400 });
    }
    if (!isValidObjectId(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const now = new Date();
    const submission = await FormSubmission.findOneAndUpdate(
      { _id: submissionId, formId, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          deletedBy: normalizeText(session?.id),
          updatedAt: now,
        },
      },
      { new: true },
    ).lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      deleted: true,
      softDeleted: true,
      submission: toDetail(submission),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete submission" },
      { status: 500 },
    );
  }
}
