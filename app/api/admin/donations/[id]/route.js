import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const donation = await DonateNowSubmission.findById(id).lean();
    if (!donation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(donation);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
