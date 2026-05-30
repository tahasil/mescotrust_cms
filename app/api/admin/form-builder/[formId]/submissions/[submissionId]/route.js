import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import {
  canAccessFormBuilder,
  canDeleteFormBuilderData,
} from "@/lib/formBuilder/permissions";
import { normalizeFormId } from "@/lib/formBuilder/shortcode";
import Form from "@/models/Form";
import FormField from "@/models/FormField";
import FormSubmission from "@/models/FormSubmission";
import SubmissionFile from "@/models/SubmissionFile";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const formId = normalizeFormId(params.formId);
    const submissionId = params.submissionId;

    if (!formId) return NextResponse.json({ error: "Invalid formId" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const [form, fields, submission, files] = await Promise.all([
      Form.findOne({ formId }).lean(),
      FormField.find({ formId }).sort({ order: 1 }).lean(),
      FormSubmission.findOne({ _id: submissionId, formId }).lean(),
      SubmissionFile.find({ submissionId, formId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    return noStoreJson({
      form,
      fields,
      submission,
      files,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load submission" },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const formId = normalizeFormId(params.formId);
    const submissionId = params.submissionId;
    if (!formId) return NextResponse.json({ error: "Invalid formId" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const body = await req.json();
    const update = {};
    if (body.isRead !== undefined) {
      const isRead = body.isRead === true;
      update.isRead = isRead;
      update.status = isRead ? "read" : "new";
      update.readAt = isRead ? new Date() : null;
      update.readBy = isRead ? (session.email || session.name || "") : "";
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const doc = await FormSubmission.findOneAndUpdate(
      { _id: submissionId, formId },
      update,
      { new: true },
    ).lean();
    if (!doc) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    return noStoreJson({ submission: doc });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to update submission" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canDeleteFormBuilderData(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    await connectDB();
    const formId = normalizeFormId(params.formId);
    const submissionId = params.submissionId;
    if (!formId) return NextResponse.json({ error: "Invalid formId" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json({ error: "Invalid submissionId" }, { status: 400 });
    }

    const doc = await FormSubmission.findOneAndDelete({ _id: submissionId, formId }).lean();
    if (!doc) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    await SubmissionFile.deleteMany({ submissionId, formId });
    return noStoreJson({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete submission" },
      { status: 500 },
    );
  }
}

