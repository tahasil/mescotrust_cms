"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { message } from "antd";
import { submitContact } from "@/app/actions/contact";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "8px 24px",
        backgroundColor: "var(--primary-color, #1890ff)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 14,
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.65 : 1,
      }}
    >
      {pending ? "Sending…" : "Send"}
    </button>
  );
}

export default function ContactForm({ page, source }) {
  const [state, formAction] = useFormState(submitContact, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      message.success("Message sent. We will get back to you soon.");
      formRef.current?.reset();
    } else if (state.error) {
      message.error(state.error);
    }
  }, [state]);

  const fieldStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 6,
    fontSize: 14,
    lineHeight: 1.5,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
    fontSize: 14,
  };

  return (
    <form ref={formRef} action={formAction} style={{ maxWidth: 480 }}>
      <input type="hidden" name="page" value={page || ""} />
      <input type="hidden" name="source" value={source || ""} />

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="contact-name" style={labelStyle}>
          Name <span style={{ color: "#ff4d4f" }}>*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          required
          style={fieldStyle}
          placeholder="Your name"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="contact-email" style={labelStyle}>
          Email <span style={{ color: "#ff4d4f" }}>*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          style={fieldStyle}
          placeholder="you@example.com"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="contact-message" style={labelStyle}>
          Message <span style={{ color: "#ff4d4f" }}>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          style={{ ...fieldStyle, resize: "vertical" }}
          placeholder="How can we help?"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
