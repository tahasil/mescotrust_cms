import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const locale = searchParams.get("locale");
    await connectDB();
    if (name) {
      const filter = { name };
      if (locale) filter.locale = locale;
      const menu = await Menu.findOne(filter).lean();
      return NextResponse.json(menu || { name, items: [] });
    }
    const filter = {};
    if (locale) filter.locale = locale;
    const menus = await Menu.find(filter).lean();
    return NextResponse.json(menus);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
