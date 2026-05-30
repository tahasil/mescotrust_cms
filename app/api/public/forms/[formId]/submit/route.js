import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import {
  FILE_FIELD_TYPES,
  FORM_STATUS,
} from "@/lib/formBuilder/constants";
import { normalizeFormId } from "@/lib/formBuilder/shortcode";
import {
  getFormBundle,
  submissionSnapshotFromFields,
} from "@/lib/formBuilder/service";
import { validateSubmissionAgainstSchema } from "@/lib/formBuilder/submissionValidation";
import { buildSearchableText } from "@/lib/formBuilder/submissionUtils";
import FormSubmission from "@/models/FormSubmission";
import SubmissionFile from "@/models/SubmissionFile";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });

function normalizeTokenList(rawValue) {
  const list = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
  return list
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();
      if (typeof item === "object") {
        if (item.uploadToken) return String(item.uploadToken).trim();
        if (item.token) return String(item.token).trim();
      }
      return "";
    })
    .filter(Boolean);
}

function runtimeBlockedResponse(form, configuration) {
  if (form.status === FORM_STATUS.DRAFT) {
    return NextResponse.json({ error: "This form is not published yet." }, { status: 403 });
  }
  if (form.status === FORM_STATUS.ARCHIVED && configuration?.allowArchivedRender !== true) {
    return NextResponse.json({ error: "This form has been archived." }, { status: 403 });
  }
  return null;
}

export async function POST(req, { params }) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    await connectDB();
    const formId = normalizeFormId(params.formId);
    if (!formId) return NextResponse.json({ error: "Invalid formId" }, { status: 400 });

    const bundle = await getFormBundle(formId);
    if (!bundle) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const blocked = runtimeBlockedResponse(bundle.form, bundle.configuration);
    if (blocked) return blocked;

    let body = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }
    const payloadByFieldKey =
      body?.payloadByFieldKey && typeof body.payloadByFieldKey === "object"
        ? body.payloadByFieldKey
        : body?.payload && typeof body.payload === "object"
          ? body.payload
          : {};
    const filesByFieldKeyRaw =
      body?.filesByFieldKey && typeof body.filesByFieldKey === "object"
        ? body.filesByFieldKey
        : {};

    const fileFieldKeys = (bundle.fields || [])
      .filter((field) => FILE_FIELD_TYPES.has(field.type))
      .map((field) => field.fieldKey);

    const uploadTokens = [];
    for (const fieldKey of fileFieldKeys) {
      const tokens = normalizeTokenList(
        filesByFieldKeyRaw[fieldKey] !== undefined
          ? filesByFieldKeyRaw[fieldKey]
          : payloadByFieldKey[fieldKey],
      );
      uploadTokens.push(...tokens);
    }

    const uniqueTokens = [...new Set(uploadTokens)];
    let uploadedFiles = [];
    if (uniqueTokens.length > 0) {
      uploadedFiles = await SubmissionFile.find({
        formId,
        uploadToken: { $in: uniqueTokens },
        submissionId: null,
      }).lean();
    }
    const fileByToken = new Map(uploadedFiles.map((entry) => [entry.uploadToken, entry]));

    const filesByFieldKey = {};
    for (const fieldKey of fileFieldKeys) {
      const tokens = normalizeTokenList(
        filesByFieldKeyRaw[fieldKey] !== undefined
          ? filesByFieldKeyRaw[fieldKey]
          : payloadByFieldKey[fieldKey],
      );
      filesByFieldKey[fieldKey] = tokens
        .map((token) => fileByToken.get(token))
        .filter(Boolean);
    }

    const validation = validateSubmissionAgainstSchema({
      fields: bundle.fields || [],
      payloadByFieldKey,
      filesByFieldKey,
    });

    if (!validation.ok) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    // Preserve file metadata directly in submission payload snapshots.
    for (const [fieldKey, files] of Object.entries(filesByFieldKey)) {
      if (!Array.isArray(files) || files.length === 0) continue;
      const compact = files.map((entry) => ({
        fileId: String(entry._id),
        uploadToken: entry.uploadToken,
        originalName: entry.originalName,
        fileName: entry.fileName,
        mimeType: entry.mimeType,
        size: entry.size,
        publicUrl: entry.publicUrl,
      }));
      validation.payloadByFieldKey[fieldKey] = compact;

      const field = (bundle.fields || []).find((item) => item.fieldKey === fieldKey);
      if (field?.name) validation.payloadByFieldNameSnapshot[field.name] = compact;
    }

    const searchableText = buildSearchableText({
      fields: bundle.fields || [],
      payloadByFieldNameSnapshot: validation.payloadByFieldNameSnapshot,
      payloadByFieldKey: validation.payloadByFieldKey,
    });

    const submission = await FormSubmission.create({
      formId,
      schemaVersion: Number(bundle.configuration?.schemaVersion || 1),
      fieldSnapshot: submissionSnapshotFromFields(bundle.fields || []),
      payloadByFieldKey: validation.payloadByFieldKey,
      payloadByFieldNameSnapshot: validation.payloadByFieldNameSnapshot,
      source: String(body?.source || "").trim(),
      page: String(body?.page || "").trim(),
      referrer: String(body?.referrer || req.headers.get("referer") || "").trim(),
      ip: clientId,
      userAgent: String(req.headers.get("user-agent") || "").trim(),
      searchableText,
      isRead: false,
      status: "new",
    });

    if (uniqueTokens.length > 0) {
      await SubmissionFile.updateMany(
        {
          formId,
          uploadToken: { $in: uniqueTokens },
          submissionId: null,
        },
        {
          $set: {
            submissionId: submission._id,
            isLinked: true,
            linkedAt: new Date(),
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          bundle.configuration?.successMessage ||
          "Thanks! Your submission has been received.",
        submissionId: submission._id,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit form" },
      { status: 500 },
    );
  }
}
