/**
 * Event RSVP emails (UAT NEW-06).
 *
 * Same table-based, inline-styled layout as the donation receipt, with the same
 * navy header and text wordmark, so every MESCO email looks like one family.
 * The relative import keeps this usable from plain-node test scripts.
 *
 * Two kinds: "confirmed" after a reply is saved, and "change_link" when someone
 * replies again from the public form. A second reply never overwrites the first
 * without the signed link, or anyone who knows an email could change that
 * person's answer.
 */

import { DONATION_RECEIPT_BRAND } from "./donationReceipt.js";

const BODY_TEXT = "#444444";
const MUTED_TEXT = "#8A8A8A";
const BORDER = "#EEEEEE";

const REPLY_LABELS = { yes: "Yes", maybe: "Maybe", no: "No" };

const HEADINGS = {
  yes: {
    title: "We'll see you there",
    subtitle: "Thank you for confirming your attendance.",
    body: "We have recorded your reply. Please find the event details below.",
  },
  maybe: {
    title: "Thank you for your reply",
    subtitle: "We have kept a seat for you.",
    body: "We have recorded your reply. If your plans change, you can update it at any time before replies close.",
  },
  no: {
    title: "Thank you for letting us know",
    subtitle: "We are sorry you can't make it.",
    body: "We have recorded your reply. If your plans change, you can update it while replies are still open.",
  },
  change_link: {
    title: "Change your reply",
    subtitle: "You have already replied to this event.",
    body: "Use the button below if you would like to change your answer. If you didn't ask for this, you can ignore this email.",
  },
};

function esc(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDetailRows(rows) {
  return rows
    .map(([label, value], index) => {
      const divider = index === rows.length - 1 ? "" : `border-bottom:1px solid ${BORDER};`;
      return (
        "<tr>" +
        `<td align="left" style="padding:12px 16px;${divider}color:#666666;font-size:14px;">${esc(label)}</td>` +
        `<td align="right" style="padding:12px 16px;${divider}text-align:right;color:#222222;font-size:14px;font-weight:600;">${esc(value)}</td>` +
        "</tr>"
      );
    })
    .join("");
}

/** A table cell with a background, which Outlook renders where a styled link alone won't. */
function button(href, label, primary) {
  const red = DONATION_RECEIPT_BRAND.red;
  const cellStyle = primary
    ? `background:${red};border-radius:8px;`
    : `border:1px solid ${red};border-radius:8px;`;
  const linkColor = primary ? "#FFFFFF" : red;
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 6px 8px;">' +
    `<tr><td align="center" ${primary ? `bgcolor="${red}"` : ""} style="${cellStyle}">` +
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;line-height:1.2;color:${linkColor};text-decoration:none;">${esc(label)}</a>` +
    "</td></tr></table>"
  );
}

export function renderEventRsvpEmail({
  kind = "confirmed",
  name = "",
  attendance = "",
  eventTitle = "",
  eventDate = "",
  venue = "",
  changeUrl = "",
  calendarUrl = "",
  orgName = "MESCO Trust",
}) {
  const { red, navy } = DONATION_RECEIPT_BRAND;
  const isChangeLink = kind === "change_link";
  const copy = HEADINGS[isChangeLink ? "change_link" : attendance] || HEADINGS.yes;
  const replyLabel = REPLY_LABELS[attendance] || "";
  const title = String(eventTitle || "our event").replace(/[\r\n]+/g, " ");
  const subject = isChangeLink ? `Change your reply: ${title}` : `Your reply: ${title}`;
  const showCalendar = !isChangeLink && attendance !== "no" && Boolean(calendarUrl);
  const details = [
    ["Event", title],
    ["Date", eventDate],
    ["Venue", venue],
  ].filter(([, value]) => value);

  const actions = [
    showCalendar ? button(calendarUrl, "Add to calendar", true) : "",
    changeUrl ? button(changeUrl, "Change your reply", !showCalendar) : "",
  ].join("");

  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<meta name="color-scheme" content="light" />',
    `<title>${esc(subject)} - ${esc(orgName)}</title>`,
    "</head>",
    `<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BODY_TEXT};-webkit-font-smoothing:antialiased;">`,
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F4F5;padding:24px 12px;">',
    '<tr><td align="center">',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">`,

    "<!-- Brand header -->",
    `<tr><td align="center" bgcolor="${navy}" style="background:${navy};padding:32px 24px 28px;">`,
    `<div style="font-size:26px;line-height:1.2;font-weight:700;letter-spacing:1px;color:#FFFFFF;margin:0 0 18px;">${esc(orgName)}</div>`,
    `<h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:700;color:#FFFFFF;">${esc(copy.title)}</h1>`,
    `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.94);">${esc(copy.subtitle)}</p>`,
    "</td></tr>",

    ...(isChangeLink || !replyLabel
      ? []
      : [
          "<!-- Reply hero -->",
          '<tr><td align="center" style="padding:28px 24px 8px;">',
          `<div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED_TEXT};margin-bottom:6px;">Your Reply</div>`,
          `<div style="font-size:32px;line-height:1.2;font-weight:700;color:${red};">${esc(replyLabel)}</div>`,
          "</td></tr>",
        ]),

    "<!-- Greeting -->",
    `<tr><td style="padding:20px 32px 4px;font-size:15px;line-height:1.7;color:${BODY_TEXT};">`,
    `Dear ${esc(name) || "friend"},<br />`,
    esc(copy.body),
    "</td></tr>",

    "<!-- Event details -->",
    '<tr><td style="padding:20px 32px 8px;">',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">`,
    buildDetailRows(details),
    "</table></td></tr>",

    ...(actions
      ? ["<!-- Actions -->", `<tr><td align="center" style="padding:16px 26px 20px;">${actions}</td></tr>`]
      : ['<tr><td style="padding:0 0 20px;"></td></tr>']),

    "</table>",

    "<!-- Disclaimer -->",
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">',
    `<tr><td align="center" style="padding:16px 24px 0;font-size:11px;line-height:1.6;color:${MUTED_TEXT};">`,
    `You are receiving this email because this address was used to reply to a ${esc(orgName)} event.`,
    "</td></tr></table>",

    "</td></tr>",
    "</table>",
    "</body></html>",
  ].join("");

  const text = [
    `${copy.title} - ${orgName}`,
    "",
    `Dear ${name || "friend"},`,
    copy.body,
    "",
    ...(isChangeLink || !replyLabel ? [] : [`Your reply: ${replyLabel}`]),
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    ...(showCalendar ? [`Add to calendar: ${calendarUrl}`] : []),
    ...(changeUrl ? [`Change your reply: ${changeUrl}`] : []),
    "",
    `— ${orgName}`,
  ].join("\n");

  return { subject, html, text };
}
