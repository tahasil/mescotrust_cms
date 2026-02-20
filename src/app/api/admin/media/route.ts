import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Media } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await Media.find().sort({ uploadedAt: -1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { fileName: string; fileUrl: string; fileType: string; altText?: string; folder?: string; size?: number; width?: number; height?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  const ext = body.fileName?.toLowerCase().slice(-5).includes(".") ? body.fileName.toLowerCase().split(".").pop() : "";
  if (body.fileType?.startsWith("image/") && ext && !allowed.includes(`.${ext}`)) {
    return NextResponse.json({ error: "Allowed image formats: png, jpg, jpeg, webp, gif" }, { status: 400 });
  }
  const media = await Media.create({
    fileName: body.fileName ?? "file",
    fileUrl: body.fileUrl ?? "",
    fileType: body.fileType ?? "application/octet-stream",
    altText: body.altText ?? null,
    folder: body.folder ?? null,
    size: body.size ?? null,
    width: body.width ?? null,
    height: body.height ?? null,
  });
  return NextResponse.json(media);
}
