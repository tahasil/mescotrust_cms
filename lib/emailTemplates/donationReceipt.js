/**
 * MESCO-branded donation receipt email template.
 *
 * Rendered as a table-based HTML email: email clients (Gmail, Outlook, Apple
 * Mail) strip modern CSS, so every style is inlined and the layout uses
 * nested tables rather than flexbox/grid.
 *
 * Content is limited to what the donor needs to reconcile the payment:
 *   Donor Name, Transaction ID, Payment Mode, Amount, Transaction Date, Purpose
 */

const BRAND_RED = "#E03C33";
const BRAND_NAVY = "#211E30";
const BODY_TEXT = "#444444";
const MUTED_TEXT = "#8A8A8A";
const BORDER = "#EEEEEE";

// Built at runtime so the HTML-escaping entities below are never mangled by
// tooling that rewrites literal ampersands while saving this file.
const E_AMP = "&#38;" ? String.fromCharCode(38) + "amp;" : "";
const E_LT = String.fromCharCode(38) + "lt;";
const E_GT = String.fromCharCode(38) + "gt;";
const E_QUOT = String.fromCharCode(38) + "quot;";
const E_APOS = String.fromCharCode(38) + "#39;";
const DQ = String.fromCharCode(34);
const SQ = String.fromCharCode(39);

function esc(value) {
  if (value == null) return "";
  return String(value)
    .replace(new RegExp(E_AMP, "g"), E_AMP)
    .replace(new RegExp("<", "g"), E_LT)
    .replace(new RegExp(">", "g"), E_GT)
    .replace(new RegExp(DQ, "g"), E_QUOT)
    .replace(new RegExp(SQ, "g"), E_APOS);
}

/** Currency formatting with the site's configured locale. */
function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR").toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return "₹" + value.toLocaleString("en-IN");
  }
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return date.toISOString();
  }
}

/**
 * Payment mode arrives in gateway-specific casing ("netbanking", "Credit Card",
 * "upi"). Title-casing it reads better in a receipt than the raw value.
 */
function humanizePaymentMode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const withSpaces = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return withSpaces
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Builds the receipt rows. Every value is escaped before reaching the HTML. */
function buildReceiptRows(details) {
  const rows = [
    { label: "Donor Name", value: details.donorName },
    { label: "Transaction ID", value: details.transactionId, mono: true },
    { label: "Payment Mode", value: details.paymentMode },
    { label: "Amount", value: details.amount, highlight: true },
    { label: "Transaction Date", value: details.transactionDate },
    { label: "Purpose", value: details.purpose },
  ];

  return rows
    .map((row, index) => {
      const isLast = index === rows.length - 1;
      const labelStyle =
        "padding:12px 16px;" +
        (isLast ? "" : "border-bottom:1px solid " + BORDER + ";") +
        "color:#666666;font-size:14px;";
      const valueBase =
        "padding:12px 16px;" +
        (isLast ? "" : "border-bottom:1px solid " + BORDER + ";") +
        "text-align:right;";
      const valueStyle = row.highlight
        ? valueBase + "color:" + BRAND_RED + ";font-size:17px;font-weight:700;"
        : row.mono
          ? valueBase +
            "color:#222222;font-size:14px;font-weight:600;" +
            "font-family:Courier New,Courier,monospace;word-break:break-all;"
          : valueBase + "color:#222222;font-size:14px;font-weight:600;";

      return (
        "<tr>" +
        '<td align="left" style="' + labelStyle + '">' + esc(row.label) + "</td>" +
        '<td align="right" style="' + valueStyle + '">' + esc(row.value || "—") + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

/**
 * @param {object} params
 * @param {string} params.donorName
 * @param {string} params.transactionId
 * @param {string} params.paymentMode
 * @param {number} params.amount
 * @param {string} [params.currency]
 * @param {Date|string} [params.transactionDate]
 * @param {string} [params.purpose]
 * @param {string} [params.note]
 * @param {string} [params.orgName]
 */
export function renderDonationReceiptHtml(params = {}) {
  const orgName = params.orgName || "MESCO Trust";
  const details = {
    donorName: params.donorName,
    transactionId: params.transactionId,
    paymentMode: humanizePaymentMode(params.paymentMode),
    amount: formatAmount(params.amount, params.currency),
    transactionDate: formatDateTime(params.transactionDate),
    purpose: params.purpose || "General Fund",
  };

  const note = String(params.note || "").trim();
  const noteFooter = String(
    params.noteFooterText ||
      "Your contribution will be applied to the programme you have chosen and will go directly towards the people MESCO Trust serves.",
  ).trim();

  // The header is a text wordmark, not the site logo, and this is deliberate:
  // Gmail, Outlook and most corporate clients block remote images by default,
  // so a logo-only header renders as a broken-image icon (or nothing at all)
  // in exactly the inbox that matters most. Text always arrives.
  //
  // The colour is explicit white, never the inherited body colour, or the
  // wordmark would disappear into the navy band behind it.
  const brandBlock =
    '<div style="font-size:26px;line-height:1.2;font-weight:700;letter-spacing:1px;color:#FFFFFF;margin:0 0 18px;">' +
    esc(orgName) +
    "</div>";

  // The note is given its own tinted card so it does not visually collide
  // with the receipt table sitting directly above it.
  const noteRow = note
    ? [
      '<tr><td style="padding:24px 32px 28px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;background:#FBF7F6;border-left:3px solid ' + BRAND_RED + ';border-radius:8px;">',
      '<tr><td style="padding:18px 20px 16px;">',
      '<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:' + MUTED_TEXT + ';margin:0 0 8px;">Your note</div>',
      '<div style="font-size:14px;line-height:1.7;color:' + BODY_TEXT + ';margin:0 0 ' + (noteFooter ? "14px" : "0") + ';">' + esc(note) + "</div>",
      noteFooter
        ? '<div style="font-size:13px;line-height:1.7;color:#6B6B6B;margin:0;padding-top:14px;border-top:1px solid ' + BORDER + ';">' + esc(noteFooter) + "</div>"
        : "",
      "</td></tr>",
      "</table>",
      "</td></tr>",
    ].join("")
    : "";

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<meta name="color-scheme" content="light" />',
    "<title>Donation Receipt — " + esc(orgName) + "</title>",
    "</head>",
    '<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:' + BODY_TEXT + ';-webkit-font-smoothing:antialiased;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F4F5;padding:24px 12px;">',
    "<tr><td align=" + DQ + "center" + DQ + ">",
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid ' + BORDER + ';">',

    "<!-- Brand header -->",
    "<tr><td align=" + DQ + "center" + DQ + ' style="background:' + BRAND_NAVY + ';padding:32px 24px 28px;" bgcolor="' + BRAND_NAVY + '">',
    brandBlock,
    '<h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:700;color:#FFFFFF;">Thank you for your donation</h1>',
    '<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.94);">Your contribution has been received successfully.</p>',
    "</td></tr>",

    "<!-- Amount hero -->",
    '<tr><td align="center" style="padding:28px 24px 8px;">',
    '<div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:' + MUTED_TEXT + ';margin-bottom:6px;">Donation Amount</div>',
    '<div style="font-size:32px;line-height:1.2;font-weight:700;color:' + BRAND_RED + ';">' + esc(details.amount) + "</div>",
    "</td></tr>",

    "<!-- Greeting -->",
    '<tr><td style="padding:20px 32px 4px;font-size:15px;line-height:1.7;color:' + BODY_TEXT + ';">',
    "Dear " + esc(details.donorName) + ",<br />",
    "We gratefully acknowledge your generous contribution to " + esc(orgName) + ". Please find your payment details below.",
    "</td></tr>",

    "<!-- Receipt table -->",
    '<tr><td style="padding:20px 32px 8px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;border:1px solid ' + BORDER + ';border-radius:10px;overflow:hidden;">',
    buildReceiptRows(details),
    "</table></td></tr>",

    noteRow,

    "</table>",

    "<!-- Disclaimer -->",
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">',
    '<tr><td align="center" style="padding:16px 24px 0;font-size:11px;line-height:1.6;color:' + MUTED_TEXT + ';">',
    "You are receiving this email because a donation was made using this email address.",
    "</td></tr></table>",

    "</td></tr>",
    "</table>",
    "</body></html>",
  ].join("");
}

/**
 * Plain-text alternative — shown by clients that block HTML rendering.
 * Mirrors the same six fields as the HTML version.
 */
export function renderDonationReceiptText(params = {}) {
  const orgName = params.orgName || "MESCO Trust";
  const details = {
    donorName: params.donorName,
    transactionId: params.transactionId,
    paymentMode: humanizePaymentMode(params.paymentMode),
    amount: formatAmount(params.amount, params.currency),
    transactionDate: formatDateTime(params.transactionDate),
    purpose: params.purpose || "General Fund",
  };
  const note = String(params.note || "").trim();
  const noteFooter = String(
    params.noteFooterText ||
      "Your contribution will be applied to the programme you have chosen and will go directly towards the people MESCO Trust serves.",
  ).trim();

  return [
    "Thank you for your donation to " + orgName + "!",
    "",
    "Donor Name:       " + (details.donorName || "—"),
    "Transaction ID:   " + (details.transactionId || "—"),
    "Payment Mode:     " + details.paymentMode,
    "Amount:           " + details.amount,
    "Transaction Date: " + details.transactionDate,
    "Purpose:          " + details.purpose,
    note ? "\nYOUR NOTE" : "",
    note ? "---------  " + note : "",
    note ? "          " + noteFooter : "",
    "",
    "This is a system-generated receipt for your records.",
    "",
    "— MESCO Trust",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export const DONATION_RECEIPT_BRAND = Object.freeze({
  red: BRAND_RED,
  navy: BRAND_NAVY,
});