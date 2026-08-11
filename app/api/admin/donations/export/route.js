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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES = Object.freeze({
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
});

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
