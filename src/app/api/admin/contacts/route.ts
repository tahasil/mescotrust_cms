import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { ContactSubmission } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await ContactSubmission.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(list.map((s) => ({ ...s, id: String(s._id) })));
}
