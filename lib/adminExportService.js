import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const LARGE_EXPORT_ROW_THRESHOLD = 5000;
const EXPORT_STORAGE_DIR = path.resolve(process.cwd(), "public", "exports", "admin-exports");
const EXPORT_STORAGE_BASE_PATH = "/exports/admin-exports";
const EXPORT_FILE_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

export function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function nowStamp() {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}`;
}

export function sanitizeFileToken(value, fallback = "export") {
  const safe = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

export function sanitizeSheetName(raw) {
  const cleaned = normalizeText(raw || "Export")
    .replace(/[:\\/?*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "Export").slice(0, 31);
}

export function parseDate(value, { endOfDay = false } = {}) {
  if (!value) return null;
  const raw = normalizeText(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    else date.setUTCHours(0, 0, 0, 0);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeDateRange(dateFrom, dateTo) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return { dateFrom: dateTo, dateTo: dateFrom };
  }
  return { dateFrom, dateTo };
}

export function parseRequestedColumns(rawColumns, allColumns) {
  const available = new Map((allColumns || []).map((col) => [col.key, col]));
  const requestedKeys = Array.isArray(rawColumns)
    ? rawColumns.map((val) => normalizeText(val)).filter(Boolean)
    : [];
  if (requestedKeys.length === 0) return allColumns;
  const picked = requestedKeys.map((key) => available.get(key)).filter(Boolean);
  return picked.length > 0 ? picked : allColumns;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function buildCsvBuffer(columns, rows) {
  const header = (Array.isArray(columns) ? columns : []).map((column) => csvEscape(column.label)).join(",");
  const bodyLines = (Array.isArray(rows) ? rows : []).map((row) =>
    (Array.isArray(row) ? row : []).map((entry) => csvEscape(entry)).join(","),
  );
  return Buffer.from(`\uFEFF${[header, ...bodyLines].join("\n")}`, "utf8");
}

export async function buildXlsxBuffer(columns, rows, sheetName = "Export") {
  const xlsxMod = await import("xlsx");
  const XLSX = xlsxMod?.default || xlsxMod;
  const header = (Array.isArray(columns) ? columns : []).map((column) => column.label);
  const data = [header, ...(Array.isArray(rows) ? rows : [])];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths based on maximum length in header + content
  const colWidths = header.map((col, idx) => {
    let maxLen = col.length;
    for (const row of Array.isArray(rows) ? rows : []) {
      const cellLen = String(row[idx] ?? "").length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export async function cleanupOldExportFiles() {
  let entries = [];
  try {
    entries = await fs.readdir(EXPORT_STORAGE_DIR, { withFileTypes: true });
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
    return;
  }

  const now = Date.now();
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const fullPath = path.join(EXPORT_STORAGE_DIR, entry.name);
        const stat = await fs.stat(fullPath).catch(() => null);
        if (!stat) return;
        if (now - stat.mtimeMs <= EXPORT_FILE_TTL_MS) return;
        await fs.unlink(fullPath).catch(() => {});
      }),
  );
}

export function buildRowsFromRecords(records, columns) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  return (Array.isArray(records) ? records : []).map((record) =>
    safeColumns.map((col) => {
      try {
        if (typeof col.accessor === "function") {
          const val = col.accessor(record);
          return val == null ? "" : String(val);
        }
        const val = record[col.key];
        return val == null ? "" : String(val);
      } catch {
        return "";
      }
    }),
  );
}

export async function createExportResponse({
  records,
  columns,
  format = "csv",
  mode = "csv_filtered",
  filenamePrefix = "export",
  sheetName = "Export",
}) {
  const rows = buildRowsFromRecords(records, columns);
  const extension = format === "xlsx" ? "xlsx" : "csv";
  const fileName = `${sanitizeFileToken(filenamePrefix)}-${sanitizeFileToken(mode)}-${nowStamp()}-${randomUUID().slice(0, 8)}.${extension}`;
  const totalRows = records.length;

  let contentType = "text/csv; charset=utf-8";
  let buffer = buildCsvBuffer(columns, rows);

  if (format === "xlsx") {
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    buffer = await buildXlsxBuffer(columns, rows, sheetName);
  }

  if (totalRows > LARGE_EXPORT_ROW_THRESHOLD) {
    await fs.mkdir(EXPORT_STORAGE_DIR, { recursive: true });
    await cleanupOldExportFiles();
    await fs.writeFile(path.join(EXPORT_STORAGE_DIR, fileName), buffer);

    return Response.json({
      mode: "file_url",
      totalRows,
      fileName,
      downloadUrl: `${EXPORT_STORAGE_BASE_PATH}/${fileName}`,
    });
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Export-Total": String(totalRows),
    },
  });
}
