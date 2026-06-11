/**
 * Generic theme API for site components (Component model, baseComponent: componentId).
 * Used by dynamically created components (e.g. MySection) — same pattern as home-hero, marquee.
 * GET: returns component defaultProps and themePalette/colors so the EditForm can use a single API call (no /api/theme).
 * PUT: admin only. Only allows componentIds from the site registry.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { normalizeThemeColorCollections } from "@/lib/themeColorFallbacks";
import { validateOverviewOfOurWorkBackgroundImages } from "@/lib/overviewOfOurWorkImageValidation";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["header", "footer", "subscribe", "home-hero", "marquee"];
const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };

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
    const [doc, themeDoc] = await Promise.all([
      Component.findOne({ baseComponent: componentId }).lean(),
      ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean(),
    ]);
    const payload = (doc?.defaultProps && typeof doc.defaultProps === "object") ? { ...doc.defaultProps } : {};
    const normalizedTheme = normalizeThemeColorCollections(themeDoc || {});
    const palette =
      normalizedTheme?.themePalette &&
      typeof normalizedTheme.themePalette === "object"
        ? normalizedTheme.themePalette
        : {};
    const colors = Array.isArray(normalizedTheme?.colors)
      ? normalizedTheme.colors
      : [];
    return NextResponse.json(
      {
        ...payload,
        themePalette: palette,
        colors,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
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

    if (componentId === "OverviewOfOurWork") {
      const validationErrors =
        await validateOverviewOfOurWorkBackgroundImages(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

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
