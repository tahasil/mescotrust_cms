import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import MediaJob from "@/models/MediaJob";

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const id = params.jobId;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  try {
    await connectDB();
    const job = await MediaJob.findById(id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (["completed", "failed", "cancelled"].includes(job.status)) {
      return NextResponse.json(job);
    }

    job.status = "cancelled";
    job.endedAt = new Date();
    await job.save();
    return NextResponse.json(job);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
