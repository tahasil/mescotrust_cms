import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { menuId: string; label: string; url: string; openInNewTab?: boolean; parentId?: string | null; order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const count = await MenuItem.countDocuments({ menuId: body.menuId, parentId: body.parentId ?? null });
  const order = body.order ?? count;
  const item = await MenuItem.create({
    menuId: body.menuId,
    label: body.label?.trim() || "Item",
    url: body.url?.trim() || "#",
    openInNewTab: body.openInNewTab ?? false,
    parentId: body.parentId || null,
    order,
  });
  return NextResponse.json(item);
}
