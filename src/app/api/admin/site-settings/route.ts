import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    const created = await SiteSettings.create({});
    settings = created.toObject();
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: {
    headerLogoUrl?: string;
    headerMenuId?: string | null;
    headerTagline?: string;
    headerSticky?: boolean;
    footerCopyright?: string;
    footerMenuId?: string | null;
    custom404PageId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  await SiteSettings.updateOne(
    {},
    {
      ...(body.headerLogoUrl !== undefined && { headerLogoUrl: body.headerLogoUrl }),
      ...(body.headerMenuId !== undefined && { headerMenuId: body.headerMenuId }),
      ...(body.headerTagline !== undefined && { headerTagline: body.headerTagline }),
      ...(body.headerSticky !== undefined && { headerSticky: body.headerSticky }),
      ...(body.footerCopyright !== undefined && { footerCopyright: body.footerCopyright }),
      ...(body.footerMenuId !== undefined && { footerMenuId: body.footerMenuId }),
      ...(body.custom404PageId !== undefined && { custom404PageId: body.custom404PageId }),
    },
    { upsert: true }
  );
  const updated = await SiteSettings.findOne().lean();
  return NextResponse.json(updated);
}
