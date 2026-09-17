import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import VolunteersFeedbackSubmission from "@/models/VolunteersFeedbackSubmission";
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

const FEEDBACK_EXPORT_COLUMNS = [
  {
    key: "submitted_at",
    label: "Submitted At",
    accessor: (item) => formatDateTime(item.createdAt),
  },
  {
    key: "name",
    label: "Name",
    accessor: (item) => item.payload?.name || "",
  },
  {
    key: "email",
    label: "Email",
    accessor: (item) => item.payload?.email || "",
  },
  {
    key: "phone",
    label: "Phone",
    accessor: (item) => item.payload?.phone || "",
  },
  {
    key: "message",
    label: "Message",
    accessor: (item) => item.payload?.message || "",
  },
  {
    key: "source",
    label: "Source",
    accessor: (item) => item.source || "",
  },
  {
    key: "page",
    label: "Page",
    accessor: (item) => item.page || "",
  },
  {
    key: "status",
    label: "Status",
    accessor: (item) => (item.isRead ? "Read" : "Unread"),
  },
];

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const mode = normalizeText(body?.type, "csv_filtered").toLowerCase();
    const format = mode === "xlsx_all" || mode === "custom" ? "xlsx" : normalizeText(body?.format, "csv").toLowerCase();

    const selectedColumns =
      mode === "custom"
        ? parseRequestedColumns(body?.columns, FEEDBACK_EXPORT_COLUMNS)
        : FEEDBACK_EXPORT_COLUMNS;

    const filter = {};

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const status = normalizeText(filters.status);
      const source = normalizeText(filters.source);
      const parsedFrom = parseDate(filters.dateFrom);
      const parsedTo = parseDate(filters.dateTo, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (status === "read") {
        filter.isRead = true;
      } else if (status === "unread") {
        filter.isRead = false;
      }

      if (source) {
        filter.source = source;
      }

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
          { "payload.name": regex },
          { "payload.email": regex },
          { "payload.phone": regex },
          { "payload.message": regex },
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
    const records = await VolunteersFeedbackSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix: "volunteers-feedback",
      sheetName: "Volunteers Feedback",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export volunteers feedback" },
      { status: 500 },
    );
  }
}
