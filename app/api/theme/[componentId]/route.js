/**
 * Generic theme API for site components (Component model, baseComponent: componentId).
 * Used by dynamically created components (e.g. MySection) — same pattern as home-hero, marquee.
 * GET: public. PUT: admin only. Only allows componentIds from the site registry.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["header", "footer", "subscribe", "home-hero", "marquee"];

function isAllowed(componentId) {
  if (!componentId || typeof componentId !== "string") return false;
  const id = componentId.trim();
  if (STATIC_ROUTES.includes(id.toLowerCase())) return false;
  const ids = getRegistryIdsFromDisk();
  return ids.includes(id);
}

export async function GET(req, { params }) {
  const componentId = (params?.componentId || "").trim();
  if (!isAllowed(componentId)) {
    return NextResponse.json({ error: "Unknown or reserved component id" }, { status: 400 });
  }
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: componentId }).lean();
    const payload = (doc?.defaultProps && typeof doc.defaultProps === "object") ? doc.defaultProps : {};
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Theme component API] GET error:", err);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req, { params }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  const componentId = (params?.componentId || "").trim();
  if (!isAllowed(componentId)) {
    return NextResponse.json({ error: "Unknown or reserved component id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const defaultProps = body && typeof body === "object" ? { ...body } : {};

    await connectDB();
    let doc = await Component.findOne({ baseComponent: componentId });
    if (!doc) {
      doc = await Component.create({
        name: componentId,
        displayName: componentId,
        type: "custom",
        baseComponent: componentId,
        defaultProps: defaultProps,
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = { ...(doc.defaultProps || {}), ...defaultProps };
      doc.markModified("defaultProps");
      await doc.save();
    }

    const out = (doc.defaultProps && typeof doc.defaultProps === "object") ? doc.defaultProps : {};
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Theme component API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
