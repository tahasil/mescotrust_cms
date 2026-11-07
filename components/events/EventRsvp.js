"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  ATTENDANCE_OPTIONS,
  SEAT_ATTENDANCE,
  getAttendanceLabel,
} from "@/lib/events/rsvp";

const Root = styled.div`
  margin-top: 18px;

  .rsvp-heading {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: 700;
    color: var(--event-detail-ink, #2a283e);
  }

  .rsvp-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .rsvp-option {
    min-height: 44px;
    border: 1px solid var(--event-detail-border, rgba(42, 40, 62, 0.14));
    border-radius: 8px;
    background: #ffffff;
    color: var(--event-detail-ink, #2a283e);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .rsvp-option:hover:not(:disabled) {
    border-color: var(--event-detail-button-bg, #2a283e);
  }

  .rsvp-option[aria-pressed="true"] {
    background: var(--event-detail-button-bg, #2a283e);
    border-color: var(--event-detail-button-bg, #2a283e);
    color: var(--event-detail-button-text, #ffffff);
  }

  .rsvp-option:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .rsvp-note {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--event-detail-muted, rgba(42, 40, 62, 0.66));
  }

  .rsvp-form {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .rsvp-field label {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--event-detail-ink, #2a283e);
  }

  .rsvp-field input {
    width: 100%;
    min-height: 42px;
    padding: 8px 12px;
    border: 1px solid var(--event-detail-border, rgba(42, 40, 62, 0.14));
    border-radius: 8px;
    background: #ffffff;
    color: var(--event-detail-ink, #2a283e);
    /* 16px stops iOS zooming the page when a field is focused. */
    font: inherit;
    font-size: 16px;
  }

  .rsvp-field input:read-only {
    background: var(--event-detail-surface, #f2f0ea);
  }

  .rsvp-trap {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .rsvp-submit {
    min-height: 46px;
    border: none;
    border-radius: 8px;
    background: var(--event-detail-accent, #e03c33);
    color: #ffffff;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .rsvp-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rsvp-error {
    margin: 0;
    font-size: 13px;
    color: #b91c1c;
  }

  .rsvp-done {
    padding: 14px;
    border-radius: 8px;
    background: var(--event-detail-surface, #f2f0ea);
    font-size: 14px;
    line-height: 1.5;
    color: var(--event-detail-ink, #2a283e);
  }

  .rsvp-done p {
    margin: 0;
  }

  .rsvp-done p + p {
    margin-top: 6px;
  }

  .rsvp-link {
    display: inline-block;
    margin-top: 10px;
    font-weight: 600;
    color: var(--event-detail-accent, #e03c33);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const DONE_MESSAGES = {
  yes: "Your attendance is confirmed.",
  maybe: "We've noted your reply as Maybe and kept a seat for you.",
  no: "We've noted that you can't attend. Thank you for letting us know.",
};

export default function EventRsvp({ slug }) {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState("");
  const [attendance, setAttendance] = useState("");
  const [fields, setFields] = useState({ name: "", email: "", phone: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const linkToken = new URLSearchParams(window.location.search).get("rsvp") || "";
    const query = new URLSearchParams({ slug });
    if (linkToken) query.set("token", linkToken);

    fetch(`/api/public/event-rsvp?${query}`, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
      .then((data) => {
        setStatus(data);
        if (data.reply) {
          setToken(linkToken);
          setAttendance(data.reply.attendance);
          setFields((prev) => ({
            ...prev,
            name: data.reply.name || "",
            email: data.reply.email || "",
            phone: data.reply.phone || "",
          }));
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setStatus({ loadFailed: true });
      });

    return () => controller.abort();
  }, [slug]);

  if (!status) return null;

  if (status.loadFailed) {
    return (
      <Root>
        <p className="rsvp-note">RSVP is unavailable right now. Please reload the page to try again.</p>
      </Root>
    );
  }

  if (!status.enabled) return null;

  if (!status.open) {
    return (
      <Root>
        <p className="rsvp-note">RSVP for this event has closed.</p>
      </Root>
    );
  }

  if (done) {
    const calendarHref = `/api/public/event-rsvp/calendar?slug=${encodeURIComponent(slug)}`;
    return (
      <Root>
        <div className="rsvp-done" role="status">
          {done.status === "already_replied" ? (
            <p>You've already replied to this event. We've emailed you a link to change your reply.</p>
          ) : (
            <>
              <p>
                <strong>Thanks{fields.name ? `, ${fields.name}` : ""}.</strong>{" "}
                {DONE_MESSAGES[done.attendance]}
              </p>
              <p>We've emailed you a confirmation with a link to change your reply.</p>
              {SEAT_ATTENDANCE.includes(done.attendance) ? (
                <a className="rsvp-link" href={calendarHref}>
                  Add to calendar
                </a>
              ) : null}
            </>
          )}
        </div>
      </Root>
    );
  }

  const isChanging = Boolean(token);
  const holdsSeatNow = SEAT_ATTENDANCE.includes(status.reply?.attendance);
  const seatsUnavailable = status.full && !holdsSeatNow;

  const updateField = (key) => (event) =>
    setFields((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/event-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, attendance, token, ...fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "full") {
          setStatus((prev) => ({ ...prev, full: true }));
          setAttendance("");
        }
        if (data.code === "closed") setStatus((prev) => ({ ...prev, open: false }));
        setError(data.error || "Could not save your reply. Please try again.");
        return;
      }
      setDone({ status: data.status, attendance });
    } catch {
      setError("Could not save your reply. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Root>
      <h3 className="rsvp-heading" id="event-rsvp-heading">
        {isChanging ? "Change your reply" : "Will you attend?"}
      </h3>
      <div className="rsvp-options" role="group" aria-labelledby="event-rsvp-heading">
        {ATTENDANCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="rsvp-option"
            aria-pressed={attendance === option.value}
            disabled={seatsUnavailable && SEAT_ATTENDANCE.includes(option.value)}
            onClick={() => {
              setAttendance(option.value);
              setError("");
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {status.tokenInvalid ? (
        <p className="rsvp-note">
          That link is no longer valid. You can reply again below with the same email.
        </p>
      ) : null}
      {seatsUnavailable ? (
        <p className="rsvp-note">This event is full. You can still let us know if you can't make it.</p>
      ) : null}

      {attendance ? (
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <div className="rsvp-field">
            <label htmlFor="event-rsvp-name">Name</label>
            <input
              id="event-rsvp-name"
              value={fields.name}
              onChange={updateField("name")}
              autoComplete="name"
              maxLength={120}
              required
            />
          </div>
          <div className="rsvp-field">
            <label htmlFor="event-rsvp-email">Email</label>
            <input
              id="event-rsvp-email"
              type="email"
              value={fields.email}
              onChange={updateField("email")}
              autoComplete="email"
              readOnly={isChanging}
              required
            />
          </div>
          <div className="rsvp-field">
            <label htmlFor="event-rsvp-phone">Phone (optional)</label>
            <input
              id="event-rsvp-phone"
              type="tel"
              value={fields.phone}
              onChange={updateField("phone")}
              autoComplete="tel"
              maxLength={30}
            />
          </div>
          <div className="rsvp-trap" aria-hidden="true">
            <label htmlFor="event-rsvp-website">Website</label>
            <input
              id="event-rsvp-website"
              tabIndex={-1}
              autoComplete="off"
              value={fields.website}
              onChange={updateField("website")}
            />
          </div>
          {error ? (
            <p className="rsvp-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="rsvp-submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : isChanging
                ? `Update reply to ${getAttendanceLabel(attendance)}`
                : `Reply ${getAttendanceLabel(attendance)}`}
          </button>
        </form>
      ) : error ? (
        <p className="rsvp-error" role="alert">
          {error}
        </p>
      ) : null}
    </Root>
  );
}
