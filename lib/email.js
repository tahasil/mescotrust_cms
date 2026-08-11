/**
 * Email service.
 *
 * Configure via env:
 *   RESEND_API_KEY  – Resend API token (required for real sending)
 *   EMAIL_FROM      – default "From" address
 *   EMAIL_TO        – admin recipient for inbox-style notifications
 *   ADMIN_EMAIL     – fallback for EMAIL_TO
 *
 * If RESEND_API_KEY is not set, all functions fall back to console.log so
 * dev environments don't error out.
 */

async function resendSend({ from, to, subject, html, text, replyTo }) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] No RESEND_API_KEY; would send:", {
      from,
      to,
      subject,
      preview: (text || html || "").slice(0, 120),
    });
    return { skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend failed (${res.status})`);
  }
  return res.json().catch(() => ({}));
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${n.toLocaleString("en-IN")}`;
  }
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export async function sendContactNotification(submission) {
  const from = process.env.EMAIL_FROM || "noreply@example.com";
  const to = process.env.EMAIL_TO || process.env.ADMIN_EMAIL || "admin@example.com";
  const { name, email, message } = submission.payload || submission;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Contact form: ${name || "No name"}`,
        text: `From: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Resend failed");
    }
    return;
  }

  // Fallback: log only (no SMTP configured)
  console.log("[Contact] No RESEND_API_KEY; would email:", { to, from, name, email, message: message?.slice(0, 50) });
}

export async function sendContactAutoReply(submission) {
  const to = submission.payload?.email || submission.email;
  if (!to) return;
  const from = process.env.EMAIL_FROM || "noreply@example.com";
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "We received your message",
        text: "Thank you for contacting us. We will get back to you soon.",
      }),
    });
  }
}

/**
 * Event registration acknowledgement — sent to the visitor and (best-effort)
 * to the admin inbox after a successful submission via /api/public/event-registrations.
 *
 * Best-effort: errors are logged but never thrown to the caller (we don't want
 * a failed email to break the form submission UX).
 *
 * @param {object} registration - EventRegistration document (after save)
 * @param {object} [orgInfo] - Optional org details from ThemeConfig
 */
export async function sendEventRegistrationAck(registration, orgInfo = {}) {
  try {
    const applicantEmail = registration?.payload?.email;
    if (!applicantEmail) {
      console.log("[EventRegAck] No applicant email; skipping");
      return { skipped: true };
    }

    const orgName = orgInfo.siteTitle || "MESCO Trust";
    const orgEmail = orgInfo.footerEmail || process.env.EMAIL_FROM || "";
    const orgPhone = orgInfo.footerPhone || "";
    const orgAddress = orgInfo.footerAddress || "";
    const logoUrl = orgInfo.logoLightUrl || orgInfo.logoImageUrl || "";

    const from = process.env.EMAIL_FROM || `noreply@${(orgEmail.split("@")[1] || "example.com")}`;
    const adminTo = process.env.EMAIL_TO || process.env.ADMIN_EMAIL || "";
    const dateStr = formatDate(registration.createdAt || new Date());

    const fields = [
      ["Event", registration.eventTitle || "—"],
      ["Event date", registration.eventDate || "—"],
      ["Name", registration.payload?.name || "—"],
      ["Email", registration.payload?.email || "—"],
      ["Phone", registration.payload?.phone || "—"],
      ["School / Institution", registration.payload?.school || "—"],
      ["Class / Year", registration.payload?.classOrYear || "—"],
      ["Submitted", dateStr],
    ];

    const rowsHtml = fields
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;">${escapeHtml(
            label,
          )}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:13px;font-weight:600;">${escapeHtml(
            value,
          )}</td></tr>`,
      )
      .join("");

    const applicantHtml = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea;">
      <div style="padding:24px;text-align:center;background:#E03C33;color:#ffffff;">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(orgName)}" style="max-height:60px;margin-bottom:12px;" />` : ""}
        <h1 style="margin:0;font-size:22px;font-weight:700;">Registration received</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Thank you for registering for ${escapeHtml(registration.eventTitle || "our event")}.</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444;">
          Dear ${escapeHtml(registration.payload?.name || "")},<br/>
          We have received your registration. Our team will review the details and reach out to you with the next steps.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${rowsHtml}
        </table>
        ${
          registration.payload?.message
            ? `<p style="margin:16px 0 0;font-size:13px;color:#555;"><strong>Your message:</strong><br/>${escapeHtml(registration.payload.message).replace(/\n/g, "<br/>")}</p>`
            : ""
        }
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#666;">
          For any queries, please reach out to us
          ${orgEmail ? `at <a href="mailto:${escapeHtml(orgEmail)}" style="color:#E03C33;">${escapeHtml(orgEmail)}</a>` : ""}
          ${orgPhone ? ` or call ${escapeHtml(orgPhone)}` : ""}.
        </p>
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
        <strong>${escapeHtml(orgName)}</strong>
        ${orgAddress ? `<br/>${escapeHtml(orgAddress)}` : ""}
      </div>
    </div>
  </div>
</body></html>`;

    const applicantText = `Hello ${registration.payload?.name || ""},

We have received your registration for ${registration.eventTitle || "our event"}.
Event date: ${registration.eventDate || "—"}
Submitted: ${dateStr}

Our team will review the details and reach out with the next steps.

— ${orgName}
${orgEmail ? `Email: ${orgEmail}` : ""}
${orgPhone ? `Phone: ${orgPhone}` : ""}`;

    await resendSend({
      from,
      to: applicantEmail,
      subject: `Registration received — ${registration.eventTitle || "Event"}`,
      html: applicantHtml,
      text: applicantText,
      replyTo: orgEmail || undefined,
    });

    // Best-effort admin notification
    if (adminTo) {
      try {
        await resendSend({
          from,
          to: adminTo,
          subject: `[Event Registration] ${registration.eventTitle || "Event"} — ${registration.payload?.name || ""}`,
          html: applicantHtml,
          text: applicantText,
        });
      } catch (e) {
        console.error("[EventRegAck] Admin copy failed:", e?.message || e);
      }
    }

    return { sent: true };
  } catch (err) {
    console.error("[EventRegAck] Failed:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}

/**
 * Donation receipt email — sent to the donor when a CCAvenue payment succeeds.
 * Best-effort: errors are logged but never thrown to the caller (we don't want
 * a failed receipt to break the donation flow itself).
 *
 * @param {object} donation - Donation document (after status="success" save)
 * @param {object} [orgInfo] - Optional org details from ThemeConfig
 */
export async function sendDonationReceipt(donation, orgInfo = {}) {
  try {
    if (!donation?.donor?.email) {
      console.log("[DonationReceipt] No donor email; skipping");
      return { skipped: true };
    }

    const orgName = orgInfo.siteTitle || "MESCO Trust";
    const orgEmail = orgInfo.footerEmail || process.env.EMAIL_FROM || "";
    const orgPhone = orgInfo.footerPhone || "";
    const orgAddress = orgInfo.footerAddress || "";
    const logoUrl = orgInfo.logoLightUrl || orgInfo.logoImageUrl || "";

    const from = process.env.EMAIL_FROM || `noreply@${(orgEmail.split("@")[1] || "example.com")}`;
    const to = donation.donor.email;
    const adminTo = process.env.EMAIL_TO || process.env.ADMIN_EMAIL || "";

    const amountStr = formatInr(donation.amount);
    const dateStr = formatDate(donation.updatedAt || donation.createdAt || new Date());

    const fields = [
      ["Receipt / Order ID", donation.orderId],
      ["Donor Name", donation.donor.name],
      ["Email", donation.donor.email],
      ["Mobile", donation.donor.mobile],
      ["Amount", amountStr],
      ["Purpose", donation.purpose || "General Fund"],
      ["Zakat", donation.zakat || "No"],
      ["PAN", donation.donor.pan || "—"],
      ["Payment Mode", donation.payment?.paymentMode || "—"],
      ["Bank Reference No.", donation.payment?.bankRefNo || "—"],
      ["Tracking ID", donation.payment?.trackingId || "—"],
      ["Date", dateStr],
    ];

    const rowsHtml = fields
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;">${escapeHtml(
            label
          )}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:13px;font-weight:600;">${escapeHtml(
            value
          )}</td></tr>`
      )
      .join("");

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea;">
      <div style="padding:24px;text-align:center;background:#E03C33;color:#ffffff;">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(orgName)}" style="max-height:60px;margin-bottom:12px;" />` : ""}
        <h1 style="margin:0;font-size:22px;font-weight:700;">Thank you for your donation</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Your contribution to ${escapeHtml(orgName)} has been received.</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444;">
          Dear ${escapeHtml(donation.donor.name)},<br/>
          We gratefully acknowledge your generous contribution. Below is your donation receipt for your records.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${rowsHtml}
        </table>
        ${
          donation.note
            ? `<p style="margin:16px 0 0;font-size:13px;color:#555;"><strong>Note:</strong> ${escapeHtml(donation.note)}</p>`
            : ""
        }
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#666;">
          This is a system-generated receipt. For any queries about your donation, please reach out to us
          ${orgEmail ? `at <a href="mailto:${escapeHtml(orgEmail)}" style="color:#E03C33;">${escapeHtml(orgEmail)}</a>` : ""}
          ${orgPhone ? ` or call ${escapeHtml(orgPhone)}` : ""}.
        </p>
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
        <strong>${escapeHtml(orgName)}</strong>
        ${orgAddress ? `<br/>${escapeHtml(orgAddress)}` : ""}
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#999;margin-top:16px;">
      You are receiving this email because a donation was made on ${escapeHtml(
        dateStr
      )} using this email address.
    </p>
  </div>
</body></html>`;

    const text = `Thank you for your donation to ${orgName}!

Receipt / Order ID: ${donation.orderId}
Donor: ${donation.donor.name}
Amount: ${amountStr}
Purpose: ${donation.purpose || "General Fund"}
Date: ${dateStr}
Tracking ID: ${donation.payment?.trackingId || "—"}

For queries: ${orgEmail || ""} ${orgPhone || ""}`;

    await resendSend({
      from,
      to,
      subject: `Donation Receipt — ${donation.orderId}`,
      html,
      text,
      replyTo: orgEmail || undefined,
    });

    // Best-effort admin copy
    if (adminTo) {
      try {
        await resendSend({
          from,
          to: adminTo,
          subject: `[Donation Received] ${amountStr} from ${donation.donor.name}`,
          html,
          text,
        });
      } catch (e) {
        console.error("[DonationReceipt] Admin copy failed:", e?.message || e);
      }
    }

    return { sent: true };
  } catch (err) {
    // Never throw — donation success path must not be blocked by email failures.
    console.error("[DonationReceipt] Failed:", err?.message || err);
    return { error: err?.message || String(err) };
  }
}
