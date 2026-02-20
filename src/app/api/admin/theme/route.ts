import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { ThemeSettings } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let theme = await ThemeSettings.findOne().lean();
  if (!theme) {
    const created = await ThemeSettings.create({});
    theme = created.toObject();
  }
  return NextResponse.json(theme);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { primaryColor?: string; secondaryColor?: string; headingFont?: string; bodyFont?: string; borderRadius?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  let theme = await ThemeSettings.findOne().lean();
  if (!theme) {
    await ThemeSettings.create({});
  }
  await ThemeSettings.updateOne(
    {},
    {
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
      ...(body.headingFont !== undefined && { headingFont: body.headingFont }),
      ...(body.bodyFont !== undefined && { bodyFont: body.bodyFont }),
      ...(body.borderRadius !== undefined && { borderRadius: body.borderRadius }),
    },
    { upsert: true }
  );
  const updated = await ThemeSettings.findOne().lean();
  return NextResponse.json(updated);
}
