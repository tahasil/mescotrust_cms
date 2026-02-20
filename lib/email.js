/**
 * Email service for contact notifications.
 * Configure via env: RESEND_API_KEY (Resend) or SMTP_* (nodemailer).
 * Optional: EMAIL_FROM, EMAIL_TO for contact form.
 */

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
