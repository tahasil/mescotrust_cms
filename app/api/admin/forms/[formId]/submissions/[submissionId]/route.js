import { promises as fs } from "fs";
import path from "path";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import SubmissionFile from "@/models/SubmissionFile";
import { canAccessFormBuilder } from "@/lib/forms/access";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toDetail(doc) {
  return {
    _id: doc._id,
    formId: doc.formId,
    schemaVersion: doc.schemaVersion,
    isRead: Boolean(doc.isRead),
    source: doc.source || "",
    pagePath: doc.pagePath || "",
    fieldSnapshot: doc.fieldSnapshot || {},
    payloadByFieldKey: doc.payloadByFieldKey || {},
    payloadByFieldNameSnapshot: doc.payloadByFieldNameSnapshot || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function removeStoredFile(storagePath) {
  const raw = normalizeText(storagePath).replace(/\\/g, "/");
  if (!raw) return;

  const absolutePath = path.resolve(
    path.isAbsolute(raw) ? raw : path.join(PUBLIC_ROOT, raw),
  );
  if (!absolutePath.startsWith(PUBLIC_ROOT)) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
  }
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
      { _id: submissionId, formId },
      {
        _id: 1,
        formId: 1,
        schemaVersion: 1,
        isRead: 1,
        source: 1,
        pagePath: 1,
        fieldSnapshot: 1,
        payloadByFieldKey: 1,
        payloadByFieldNameSnapshot: 1,
        createdAt: 1,
        updatedAt: 1,
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
      { _id: submissionId, formId },
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

    const submission = await FormSubmission.findOne({ _id: submissionId, formId }, { _id: 1 }).lean();
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const linkedFiles = await SubmissionFile.find(
      { formId, submissionId },
      { _id: 1, storagePath: 1 },
    ).lean();

    for (const file of linkedFiles || []) {
      await removeStoredFile(file?.storagePath);
    }

    await SubmissionFile.deleteMany({ formId, submissionId });
    await FormSubmission.deleteOne({ _id: submissionId, formId });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete submission" },
      { status: 500 },
    );
  }
}
