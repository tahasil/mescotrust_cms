import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { hash } from "bcryptjs";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).populate("roleId", "name slug").lean();
  return NextResponse.json(users.map((u) => ({ ...u, id: String(u._id) })));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { name: string; email: string; password: string; roleId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  const existing = await User.findOne({ email: body.email.trim() }).lean();
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }
  const hashed = await hash(body.password || "changeme", 10);
  const user = await User.create({
    name: body.name?.trim() || "User",
    email: body.email.trim(),
    password: hashed,
    roleId: body.roleId || undefined,
    status: "active",
  });
  const populated = await User.findById(user._id).populate("roleId").lean();
  return NextResponse.json(populated);
}
