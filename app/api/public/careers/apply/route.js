import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/db";
import CareerApplication from "@/models/CareerApplication";
import { isValidEmail, isValidPhone, normalizeText } from "@/lib/formValidation";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let jobTitle = "";
    let jobId = "";
    let name = "";
    let email = "";
    let phone = "";
    let experience = "";
    let currentOrganization = "";
    let coverLetter = "";
    let resumeUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      jobTitle = normalizeText(formData.get("jobTitle"));
      jobId = normalizeText(formData.get("jobId"));
      name = normalizeText(formData.get("name"));
      email = normalizeText(formData.get("email")).toLowerCase();
      phone = normalizeText(formData.get("phone"));
      experience = normalizeText(formData.get("experience"));
      currentOrganization = normalizeText(formData.get("currentOrganization"));
      coverLetter = normalizeText(formData.get("coverLetter"));

      const file = formData.get("resume");
      if (file && typeof file === "object" && file.name) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name).toLowerCase() || ".pdf";
        const allowedExts = [".pdf", ".doc", ".docx"];
        if (!allowedExts.includes(ext)) {
          return NextResponse.json(
            { error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." },
            { status: 400 }
          );
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
        await mkdir(uploadDir, { recursive: true });
        const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        const filePath = path.join(uploadDir, safeFileName);
        await writeFile(filePath, buffer);
        resumeUrl = `/uploads/resumes/${safeFileName}`;
      } else {
        resumeUrl = normalizeText(formData.get("resumeUrl"));
      }
    } else {
      const body = await req.json();
      jobTitle = normalizeText(body?.jobTitle);
      jobId = normalizeText(body?.jobId);
      name = normalizeText(body?.name);
      email = normalizeText(body?.email).toLowerCase();
      phone = normalizeText(body?.phone);
      experience = normalizeText(body?.experience);
      currentOrganization = normalizeText(body?.currentOrganization);
      coverLetter = normalizeText(body?.coverLetter);
      resumeUrl = normalizeText(body?.resumeUrl);
    }

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }
    if (!resumeUrl) {
      return NextResponse.json({ error: "Please upload your resume (PDF/DOC)." }, { status: 400 });
    }

    await connectDB();
    const application = await CareerApplication.create({
      jobTitle,
      jobId,
      name,
      email,
      phone,
      experience,
      currentOrganization,
      resumeUrl,
      coverLetter,
      status: "new",
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully!",
      applicationId: application._id,
    });
  } catch (err) {
    console.error("Career application error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
