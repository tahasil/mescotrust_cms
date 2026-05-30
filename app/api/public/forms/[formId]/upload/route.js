import path from "path";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { normalizeFormId } from "@/lib/formBuilder/shortcode";
import { FORM_FIELD_TYPE, FORM_STATUS } from "@/lib/formBuilder/constants";
import { getFormBundle } from "@/lib/formBuilder/service";
import { persistUploadedFile } from "@/lib/formBuilder/files";
import SubmissionFile from "@/models/SubmissionFile";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 20 });

function isAllowedFileType(file, rules = []) {
  if (!Array.isArray(rules) || rules.length === 0) return true;
  const mime = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  const normalized = rules.map((rule) => String(rule || "").trim().toLowerCase()).filter(Boolean);
  return normalized.some((rule) => {
    if (!rule) return false;
    if (rule.startsWith(".")) return name.endsWith(rule);
    return mime === rule || mime.startsWith(`${rule}/`);
  });
}

function ensureRuntimeAllowed(form, configuration) {
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
    const blocked = ensureRuntimeAllowed(bundle.form, bundle.configuration);
    if (blocked) return blocked;

    const formData = await req.formData();
    const fieldKey = String(formData.get("fieldKey") || "").trim();
    const file = formData.get("file");

    if (!fieldKey) return NextResponse.json({ error: "fieldKey is required" }, { status: 400 });
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const field = (bundle.fields || []).find((entry) => entry.fieldKey === fieldKey);
    if (!field) {
      return NextResponse.json({ error: "Invalid fieldKey for this form" }, { status: 400 });
    }
    if (field.type !== FORM_FIELD_TYPE.FILE) {
      return NextResponse.json({ error: "fieldKey does not map to a file field" }, { status: 400 });
    }

    const maxFileSizeMb = Number(field?.validation?.maxFileSizeMb || 0);
    const maxBytes = maxFileSizeMb > 0 ? maxFileSizeMb * 1024 * 1024 : 0;
    if (maxBytes > 0 && Number(file.size || 0) > maxBytes) {
      return NextResponse.json(
        { error: `File is too large (max ${maxFileSizeMb} MB)` },
        { status: 400 },
      );
    }
    if (!isAllowedFileType(file, field?.validation?.fileTypes || [])) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fallbackExt = path.extname(String(file.name || "")) || ".bin";
    const persisted = await persistUploadedFile({
      formId,
      originalName: file.name || "upload",
      fileBuffer: buffer,
      fallbackExt,
    });

    const uploadToken = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const fileDoc = await SubmissionFile.create({
      formId,
      fieldKey,
      uploadToken,
      originalName: String(file.name || "upload"),
      fileName: persisted.fileName,
      mimeType: String(file.type || ""),
      size: Number(file.size || buffer.length || 0),
      storagePath: persisted.absPath,
      publicUrl: persisted.publicUrl,
      uploadedByIp: clientId,
      isLinked: false,
      submissionId: null,
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          fileId: String(fileDoc._id),
          uploadToken,
          fieldKey,
          originalName: fileDoc.originalName,
          mimeType: fileDoc.mimeType,
          size: fileDoc.size,
          publicUrl: fileDoc.publicUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 },
    );
  }
}

