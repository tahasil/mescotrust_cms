import path from "path";
import { mkdir, writeFile } from "fs/promises";

function sanitizeSegment(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeFilename(originalName, fallbackExt = ".bin") {
  const base = String(originalName || "upload")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const ext = path.extname(base) || fallbackExt;
  const name = path.basename(base, ext) || "upload";
  return `${name}${ext.toLowerCase()}`;
}

export function getFormUploadDirectory(formId) {
  const safeFormId = sanitizeSegment(formId) || "form";
  return path.join(process.cwd(), "storage", "form-submissions", safeFormId);
}

export async function persistUploadedFile({
  formId,
  originalName,
  fileBuffer,
  fallbackExt = ".bin",
}) {
  const dir = getFormUploadDirectory(formId);
  await mkdir(dir, { recursive: true });

  const safeName = sanitizeFilename(originalName, fallbackExt);
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const finalName = `${stamp}_${safeName}`;
  const absPath = path.join(dir, finalName);
  await writeFile(absPath, fileBuffer);

  return {
    fileName: finalName,
    absPath,
    publicUrl: "",
  };
}
