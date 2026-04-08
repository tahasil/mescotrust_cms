import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogComment from "@/models/BlogComment";

/** GET — comment counts + optional recent comments */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const recent = Number(searchParams.get("recent")) || 0;

    await connectDB();

    // If requesting recent comments
    if (recent > 0) {
      const comments = await BlogComment.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(recent)
        .populate("blogId", "title slug")
        .lean();
      const recentComments = comments.map((c) => ({
        _id: c._id,
        name: c.name,
        blogTitle: c.blogId?.title || "",
        blogSlug: c.blogId?.slug || "",
        createdAt: c.createdAt,
      }));
      return NextResponse.json({ recent: recentComments });
    }

    // Default: return counts per blogId
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
