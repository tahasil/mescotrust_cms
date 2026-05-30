import mongoose from "mongoose";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { canAccessFormBuilder } from "@/lib/formBuilder/permissions";
import SubmissionFile from "@/models/SubmissionFile";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const fileId = params.fileId;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return NextResponse.json({ error: "Invalid fileId" }, { status: 400 });
    }

    const fileDoc = await SubmissionFile.findById(fileId).lean();
    if (!fileDoc) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const data = await readFile(fileDoc.storagePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": fileDoc.mimeType || "application/octet-stream",
        "Content-Length": String(data.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          fileDoc.originalName || fileDoc.fileName || "download",
        )}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "File no longer exists on disk" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to download file" },
      { status: 500 },
    );
  }
}

