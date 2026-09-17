import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCsvBuffer,
  buildRowsFromRecords,
  buildXlsxBuffer,
  createExportResponse,
  escapeRegex,
  normalizeDateRange,
  parseDate,
  parseRequestedColumns,
} from "../lib/adminExportService.js";
import { formatDateTime } from "../lib/formatDate.js";

test("adminExportService - buildCsvBuffer outputs UTF-8 BOM and escapes cells", () => {
  const columns = [
    { key: "name", label: "Full Name" },
    { key: "message", label: "User, Message" },
  ];
  const rows = [
    ["John Doe", 'Hello "World", test\nnewline'],
    ["Jane Smith", "Simple message"],
  ];
  const buffer = buildCsvBuffer(columns, rows);
  const text = buffer.toString("utf8");

  // Check UTF-8 BOM
  assert.ok(text.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM");
  assert.ok(text.includes('"User, Message"'), "Column headers with comma must be quoted");
  assert.ok(text.includes('"Hello ""World"", test\nnewline"'), "Cells with quotes and commas must be escaped");
  assert.ok(text.includes("Jane Smith"), "Standard cells must be present");
});

test("adminExportService - buildXlsxBuffer creates valid Excel workbook buffer", async () => {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
  ];
  const rows = [
    ["1", "Alice"],
    ["2", "Bob"],
  ];
  const buffer = await buildXlsxBuffer(columns, rows, "Test Sheet");
  assert.ok(Buffer.isBuffer(buffer), "buildXlsxBuffer must return a Buffer");
  assert.ok(buffer.length > 0, "Excel buffer must not be empty");

  // Verify it can be read back with SheetJS
  const xlsxMod = await import("xlsx");
  const XLSX = xlsxMod?.default || xlsxMod;
  const wb = XLSX.read(buffer, { type: "buffer" });
  assert.equal(wb.SheetNames[0], "Test Sheet");
  const sheet = wb.Sheets["Test Sheet"];
  assert.equal(sheet["A1"]?.v, "ID");
  assert.equal(sheet["B1"]?.v, "Name");
  assert.equal(sheet["A2"]?.v, "1");
  assert.equal(sheet["B2"]?.v, "Alice");
});

test("adminExportService - parseRequestedColumns picks only requested columns or falls back to all", () => {
  const allColumns = [
    { key: "col1", label: "Column 1" },
    { key: "col2", label: "Column 2" },
    { key: "col3", label: "Column 3" },
  ];

  const picked = parseRequestedColumns(["col2", "col3"], allColumns);
  assert.deepEqual(picked.map((c) => c.key), ["col2", "col3"]);

  const fallbackEmpty = parseRequestedColumns([], allColumns);
  assert.deepEqual(fallbackEmpty.map((c) => c.key), ["col1", "col2", "col3"]);

  const fallbackUnknown = parseRequestedColumns(["non_existent"], allColumns);
  assert.deepEqual(fallbackUnknown.map((c) => c.key), ["col1", "col2", "col3"]);
});

test("adminExportService - parseDate & normalizeDateRange handles dates accurately", () => {
  const from = parseDate("2026-09-01");
  const to = parseDate("2026-09-17", { endOfDay: true });
  assert.ok(from instanceof Date && !Number.isNaN(from.getTime()));
  assert.ok(to instanceof Date && !Number.isNaN(to.getTime()));
  assert.equal(from.getUTCHours(), 0);
  assert.equal(to.getUTCHours(), 23);

  const range = normalizeDateRange(to, from);
  assert.ok(range.dateFrom <= range.dateTo, "Date range should be swapped if inverted");
});

test("adminExportService - createExportResponse returns attachment with headers", async () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
  ];
  const records = [{ name: "Test User", email: "test@example.com" }];
  const res = await createExportResponse({
    records,
    columns,
    format: "csv",
    mode: "csv_filtered",
    filenamePrefix: "test-export",
    sheetName: "Test Sheet",
  });

  assert.equal(res.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.ok(res.headers.get("Content-Disposition").includes("test-export-csv_filtered-"));
  assert.equal(res.headers.get("X-Export-Total"), "1");
});

test("adminExportService - records mapping for Contact, Subscribers, Events, Donations, Volunteers", () => {
  // Test contact record mapping
  const contactCols = [
    { key: "name", label: "Name", accessor: (r) => r.payload?.name || "" },
    { key: "email", label: "Email", accessor: (r) => r.payload?.email || "" },
    { key: "status", label: "Status", accessor: (r) => r.isRead ? "Read" : "Unread" },
  ];
  const contactRows = buildRowsFromRecords(
    [{ payload: { name: "Amol", email: "amol@test.com" }, isRead: true }],
    contactCols
  );
  assert.deepEqual(contactRows, [["Amol", "amol@test.com", "Read"]]);

  // Test subscribers record mapping
  const subCols = [
    { key: "email", label: "Email", accessor: (r) => r.email },
    { key: "status", label: "Status", accessor: (r) => r.status === "active" ? "Active" : "Unsubscribed" },
  ];
  const subRows = buildRowsFromRecords([{ email: "user@test.com", status: "active" }], subCols);
  assert.deepEqual(subRows, [["user@test.com", "Active"]]);

  // Test events record mapping
  const eventCols = [
    { key: "event_title", label: "Event Title", accessor: (r) => r.eventTitle },
    { key: "applicant", label: "Name", accessor: (r) => r.payload?.name },
    { key: "school", label: "School", accessor: (r) => r.payload?.school || "" },
  ];
  const eventRows = buildRowsFromRecords(
    [{ eventTitle: "Tech Fair", payload: { name: "Student A", school: "MESCO High" } }],
    eventCols
  );
  assert.deepEqual(eventRows, [["Tech Fair", "Student A", "MESCO High"]]);
});
