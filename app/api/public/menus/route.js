import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    await connectDB();
    if (name) {
      const menu = await Menu.findOne({ name }).lean();
      return NextResponse.json(menu || { name, items: [] });
    }
    const menus = await Menu.find().lean();
    return NextResponse.json(menus);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
