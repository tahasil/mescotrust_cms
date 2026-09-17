import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import EventRegistration from "@/models/EventRegistration";
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

const EVENT_REG_EXPORT_COLUMNS = [
  {
    key: "submitted_at",
    label: "Submitted At",
    accessor: (item) => formatDateTime(item.createdAt),
  },
  {
    key: "event_title",
    label: "Event Title",
    accessor: (item) => item.eventTitle || "",
  },
  {
    key: "event_date",
    label: "Event Date",
    accessor: (item) => item.eventDate || "",
  },
  {
    key: "name",
    label: "Applicant Name",
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
    key: "school",
    label: "School / Institution",
    accessor: (item) => item.payload?.school || "",
  },
  {
    key: "class_or_year",
    label: "Class / Year",
    accessor: (item) => item.payload?.classOrYear || "",
  },
  {
    key: "message",
    label: "Message",
    accessor: (item) => item.payload?.message || "",
  },
  {
    key: "status",
    label: "Status",
    accessor: (item) => item.status || "",
  },
  {
    key: "read_status",
    label: "Read Status",
    accessor: (item) => (item.isRead ? "Read" : "Unread"),
  },
  {
    key: "page",
    label: "Page",
    accessor: (item) => item.page || "",
  },
  {
    key: "source",
    label: "Source",
    accessor: (item) => item.source || "",
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
        ? parseRequestedColumns(body?.columns, EVENT_REG_EXPORT_COLUMNS)
        : EVENT_REG_EXPORT_COLUMNS;

    const filter = {};

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const status = normalizeText(filters.status);
      const eventTitle = normalizeText(filters.event || filters.eventTitle);
      const parsedFrom = parseDate(filters.dateFrom);
      const parsedTo = parseDate(filters.dateTo, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (status) {
        filter.status = status;
      }
      if (eventTitle) {
        filter.eventTitle = eventTitle;
      }
      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
          { "payload.name": regex },
          { "payload.email": regex },
          { "payload.phone": regex },
          { eventTitle: regex },
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
    const records = await EventRegistration.find(filter).sort({ createdAt: -1 }).lean();

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix: "event-registrations",
      sheetName: "Event Registrations",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export event registrations" },
      { status: 500 },
    );
  }
}
