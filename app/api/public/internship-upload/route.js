import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InternshipSubmission from "@/models/InternshipSubmission";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 8 });
export const dynamic = "force-dynamic";

const INTERNSHIP_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "internships");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function sanitizeBaseFilename(name) {
  return normalizeText(name || "resume")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function POST(req) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let fullName = "";
    let email = "";
    let phone = "";
    let roleTitle = "General Internship";
    let department = "";
    let customRole = "";
    let roleCategory = "ActiveRole";
    let skills = "";
    let workMode = "Not specified";
    let duration = "";
    let startDate = "";
    let currentCity = "";
    let statement = "";
    let page = "";
    let source = "internship-upload";
    let resumeMeta = {
      filename: "",
      originalName: "",
      mimeType: "",
      size: 0,
      storagePath: "",
      url: "",
    };

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const honeypot = normalizeText(formData.get("website") || formData.get("internshipTrap"));
      if (honeypot) {
        return NextResponse.json({ error: "Invalid submission. Please try again." }, { status: 400 });
      }

      fullName = normalizeText(formData.get("fullName") || formData.get("name"));
      email = normalizeText(formData.get("email")).toLowerCase();
      phone = normalizeText(formData.get("phone"));
      roleTitle = normalizeText(formData.get("roleTitle") || formData.get("position") || "General Internship");
      department = normalizeText(formData.get("department"));
      customRole = normalizeText(formData.get("customRole") || formData.get("customPosition"));
      roleCategory = normalizeText(formData.get("roleCategory") || (customRole ? "Other" : "ActiveRole"));
      skills = normalizeText(formData.get("skills") || formData.get("qualification"));
      workMode = normalizeText(formData.get("workMode") || "Not specified");
      duration = normalizeText(formData.get("duration"));
      startDate = normalizeText(formData.get("startDate"));
      currentCity = normalizeText(formData.get("currentCity") || formData.get("city"));
      statement = normalizeText(formData.get("statement") || formData.get("coverLetter") || formData.get("message"));
      page = normalizeText(formData.get("page"));
      source = normalizeText(formData.get("source") || "internship-upload");

      const file = formData.get("resume") || formData.get("file");
      if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
        const originalName = normalizeText(file.name || "resume.pdf");
        const ext = path.extname(originalName).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            { error: "Invalid resume format. Only PDF, DOC, and DOCX files are allowed." },
            { status: 400 },
          );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "Resume file size exceeds the 5MB limit." },
            { status: 400 },
          );
        }

        const mimeType = file.type || "application/pdf";
        if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
          return NextResponse.json(
            { error: "Invalid file type. Please upload a valid PDF or Word document." },
            { status: 400 },
          );
        }

        await fs.mkdir(INTERNSHIP_UPLOAD_DIR, { recursive: true });
        const cleanBase = sanitizeBaseFilename(path.basename(originalName, ext));
        const safeFilename = `${cleanBase}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
        const targetPath = path.join(INTERNSHIP_UPLOAD_DIR, safeFilename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(targetPath, buffer);

        resumeMeta = {
          filename: safeFilename,
          originalName,
          mimeType,
          size: file.size,
          storagePath: `/uploads/internships/${safeFilename}`,
          url: `/uploads/internships/${safeFilename}`,
        };
      }
    } else {
      const body = await req.json();
      const honeypot = normalizeText(body?.website || body?.internshipTrap);
      if (honeypot) {
        return NextResponse.json({ error: "Invalid submission. Please try again." }, { status: 400 });
      }

      fullName = normalizeText(body?.fullName || body?.name);
      email = normalizeText(body?.email).toLowerCase();
      phone = normalizeText(body?.phone);
      roleTitle = normalizeText(body?.roleTitle || body?.position || "General Internship");
      department = normalizeText(body?.department);
      customRole = normalizeText(body?.customRole || body?.customPosition);
      roleCategory = normalizeText(body?.roleCategory || (customRole ? "Other" : "ActiveRole"));
      skills = normalizeText(body?.skills || body?.qualification);
      workMode = normalizeText(body?.workMode || "Not specified");
      duration = normalizeText(body?.duration);
      startDate = normalizeText(body?.startDate);
      currentCity = normalizeText(body?.currentCity || body?.city);
      statement = normalizeText(body?.statement || body?.coverLetter || body?.message);
      page = normalizeText(body?.page);
      source = normalizeText(body?.source || "internship-upload");
    }

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 },
      );
    }
    if (!roleTitle) {
      return NextResponse.json(
        { error: "Please select an internship role / department." },
        { status: 400 },
      );
    }
    if (roleTitle.toLowerCase() === "other" && !customRole) {
      return NextResponse.json(
        { error: "Please specify your preferred role / department." },
        { status: 400 },
      );
    }

    await connectDB();

    const finalRole = roleTitle.toLowerCase() === "other" ? customRole : roleTitle;
    const finalRoleCategory = roleTitle.toLowerCase() === "other" || customRole ? "Other" : "ActiveRole";

    const submission = await InternshipSubmission.create({
      fullName,
      email,
      phone,
      roleTitle: finalRole,
      department,
      customRole,
      roleCategory: finalRoleCategory,
      skills,
      workMode,
      duration,
      startDate,
      currentCity,
      statement,
      resume: resumeMeta,
      status: "new",
      isRead: false,
      sourcePage: page,
      source,
    });

    const ref = `INT-${Date.now().toString().slice(-6)}-${String(submission._id).slice(-4).toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        id: submission._id,
        reference: ref,
        message: "Thank you! Your internship application has been received successfully.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[InternshipUpload POST error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process internship application. Please try again." },
      { status: 500 },
    );
  }
}

