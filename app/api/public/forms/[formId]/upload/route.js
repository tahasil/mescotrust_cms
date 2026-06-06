import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import SubmissionFile from "@/models/SubmissionFile";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { ALLOWED_UPLOAD_MIME_TYPES, UPLOAD_MIME_BY_EXT } from "@/lib/media/constants";
import { isSvgMimeType, sanitizeUploadedSvg } from "@/lib/media/svgSanitizer";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 10 });
const FORM_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "forms");
const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeExt(value) {
  const ext = normalizeText(value).toLowerCase();
  if (!ext) return "";
  return ext.startsWith(".") ? ext : `.${ext}`;
}

function sanitizeName(name) {
  return normalizeText(name || "upload")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

function getFileExtension(filename) {
  const ext = path.extname(normalizeText(filename)).toLowerCase();
  return ext || "";
}

function toAllowedSet(value, normalize = (entry) => normalizeText(entry).toLowerCase()) {
  if (!Array.isArray(value) || value.length === 0) return null;
  const set = new Set(value.map((entry) => normalize(entry)).filter(Boolean));
  return set.size > 0 ? set : null;
}

function resolveMaxSizeBytes(rules) {
  const maxSizeBytes = Number(rules?.maxSizeBytes);
  if (Number.isFinite(maxSizeBytes) && maxSizeBytes > 0) return Math.round(maxSizeBytes);
  const maxSizeMB = Number(rules?.maxSizeMB);
  if (Number.isFinite(maxSizeMB) && maxSizeMB > 0) return Math.round(maxSizeMB * 1024 * 1024);
  return DEFAULT_MAX_FILE_SIZE_BYTES;
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
      { formSchema: 1, formId: 1 },
    ).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const fieldKey = normalizeText(formData.get("fieldKey"));

    if (!fieldKey) {
      return NextResponse.json({ error: "fieldKey is required" }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const question = (Array.isArray(form.formSchema?.questions) ? form.formSchema.questions : []).find(
      (item) => normalizeText(item?.fieldKey) === fieldKey,
    );
    if (!question || normalizeText(question.type) !== "file") {
      return NextResponse.json({ error: "Invalid file field" }, { status: 400 });
    }

    const originalName = sanitizeName(file.name) || "upload";
    const extension = normalizeExt(getFileExtension(originalName));
    const detectedMime = normalizeText(file.type).toLowerCase();
    const inferredMime = UPLOAD_MIME_BY_EXT[extension] || "";
    const mimeType = detectedMime || inferredMime;

    if (!mimeType || !ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (!extension || !UPLOAD_MIME_BY_EXT[extension]) {
      return NextResponse.json({ error: "Unsupported file extension" }, { status: 400 });
    }

    const allowedMimeTypes = toAllowedSet(question?.rules?.allowedMimeTypes);
    const allowedExtensions = toAllowedSet(question?.rules?.allowedExtensions, normalizeExt);
    if (allowedMimeTypes && !allowedMimeTypes.has(mimeType)) {
      return NextResponse.json({ error: "This file type is not allowed for this field" }, { status: 400 });
    }
    if (allowedExtensions && !allowedExtensions.has(extension)) {
      return NextResponse.json({ error: "This file extension is not allowed for this field" }, { status: 400 });
    }

    const maxBytes = resolveMaxSizeBytes(question?.rules || {});
    if (Number(file.size || 0) > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max size is ${Math.round(maxBytes / (1024 * 1024) * 100) / 100} MB.` },
        { status: 400 },
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    if (isSvgMimeType(mimeType)) {
      const sanitized = sanitizeUploadedSvg(buffer);
      if (!sanitized.ok) {
        return NextResponse.json({ error: sanitized.error }, { status: 400 });
      }
      buffer = sanitized.buffer;
    }

    const now = new Date();
    const dir = path.join(
      FORM_UPLOAD_ROOT,
      formId,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
    );
    await fs.mkdir(dir, { recursive: true });

    const storedFilename = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(dir, storedFilename);
    await fs.writeFile(absolutePath, buffer);

    const relativePath = path
      .relative(path.join(process.cwd(), "public"), absolutePath)
      .split(path.sep)
      .join("/");
    const url = `/${relativePath}`;

    const fileDoc = await SubmissionFile.create({
      formId,
      submissionId: "",
      fieldKey,
      filename: storedFilename,
      mimeType,
      size: buffer.length,
      storagePath: relativePath,
      url,
      status: "pending",
    });

    return NextResponse.json(
      {
        submissionFileId: String(fileDoc._id),
        formId,
        fieldKey,
        filename: fileDoc.filename,
        mimeType: fileDoc.mimeType,
        size: fileDoc.size,
        url: fileDoc.url,
        status: fileDoc.status,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to upload form file" },
      { status: 500 },
    );
  }
}
