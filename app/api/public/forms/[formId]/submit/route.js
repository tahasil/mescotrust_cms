import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import SubmissionFile from "@/models/SubmissionFile";
import { FORM_DEFAULTS } from "@/lib/forms/constants";
import { validateSubmissionAndBuild } from "@/lib/forms/runtimeValidation";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 8 });
const PENDING_FILE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function extractSubmissionFileIds(input, ids) {
  if (Array.isArray(input)) {
    input.forEach((item) => extractSubmissionFileIds(item, ids));
    return;
  }
  if (input && typeof input === "object") {
    const objectId = normalizeText(input?.submissionFileId || input?.id || input?._id);
    if (objectId) ids.add(objectId);
    return;
  }
  const scalarId = normalizeText(input);
  if (scalarId) ids.add(scalarId);
}

function collectSubmissionFileIds(answersByFieldKey, fileFieldKeys = []) {
  const ids = new Set();
  fileFieldKeys.forEach((fieldKey) => {
    const value = answersByFieldKey?.[fieldKey];
    extractSubmissionFileIds(value, ids);
  });
  return [...ids];
}

function buildAnswersByFieldKey(body, formSchema) {
  const answersByFieldKey =
    (body?.answersByFieldKey && typeof body.answersByFieldKey === "object" ? body.answersByFieldKey : null) ||
    (body?.answers && typeof body.answers === "object" ? body.answers : null) ||
    (body?.payloadByFieldKey && typeof body.payloadByFieldKey === "object" ? body.payloadByFieldKey : null) ||
    {};

  const answersByFieldName =
    (body?.answersByFieldName && typeof body.answersByFieldName === "object"
      ? body.answersByFieldName
      : null) ||
    (body?.payload && typeof body.payload === "object" ? body.payload : null) ||
    {};

  const fieldNameToKey = new Map(
    (Array.isArray(formSchema?.questions) ? formSchema.questions : [])
      .filter((question) => question?.fieldName && question?.fieldKey)
      .map((question) => [normalizeText(question.fieldName), normalizeText(question.fieldKey)]),
  );

  const merged = { ...answersByFieldKey };
  Object.entries(answersByFieldName).forEach(([fieldName, value]) => {
    const key = fieldNameToKey.get(normalizeText(fieldName));
    if (!key) return;
    if (merged[key] !== undefined) return;
    merged[key] = value;
  });

  return merged;
}

function collectLinkedFileIds(payloadByFieldKey) {
  const ids = new Set();
  Object.values(payloadByFieldKey || {}).forEach((value) => {
    if (!Array.isArray(value)) return;
    value.forEach((entry) => {
      const submissionFileId = normalizeText(entry?.submissionFileId || entry?.id || entry?._id);
      if (submissionFileId) ids.add(submissionFileId);
    });
  });
  return [...ids];
}

export async function POST(req, { params }) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const form = await Form.findOne(
      { formId, status: "published" },
      { formId: 1, schemaVersion: 1, formSchema: 1 },
    ).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const honeypot = normalizeText(body?.website || body?.formTrap);
    if (honeypot) {
      return NextResponse.json(
        { success: true, submissionId: null, message: FORM_DEFAULTS.successMessage },
        { status: 201 },
      );
    }

    const answersByFieldKey = buildAnswersByFieldKey(body, form.formSchema || {});
    const fileFieldKeys = (Array.isArray(form.formSchema?.questions) ? form.formSchema.questions : [])
      .filter((question) => normalizeText(question?.type) === "file")
      .map((question) => normalizeText(question?.fieldKey))
      .filter(Boolean);
    const pendingFileIds = collectSubmissionFileIds(answersByFieldKey, fileFieldKeys);

    const invalidFileId = pendingFileIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidFileId) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: [{ fieldKey: "file", error: "Invalid uploaded file reference" }],
        },
        { status: 400 },
      );
    }

    const pendingFiles = pendingFileIds.length
      ? await SubmissionFile.find(
          {
            _id: { $in: pendingFileIds },
            formId,
            status: "pending",
            createdAt: { $gte: new Date(Date.now() - PENDING_FILE_TTL_MS) },
          },
          { _id: 1, fieldKey: 1, filename: 1, mimeType: 1, size: 1, url: 1 },
        ).lean()
      : [];

    const filesById = new Map((pendingFiles || []).map((file) => [String(file._id), file]));
    const validated = validateSubmissionAndBuild({
      formSchema: form.formSchema || {},
      answersByFieldKey,
      filesById,
    });

    if (!validated.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validated.errors,
        },
        { status: 400 },
      );
    }

    const submission = await FormSubmission.create({
      formId,
      schemaVersion: Number(form.schemaVersion || 1),
      fieldSnapshot: validated.fieldSnapshot,
      payloadByFieldKey: validated.payloadByFieldKey,
      payloadByFieldNameSnapshot: validated.payloadByFieldNameSnapshot,
      searchText: validated.searchText,
      isRead: false,
      source: normalizeText(body?.source || "form-builder"),
      pagePath: normalizeText(body?.pagePath || body?.page),
    });

    const linkedFileIds = collectLinkedFileIds(validated.payloadByFieldKey);
    if (linkedFileIds.length > 0) {
      await SubmissionFile.updateMany(
        {
          _id: { $in: linkedFileIds },
          formId,
          status: "pending",
        },
        {
          $set: {
            status: "linked",
            submissionId: String(submission._id),
            updatedAt: new Date(),
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        formId,
        submissionId: String(submission._id),
        message: FORM_DEFAULTS.successMessage,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit form" },
      { status: 500 },
    );
  }
}
