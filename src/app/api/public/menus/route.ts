import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Menu, MenuItem } from "@/models";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");
  const query = location ? { location } : {};
  const menus = await Menu.find(query).lean();
  const withItems = await Promise.all(
    menus.map(async (m) => {
      const items = await MenuItem.find({ menuId: m._id, parentId: null })
        .sort({ order: 1 })
        .lean();
      const withChildren = await Promise.all(
        items.map(async (item) => {
          const children = await MenuItem.find({ parentId: item._id }).sort({ order: 1 }).lean();
          return { ...item, children };
        })
      );
      return { ...m, items: withChildren };
    })
  );
  return NextResponse.json(withItems);
}
