import { formatDateTime } from "@/lib/formatDate";

export const DONATION_EXPORT_FORMATS = new Set(["csv", "xlsx", "pdf"]);

export const DONATION_EXPORT_COLUMNS = Object.freeze([
  "Submission Date & Time",
  "Donor Name",
  "Email",
  "Mobile",
  "PAN",
  "Address",
  "City",
  "State",
  "Country",
  "Pincode",
  "Donation Purpose",
  "Donation Amount",
  "Currency",
  "Payment Status",
  "Donation Category",
  "Zakat",
  "Interest Money",
  "Student Count",
  "Donor Type",
  "Order ID",
  "Transaction ID",
  "Bank Reference",
  "Payment Mode",
  "Completed Date & Time",
  "Note",
]);

function text(value) {
  return String(value ?? "").trim();
}

function exportStatus(value) {
  const normalized = text(value).toLowerCase();
  return ["aborted", "cancelled"].includes(normalized)
    ? "CANCELLED"
    : normalized.toUpperCase();
}

export function donationToExportRow(record) {
  return {
    "Submission Date & Time": formatDateTime(record?.createdAt),
    "Donor Name": text(record?.donor?.name),
    Email: text(record?.donor?.email),
    Mobile: text(record?.donor?.mobile),
    PAN: text(record?.donor?.pan),
    Address: text(record?.donor?.address),
    City: text(record?.donor?.city),
    State: text(record?.donor?.state),
    Country: text(record?.donor?.country),
    Pincode: text(record?.donor?.pincode),
    "Donation Purpose": text(record?.purpose),
    "Donation Amount": Number(record?.amount) || 0,
    Currency: text(record?.currency || "INR"),
    "Payment Status": exportStatus(record?.status),
    "Donation Category": text(
      record?.donationCategory ||
        (record?.zakat === "Yes"
          ? "Zakat"
          : record?.interestMoney === "Yes"
            ? "Interest Money"
            : "Non-Zakat"),
    ),
    Zakat: text(record?.zakat),
    "Interest Money": text(record?.interestMoney),
    "Student Count": text(record?.studentsCount),
    "Donor Type": text(record?.donorType),
    "Order ID": text(record?.orderId),
    "Transaction ID": text(record?.payment?.transactionId),
    "Bank Reference": text(record?.payment?.bankRefNo),
    "Payment Mode": text(record?.payment?.paymentMode),
    "Completed Date & Time": record?.completedAt
      ? formatDateTime(record.completedAt)
      : "",
    Note: text(record?.note),
  };
}

function safeSpreadsheetValue(value) {
  if (typeof value === "number") return value;
  const normalized = text(value);
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

function csvCell(value) {
  const normalized = String(safeSpreadsheetValue(value)).replace(/"/g, '""');
  return `"${normalized}"`;
}

export function buildDonationCsv(rows) {
  const lines = [
    DONATION_EXPORT_COLUMNS.map(csvCell).join(","),
    ...rows.map((row) =>
      DONATION_EXPORT_COLUMNS.map((column) => csvCell(row[column])).join(","),
    ),
  ];
  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

export async function buildDonationXlsx(rows) {
  const xlsxModule = await import("xlsx");
  const XLSX = xlsxModule.default || xlsxModule;
  const data = [
    DONATION_EXPORT_COLUMNS,
    ...rows.map((row) =>
      DONATION_EXPORT_COLUMNS.map((column) => safeSpreadsheetValue(row[column])),
    ),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!cols"] = DONATION_EXPORT_COLUMNS.map((column) => ({
    wch: Math.min(36, Math.max(12, column.length + 2)),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Donate Submissions");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function pdfText(value) {
  return text(value)
    .replace(/₹/g, "Rs. ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdf(value) {
  return pdfText(value).replace(/([\\()])/g, "\\$1");
}

function wrapText(value, maxCharacters, maxLines = 3) {
  const normalized = pdfText(value) || "-";
  const words = normalized.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > maxCharacters ? word.slice(0, maxCharacters) : word;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && normalized.length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, maxCharacters - 3))}...`;
  }
  return lines;
}

const PDF_COLUMNS = Object.freeze([
  { label: "Date & Time", key: "Submission Date & Time", width: 92, chars: 20 },
  { label: "Donor", key: "Donor", width: 132, chars: 29 },
  { label: "Purpose", key: "Donation Purpose", width: 124, chars: 27 },
  { label: "Amount", key: "Amount", width: 68, chars: 14 },
  { label: "Status", key: "Payment Status", width: 62, chars: 13 },
  { label: "Order ID", key: "Order ID", width: 132, chars: 28 },
  { label: "Transaction ID", key: "Transaction ID", width: 142, chars: 30 },
]);

function pdfRow(row) {
  const donor = [row["Donor Name"], row.Email, row.Mobile].filter(Boolean).join(" | ");
  const values = {
    ...row,
    Donor: donor,
    Amount: `${row.Currency || "INR"} ${Number(row["Donation Amount"] || 0).toLocaleString("en-IN")}`,
  };
  const cells = PDF_COLUMNS.map((column) =>
    wrapText(values[column.key], column.chars, 3),
  );
  return { cells, height: Math.max(...cells.map((cell) => cell.length)) * 10 + 8 };
}

function textCommand(value, x, y, size = 8, color = "0.13 0.13 0.16") {
  return `${color} rg BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`;
}

function buildPdfPage(rows, pageNumber, pageCount, filterSummary) {
  const commands = [
    textCommand("Donate Submissions", 30, 565, 15, "0.16 0.15 0.24"),
    textCommand(`Records: ${rows.totalRecords} | Page ${pageNumber} of ${pageCount}`, 650, 565, 8),
    textCommand(filterSummary || "Filters: All submissions", 30, 548, 8, "0.35 0.35 0.38"),
    "0.16 0.15 0.24 rg 30 515 752 22 re f",
  ];

  let x = 34;
  for (const column of PDF_COLUMNS) {
    commands.push(textCommand(column.label, x, 522, 8, "1 1 1"));
    x += column.width;
  }

  let y = 510;
  for (const row of rows.items) {
    const bottom = y - row.height;
    commands.push(`0.88 0.88 0.9 RG 30 ${bottom} 752 0.5 re S`);
    let cellX = 34;
    row.cells.forEach((lines, index) => {
      lines.forEach((line, lineIndex) => {
        commands.push(textCommand(line, cellX, y - 12 - lineIndex * 10, 7.2));
      });
      cellX += PDF_COLUMNS[index].width;
    });
    y = bottom;
  }

  if (rows.items.length === 0) {
    commands.push(textCommand("No matching donation submissions.", 34, 492, 9));
  }
  return commands.join("\n");
}

function serializePdf(pageStreams) {
  const objects = [null, null, null, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageIds = [];

  for (const stream of pageStreams) {
    const streamLength = Buffer.byteLength(stream, "latin1");
    const contentId = objects.length;
    objects.push(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);
    const pageId = objects.length;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] ` +
        `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks = [Buffer.from("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", "latin1")];
  const offsets = [0];
  let length = chunks[0].length;
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = length;
    const chunk = Buffer.from(`${id} 0 obj\n${objects[id]}\nendobj\n`, "latin1");
    chunks.push(chunk);
    length += chunk.length;
  }
  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join("");
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function buildDonationPdf(rows, filterSummary = "") {
  const preparedRows = rows.map(pdfRow);
  const pages = [];
  let current = [];
  let remainingHeight = 465;
  for (const row of preparedRows) {
    if (current.length > 0 && row.height > remainingHeight) {
      pages.push(current);
      current = [];
      remainingHeight = 465;
    }
    current.push(row);
    remainingHeight -= row.height;
  }
  if (current.length > 0 || pages.length === 0) pages.push(current);

  const pageStreams = pages.map((items, index) =>
    buildPdfPage(
      { items, totalRecords: rows.length },
      index + 1,
      pages.length,
      filterSummary,
    ),
  );
  return serializePdf(pageStreams);
}

export function donationFilterSummary(searchParams) {
  const parts = [];
  const status = text(searchParams.get("status"));
  const search = text(searchParams.get("search"));
  const from = text(searchParams.get("from"));
  const to = text(searchParams.get("to"));
  if (from || to) {
    const fromLabel = from ? formatDateTime(from).split(",")[0] : "Beginning";
    const toLabel = to ? formatDateTime(to).split(",")[0] : "Now";
    parts.push(`Date: ${fromLabel} to ${toLabel}`);
  }
  if (status) parts.push(`Status: ${exportStatus(status)}`);
  if (search) parts.push(`Search: ${search}`);
  return parts.length > 0 ? `Filters: ${parts.join(" | ")}` : "Filters: All submissions";
}
