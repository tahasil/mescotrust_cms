import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Menu, MenuItem } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const menus = await Menu.find().sort({ name: 1 }).lean();
  const withItems = await Promise.all(
    menus.map(async (m) => {
      const items = await MenuItem.find({ menuId: m._id, parentId: null }).sort({ order: 1 }).lean();
      return { ...m, id: String(m._id), items: items.map((i) => ({ ...i, id: String(i._id) })) };
    })
  );
  return NextResponse.json(withItems);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { name: string; location: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const menu = await Menu.create({
    name: body.name?.trim() || "Menu",
    location: body.location?.trim() || "header",
    type: body.type ?? "normal",
  });
  return NextResponse.json(menu);
}
