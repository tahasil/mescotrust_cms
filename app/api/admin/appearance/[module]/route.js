import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Appearance from "@/models/Appearance";
import {
  ensureAppearanceDocuments,
  isAppearanceModuleKey,
  serializeAppearanceDocument,
} from "@/lib/appearance";

const RESERVED_KEYS = new Set([
  "_id",
  "__v",
  "__proto__",
  "constructor",
  "prototype",
  "moduleKey",
  "displayName",
  "template",
  "active",
  "layout",
  "defaultProps",
  "createdAt",
  "updatedAt",
  "publishedAt",
]);

function moduleKeyFromParams(params) {
  return String(params?.module || "").trim().toLowerCase();
}

function responsePayload(doc) {
  const serialized = serializeAppearanceDocument(doc);
  return serialized
    ? { ...serialized.defaultProps, ...serialized }
    : null;
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const moduleKey = moduleKeyFromParams(params);
  if (!isAppearanceModuleKey(moduleKey)) {
    return NextResponse.json({ error: "Appearance module not found" }, { status: 404 });
  }

  try {
    await connectDB();
    await ensureAppearanceDocuments();
    const doc = await Appearance.findOne({ moduleKey }).lean();
    return NextResponse.json(responsePayload(doc));
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load Appearance module" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const moduleKey = moduleKeyFromParams(params);
  if (!isAppearanceModuleKey(moduleKey)) {
    return NextResponse.json({ error: "Appearance module not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const bodyProps =
      body?.defaultProps && typeof body.defaultProps === "object"
        ? body.defaultProps
        : body;
    const incomingProps = Object.fromEntries(
      Object.entries(bodyProps || {}).filter(([key]) => !RESERVED_KEYS.has(key)),
    );

    await connectDB();
    await ensureAppearanceDocuments();
    const doc = await Appearance.findOne({ moduleKey });
    if (!doc) {
      return NextResponse.json({ error: "Appearance module not found" }, { status: 404 });
    }

    if (typeof body?.displayName === "string" && body.displayName.trim()) {
      doc.displayName = body.displayName.trim();
    }
    if (typeof body?.active === "boolean") doc.active = body.active;
    if (Array.isArray(body?.layout)) doc.layout = body.layout;
    doc.defaultProps = { ...(doc.defaultProps || {}), ...incomingProps };
    doc.publishedAt = new Date();
    doc.markModified("defaultProps");
    doc.markModified("layout");
    await doc.save();

    return NextResponse.json(responsePayload(doc));
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to save Appearance module" },
      { status: 500 },
    );
  }
}
