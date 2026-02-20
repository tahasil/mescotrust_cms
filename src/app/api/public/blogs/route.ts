import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { status: "published" };
  if (category) where.categoryId = category;
  const [posts, total] = await Promise.all([
    BlogPost.find(where)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("id slug title excerpt publishedAt categoryId")
      .populate("categoryId", "id name slug")
      .lean(),
    BlogPost.countDocuments(where),
  ]);
  return NextResponse.json({ posts, total, page, limit });
}
