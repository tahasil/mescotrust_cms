import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import CareerSubmission from "@/models/CareerSubmission";
import { formatDateTime } from "@/lib/formatDate";
import {
  createExportResponse,
  escapeRegex,
  normalizeDateRange,
  normalizeText,
  parseDate,
  parseRequestedColumns,
} from "@/lib/adminExportService";

export const dynamic = "force-dynamic";

export const CAREER_EXPORT_COLUMNS = [
  {
    key: "submitted_at",
    label: "Submitted At",
    accessor: (item) => formatDateTime(item.createdAt),
  },
  {
    key: "fullName",
    label: "Candidate Name",
    accessor: (item) => item.fullName || "",
  },
  {
    key: "email",
    label: "Email",
    accessor: (item) => item.email || "",
  },
  {
    key: "phone",
    label: "Phone",
    accessor: (item) => item.phone || "",
  },
  {
    key: "position",
    label: "Applied Position",
    accessor: (item) => item.position || "",
  },
  {
    key: "customPosition",
    label: "Specified Role (Other)",
    accessor: (item) => item.customPosition || "",
  },
  {
    key: "positionCategory",
    label: "Position Category",
    accessor: (item) => item.positionCategory || "",
  },
  {
    key: "qualification",
    label: "Highest Qualification",
    accessor: (item) => item.qualification || "",
  },
  {
    key: "experience",
    label: "Experience",
    accessor: (item) => item.experience || "",
  },
  {
    key: "currentCity",
    label: "Current City",
    accessor: (item) => item.currentCity || "",
  },
  {
    key: "status",
    label: "Status",
    accessor: (item) => item.status || "new",
  },
  {
    key: "resumeName",
    label: "Resume Filename",
    accessor: (item) => item.resume?.originalName || item.resume?.filename || "",
  },
  {
    key: "resumeUrl",
    label: "Resume URL",
    accessor: (item) => item.resume?.url || "",
  },
  {
    key: "coverLetter",
    label: "Cover Letter / Statement",
    accessor: (item) => item.coverLetter || "",
  },
  {
    key: "sourcePage",
    label: "Source Page",
    accessor: (item) => item.sourcePage || "",
  },
];

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const mode = normalizeText(body?.type, "csv_filtered").toLowerCase();
    const format =
      mode === "xlsx_all" || mode === "custom"
        ? "xlsx"
        : normalizeText(body?.format, "csv").toLowerCase();

    const selectedColumns =
      mode === "custom"
        ? parseRequestedColumns(body?.columns, CAREER_EXPORT_COLUMNS)
        : CAREER_EXPORT_COLUMNS;

    const filter = {};

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const status = normalizeText(filters.status).toLowerCase();
      const position = normalizeText(filters.position);
      const parsedFrom = parseDate(filters.dateFrom || filters.from);
      const parsedTo = parseDate(filters.dateTo || filters.to, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (status === "read") filter.isRead = true;
      else if (status === "unread") filter.isRead = false;
      else if (status && status !== "all") filter.status = status;

      if (position && position !== "all") filter.position = position;

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
          { fullName: regex },
          { email: regex },
          { phone: regex },
          { position: regex },
          { customPosition: regex },
          { currentCity: regex },
          { coverLetter: regex },
        ];
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = dateFrom;
        if (dateTo) filter.createdAt.$lte = dateTo;
      }
    } else if (mode === "custom") {
      const parsedFrom = parseDate(body?.dateFrom);
      const parsedTo = parseDate(body?.dateTo, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = dateFrom;
        if (dateTo) filter.createdAt.$lte = dateTo;
      }
    }

    await connectDB();
    const records = await CareerSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix: "career-submissions",
      sheetName: "Career Submissions",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export career submissions" },
      { status: 500 },
    );
  }
}

