import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import {
  assertSiteFileType,
  generateAndSaveSiteFile,
  getSiteFile,
  saveSiteFile,
} from "@/lib/siteFiles";

function errorResponse(error) {
  const message = error instanceof Error ? error.message : "Unable to manage site file";
  const status = /unsupported|required|valid|too large/i.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const type = assertSiteFileType(params?.type);
    return NextResponse.json(await getSiteFile(type));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const type = assertSiteFileType(params?.type);
    const saved = await generateAndSaveSiteFile(type, session.email || "");
    return NextResponse.json(saved);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const type = assertSiteFileType(params?.type);
    const body = await req.json();
    const saved = await saveSiteFile(type, body?.content, session.email || "");
    return NextResponse.json(saved);
  } catch (error) {
    return errorResponse(error);
  }
}
