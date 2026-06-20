import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { validateOverviewOfOurWorkBackgroundImages } from "@/lib/overviewOfOurWorkImageValidation";
import { validateWelcometoMESCOImage } from "@/lib/welcometoMESCOImageValidation";
import {
  INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT,
  INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH,
  validateInnerPageHeroBackgroundImage,
} from "@/lib/innerPageHeroImageValidation";
import { validateVideoPlayingCoverImage } from "@/lib/videoPlayingImageValidation";
import { validateHomeHeroSlideImages } from "@/lib/homeHeroImageValidation";
import { validateLatestEvents1Images } from "@/lib/latestEvents1ImageValidation";
import { validateMarqueeImages } from "@/lib/marqueeImageValidation";
import { validateStoriesSliderImages } from "@/lib/storiesSliderImageValidation";
import { validatePhotoGalleryCoverImages } from "@/lib/photoGalleryImageValidation";
import { validateImpactShowcaseImages } from "@/lib/impactShowcaseImageValidation";
import { validateHelpingpeopleImage } from "@/lib/helpingpeopleImageValidation";
import { validateManagingCommitteeImage } from "@/lib/managingCommitteeImageValidation";
import { validateCommitteeMembersImages } from "@/lib/committeeMembersImageValidation";
import { validateManageSectionBackgroundImages } from "@/lib/manageSectionBackgroundImageValidation";
import { validateMissionImage, validateVisionImage } from "@/lib/visionMissionImageValidation";
const SHORT_CODE_REQUIRED_IMAGE_WIDTH = 1440;
const SHORT_CODE_REQUIRED_IMAGE_HEIGHT = 378;

function getManageSectionBackgroundValidationOptions(baseComponent) {
  if (baseComponent === "InnerPageHero") {
    return {
      requiredWidth: INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH,
      requiredHeight: INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT,
    };
  }
  if (baseComponent === "ShortCode") {
    return {
      requiredWidth: SHORT_CODE_REQUIRED_IMAGE_WIDTH,
      requiredHeight: SHORT_CODE_REQUIRED_IMAGE_HEIGHT,
    };
  }
  return {};
}

function getBlockBaseComponentFromError(errorText) {
  const text = String(errorText || "");
  const match = text.match(/Block\s+"([^"]+)"/);
  return match ? String(match[1] || "").trim() : "";
}

export function filterLayoutValidationErrors(
  errors,
  options = {},
) {
  const list = Array.isArray(errors) ? errors : [];
  const nonBlockingBaseComponents = Array.isArray(
    options?.nonBlockingBaseComponents,
  )
    ? options.nonBlockingBaseComponents
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    : [];
  if (nonBlockingBaseComponents.length === 0) return list;

  const nonBlockingSet = new Set(nonBlockingBaseComponents);
  return list.filter((errorText) => {
    const baseComponent = getBlockBaseComponentFromError(errorText);
    return !baseComponent || !nonBlockingSet.has(baseComponent);
  });
}

export async function validateLayoutProps(layout) {
  const errors = [];
  if (!Array.isArray(layout) || layout.length === 0) return errors;

  await connectDB();
  const components = await Component.find({ active: true }).lean();
  const compMap = {};
  for (const c of components) compMap[c.baseComponent] = c;

  for (const block of layout) {
    const manageSectionBackgroundErrors =
      await validateManageSectionBackgroundImages(block?.props || {}, {
        labelPrefix: block?.instanceId
          ? `Block "${block.baseComponent}" (${block.instanceId})`
          : `Block "${block?.baseComponent || "Unknown"}"`,
        ...getManageSectionBackgroundValidationOptions(block?.baseComponent),
      });
    errors.push(...manageSectionBackgroundErrors);

    if (
      block?.baseComponent === "OverviewOfOurWork" ||
      block?.baseComponent === "AwardsRecognition"
    ) {
      const overviewErrors = await validateOverviewOfOurWorkBackgroundImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "OverviewOfOurWork"}"`,
        },
      );
      errors.push(...overviewErrors);
    }

    if (block?.baseComponent === "WelcometoMESCO") {
      const welcometoMESCOErrors = await validateWelcometoMESCOImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "WelcometoMESCO"}"`,
        },
      );
      errors.push(...welcometoMESCOErrors);
    }

    if (block?.baseComponent === "InnerPageHero") {
      const innerPageHeroErrors = await validateInnerPageHeroBackgroundImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "InnerPageHero"}"`,
        },
      );
      errors.push(...innerPageHeroErrors);
    }

    if (block?.baseComponent === "VideoPlaying") {
      const videoPlayingErrors = await validateVideoPlayingCoverImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "VideoPlaying"}"`,
        },
      );
      errors.push(...videoPlayingErrors);
    }

    if (block?.baseComponent === "HomeHero") {
      const homeHeroErrors = await validateHomeHeroSlideImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "HomeHero"}"`,
        },
      );
      errors.push(...homeHeroErrors);
    }

    if (block?.baseComponent === "LatestEvents1") {
      const latestEvents1Errors = await validateLatestEvents1Images(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "LatestEvents1"}"`,
        },
      );
      errors.push(...latestEvents1Errors);
    }

    if (block?.baseComponent === "Marquee") {
      const marqueeErrors = await validateMarqueeImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "Marquee"}"`,
        },
      );
      errors.push(...marqueeErrors);
    }

    if (block?.baseComponent === "StoriesSlider") {
      const storiesSliderErrors = await validateStoriesSliderImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "StoriesSlider"}"`,
        },
      );
      errors.push(...storiesSliderErrors);
    }

    if (block?.baseComponent === "PhotoGallery") {
      const photoGalleryErrors = await validatePhotoGalleryCoverImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "PhotoGallery"}"`,
        },
      );
      errors.push(...photoGalleryErrors);
    }

    if (block?.baseComponent === "ImpactShowcase") {
      const impactShowcaseErrors = await validateImpactShowcaseImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "ImpactShowcase"}"`,
        },
      );
      errors.push(...impactShowcaseErrors);
    }

    if (block?.baseComponent === "Helpingpeople") {
      const helpingpeopleErrors = await validateHelpingpeopleImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "Helpingpeople"}"`,
        },
      );
      errors.push(...helpingpeopleErrors);
    }

    if (block?.baseComponent === "ManagingCommittee") {
      const managingCommitteeErrors = await validateManagingCommitteeImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "ManagingCommittee"}"`,
        },
      );
      errors.push(...managingCommitteeErrors);
    }

    if (block?.baseComponent === "CommitteeMembers") {
      const committeeMembersErrors = await validateCommitteeMembersImages(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "CommitteeMembers"}"`,
        },
      );
      errors.push(...committeeMembersErrors);
    }

    if (block?.baseComponent === "Vision") {
      const visionErrors = await validateVisionImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "Vision"}"`,
        },
      );
      errors.push(...visionErrors);
    }

    if (block?.baseComponent === "Mission") {
      const missionErrors = await validateMissionImage(
        block?.props || {},
        {
          labelPrefix: block?.instanceId
            ? `Block "${block.baseComponent}" (${block.instanceId})`
            : `Block "${block?.baseComponent || "Mission"}"`,
        },
      );
      errors.push(...missionErrors);
    }

    const comp = compMap[block.baseComponent];
    if (!comp?.propsSchema?.length) continue;

    const label = block.instanceId
      ? `Block "${block.baseComponent}" (${block.instanceId})`
      : `Block "${block.baseComponent}"`;

    for (const field of comp.propsSchema) {
      const val = block.props?.[field.key];
      if (field.required && (val === undefined || val === "")) {
        errors.push(`${label}: "${field.label || field.key}" is required`);
      }
      if (field.maxLength && typeof val === "string" && val.length > field.maxLength) {
        errors.push(`${label}: "${field.label || field.key}" exceeds max length ${field.maxLength}`);
      }
    }
  }
  return [...new Set(errors)];
}
