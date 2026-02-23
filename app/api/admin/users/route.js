import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isAdmin } from "@/lib/permissions";

function guardAdmin(session) {
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const { name, email, password, role, status } = body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: "Name, email, and password (min 6 chars) required" }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: role === "Admin" ? "Admin" : "Editor",
      status: status === "inactive" ? "inactive" : "active",
    });
    const out = await User.findById(user._id).select("-password").lean();
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
