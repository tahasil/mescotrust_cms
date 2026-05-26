import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isAdmin } from "@/lib/permissions";

const ALLOWED_ROLES = new Set(["Admin", "Editor", "Author"]);

function guardAdmin(session) {
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const user = await User.findById(id).select("-password").lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const { name, email, role, status, password } = body;
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (role !== undefined && !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const adminCount = await User.countDocuments({ role: "Admin" });
    if (role !== undefined && role !== "Admin" && user.role === "Admin" && adminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the last Admin" }, { status: 400 });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (trimmed !== user.email) {
        const dup = await User.findOne({ email: trimmed, _id: { $ne: id } });
        if (dup) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
      }
      user.email = trimmed;
    }
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (password && password.length >= 6) user.password = await bcrypt.hash(password, 10);
    await user.save();
    const out = await User.findById(id).select("-password").lean();
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last Admin" }, { status: 400 });
      }
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
