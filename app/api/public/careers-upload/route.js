import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CareerSubmission from "@/models/CareerSubmission";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 8 });
export const dynamic = "force-dynamic";

const CAREER_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "careers");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // Fallback for some browsers
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
    let position = "General Application";
    let qualification = "";
    let experience = "";
    let currentCity = "";
    let coverLetter = "";
    let page = "";
    let source = "careers-upload";
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
      
      const honeypot = normalizeText(formData.get("website") || formData.get("careersTrap"));
      if (honeypot) {
        return NextResponse.json({ error: "Invalid submission. Please try again." }, { status: 400 });
      }

      fullName = normalizeText(formData.get("fullName") || formData.get("name"));
      email = normalizeText(formData.get("email")).toLowerCase();
      phone = normalizeText(formData.get("phone"));
      position = normalizeText(formData.get("position") || "General Application");
      qualification = normalizeText(formData.get("qualification"));
      experience = normalizeText(formData.get("experience"));
      currentCity = normalizeText(formData.get("currentCity") || formData.get("city"));
      coverLetter = normalizeText(formData.get("coverLetter") || formData.get("message"));
      page = normalizeText(formData.get("page"));
      source = normalizeText(formData.get("source") || "careers-upload");

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

        await fs.mkdir(CAREER_UPLOAD_DIR, { recursive: true });
        const cleanBase = sanitizeBaseFilename(path.basename(originalName, ext));
        const safeFilename = `${cleanBase}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
        const targetPath = path.join(CAREER_UPLOAD_DIR, safeFilename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(targetPath, buffer);

        resumeMeta = {
          filename: safeFilename,
          originalName,
          mimeType,
          size: file.size,
          storagePath: `/uploads/careers/${safeFilename}`,
          url: `/uploads/careers/${safeFilename}`,
        };
      }
    } else {
      const body = await req.json();
      const honeypot = normalizeText(body?.website || body?.careersTrap);
      if (honeypot) {
        return NextResponse.json({ error: "Invalid submission. Please try again." }, { status: 400 });
      }

      fullName = normalizeText(body?.fullName || body?.name);
      email = normalizeText(body?.email).toLowerCase();
      phone = normalizeText(body?.phone);
      position = normalizeText(body?.position || "General Application");
      qualification = normalizeText(body?.qualification);
      experience = normalizeText(body?.experience);
      currentCity = normalizeText(body?.currentCity || body?.city);
      coverLetter = normalizeText(body?.coverLetter || body?.message);
      page = normalizeText(body?.page);
      source = normalizeText(body?.source || "careers-upload");
    }

    if (!fullName) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: "A valid phone number (10-15 digits) is required." }, { status: 400 });
    }

    await connectDB();
    const submission = await CareerSubmission.create({
      fullName,
      email,
      phone,
      position,
      qualification,
      experience,
      currentCity,
      coverLetter,
      resume: resumeMeta,
      page,
      sourcePage: page,
      source,
    });

    return NextResponse.json(
      {
        success: true,
        id: String(submission._id),
        message: "Thank you! Your application and CV have been received successfully.",
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    console.error("[CareersUpload POST error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit application. Please try again." },
      { status: 500 },
    );
  }
}
