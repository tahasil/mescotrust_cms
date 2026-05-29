/**
 * HomeHero data in the sliders collection (Slider model, componentId "HomeHero").
 * On read, falls back to the legacy components-collection doc (pre-Phase-6 storage)
 * so existing content shows until the M7 migration runs. GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Slider from "@/models/Slider";
import Component from "@/models/Component";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { isAdmin } from "@/lib/permissions";
import { normalizeMapSliderConfig } from "@/lib/mapSliderAnimations";

export const dynamic = "force-dynamic";
const HOME_HERO_COMPONENT_ID = "HomeHero";

const HOME_HERO_STRING_KEYS = [
  "homeHeroSliderTitleColorKey",
  "homeHeroSliderDescColorKey",
  "homeHeroSliderButtonBgColorKey",
  "homeHeroSliderButtonTextColorKey",
  "homeHeroBackgroundContainer",
  "homeHeroContentContainer",
  "homeHeroSectionBgType",
  "homeHeroSectionBgImage",
  "homeHeroSectionBgColorKey",
  "homeHeroPageContainerBgType",
  "homeHeroPageContainerBgImage",
  "homeHeroPageContainerBgColorKey",
];

const HOME_HERO_BOOLEAN_KEYS = [
  "homeHeroAutoplay",
  "homeHeroShowArrows",
  "homeHeroShowDots",
  "_disableFadeAnimation",
];

const HOME_HERO_NUMBER_KEYS = [
  "homeHeroAutoplaySpeed",
  "homeHeroSpeed",
  "homeHeroSectionPaddingTop",
  "homeHeroSectionPaddingBottom",
  "homeHeroSectionMarginTop",
  "homeHeroSectionMarginBottom",
  "homeHeroPageContainerPaddingTop",
  "homeHeroPageContainerPaddingRight",
  "homeHeroPageContainerPaddingBottom",
  "homeHeroPageContainerPaddingLeft",
  "homeHeroPageContainerMarginTop",
  "homeHeroPageContainerMarginBottom",
];

const HOME_HERO_DEFAULTS = {
  homeHeroSlides: [],
  homeHeroSliderTitleColorKey: "",
  homeHeroSliderDescColorKey: "",
  homeHeroSliderButtonBgColorKey: "",
  homeHeroSliderButtonTextColorKey: "",
  homeHeroBackgroundContainer: "full",
  homeHeroContentContainer: "pageContainer",
  homeHeroAutoplay: true,
  homeHeroShowArrows: true,
  homeHeroShowDots: true,
  homeHeroAutoplaySpeed: 5000,
  homeHeroSpeed: 500,
  homeHeroSectionBgType: "default",
  homeHeroSectionBgImage: "",
  homeHeroSectionBgColorKey: "",
  homeHeroPageContainerBgType: "default",
  homeHeroPageContainerBgImage: "",
  homeHeroPageContainerBgColorKey: "",
  _disableFadeAnimation: false,
};

function normalizeButtonTarget(value) {
  return value === "_blank" ? "_blank" : "_self";
}

function normalizeSlide(s) {
  const mediaType =
    s?.mediaType === "video"
      ? "video"
      : s?.mediaType === "lottie"
        ? "lottie"
        : s?.mediaType === "mapSlider"
          ? "mapSlider"
          : "image";
  const youtubeUrl =
    s?.youtubeUrl != null
      ? String(s.youtubeUrl).trim()
      : s?.videoUrl != null
        ? String(s.videoUrl).trim()
        : "";
  const lottieJsonUrl = s?.lottieJsonUrl != null ? String(s.lottieJsonUrl).trim() : "";
  const mapSliderConfig = normalizeMapSliderConfig(s?.mapSliderConfig, { defaultItemCount: 10 });
  const bgImageUrlDesktop =
    s?.bgImageUrlDesktop != null
      ? String(s.bgImageUrlDesktop).trim()
      : s?.bgImageUrl != null
        ? String(s.bgImageUrl).trim()
        : "";
  const bgImageUrlMobile = s?.bgImageUrlMobile != null ? String(s.bgImageUrlMobile).trim() : "";

  return {
    bgImageUrl: mediaType === "image" || mediaType === "video" ? bgImageUrlDesktop : "",
    bgImageUrlDesktop: mediaType === "image" || mediaType === "video" ? bgImageUrlDesktop : "",
    bgImageUrlMobile: mediaType === "image" || mediaType === "video" ? bgImageUrlMobile : "",
    title: s?.title != null ? String(s.title).trim() : "",
    description: s?.description != null ? String(s.description).trim() : "",
    buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
    buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
    buttonTarget: normalizeButtonTarget(s?.buttonTarget),
    showButton: s?.showButton !== false,
    mediaType,
    youtubeUrl: mediaType === "video" ? youtubeUrl : "",
    lottieJsonUrl: mediaType === "lottie" ? lottieJsonUrl : "",
    mapSliderConfig: mediaType === "mapSlider" ? mapSliderConfig : undefined,
  };
}

function toPayload(defaultProps) {
  const out = { ...HOME_HERO_DEFAULTS };
  if (defaultProps && typeof defaultProps === "object") {
    if (Array.isArray(defaultProps.homeHeroSlides)) {
      out.homeHeroSlides = defaultProps.homeHeroSlides.map(normalizeSlide);
    }
    for (const k of HOME_HERO_STRING_KEYS) {
      if (defaultProps[k] != null) {
        if (k.endsWith("BgType")) {
          const value = String(defaultProps[k]).trim();
          out[k] = value === "image" || value === "color" ? value : "default";
        } else {
          out[k] = String(defaultProps[k]).trim();
        }
      }
    }
    for (const k of HOME_HERO_BOOLEAN_KEYS) {
      if (defaultProps[k] !== undefined) out[k] = defaultProps[k] !== false;
    }
    for (const k of HOME_HERO_NUMBER_KEYS) {
      if (defaultProps[k] !== undefined && defaultProps[k] !== null) {
        const next = Number(defaultProps[k]);
        if (Number.isFinite(next)) out[k] = next;
      }
    }
  }
  return out;
}

export async function GET() {
  try {
    await connectDB();
    const [sliderDoc, legacyDoc] = await Promise.all([
      Slider.findOne({ componentId: HOME_HERO_COMPONENT_ID }).lean(),
      Component.findOne({ baseComponent: HOME_HERO_COMPONENT_ID }).lean(),
    ]);
    const fromSlider =
      sliderDoc?.defaultProps && typeof sliderDoc.defaultProps === "object" ? sliderDoc.defaultProps : null;
    const fromLegacy =
      legacyDoc?.defaultProps && typeof legacyDoc.defaultProps === "object" ? legacyDoc.defaultProps : null;
    const payload = toPayload(fromSlider || fromLegacy || {});
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[HomeHero API] GET error:", err);
    return NextResponse.json(toPayload(null), { status: 200 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const defaultProps = { ...HOME_HERO_DEFAULTS };
    if (Array.isArray(body.homeHeroSlides)) {
      defaultProps.homeHeroSlides = body.homeHeroSlides.map(normalizeSlide);
    }
    for (const k of HOME_HERO_STRING_KEYS) {
      if (body[k] !== undefined) {
        if (k.endsWith("BgType")) {
          const value = body[k] == null ? "" : String(body[k]).trim();
          defaultProps[k] = value === "image" || value === "color" ? value : "default";
        } else {
          defaultProps[k] = body[k] == null ? "" : String(body[k]).trim();
        }
      }
    }
    for (const k of HOME_HERO_BOOLEAN_KEYS) {
      if (body[k] !== undefined) defaultProps[k] = body[k] !== false;
    }
    for (const k of HOME_HERO_NUMBER_KEYS) {
      if (body[k] !== undefined && body[k] !== null) {
        const next = Number(body[k]);
        if (Number.isFinite(next)) defaultProps[k] = next;
      }
    }

    await connectDB();
    const meta = await SiteComponentMeta.findOne({ componentId: HOME_HERO_COMPONENT_ID }).lean();
    const displayName =
      typeof meta?.displayName === "string" && meta.displayName.trim()
        ? meta.displayName.trim()
        : HOME_HERO_COMPONENT_ID;
    const saved = await Slider.findOneAndUpdate(
      { componentId: HOME_HERO_COMPONENT_ID },
      { $set: { componentId: HOME_HERO_COMPONENT_ID, displayName, enabled: meta?.enabled !== false, defaultProps } },
      { new: true, upsert: true, setDefaultsOnInsert: true, strict: false }
    );

    revalidatePath("/", "layout");
    const out = toPayload(
      saved?.defaultProps && typeof saved.defaultProps === "object" ? saved.defaultProps : defaultProps
    );
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[HomeHero API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
