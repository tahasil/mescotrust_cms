/**
 * One-time code email for the public donation history page (UAT DON-05).
 *
 * Same table-based, inline-styled layout as the donation receipt so it renders
 * in Gmail/Outlook, and the same text wordmark header (remote logos are
 * blocked by most clients).
 */

import { DONATION_RECEIPT_BRAND } from "@/lib/emailTemplates/donationReceipt";

const BODY_TEXT = "#444444";
const MUTED_TEXT = "#8A8A8A";
const BORDER = "#EEEEEE";

function esc(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderDonorHistoryOtpHtml({ code, orgName = "MESCO Trust", validMinutes = 10 } = {}) {
  const navy = DONATION_RECEIPT_BRAND.navy;
  const red = DONATION_RECEIPT_BRAND.red;

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<meta name="color-scheme" content="light" />',
    `<title>Your donation history code - ${esc(orgName)}</title>`,
    "</head>",
    `<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BODY_TEXT};">`,
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F4F5;padding:24px 12px;">',
    '<tr><td align="center">',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">`,
    `<tr><td align="center" bgcolor="${navy}" style="background:${navy};padding:28px 24px 24px;">`,
    `<div style="font-size:22px;line-height:1.2;font-weight:700;letter-spacing:1px;color:#FFFFFF;">${esc(orgName)}</div>`,
    '<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.94);">Your donation history code</p>',
    "</td></tr>",
    `<tr><td style="padding:28px 32px 8px;font-size:15px;line-height:1.7;color:${BODY_TEXT};">`,
    "Use this code to view your past donations. It works once and expires in " +
      `${esc(validMinutes)} minutes.`,
    "</td></tr>",
    '<tr><td align="center" style="padding:16px 32px 8px;">',
    `<div style="display:inline-block;font-size:32px;line-height:1.2;font-weight:700;letter-spacing:8px;color:${red};padding:12px 20px;border:1px dashed ${BORDER};border-radius:10px;">${esc(code)}</div>`,
    "</td></tr>",
    `<tr><td style="padding:16px 32px 28px;font-size:13px;line-height:1.7;color:${MUTED_TEXT};">`,
    "If you didn't ask for this, you can ignore this email. Nobody can see your donations without this code.",
    "</td></tr>",
    "</table>",
    "</td></tr>",
    "</table>",
    "</body></html>",
  ].join("");
}

export function renderDonorHistoryOtpText({ code, orgName = "MESCO Trust", validMinutes = 10 } = {}) {
  return [
    `${orgName}: your donation history code`,
    "",
    `Code: ${code}`,
    "",
    `Use it to view your past donations. It works once and expires in ${validMinutes} minutes.`,
    "If you didn't ask for this, you can ignore this email.",
  ].join("\n");
}
