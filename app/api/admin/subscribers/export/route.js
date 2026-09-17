import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
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

const SUBSCRIBER_EXPORT_COLUMNS = [
  {
    key: "email",
    label: "Email",
    accessor: (item) => item.email || "",
  },
  {
    key: "status",
    label: "Status",
    accessor: (item) => (item.status === "active" ? "Active" : "Unsubscribed"),
  },
  {
    key: "source",
    label: "Source",
    accessor: (item) => item.source || "",
  },
  {
    key: "subscribed_at",
    label: "Subscribed At",
    accessor: (item) => formatDateTime(item.createdAt),
  },
  {
    key: "updated_at",
    label: "Updated At",
    accessor: (item) => (item.updatedAt ? formatDateTime(item.updatedAt) : ""),
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
        ? parseRequestedColumns(body?.columns, SUBSCRIBER_EXPORT_COLUMNS)
        : SUBSCRIBER_EXPORT_COLUMNS;

    const filter = {};

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const status = normalizeText(filters.status);
      const parsedFrom = parseDate(filters.dateFrom);
      const parsedTo = parseDate(filters.dateTo, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (status && ["active", "unsubscribed"].includes(status)) {
        filter.status = status;
      }
      if (search) {
        filter.email = { $regex: escapeRegex(search), $options: "i" };
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
    const records = await Subscriber.find(filter).sort({ createdAt: -1 }).lean();

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix: "subscribers",
      sheetName: "Subscribers",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export subscribers" },
      { status: 500 },
    );
  }
}
