import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogComment from "@/models/BlogComment";

/** GET — comment counts per blogId (for listing page) */
export async function GET() {
  try {
    await connectDB();
    const counts = await BlogComment.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$blogId", count: { $sum: 1 } } },
    ]);
    const map = {};
    counts.forEach((c) => { map[String(c._id)] = c.count; });
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({});
  }
}
