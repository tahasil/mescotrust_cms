import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Redirect } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await Redirect.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(list.map((r) => ({ ...r, id: String(r._id) })));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { fromPath: string; toPath: string; statusCode?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const redirect = await Redirect.create({
    fromPath: body.fromPath?.trim() ?? "",
    toPath: body.toPath?.trim() ?? "",
    statusCode: body.statusCode ?? 301,
  });
  return NextResponse.json(redirect);
}
