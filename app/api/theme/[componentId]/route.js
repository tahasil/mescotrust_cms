/**
 * Generic theme API for site components.
 * defaultProps live in three collections, routed by inferComponentModule(componentId, meta.module):
 *   - Component (components collection) for normal site components,
 *   - Slider    (sliders collection)    for slider modules (HomeHero uses its own /api/theme/home-hero route),
 *   - Popup     (popups collection)     for popup modules.
 * GET: returns defaultProps + theme palette/colors so the EditForm can use a single API call.
 * PUT: admin only. Only allows componentIds from the site registry.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import Slider from "@/models/Slider";
import Popup from "@/models/Popup";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { normalizeThemeColorCollections } from "@/lib/themeColorFallbacks";
import {
  inferComponentModule,
  isCorePopupComponentId,
  isCoreSliderComponentId,
} from "@/lib/sliderComponentRegistry";
import { normalizePopupTargetRoutes } from "@/lib/popupRouteUtils";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["header", "footer", "subscribe", "home-hero", "marquee"];
const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };

function isAllowed(componentId) {
  if (!componentId || typeof componentId !== "string") return false;
  const id = componentId.trim();
  if (STATIC_ROUTES.includes(id.toLowerCase())) return false;
  // Sliders/popups live in their own collections, not the site-component registry,
  // so allow their componentIds here (e.g. MarketingPopup) — otherwise GET/PUT of
  // a popup/slider's defaultProps would 400 before reaching the model branch.
  if (isCorePopupComponentId(id) || isCoreSliderComponentId(id)) return true;
  const ids = getRegistryIdsFromDisk();
  return ids.includes(id);
}

function buildPaletteResponse(themeDoc) {
  const normalizedTheme = normalizeThemeColorCollections(themeDoc || {});
  const palette =
    normalizedTheme?.themePalette && typeof normalizedTheme.themePalette === "object"
      ? normalizedTheme.themePalette
      : {};
  const colors = Array.isArray(normalizedTheme?.colors) ? normalizedTheme.colors : [];
  return { palette, colors };
}

/* ---- Popup payload sanitization (ported from TSUV theme route) ---- */
function normalizeModalWidthPreset(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (["small", "medium", "large", "full", "custom"].includes(value)) return value;
  return "medium";
}
function normalizeCustomModalWidthPx(raw, fallback = 560) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(280, Math.min(1600, Math.round(value)));
}
function normalizePopupLinkTarget(raw) {
  return String(raw || "").trim().toLowerCase() === "_blank" ? "_blank" : "_self";
}
function isValidPopupLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("#")) return true;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
  return false;
}
function sanitizePopupLink(input) {
  const linkInput = input && typeof input === "object" ? input : {};
  const enabled = linkInput.enabled === true;
  const target = normalizePopupLinkTarget(linkInput.target);
  const url = String(linkInput.url || "").trim();
  if (!enabled) return { enabled: false, url: "", target };
  if (!isValidPopupLinkUrl(url)) throw new Error("Invalid popup link URL");
  return { enabled: true, url, target };
}
function normalizePopupCtaStyle(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "secondary" || value === "outline") return value;
  return "primary";
}
function sanitizePopupCtaButtons(rawButtons) {
  const list = Array.isArray(rawButtons) ? rawButtons : [];
  return list
    .slice(0, 3)
    .map((button, index) => {
      const label = String(button?.label || "").trim();
      if (!label) return null;
      return {
        id: String(button?.id || `cta_${index + 1}`),
        label: label.slice(0, 48),
        enabled: button?.enabled !== false,
        style: normalizePopupCtaStyle(button?.style),
      };
    })
    .filter(Boolean);
}
function sanitizePopupPayload(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const targetRoutes = normalizePopupTargetRoutes(input.targetRoutes);
  if (targetRoutes.length === 0) throw new Error("Popup requires at least one target route");
  const imageUrl = String(input.imageUrl || "").trim();
  if (!imageUrl) throw new Error("Popup image is required");
  const reShowBehavior =
    input.reShowBehavior === "session_until_browser_close"
      ? "session_until_browser_close"
      : input.reShowBehavior === "always"
        ? "always"
        : "";
  if (!reShowBehavior) throw new Error("Invalid popup reShowBehavior");
  const animationInput =
    input.animation && typeof input.animation === "object" ? input.animation : {};
  const durationMsRaw = Number(animationInput.durationMs);
  const durationMs =
    Number.isFinite(durationMsRaw) && durationMsRaw >= 120 && durationMsRaw <= 1500
      ? Math.round(durationMsRaw)
      : 280;
  const priorityRaw = Number(input.priority);
  const priority =
    Number.isFinite(priorityRaw) && priorityRaw >= 0 && priorityRaw <= 9999
      ? Math.round(priorityRaw)
      : 100;
  return {
    targetRoutes,
    imageUrl,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    openOnPageLoad: input.openOnPageLoad !== false,
    dismissible: input.dismissible !== false,
    reShowBehavior,
    priority,
    animation: { durationMs },
    modalWidthPreset: normalizeModalWidthPreset(input.modalWidthPreset),
    customModalWidthPx: normalizeCustomModalWidthPx(input.customModalWidthPx, 560),
    link: sanitizePopupLink(
      input.link && typeof input.link === "object"
        ? input.link
        : { enabled: input.linkEnabled === true, url: input.linkUrl, target: input.linkTarget },
    ),
    ctaButtons: sanitizePopupCtaButtons(input.ctaButtons),
    delayMs:
      Number.isFinite(Number(input.delayMs)) && Number(input.delayMs) >= 0
        ? Number(input.delayMs)
        : 0,
  };
}

export async function GET(req, { params }) {
  const componentId = (params?.componentId || "").trim();
  if (!isAllowed(componentId)) {
    return NextResponse.json({ error: "Unknown or reserved component id" }, { status: 400 });
  }
  try {
    await connectDB();
    const [componentDoc, sliderDoc, popupDoc, meta, themeDoc] = await Promise.all([
      Component.findOne({ baseComponent: componentId }).lean(),
      Slider.findOne({ componentId }).lean(),
      Popup.findOne({ componentId }).lean(),
      SiteComponentMeta.findOne({ componentId }).lean(),
      ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean(),
    ]);
    const componentModule = inferComponentModule(componentId, meta?.module);
    const fromComponents =
      componentDoc?.defaultProps && typeof componentDoc.defaultProps === "object"
        ? { ...componentDoc.defaultProps }
        : {};
    const fromSlider =
      sliderDoc?.defaultProps && typeof sliderDoc.defaultProps === "object"
        ? { ...sliderDoc.defaultProps }
        : {};
    const fromPopup =
      popupDoc?.defaultProps && typeof popupDoc.defaultProps === "object"
        ? { ...popupDoc.defaultProps }
        : {};
    const payload =
      componentModule === "sliders"
        ? fromSlider
        : componentModule === "popups"
          ? fromPopup
          : fromComponents;
    const { palette, colors } = buildPaletteResponse(themeDoc);
    return NextResponse.json(
      { ...payload, themePalette: palette, colors },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
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
    // Never persist the palette echoed back by EditForms into defaultProps.
    delete defaultProps.themePalette;
    delete defaultProps.colors;
    delete defaultProps.frontendUiColors;

    await connectDB();
    const meta = await SiteComponentMeta.findOne({ componentId }).lean();
    const componentModule = inferComponentModule(componentId, meta?.module);
    const displayName =
      typeof meta?.displayName === "string" && meta.displayName.trim()
        ? meta.displayName.trim()
        : componentId;

    if (componentModule === "sliders") {
      const sliderDoc = await Slider.findOneAndUpdate(
        { componentId },
        { $set: { componentId, displayName, defaultProps, enabled: meta?.enabled !== false } },
        { new: true, upsert: true, setDefaultsOnInsert: true, strict: false }
      );
      revalidatePath("/", "layout");
      const out = sliderDoc?.defaultProps && typeof sliderDoc.defaultProps === "object" ? sliderDoc.defaultProps : {};
      return NextResponse.json(out, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
    }

    if (componentModule === "popups") {
      let popupProps;
      try {
        popupProps = sanitizePopupPayload(defaultProps);
      } catch (validationErr) {
        return NextResponse.json({ error: validationErr?.message || "Invalid popup payload" }, { status: 400 });
      }
      const popupDoc = await Popup.findOneAndUpdate(
        { componentId },
        { $set: { componentId, displayName, defaultProps: popupProps, enabled: meta?.enabled !== false } },
        { new: true, upsert: true, setDefaultsOnInsert: true, strict: false }
      );
      revalidatePath("/", "layout");
      const out = popupDoc?.defaultProps && typeof popupDoc.defaultProps === "object" ? popupDoc.defaultProps : {};
      return NextResponse.json(out, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
    }

    // Default: normal site component — merge into Component.defaultProps (MESCO behavior).
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
    revalidatePath("/", "layout");
    const out = doc.defaultProps && typeof doc.defaultProps === "object" ? doc.defaultProps : {};
    return NextResponse.json(out, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  } catch (err) {
    console.error("[Theme component API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
