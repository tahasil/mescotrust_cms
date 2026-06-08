import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import { canAccessFormBuilder } from "@/lib/forms/access";
import {
  LARGE_EXPORT_ROW_THRESHOLD,
  buildCsvBuffer,
  buildExportRows,
  buildSubmissionExportColumns,
  buildSubmissionFilter,
  getOrderedFormQuestions,
  getSubmissionSortOrder,
  normalizeDateRange,
  normalizeText,
  parseBooleanFilter,
  parseDate,
  parseSubmissionSort,
  sanitizeFileToken,
} from "@/lib/forms/submissionUtils";

const EXPORT_STORAGE_DIR = path.resolve(process.cwd(), "public", "exports", "form-submissions");
const EXPORT_STORAGE_BASE_PATH = "/exports/form-submissions";
const EXPORT_FILE_TTL_MS = 24 * 60 * 60 * 1000;

function nowStamp() {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}`;
}

function sanitizeSheetName(raw) {
  const cleaned = normalizeText(raw || "Submissions")
    .replace(/[:\\/?*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "Submissions").slice(0, 31);
}

function parseFilters(input) {
  const source = input && typeof input === "object" ? input : {};
  const search = normalizeText(source.search);
  const isRead = parseBooleanFilter(source.isRead || "all");
  const sort = parseSubmissionSort(source.sort);
  const parsedFrom = parseDate(source.dateFrom);
  const parsedTo = parseDate(source.dateTo, { endOfDay: true });
  const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);
  return { search, isRead, sort, dateFrom, dateTo };
}

function parseCustomDateRange(input) {
  const source = input && typeof input === "object" ? input : {};
  const parsedFrom = parseDate(source.dateFrom);
  const parsedTo = parseDate(source.dateTo, { endOfDay: true });
  return normalizeDateRange(parsedFrom, parsedTo);
}

function resolveMode(rawType) {
  const normalized = normalizeText(rawType).toLowerCase();
  if (normalized === "xlsx_all") return "xlsx_all";
  if (normalized === "custom") return "custom";
  return "csv_filtered";
}

function resolveFormat(mode, rawFormat) {
  if (mode === "xlsx_all") return "xlsx";
  const normalized = normalizeText(rawFormat).toLowerCase();
  if (normalized === "xlsx") return "xlsx";
  return "csv";
}

async function buildXlsxBuffer(columns, rows, sheetName) {
  const xlsxMod = await import("xlsx");
  const XLSX = xlsxMod?.default || xlsxMod;
  const header = (Array.isArray(columns) ? columns : []).map((column) => column.label);
  const ws = XLSX.utils.aoa_to_sheet([header, ...(Array.isArray(rows) ? rows : [])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function cleanupOldExportFiles() {
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

function buildDownloadFilename(formId, mode, format) {
  return `${sanitizeFileToken(formId)}-${sanitizeFileToken(mode)}-${nowStamp()}-${randomUUID().slice(0, 8)}.${format}`;
}

function parseRequestedColumns(rawColumns, allColumns) {
  const available = new Map((allColumns || []).map((column) => [column.key, column]));
  const requestedKeys = Array.isArray(rawColumns)
    ? rawColumns.map((value) => normalizeText(value)).filter(Boolean)
    : [];
  if (requestedKeys.length === 0) return allColumns;
  const picked = requestedKeys.map((key) => available.get(key)).filter(Boolean);
  return picked.length > 0 ? picked : allColumns;
}

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const form = await Form.findOne(
      { formId },
      {
        _id: 1,
        formId: 1,
        name: 1,
        "formSchema.questions.fieldKey": 1,
        "formSchema.questions.fieldName": 1,
        "formSchema.questions.label": 1,
        "formSchema.questions.type": 1,
        "formSchema.questions.order": 1,
      },
    ).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = resolveMode(body?.type);
    const format = resolveFormat(mode, body?.format);

    const questions = getOrderedFormQuestions(form.formSchema);
    const allColumns = buildSubmissionExportColumns(questions);
    const selectedColumns =
      mode === "custom" ? parseRequestedColumns(body?.columns, allColumns) : allColumns;

    let search = "";
    let isRead = null;
    let sort = "createdAt_desc";
    let dateFrom = null;
    let dateTo = null;

    if (mode === "csv_filtered") {
      const parsed = parseFilters(body?.filters);
      search = parsed.search;
      isRead = parsed.isRead;
      sort = parsed.sort;
      dateFrom = parsed.dateFrom;
      dateTo = parsed.dateTo;
    } else if (mode === "custom") {
      const parsed = parseCustomDateRange(body);
      dateFrom = parsed.dateFrom;
      dateTo = parsed.dateTo;
      sort = parseSubmissionSort(body?.sort);
    }

    const filter = buildSubmissionFilter({ formId, isRead, search, dateFrom, dateTo });
    const sortOrder = getSubmissionSortOrder(sort);

    const projection = {
      _id: 1,
      formId: 1,
      isRead: 1,
      createdAt: 1,
      source: 1,
      pagePath: 1,
      payloadByFieldNameSnapshot: 1,
      payloadByFieldKey: 1,
    };

    const [totalRows, submissions] = await Promise.all([
      FormSubmission.countDocuments(filter),
      FormSubmission.find(filter, projection).sort({ createdAt: sortOrder }).lean(),
    ]);

    const rows = buildExportRows(submissions, selectedColumns);
    const fileName = buildDownloadFilename(form.formId, mode, format);

    let contentType = "text/csv; charset=utf-8";
    let buffer = buildCsvBuffer(selectedColumns, rows);

    if (format === "xlsx") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      buffer = await buildXlsxBuffer(selectedColumns, rows, form.name || form.formId);
    }

    if (totalRows > LARGE_EXPORT_ROW_THRESHOLD) {
      await fs.mkdir(EXPORT_STORAGE_DIR, { recursive: true });
      await cleanupOldExportFiles();
      await fs.writeFile(path.join(EXPORT_STORAGE_DIR, fileName), buffer);

      return NextResponse.json({
        mode: "file_url",
        totalRows,
        fileName,
        downloadUrl: `${EXPORT_STORAGE_BASE_PATH}/${fileName}`,
      });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Export-Total": String(totalRows),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export submissions" },
      { status: 500 },
    );
  }
}
