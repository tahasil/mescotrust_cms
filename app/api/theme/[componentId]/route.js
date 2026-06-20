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
import { validateWelcometoMESCOImage } from "@/lib/welcometoMESCOImageValidation";
import {
  INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT,
  INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH,
  validateInnerPageHeroBackgroundImage,
} from "@/lib/innerPageHeroImageValidation";
import { validateLatestEvents1Images } from "@/lib/latestEvents1ImageValidation";
import { validateStoriesSliderImages } from "@/lib/storiesSliderImageValidation";
import { validateImpactShowcaseImages } from "@/lib/impactShowcaseImageValidation";
import { validateHelpingpeopleImage } from "@/lib/helpingpeopleImageValidation";
import { validateManagingCommitteeImage } from "@/lib/managingCommitteeImageValidation";
import { validateCommitteeMembersImages } from "@/lib/committeeMembersImageValidation";
import { validateManageSectionBackgroundImages } from "@/lib/manageSectionBackgroundImageValidation";
import {
  validateMissionImage,
  validateVisionImage,
} from "@/lib/visionMissionImageValidation";
import {
  stripPhotoGalleryMobileCoverImages,
  validatePhotoGalleryCoverImages,
} from "@/lib/photoGalleryImageValidation";
import {
  stripVideoPlayingMobileCoverImage,
  validateVideoPlayingCoverImage,
} from "@/lib/videoPlayingImageValidation";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["header", "footer", "subscribe", "home-hero", "marquee"];
const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };
const SHORT_CODE_REQUIRED_IMAGE_WIDTH = 1440;
const SHORT_CODE_REQUIRED_IMAGE_HEIGHT = 378;

function sanitizeComponentDefaultProps(componentId, props) {
  if (componentId === "VideoPlaying") {
    return stripVideoPlayingMobileCoverImage(props);
  }
  if (componentId === "PhotoGallery") {
    return stripPhotoGalleryMobileCoverImages(props);
  }
  return props;
}

function isAllowed(componentId) {
  if (!componentId || typeof componentId !== "string") return false;
  const id = componentId.trim();
  if (STATIC_ROUTES.includes(id.toLowerCase())) return false;
  const ids = getRegistryIdsFromDisk();
  return ids.includes(id);
}

function getManageSectionBackgroundValidationOptions(componentId) {
  if (componentId === "InnerPageHero") {
    return {
      requiredWidth: INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH,
      requiredHeight: INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT,
    };
  }
  if (componentId === "ShortCode") {
    return {
      requiredWidth: SHORT_CODE_REQUIRED_IMAGE_WIDTH,
      requiredHeight: SHORT_CODE_REQUIRED_IMAGE_HEIGHT,
    };
  }
  return {};
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
    const payload =
      doc?.defaultProps && typeof doc.defaultProps === "object"
        ? { ...doc.defaultProps }
        : {};
    const safePayload = sanitizeComponentDefaultProps(componentId, payload);
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
        ...safePayload,
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
    const safeDefaultProps = sanitizeComponentDefaultProps(
      componentId,
      defaultProps,
    );

    await connectDB();

    const manageSectionBackgroundErrors =
      await validateManageSectionBackgroundImages(
        defaultProps,
        getManageSectionBackgroundValidationOptions(componentId),
      );
    if (manageSectionBackgroundErrors.length > 0) {
      return NextResponse.json(
        { error: manageSectionBackgroundErrors[0] },
        { status: 400 },
      );
    }

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

    if (componentId === "WelcometoMESCO") {
      const validationErrors = await validateWelcometoMESCOImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "InnerPageHero") {
      const validationErrors =
        await validateInnerPageHeroBackgroundImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "LatestEvents1") {
      const validationErrors = await validateLatestEvents1Images(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "StoriesSlider") {
      const validationErrors = await validateStoriesSliderImages(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "ImpactShowcase") {
      const validationErrors = await validateImpactShowcaseImages(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "Helpingpeople") {
      const validationErrors = await validateHelpingpeopleImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "ManagingCommittee") {
      const validationErrors = await validateManagingCommitteeImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "CommitteeMembers") {
      const validationErrors = await validateCommitteeMembersImages(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "Vision") {
      const validationErrors = await validateVisionImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "Mission") {
      const validationErrors = await validateMissionImage(defaultProps);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: validationErrors[0] },
          { status: 400 },
        );
      }
    }

    if (componentId === "PhotoGallery") {
      const validationErrors =
        await validatePhotoGalleryCoverImages(safeDefaultProps);
      if (validationErrors.length > 0) {
        // Temporary non-blocking behavior requested by product: do not fail save for PhotoGallery image-size validation.
        console.warn(
          "[Theme component API] Non-blocking PhotoGallery validation:",
          validationErrors[0],
        );
      }
    }

    if (componentId === "VideoPlaying") {
      const validationErrors =
        await validateVideoPlayingCoverImage(safeDefaultProps);
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
        defaultProps: safeDefaultProps,
        layout: [],
        active: true,
      });
    } else {
      const mergedDefaultProps = { ...(doc.defaultProps || {}), ...safeDefaultProps };
      doc.defaultProps = sanitizeComponentDefaultProps(
        componentId,
        mergedDefaultProps,
      );
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
