/**
 * Checks the email configuration and optionally sends a real test receipt.
 *
 * Reports which provider the app will use, then optionally delivers a real
 * test email through the exact same code path the donation flow uses.
 *
 * Usage:
 *   node scripts/test-email-config.js
 *       -> config report only, sends nothing
 *
 *   node scripts/test-email-config.js --send you@example.com
 *       -> also sends a real test receipt to that address
 */
require("dotenv").config();
const path = require("path");
const { pathToFileURL } = require("url");

function env(key) {
  return String(process.env[key] || "").trim();
}

function mask(value) {
  if (!value) return "*** MISSING ***";
  return value.length <= 4 ? "SET" : "SET (ends " + value.slice(-4) + ")";
}

function parseArgs(argv) {
  const sendIndex = argv.indexOf("--send");
  return {
    shouldSend: sendIndex !== -1,
    recipient: sendIndex !== -1 ? String(argv[sendIndex + 1] || "").trim() : "",
  };
}

/**
 * Lorem Ipsum placeholders — never real donor data, so a misconfigured test
 * run can never leak someone's details.
 */
const SAMPLE = {
  donorName: "Lorem Ipsum",
  transactionId: "TXN_TESTPREVIEW000",
  paymentMode: "test-mode",
  amount: 50000,
  currency: "INR",
  transactionDate: new Date(),
  purpose: "Lorem Ipsum Dolor Sit Amet",
  note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  orgName: "MESCO Trust",
};

async function main() {
  const { shouldSend, recipient } = parseArgs(process.argv.slice(2));

  const smtpHost = env("SMTP_HOST");
  const smtpUser = env("SMTP_USER");
  const smtpPass = env("SMTP_PASS");
  const resendKey = env("RESEND_API_KEY");
  // Mirror lib/mailTransport.js resolution exactly: SMTP_FROM wins, EMAIL_FROM
  // is the fallback. Reporting EMAIL_FROM here would hide the address the app
  // actually sends from.
  const from = env("SMTP_FROM") || env("EMAIL_FROM");
  const adminTo = env("ADMIN_NOTIFICATION_EMAIL") || env("EMAIL_TO") || env("ADMIN_EMAIL");

  const smtpReady = Boolean(smtpHost && smtpUser);
  const resendReady = Boolean(resendKey);
  const active = smtpReady ? "SMTP" : resendReady ? "Resend" : null;

  console.log("=== Email configuration ===\n");
  console.log("[SMTP — checked first]");
  console.log("  SMTP_HOST   : " + (smtpHost || "*** MISSING ***"));
  console.log("  SMTP_PORT   : " + (env("SMTP_PORT") || "587 (default)"));
  console.log("  SMTP_SECURE : " + (env("SMTP_SECURE") || "false (default)"));
  console.log("  SMTP_USER   : " + (smtpUser || "*** MISSING ***"));
  console.log("  SMTP_PASS   : " + mask(smtpPass));
  console.log("  status      : " + (smtpReady ? "CONFIGURED" : "not configured"));
  console.log("\n[Resend — fallback]");
  console.log("  RESEND_API_KEY : " + mask(resendKey));
  console.log("  status         : " + (resendReady ? "CONFIGURED" : "not configured"));
  console.log("\n[Addresses]");
  console.log("  SMTP_FROM  : " + (env("SMTP_FROM") || "(not set)"));
  console.log("  EMAIL_FROM : " + (env("EMAIL_FROM") || "*** MISSING ***"));
  console.log("  >>> FROM   : " + (from || "*** MISSING ***"));
  console.log("  ADMIN_NOTIFICATION_EMAIL : " + (env("ADMIN_NOTIFICATION_EMAIL") || "(not set)"));
  console.log("  EMAIL_TO   : " + (env("EMAIL_TO") || "(not set)"));
  console.log("  >>> ADMIN TO : " + (adminTo || "(not set — admin copy disabled)"));
  console.log("\n>>> ACTIVE PROVIDER: " + (active || "NONE — emails will be skipped"));

  if (!active) {
    console.log("\nCannot send: neither provider is configured.");
    console.log("Fill SMTP_HOST + SMTP_USER + SMTP_PASS, or set RESEND_API_KEY, in .env.");
    console.log("For SMTP values, ask your host for its outgoing mail settings.");
    return;
  }

  if (!from) {
    console.log("\nCannot send: neither SMTP_FROM nor EMAIL_FROM is set — every provider requires a 'from' address.");
    return;
  }

  if (!shouldSend) {
    console.log("\nRe-run with --send <email> to deliver a real test receipt.");
    return;
  }

  if (!recipient) {
    console.log("\nCannot send: pass an address, e.g. --send you@example.com");
    return;
  }

  // Import through the same transport the app uses, so this test exercises the
  // real delivery path rather than a parallel copy of it.
  // Relative specifiers work on every platform. Absolute Windows paths
  // ("D:\...") are rejected by the ESM loader, so resolve to a file:// URL.
  const asUrl = (relativePath) =>
    pathToFileURL(path.join(process.cwd(), relativePath)).href;

  const [{ sendMail }, { renderDonationReceiptHtml, renderDonationReceiptText }] =
    await Promise.all([
      import(asUrl("lib/mailTransport.js")),
      import(asUrl("lib/emailTemplates/donationReceipt.js")),
    ]);

  console.log("\n=== Sending test receipt ===");
  console.log("Provider : " + active);
  console.log("To       : " + recipient);
  console.log("From     : " + from);
  console.log("Subject  : [TEST] Donation Receipt — " + SAMPLE.transactionId);

  const result = await sendMail({
    from,
    to: recipient,
    subject: "[TEST] Donation Receipt — " + SAMPLE.transactionId,
    html: renderDonationReceiptHtml(SAMPLE),
    text: renderDonationReceiptText(SAMPLE),
  });

  if (!result.delivered) {
    console.log("\nSEND FAILED via " + (result.provider || active));
    console.log("Reason: " + (result.error || "no provider available"));
    console.log("\nCommon causes:");
    if (active === "Resend") {
      console.log("  - API key invalid or revoked");
      console.log("  - Sending domain not verified (check https://resend.com/domains)");
      console.log("  - 'from' address uses a domain you do not own");
    } else {
      console.log("  - Wrong host/port, or the provider blocks the port");
      console.log("  - Wrong username/password (Gmail needs an App Password)");
      console.log("  - Self-signed certificate -> set SMTP_ALLOW_SELF_SIGNED=true (dev only)");
      console.log("  - From address not on the same account as SMTP_USER");
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nSENT OK via " + result.provider);
  if (result.messageId) console.log("Message id : " + result.messageId);
  console.log("\nCheck the inbox (and spam) of " + recipient + ".");
}

main().catch((err) => {
  console.error("Test failed:", err?.message || err);
  process.exit(1);
});