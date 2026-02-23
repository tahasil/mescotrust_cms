import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const count = await Page.countDocuments({ "layout.componentId": id });
    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
