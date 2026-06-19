/**
 * HomeHero data in components collection (Component model, baseComponent: "HomeHero").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";
import { validateHomeHeroSlideImages } from "@/lib/homeHeroImageValidation";

export const dynamic = "force-dynamic";

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
};

function normalizeSlide(s) {
  const mediaType = s?.mediaType === "video" ? "video" : "image";
  const youtubeUrl =
    s?.youtubeUrl != null
      ? String(s.youtubeUrl).trim()
      : s?.videoUrl != null
        ? String(s.videoUrl).trim()
        : "";
  const bgImageUrlDesktop =
    s?.bgImageUrlDesktop != null
      ? String(s.bgImageUrlDesktop).trim()
      : s?.bgImageUrl != null
        ? String(s.bgImageUrl).trim()
        : "";
  const bgImageUrlMobile =
    s?.bgImageUrlMobile != null ? String(s.bgImageUrlMobile).trim() : "";

  return {
    bgImageUrl: bgImageUrlDesktop,
    bgImageUrlDesktop,
    bgImageUrlMobile,
    title: s?.title != null ? String(s.title).trim() : "",
    description: s?.description != null ? String(s.description).trim() : "",
    buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
    buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
    showButton: s?.showButton !== false,
    mediaType,
    youtubeUrl,
  };
}

function normalizeHomeHeroProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...HOME_HERO_DEFAULTS, ...payload };
  out.homeHeroSlides = Array.isArray(out.homeHeroSlides)
    ? out.homeHeroSlides.map(normalizeSlide)
    : [];
  if (out.homeHeroAutoplay !== undefined) {
    out.homeHeroAutoplay = out.homeHeroAutoplay !== false;
  }
  if (out.homeHeroShowArrows !== undefined) {
    out.homeHeroShowArrows = out.homeHeroShowArrows !== false;
  }
  if (out.homeHeroShowDots !== undefined) {
    out.homeHeroShowDots = out.homeHeroShowDots !== false;
  }
  if (out.homeHeroAutoplaySpeed != null) {
    const n = Number(out.homeHeroAutoplaySpeed);
    out.homeHeroAutoplaySpeed = Number.isFinite(n) ? Math.max(1000, n) : HOME_HERO_DEFAULTS.homeHeroAutoplaySpeed;
  }
  if (out.homeHeroSpeed != null) {
    const n = Number(out.homeHeroSpeed);
    out.homeHeroSpeed = Number.isFinite(n) ? Math.max(200, n) : HOME_HERO_DEFAULTS.homeHeroSpeed;
  }
  for (const [key, value] of Object.entries(out)) {
    if (key === "homeHeroSlides") continue;
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

function toPayload(defaultProps) {
  const out = normalizeHomeHeroProps(defaultProps);
  if (defaultProps && typeof defaultProps === "object") {
    for (const key of Object.keys(defaultProps)) {
      if (out[key] !== undefined) continue;
      const value = defaultProps[key];
      out[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return out;
}

export async function GET() {
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: "HomeHero" }).lean();
    const payload = toPayload(doc?.defaultProps);
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
    const payload = body && typeof body === "object" ? body : {};

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "HomeHero" });
    if (!doc) {
      const defaultProps = normalizeHomeHeroProps(payload);
      const validationErrors = await validateHomeHeroSlideImages(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
      }
      doc = await Component.create({
        name: "HomeHero",
        displayName: "Home Hero",
        type: "system",
        baseComponent: "HomeHero",
        defaultProps: { ...defaultProps },
        layout: [],
        active: true,
      });
    } else {
      const nextDefaultProps = normalizeHomeHeroProps({
        ...(doc.defaultProps || {}),
        ...payload,
      });
      const validationErrors = await validateHomeHeroSlideImages(nextDefaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
      }
      doc.defaultProps = nextDefaultProps;
      doc.markModified("defaultProps");
      await doc.save();
    }

    const out = toPayload(doc.defaultProps);
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[HomeHero API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
