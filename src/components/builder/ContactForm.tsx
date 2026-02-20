"use client";

import { useState } from "react";

type ContactFormProps = {
  title?: string;
  className?: string;
};

export function ContactFormBlock({ title = "Contact us", className = "" }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      setStatus("done");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className={`rounded border border-green-200 bg-green-50 p-4 ${className}`}>
        <p className="text-green-800">Thank you. Your message has been sent.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <textarea
          placeholder="Message"
          value={formData.message}
          onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
          className="w-full rounded border px-3 py-2"
          rows={4}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "loading" ? "Sending…" : "Send"}
        </button>
        {status === "error" && <p className="text-sm text-red-600">Something went wrong. Try again.</p>}
      </form>
    </div>
  );
}
