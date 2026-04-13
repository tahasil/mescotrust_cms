/**
 * HomeHero data in components collection (Component model, baseComponent: "HomeHero").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const HOME_HERO_KEYS = [
  "homeHeroSlides",
  "homeHeroSliderTitleColorKey",
  "homeHeroSliderDescColorKey",
  "homeHeroSliderButtonBgColorKey",
  "homeHeroSliderButtonTextColorKey",
  "homeHeroBackgroundContainer",
  "homeHeroContentContainer",
];

const HOME_HERO_DEFAULTS = {
  homeHeroSlides: [],
  homeHeroSliderTitleColorKey: "",
  homeHeroSliderDescColorKey: "",
  homeHeroSliderButtonBgColorKey: "",
  homeHeroSliderButtonTextColorKey: "",
  homeHeroBackgroundContainer: "full",
  homeHeroContentContainer: "pageContainer",
};

function normalizeSlide(s) {
  const mediaType = s?.mediaType === "video" ? "video" : "image";
  const youtubeUrl =
    s?.youtubeUrl != null
      ? String(s.youtubeUrl).trim()
      : s?.videoUrl != null
        ? String(s.videoUrl).trim()
        : "";

  return {
    bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
    title: s?.title != null ? String(s.title).trim() : "",
    description: s?.description != null ? String(s.description).trim() : "",
    buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
    buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
    showButton: s?.showButton !== false,
    mediaType,
    youtubeUrl,
  };
}

function toPayload(defaultProps) {
  const out = { ...HOME_HERO_DEFAULTS };
  if (defaultProps && typeof defaultProps === "object") {
    if (Array.isArray(defaultProps.homeHeroSlides)) {
      out.homeHeroSlides = defaultProps.homeHeroSlides.map(normalizeSlide);
    }
    for (const k of HOME_HERO_KEYS) {
      if (k !== "homeHeroSlides" && defaultProps[k] != null) {
        out[k] = String(defaultProps[k]).trim();
      }
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
    const defaultProps = { ...HOME_HERO_DEFAULTS };
    if (Array.isArray(body.homeHeroSlides)) {
      defaultProps.homeHeroSlides = body.homeHeroSlides.map(normalizeSlide);
    }
    for (const k of HOME_HERO_KEYS) {
      if (k !== "homeHeroSlides" && body[k] !== undefined) {
        defaultProps[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
    }

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "HomeHero" });
    if (!doc) {
      doc = await Component.create({
        name: "HomeHero",
        displayName: "Home Hero",
        type: "system",
        baseComponent: "HomeHero",
        defaultProps,
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = { ...(doc.defaultProps || {}), ...defaultProps };
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
