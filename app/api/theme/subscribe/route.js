import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };
const SUBSCRIBE_KEYS = ["subscribeSubtitle", "subscribeTitle", "subscribePlaceholder", "subscribeButtonText", "subscribeBgUrl"];

const SUBSCRIBE_DEFAULTS = {
  subscribeSubtitle: "Latest News",
  subscribeTitle: "To get weekly & monthly news, Subscribe to our newsletter.",
  subscribePlaceholder: "Enter email address",
  subscribeButtonText: "Subscribe",
  subscribeBgUrl: "/images/subscribe-bg.png",
};

/**
 * PUT /api/theme/subscribe — update only subscribe fields and return the updated theme doc.
 * Used by admin Subscribe edit so persistence is isolated from the main theme PUT.
 */
export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();

    let theme = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 });
    if (!theme) {
      const subscribeFields = {};
      for (const k of SUBSCRIBE_KEYS) {
        subscribeFields[k] = body[k] !== undefined
          ? (typeof body[k] === "string" ? String(body[k]).trim() : body[k])
          : SUBSCRIBE_DEFAULTS[k];
      }
      theme = await ThemeConfig.create({
        themeKey: "default",
        ...subscribeFields,
      });
    } else {
      const updates = { updatedAt: new Date() };
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) {
          updates[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
        }
      }
      const result = await ThemeConfig.updateOne({ _id: theme._id }, { $set: updates });
      if (process.env.NODE_ENV !== "production") {
        console.log("[Theme Subscribe API] Written to DB — matched:", result.matchedCount, "modified:", result.modifiedCount, "fields:", Object.keys(updates).filter((k) => k !== "updatedAt"));
      }
    }

    const fresh = await ThemeConfig.findById(theme._id).lean();
    const out = {};
    for (const k of SUBSCRIBE_KEYS) {
      out[k] = fresh[k] != null ? String(fresh[k]).trim() : SUBSCRIBE_DEFAULTS[k];
    }
    const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };
    return NextResponse.json(out, { headers });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
