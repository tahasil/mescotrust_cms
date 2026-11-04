"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Public donation history (UAT DON-05).
 *
 * Steps: identify (email or mobile) -> code (6-digit OTP sent to the email on
 * record) -> list. The session lives in an httpOnly cookie scoped to
 * /api/public/donor-history, so on load we simply ask the list endpoint
 * whether we're already signed in.
 */

const API = "/api/public/donor-history";

function formatAmount(amount, currency = "INR") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "-";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR").toUpperCase(),
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString("en-IN")}`;
  }
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function DonationHistoryClient({ donateHref = "/donate-now" }) {
  const [step, setStep] = useState("checking");
  const [identifier, setIdentifier] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [history, setHistory] = useState(null);
  const [receipts, setReceipts] = useState({});
  const codeInputRef = useRef(null);
  const listTopRef = useRef(null);

  /** Returns "ok", "signed-out" or "error". */
  const loadHistory = useCallback(async (page = 1) => {
    const res = await fetch(`${API}?page=${page}`, { cache: "no-store", credentials: "same-origin" });
    const data = await readJson(res);
    if (res.status === 401 || (res.ok && data.signedIn === false)) {
      setHistory(null);
      setStep("identify");
      return "signed-out";
    }
    if (!res.ok) {
      setError(data.error || "We couldn't load your donations right now. Please try again.");
      return "error";
    }
    setHistory(data);
    setStep("list");
    return "ok";
  }, []);

  useEffect(() => {
    loadHistory(1)
      .then((result) => {
        if (result === "error") setStep("identify");
      })
      .catch(() => {
        setStep("identify");
        setError("We couldn't reach the server. Please check your connection and try again.");
      });
  }, [loadHistory]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  const requestCode = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await readJson(res);
      // A challenge means a code was sent (or an earlier one is still valid).
      if (res.ok && data.challengeId) {
        setChallengeId(String(data.challengeId));
        setNotice(data.message || "");
        setResendIn(Number(data.resendAfterSeconds) || 60);
        setCode("");
        setStep("code");
        return;
      }
      // No donations / none completed / waiting / send failure: say why.
      if (data.retryAfterSeconds) setResendIn(Number(data.retryAfterSeconds) || 60);
      setError(
        data.message || data.error || "We couldn't send a code right now. Please try again.",
      );
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleIdentify = (event) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("Enter the email address or mobile number you used when donating.");
      return;
    }
    requestCode();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ challengeId, code }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(data.error || "That code didn't work. Please try again.");
        return;
      }
      setNotice("");
      setReceipts({});
      await loadHistory(1);
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    setStep("identify");
    setChallengeId("");
    setCode("");
    setNotice("");
    setError("");
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch(API, { method: "DELETE", credentials: "same-origin" });
    } catch {
      // The cookie expires on its own; still return to the start.
    } finally {
      setBusy(false);
      setHistory(null);
      setReceipts({});
      setIdentifier("");
      startOver();
    }
  };

  const goToPage = async (page) => {
    setBusy(true);
    setError("");
    try {
      const result = await loadHistory(page);
      if (result === "ok") listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (result === "signed-out") setNotice("Your session ended. Verify again to see your donations.");
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const emailReceipt = async (orderId) => {
    setReceipts((prev) => ({ ...prev, [orderId]: { status: "sending" } }));
    try {
      const res = await fetch(`${API}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderId }),
      });
      const data = await readJson(res);
      if (res.status === 401) {
        setHistory(null);
        setStep("identify");
        setNotice("Your session ended. Verify again to see your donations.");
        return;
      }
      setReceipts((prev) => ({
        ...prev,
        [orderId]: res.ok
          ? { status: "sent", message: data.message || "Receipt sent." }
          : { status: "error", message: data.error || "Couldn't send the receipt." },
      }));
    } catch {
      setReceipts((prev) => ({
        ...prev,
        [orderId]: { status: "error", message: "Couldn't reach the server." },
      }));
    }
  };

  const items = history?.items || [];

  return (
    <section className="dh-page">
      <div className="dh-hero">
        <div className="dh-hero-inner">
          <span className="dh-eyebrow">Donor area</span>
          <h1 className="dh-title">Your donation history</h1>
          <p className="dh-subtitle">
            See the donations you've made to MESCO Trust. We'll email you a one-time code to
            confirm it's you.
          </p>
        </div>
      </div>

      <div className="dh-body">
        {step === "checking" ? (
          <div className="dh-card dh-loading" aria-live="polite">
            Loading…
          </div>
        ) : null}

        {step === "identify" ? (
          <form className="dh-card" onSubmit={handleIdentify} noValidate>
            {notice ? (
              <p className="dh-notice" aria-live="polite">
                {notice}
              </p>
            ) : null}
            <label className="dh-label" htmlFor="dh-identifier">
              Email or mobile number
            </label>
            <input
              id="dh-identifier"
              className="dh-input"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. you@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={busy}
            />
            <p className="dh-hint">
              Use the email or mobile number you gave when donating. We'll send the code to the
              email address on your donation.
            </p>
            {error ? (
              <p className="dh-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="dh-btn" disabled={busy}>
              {busy ? "Sending…" : "Email me a code"}
            </button>
            <p className="dh-foot">
              Haven't donated yet? <Link href={donateHref}>Donate now</Link>
            </p>
          </form>
        ) : null}

        {step === "code" ? (
          <form className="dh-card" onSubmit={handleVerify} noValidate>
            <p className="dh-notice" aria-live="polite">
              {notice}
            </p>
            <label className="dh-label" htmlFor="dh-code">
              6-digit code
            </label>
            <input
              id="dh-code"
              ref={codeInputRef}
              className="dh-input dh-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={busy}
            />
            {error ? (
              <p className="dh-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="dh-btn" disabled={busy}>
              {busy ? "Checking…" : "View my donations"}
            </button>
            <div className="dh-links">
              <button
                type="button"
                className="dh-link"
                onClick={requestCode}
                disabled={busy || resendIn > 0}
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
              <button type="button" className="dh-link" onClick={startOver} disabled={busy}>
                Use a different email or mobile
              </button>
            </div>
          </form>
        ) : null}

        {step === "list" && history ? (
          <div className="dh-list" ref={listTopRef}>
            <div className="dh-list-head">
              <div>
                <div className="dh-signed-in">
                  Signed in as <strong>{history.email}</strong>
                </div>
                <div className="dh-count">
                  {history.total === 1 ? "1 donation" : `${history.total} donations`}
                </div>
              </div>
              <button type="button" className="dh-btn-secondary" onClick={signOut} disabled={busy}>
                Sign out
              </button>
            </div>

            {error ? (
              <p className="dh-error" role="alert">
                {error}
              </p>
            ) : null}

            {items.length === 0 ? (
              <div className="dh-card dh-empty">
                We couldn't find any completed donations for this email.{" "}
                <Link href={donateHref}>Make a donation</Link>
              </div>
            ) : (
              <div className="dh-table" role="table" aria-label="Your donations">
                <div className="dh-tr dh-thead" role="row">
                  <div role="columnheader">Date</div>
                  <div role="columnheader">Scheme</div>
                  <div role="columnheader">Category</div>
                  <div role="columnheader" className="dh-right">
                    Amount
                  </div>
                  <div role="columnheader">Order ID</div>
                  <div role="columnheader">Receipt</div>
                </div>
                {items.map((item) => {
                  const receipt = receipts[item.orderId] || {};
                  return (
                    <div className="dh-tr" role="row" key={item.orderId}>
                      <div className="dh-td" role="cell" data-label="Date">
                        {formatDate(item.date)}
                      </div>
                      <div className="dh-td dh-td-scheme" role="cell" data-label="Scheme">
                        {item.schemes.length > 0 ? (
                          <ul className="dh-schemes">
                            {item.schemes.map((scheme, index) => (
                              <li key={`${scheme.name}-${index}`}>
                                {scheme.name}
                                {scheme.quantity > 1 ? (
                                  <span className="dh-qty"> × {scheme.quantity}</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          item.purpose || "General donation"
                        )}
                      </div>
                      <div className="dh-td" role="cell" data-label="Category">
                        {item.category || "-"}
                      </div>
                      <div className="dh-td dh-td-amount dh-right" role="cell" data-label="Amount">
                        {formatAmount(item.amount, item.currency)}
                      </div>
                      <div className="dh-td" role="cell" data-label="Order ID">
                        <span className="dh-mono">{item.orderId}</span>
                      </div>
                      <div className="dh-td dh-td-action" role="cell" data-label="Receipt">
                        <button
                          type="button"
                          className="dh-btn-small"
                          onClick={() => emailReceipt(item.orderId)}
                          disabled={receipt.status === "sending"}
                        >
                          {receipt.status === "sending" ? "Sending…" : "Email receipt again"}
                        </button>
                        {receipt.message ? (
                          <span
                            className={receipt.status === "error" ? "dh-receipt-error" : "dh-receipt-ok"}
                            aria-live="polite"
                          >
                            {receipt.message}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {history.totalPages > 1 ? (
              <nav className="dh-pager" aria-label="Donation pages">
                <button
                  type="button"
                  className="dh-btn-secondary"
                  onClick={() => goToPage(history.page - 1)}
                  disabled={busy || history.page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {history.page} of {history.totalPages}
                </span>
                <button
                  type="button"
                  className="dh-btn-secondary"
                  onClick={() => goToPage(history.page + 1)}
                  disabled={busy || history.page >= history.totalPages}
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        .dh-page {
          min-height: 70vh;
          background: #ffffff;
          font-family: "Instrument Sans", system-ui, -apple-system, sans-serif;
          color: #1a1a1a;
        }
        .dh-hero {
          background: linear-gradient(180deg, #fbf8f5 0%, #ffffff 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 56px 16px 40px;
        }
        .dh-hero-inner {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }
        .dh-eyebrow {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a82d2d;
          margin-bottom: 12px;
        }
        .dh-title {
          font-family: "Bricolage Grotesque", system-ui, sans-serif;
          font-size: clamp(28px, 4.2vw, 42px);
          font-weight: 650;
          color: #050505;
          line-height: 1.18;
          margin: 0 0 12px;
        }
        .dh-subtitle {
          font-size: 16px;
          line-height: 1.55;
          color: rgba(5, 5, 5, 0.65);
          margin: 0 auto;
          max-width: 560px;
        }
        .dh-body {
          max-width: 1040px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }
        .dh-card {
          max-width: 460px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 28px 24px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dh-loading {
          text-align: center;
          color: rgba(5, 5, 5, 0.6);
        }
        .dh-label {
          font-weight: 600;
          font-size: 14px;
          color: #050505;
        }
        .dh-input {
          width: 100%;
          border: 1.5px solid rgba(0, 0, 0, 0.16);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 16px;
          font-family: inherit;
          color: #050505;
          background: #ffffff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dh-input:focus {
          outline: none;
          border-color: #a82d2d;
          box-shadow: 0 0 0 3px rgba(168, 45, 45, 0.12);
        }
        .dh-code-input {
          font-size: 24px;
          letter-spacing: 0.4em;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .dh-hint,
        .dh-foot {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(5, 5, 5, 0.6);
          margin: 0;
        }
        .dh-foot a,
        .dh-empty a {
          color: #a82d2d;
          font-weight: 600;
        }
        .dh-notice {
          margin: 0 0 4px;
          font-size: 14px;
          line-height: 1.5;
          color: #1f4d2b;
          background: #eef7f0;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .dh-error {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #a82d2d;
        }
        .dh-btn {
          margin-top: 6px;
          border: none;
          border-radius: 999px;
          background: #a82d2d;
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          padding: 13px 20px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .dh-btn:hover:not(:disabled) {
          background: #8f2525;
        }
        .dh-btn:disabled,
        .dh-btn-secondary:disabled,
        .dh-btn-small:disabled,
        .dh-link:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .dh-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
          margin-top: 4px;
        }
        .dh-link {
          background: none;
          border: none;
          padding: 4px 0;
          color: #a82d2d;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .dh-btn-secondary {
          border: 1.5px solid rgba(0, 0, 0, 0.16);
          border-radius: 999px;
          background: #ffffff;
          color: #050505;
          font-weight: 600;
          font-size: 14px;
          padding: 9px 18px;
          cursor: pointer;
          font-family: inherit;
        }
        .dh-btn-secondary:hover:not(:disabled) {
          border-color: #a82d2d;
          color: #a82d2d;
        }
        .dh-list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .dh-signed-in {
          font-size: 15px;
          color: #050505;
          word-break: break-all;
        }
        .dh-count {
          font-size: 13px;
          color: rgba(5, 5, 5, 0.6);
          margin-top: 2px;
        }
        .dh-empty {
          max-width: none;
          text-align: center;
          display: block;
        }
        .dh-table {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 14px;
          overflow: hidden;
        }
        .dh-tr {
          display: grid;
          grid-template-columns: 110px minmax(0, 2fr) minmax(0, 1fr) 110px minmax(0, 1.3fr) 170px;
          column-gap: 20px;
          row-gap: 12px;
          align-items: start;
          padding: 14px 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.07);
          font-size: 14px;
          line-height: 1.5;
        }
        .dh-thead {
          border-top: none;
          background: #fbf8f5;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(5, 5, 5, 0.6);
        }
        .dh-right {
          text-align: right;
        }
        .dh-td-amount {
          font-weight: 700;
          color: #050505;
          font-variant-numeric: tabular-nums;
        }
        .dh-schemes {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .dh-qty {
          color: rgba(5, 5, 5, 0.6);
          white-space: nowrap;
        }
        .dh-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px;
          word-break: break-all;
        }
        .dh-td-action {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }
        .dh-btn-small {
          border: 1.5px solid #a82d2d;
          border-radius: 999px;
          background: #ffffff;
          color: #a82d2d;
          font-weight: 600;
          font-size: 13px;
          padding: 5px 12px;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
        }
        .dh-btn-small:hover:not(:disabled) {
          background: #a82d2d;
          color: #ffffff;
        }
        .dh-receipt-ok {
          font-size: 12px;
          color: #1f4d2b;
        }
        .dh-receipt-error {
          font-size: 12px;
          color: #a82d2d;
        }
        .dh-pager {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
          font-size: 14px;
          color: rgba(5, 5, 5, 0.7);
        }

        @media (max-width: 860px) {
          .dh-thead {
            display: none;
          }
          .dh-table {
            border: none;
            border-radius: 0;
            overflow: visible;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .dh-tr {
            grid-template-columns: 1fr;
            gap: 8px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 14px;
            padding: 16px;
          }
          .dh-td {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            text-align: right;
          }
          .dh-td::before {
            content: attr(data-label);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: rgba(5, 5, 5, 0.55);
            text-align: left;
            flex-shrink: 0;
            padding-top: 2px;
          }
          .dh-td-action {
            flex-direction: column;
            align-items: stretch;
            text-align: left;
            padding-top: 6px;
            border-top: 1px solid rgba(0, 0, 0, 0.07);
          }
          .dh-td-action::before {
            display: none;
          }
          .dh-btn-small {
            width: 100%;
            padding: 9px 12px;
          }
          .dh-schemes {
            text-align: right;
          }
        }
      `}</style>
    </section>
  );
}
