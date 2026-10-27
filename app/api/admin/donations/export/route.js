import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import {
  buildDonationFilter,
  DonationQueryError,
} from "@/lib/donations/adminQuery";
import {
  buildDonationCsv,
  buildDonationPdf,
  buildDonationXlsx,
  DONATION_EXPORT_FORMATS,
  donationFilterSummary,
  donationToExportRow,
} from "@/lib/donations/exportFiles";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import { formatDateTime } from "@/lib/formatDate";
import {
  createExportResponse,
  escapeRegex,
  normalizeDateRange,
  normalizeText,
  parseDate,
  parseRequestedColumns,
} from "@/lib/adminExportService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES = Object.freeze({
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
});

const DONATION_COLUMNS = [
  { key: "createdAt", label: "Submission Date & Time", accessor: (r) => formatDateTime(r?.createdAt) },
  { key: "donor_name", label: "Donor Name", accessor: (r) => String(r?.donor?.name ?? "").trim() },
  { key: "email", label: "Email", accessor: (r) => String(r?.donor?.email ?? "").trim() },
  { key: "mobile", label: "Mobile", accessor: (r) => String(r?.donor?.mobile ?? "").trim() },
  { key: "pan", label: "PAN", accessor: (r) => String(r?.donor?.pan ?? "").trim() },
  { key: "address", label: "Address", accessor: (r) => String(r?.donor?.address ?? "").trim() },
  { key: "city", label: "City", accessor: (r) => String(r?.donor?.city ?? "").trim() },
  { key: "state", label: "State", accessor: (r) => String(r?.donor?.state ?? "").trim() },
  { key: "country", label: "Country", accessor: (r) => String(r?.donor?.country ?? "").trim() },
  { key: "pincode", label: "Pincode", accessor: (r) => String(r?.donor?.pincode ?? "").trim() },
  { key: "purpose", label: "Donation Purpose", accessor: (r) => String(r?.purpose ?? "").trim() },
  { key: "amount", label: "Donation Amount", accessor: (r) => Number(r?.amount) || 0 },
  { key: "currency", label: "Currency", accessor: (r) => String(r?.currency || "INR").trim() },
  {
    key: "status",
    label: "Payment Status",
    accessor: (r) => {
      const s = String(r?.status ?? "").trim().toLowerCase();
      return ["aborted", "cancelled"].includes(s) ? "CANCELLED" : s.toUpperCase();
    },
  },
  {
    key: "donationCategory",
    label: "Donation Category",
    accessor: (r) => {
      if (r?.donationCategory) return String(r.donationCategory).trim();
      if (String(r?.zakat ?? "").trim().toLowerCase() === "yes") return "Zakat";
      if (String(r?.interestMoney ?? "").trim().toLowerCase() === "yes") return "Interest Money";
      return "Non-Zakat";
    },
  },
  { key: "zakat", label: "Zakat", accessor: (r) => String(r?.zakat ?? "").trim() },
  { key: "interestMoney", label: "Interest Money", accessor: (r) => String(r?.interestMoney ?? "").trim() },
  { key: "studentsCount", label: "Student Count", accessor: (r) => String(r?.studentsCount ?? "").trim() },
  { key: "donorType", label: "Donor Type", accessor: (r) => String(r?.donorType ?? "").trim() },
  { key: "orderId", label: "Order ID", accessor: (r) => String(r?.orderId ?? "").trim() },
  { key: "transactionId", label: "Transaction ID", accessor: (r) => String(r?.payment?.transactionId ?? "").trim() },
  { key: "bankRefNo", label: "Bank Reference", accessor: (r) => String(r?.payment?.bankRefNo ?? "").trim() },
  { key: "paymentMode", label: "Payment Mode", accessor: (r) => String(r?.payment?.paymentMode ?? "").trim() },
  { key: "completedAt", label: "Completed Date & Time", accessor: (r) => (r?.completedAt ? formatDateTime(r.completedAt) : "") },
  { key: "note", label: "Note", accessor: (r) => String(r?.note ?? "").trim() },
];

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const format = String(searchParams.get("format") || "").toLowerCase();
    if (!DONATION_EXPORT_FORMATS.has(format)) {
      return NextResponse.json(
        { error: "Export format must be csv, xlsx, or pdf" },
        { status: 400 },
      );
    }

    const filter = buildDonationFilter(searchParams);
    await connectDB();
    const records = await DonateNowSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    const rows = records.map(donationToExportRow);

    let output;
    if (format === "xlsx") output = await buildDonationXlsx(rows);
    else if (format === "pdf") {
      output = buildDonationPdf(rows, donationFilterSummary(searchParams));
    } else output = buildDonationCsv(rows);

    const date = new Date().toISOString().slice(0, 10);
    const filename = `donate-submissions-${date}.${format}`;
    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(output.length),
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DonationQueryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Donation export error:", error);
    return NextResponse.json(
      { error: "Failed to export donation submissions" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const mode = normalizeText(body?.type, "csv_filtered").toLowerCase();
    const format = mode === "xlsx_all" || mode === "custom" ? "xlsx" : normalizeText(body?.format, "csv").toLowerCase();

    const selectedColumns =
      mode === "custom"
        ? parseRequestedColumns(body?.columns, DONATION_COLUMNS)
        : DONATION_COLUMNS;

    const filter = { isDeleted: { $ne: true } };

    if (mode === "csv_filtered") {
      const filters = body?.filters || {};
      const search = normalizeText(filters.search);
      const status = normalizeText(filters.status);
      const parsedFrom = parseDate(filters.dateFrom || filters.from);
      const parsedTo = parseDate(filters.dateTo || filters.to, { endOfDay: true });
      const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

      if (status) {
        if (["cancelled", "aborted"].includes(status.toLowerCase())) {
          filter.status = { $in: ["cancelled", "aborted"] };
        } else {
          filter.status = status.toLowerCase();
        }
      }

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
          { "donor.name": regex },
          { "donor.email": regex },
          { "donor.mobile": regex },
          { orderId: regex },
          { "payment.transactionId": regex },
          { purpose: regex },
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
    const records = await DonateNowSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return await createExportResponse({
      records,
      columns: selectedColumns,
      format,
      mode,
      filenamePrefix: "donations",
      sheetName: "Donations",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to export donations" },
      { status: 500 },
    );
  }
}
