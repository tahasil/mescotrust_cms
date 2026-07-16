import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isAdmin, isSuperAdmin, isSuperAdminEmail } from "@/lib/permissions";

const ALLOWED_ROLES = new Set(["Admin", "Editor", "Author"]);
const ALLOWED_STATUSES = new Set(["active", "inactive"]);

function isHiddenFromNonSuperAdmin(targetUser) {
  if (!targetUser || typeof targetUser !== "object") return false;
  return isSuperAdminEmail(targetUser.email);
}

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
    if (!isSuperAdmin(session) && isHiddenFromNonSuperAdmin(user)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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
    const actorIsSuperAdmin = isSuperAdmin(session);
    if (!actorIsSuperAdmin && isHiddenFromNonSuperAdmin(user)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const targetIsSuperAdmin = isSuperAdminEmail(user.email);

    if (targetIsSuperAdmin && !actorIsSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin account can only be managed by Super Admin" },
        { status: 403 },
      );
    }

    if (role !== undefined && !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const adminCount = await User.countDocuments({ role: "Admin" });
    if (role !== undefined && role !== "Admin" && user.role === "Admin" && adminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the last Admin" }, { status: 400 });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (targetIsSuperAdmin && trimmed !== user.email) {
        return NextResponse.json(
          { error: "Super Admin email cannot be changed" },
          { status: 400 },
        );
      }
      if (trimmed !== user.email) {
        const dup = await User.findOne({ email: trimmed, _id: { $ne: id } });
        if (dup) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
      }
      user.email = trimmed;
    }
    if (targetIsSuperAdmin) {
      if (role !== undefined && role !== "Admin") {
        return NextResponse.json(
          { error: "Super Admin role cannot be changed" },
          { status: 400 },
        );
      }
      if (status !== undefined && status !== "active") {
        return NextResponse.json(
          { error: "Super Admin cannot be deactivated" },
          { status: 400 },
        );
      }
    }
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (password && password.length >= 6) user.password = await bcrypt.hash(password, 10);
    if (targetIsSuperAdmin) {
      user.role = "Admin";
      user.status = "active";
    }
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
    const actorIsSuperAdmin = isSuperAdmin(session);
    if (!actorIsSuperAdmin && isHiddenFromNonSuperAdmin(user)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const targetIsSuperAdmin = isSuperAdminEmail(user.email);
    if (targetIsSuperAdmin) {
      if (!actorIsSuperAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Super Admin account can only be managed by Super Admin" },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "Super Admin account cannot be deleted" },
        { status: 400 },
      );
    }
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
