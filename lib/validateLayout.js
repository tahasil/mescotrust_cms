import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { validateOverviewOfOurWorkBackgroundImages } from "@/lib/overviewOfOurWorkImageValidation";
import { validateWelcometoMESCOImage } from "@/lib/welcometoMESCOImageValidation";
import { validateVideoPlayingCoverImage } from "@/lib/videoPlayingImageValidation";
import { validateHomeHeroSlideImages } from "@/lib/homeHeroImageValidation";
import { validateLatestEvents1Images } from "@/lib/latestEvents1ImageValidation";
import { validateMarqueeImages } from "@/lib/marqueeImageValidation";
import { validateStoriesSliderImages } from "@/lib/storiesSliderImageValidation";

export async function validateLayoutProps(layout) {
  const errors = [];
  if (!Array.isArray(layout) || layout.length === 0) return errors;

  await connectDB();
  const components = await Component.find({ active: true }).lean();
  const compMap = {};
  for (const c of components) compMap[c.baseComponent] = c;

  for (const block of layout) {
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
