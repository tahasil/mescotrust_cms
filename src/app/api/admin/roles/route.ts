import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Role, User } from "@/models";
import { toSlug } from "@/utils/slug";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const roles = await Role.find().sort({ name: 1 }).lean();
  const withCount = await Promise.all(
    roles.map(async (r) => ({
      ...r,
      _count: { users: await User.countDocuments({ roleId: r._id }) },
    }))
  );
  return NextResponse.json(withCount);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { name: string; slug?: string; description?: string; permissions?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.name || "role");
  const existing = await Role.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  const role = await Role.create({
    name: body.name?.trim() || "Role",
    slug,
    description: body.description?.trim() || null,
    permissions: body.permissions ?? [],
  });
  return NextResponse.json(role);
}
