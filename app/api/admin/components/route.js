import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const components = await Component.find().sort({ category: 1, name: 1 }).lean();
    return NextResponse.json(components);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, displayName, type, category, baseComponent, propsSchema, defaultProps, active } = body;

    await connectDB();
    const component = await Component.create({
      name: name || "Unnamed",
      displayName: displayName || name || "",
      type: type || "custom",
      category: category || "",
      baseComponent: baseComponent || name || "Paragraph",
      propsSchema: propsSchema || [],
      defaultProps: defaultProps || {},
      active: active !== false,
    });
    return NextResponse.json(component);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
