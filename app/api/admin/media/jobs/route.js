import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import MediaJob from "@/models/MediaJob";
import { enqueueMediaJob } from "@/lib/media/queue";
import { runMediaJob } from "@/lib/media/jobsRunner";

const ALLOWED_JOB_TYPES = [
  "bulk_optimize",
  "regenerate_sizes",
  "convert_formats",
];

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const jobs = await MediaJob.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ items: jobs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const jobType = String(body.jobType || "bulk_optimize");
    if (!ALLOWED_JOB_TYPES.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Allowed: ${ALLOWED_JOB_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    await connectDB();
    const job = await MediaJob.create({
      jobType,
      status: "queued",
      createdBy: session.email || session.name || "",
    });

    enqueueMediaJob(String(job._id), runMediaJob);
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
