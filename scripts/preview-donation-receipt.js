/**
 * Renders the MESCO donation receipt email to a local HTML file so the design
 * can be reviewed in a browser without sending any mail.
 *
 * All sample values are Lorem Ipsum placeholders. This script only exercises
 * the template for design review — real emails are produced by
 * lib/email.js from the actual donor submission data at payment time.
 *
 * Usage:
 *   node scripts/preview-donation-receipt.js
 *   -> scratch/donation-receipt-preview.html
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");

/**
 * Placeholder sample. `amount` and `transactionDate` stay typed (number/Date)
 * because the template formats them with Intl — placeholder text there would
 * render as "—" instead of exercising the real layout.
 */
const SAMPLE = {
  donorName: "Lorem Ipsum",
  transactionId: "TXN_LOREMIPSUM00000",
  paymentMode: "lorem-ipsum",
  amount: 50000,
  currency: "INR",
  transactionDate: new Date("2026-01-01T10:30:00Z"),
  purpose: "Lorem Ipsum Dolor Sit Amet",
  note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  orgName: "MESCO Trust",
};

async function main() {
  const { renderDonationReceiptHtml, renderDonationReceiptText } = await import(
    "../lib/emailTemplates/donationReceipt.js"
  );

  const html = renderDonationReceiptHtml(SAMPLE);
  const text = renderDonationReceiptText(SAMPLE);

  const outDir = path.join(process.cwd(), "scratch");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "donation-receipt-preview.html");
  fs.writeFileSync(outFile, html, "utf8");
  fs.writeFileSync(path.join(outDir, "donation-receipt-preview.txt"), text, "utf8");

  console.log("HTML preview : " + outFile);
  console.log("Text preview : " + path.join(outDir, "donation-receipt-preview.txt"));
  console.log("\n--- PLAIN TEXT VERSION ---");
  console.log(text);
}

main().catch((err) => {
  console.error("Preview failed:", err?.message || err);
  process.exit(1);
});