import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
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

const CONTACT_EXPORT_COLUMNS = [
  {
    key: "submitted_at",
    label: "Submitted At",
    accessor: (item) => formatDateTime(item.createdAt),
  },
  {
    key: "status",
    label: "Status",
    accessor: (item) => (item.isRead ? "Read" : "Unread"),
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
    key: "subject",
    label: "Subject",
    accessor: (item) => item.payload?.subject || "",
  },
  {
    key: "message",
    label: "Message",
    accessor: (item) => item.payload?.message || "",
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

function buildSubmissionTypeQuery(submissionType) {
  const volunteerRegex = /volunteer/i;
  const volunteerFilter = {
    $or: [
      { source: volunteerRegex },
      { page: volunteerRegex },
      { "payload.subject": volunteerRegex },
    ],
  };
  if (submissionType === "volunteer") return volunteerFilter;
  if (submissionType === "contact") return { $nor: volunteerFilter.$or };
  return {};
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const submissionType = (searchParams.get("submissionType") || "contact").toLowerCase();

    const body = await req.json().catch(() => ({}));
    const mode = normalizeText(body?.type, "csv_filtered").toLowerCase();
    const format = mode === "xlsx_all" || mode === "custom" ? "xlsx" : normalizeText(body?.format, "csv").toLowerCase();

    const selectedColumns =
      mode === "custom"
        ? parseRequestedColumns(body?.columns, CONTACT_EXPORT_COLUMNS)
        : CONTACT_EXPORT_COLUMNS;

    const baseTypeQuery = buildSubmissionTypeQuery(submissionType);
    const filter = { ...baseTypeQuery, isDeleted: { $ne: true } };

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const isRead = filters.isRead;
      const parsedFrom = parseDate(filters.dateFrom);
      const parsedTo = parseDate(filters.dateTo, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { "payload.name": regex },
            { "payload.email": regex },
            { "payload.phone": regex },
            { "payload.subject": regex },
            { "payload.message": regex },
          ],
        });
      }

      if (isRead === true || isRead === "true") filter.isRead = true;
      else if (isRead === false || isRead === "false") filter.isRead = false;

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
    const records = await ContactSubmission.find(filter).sort({ createdAt: -1 }).lean();

    const filenamePrefix = submissionType === "volunteer" ? "volunteer-submissions" : "contact-submissions";
    const sheetName = submissionType === "volunteer" ? "Volunteer Form" : "Contact Us";

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix,
      sheetName,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export submissions" },
      { status: 500 },
    );
  }
}
