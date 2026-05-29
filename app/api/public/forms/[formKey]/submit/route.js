import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";

function toSafeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getRequestIp(req) {
  const xff = req.headers.get("x-forwarded-for") || "";
  if (xff) return String(xff.split(",")[0] || "").trim();
  return req.headers.get("x-real-ip") || "";
}

export async function POST(req, { params }) {
  try {
    const formKey = String(params?.formKey || "").trim();
    if (!formKey) {
      return NextResponse.json({ error: "Form key is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const payload = toSafeObject(body?.payload);

    await connectDB();
    const form = await Form.findOne({ formKey, isActive: true });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    form.submissions.push({
      payload,
      source: String(body?.source || "").trim(),
      page: String(body?.page || "").trim(),
      ip: getRequestIp(req),
      userAgent: String(req.headers.get("user-agent") || "").trim(),
      isRead: false,
      submittedAt: new Date(),
    });
    await form.save();

    return NextResponse.json({
      success: true,
      message: String(form?.successMessage || "").trim() || "Form submitted successfully",
      data: { formKey, submissionId: form.submissions[form.submissions.length - 1]?._id || null },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Submission failed" }, { status: 500 });
  }
}
