/**
 * Mail transport selection.
 *
 * Two providers are supported, resolved once per send from environment:
 *
 *   1. SMTP (nodemailer) — used when SMTP_HOST and SMTP_USER are set.
 *      This is what cPanel / Hostinger / Gmail / Office365 accounts give you.
 *   2. Resend (HTTP API) — used when SMTP is absent but RESEND_API_KEY is set.
 *      Kept as the fallback so existing Resend deployments keep working
 *      without any config change.
 *
 * If neither is configured the caller gets `{ sent: false, skipped: true }`
 * and nothing is thrown — a mail failure must never break a donation.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function envValue(key) {
  return String(process.env[key] || "").trim();
}

/** SMTP is considered configured when a host and a user are both present. */
export function isSmtpConfigured() {
  return Boolean(envValue("SMTP_HOST") && envValue("SMTP_USER"));
}

export function isResendConfigured() {
  return Boolean(envValue("RESEND_API_KEY"));
}

/** True when either provider can deliver mail. */
export function isEmailConfigured() {
  return isSmtpConfigured() || isResendConfigured();
}

/** "SMTP" | "Resend" | null — useful for logs and diagnostics. */
export function getActiveMailProvider() {
  if (isSmtpConfigured()) return "SMTP";
  if (isResendConfigured()) return "Resend";
  return null;
}

/**
 * nodemailer is loaded lazily so the Resend-only path never pays the require
 * cost, and so the dependency is optional in environments that only use one.
 */
async function sendViaSmtp({ from, to, subject, html, text, replyTo }) {
  const nodemailer = (await import("nodemailer")).default;

  const port = Number(envValue("SMTP_PORT")) || 587;
  const useSecure = envValue("SMTP_SECURE")
    ? /^(1|true|yes|on)$/i.test(envValue("SMTP_SECURE"))
    : port === 465;

  const transport = nodemailer.createTransport({
    host: envValue("SMTP_HOST"),
    port,
    secure: useSecure,
    // cPanel/hosting providers commonly present a self-signed certificate.
    // Set SMTP_ALLOW_SELF_SIGNED=true to accept it (dev/staging only).
    ignoreTLS: false,
    tls: {
      rejectUnauthorized: !/^(1|true|yes|on)$/i.test(envValue("SMTP_ALLOW_SELF_SIGNED")),
    },
    auth: {
      user: envValue("SMTP_USER"),
      pass: envValue("SMTP_PASS"),
    },
  });

  const info = await transport.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });

  return { provider: "SMTP", messageId: info?.messageId || "" };
}

async function sendViaResend({ from, to, subject, html, text, replyTo }) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envValue("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Resend failed (${response.status})`);
  }

  const result = await response.json().catch(() => ({}));
  return { provider: "Resend", messageId: result?.id || "" };
}

/**
 * Sends one email through whichever provider is configured.
 *
 * @returns {Promise<{sent: boolean, delivered: boolean, skipped?: boolean, provider?: string, messageId?: string, error?: string}>}
 */
export async function sendMail({ from, to, subject, html, text, replyTo }) {
  if (!to) return { sent: false, delivered: false, skipped: true };

  if (!isEmailConfigured()) {
    console.warn("[Email] No SMTP_HOST/SMTP_USER and no RESEND_API_KEY — email NOT sent:", {
      to,
      subject,
    });
    return { sent: false, delivered: false, skipped: true };
  }

  try {
    const result = isSmtpConfigured()
      ? await sendViaSmtp({ from, to, subject, html, text, replyTo })
      : await sendViaResend({ from, to, subject, html, text, replyTo });

    return { sent: true, delivered: true, ...result };
  } catch (err) {
    // Thrown for the caller to log; never bubbles into the donation flow.
    return {
      sent: false,
      delivered: false,
      error: err?.message || String(err),
      provider: isSmtpConfigured() ? "SMTP" : "Resend",
    };
  }
}