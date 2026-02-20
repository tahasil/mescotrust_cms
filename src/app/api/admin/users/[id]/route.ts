import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { User, Role } from "@/models";
import { hash } from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).populate("roleId").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { name?: string; email?: string; password?: string; roleId?: string | null; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const user = await User.findById(id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email.trim();
  if (body.roleId !== undefined) data.roleId = body.roleId || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.password && body.password.length > 0) {
    data.password = await hash(body.password, 10);
  }

  await User.updateOne({ _id: id }, data);
  const updated = await User.findById(id).populate("roleId").lean();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const superAdminRole = await Role.findOne({ slug: "super_admin" }).lean() as { _id: unknown } | null;
  if (superAdminRole) {
    const adminCount = await User.countDocuments({
      roleId: superAdminRole._id,
      status: "active",
    });
    const user = await User.findById(id).populate("roleId").lean() as { roleId?: { slug?: string } | null } | null;
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const role = user.roleId as { slug?: string } | null;
    if (role?.slug === "super_admin" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin" },
        { status: 400 }
      );
    }
  }
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
