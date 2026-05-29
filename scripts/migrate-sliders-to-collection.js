/* eslint-disable no-console */
/**
 * M7 — Move slider defaultProps from the `components` collection (legacy storage,
 * Component.baseComponent) into the `sliders` collection (Slider.componentId),
 * which is the canonical store after the Phase 6 Sliders relocate.
 *
 * Covers the core homepage sliders: HomeHero, ImageSlider, StoriesSlider, EventsSlider.
 * (NewsFeedSlider / CustomSlider are net-new and have no legacy doc to migrate.)
 *
 * Idempotent + non-destructive:
 *   - Copies only when no Slider doc exists yet OR the existing Slider.defaultProps
 *     is empty (so re-runs never clobber content edited after the relocate).
 *   - Leaves the legacy Component docs in place as a backup (the public render reads
 *     the Slider collection first via defaultPropsByBase, so the copy wins).
 *
 * Usage:  node scripts/migrate-sliders-to-collection.js
 *         (reads MONGODB_URI from .env.local then .env)
 */
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
const mongoose = require("mongoose");

const SLIDER_COMPONENT_IDS = ["HomeHero", "ImageSlider", "StoriesSlider", "EventsSlider"];

function isNonEmptyObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

async function migrateSliders() {
  const Component = require(path.join(projectRoot, "models", "Component"));
  const Slider = require(path.join(projectRoot, "models", "Slider"));
  const SiteComponentMeta = require(path.join(projectRoot, "models", "SiteComponentMeta"));

  const summary = [];
  for (const componentId of SLIDER_COMPONENT_IDS) {
    const legacy = await Component.findOne({ baseComponent: componentId }).lean();
    const existingSlider = await Slider.findOne({ componentId }).lean();

    if (isNonEmptyObject(existingSlider?.defaultProps)) {
      summary.push(`${componentId}: skipped (sliders doc already has content)`);
      continue;
    }
    if (!isNonEmptyObject(legacy?.defaultProps)) {
      summary.push(`${componentId}: skipped (no legacy components-collection content)`);
      continue;
    }

    const meta = await SiteComponentMeta.findOne({ componentId }).lean();
    const displayName =
      (typeof meta?.displayName === "string" && meta.displayName.trim()) ||
      (typeof legacy.displayName === "string" && legacy.displayName.trim()) ||
      componentId;

    await Slider.findOneAndUpdate(
      { componentId },
      {
        $set: {
          componentId,
          displayName,
          defaultProps: legacy.defaultProps,
          enabled: meta ? meta.enabled !== false : true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, strict: false },
    );
    const slideCount = Array.isArray(legacy.defaultProps.homeHeroSlides)
      ? legacy.defaultProps.homeHeroSlides.length
      : Array.isArray(legacy.defaultProps.imageSliderImages)
        ? legacy.defaultProps.imageSliderImages.length
        : Array.isArray(legacy.defaultProps.storiesSliderItems)
          ? legacy.defaultProps.storiesSliderItems.length
          : "n/a";
    summary.push(`${componentId}: migrated (items=${slideCount})`);
  }
  return summary;
}

async function runStandalone() {
  require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
  require("dotenv").config({ path: path.join(projectRoot, ".env") });
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local or .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("[migrate-sliders] connected:", uri.replace(/\/\/[^@]*@/, "//***@"));
  const summary = await migrateSliders();
  summary.forEach((line) => console.log("[migrate-sliders]", line));
  await mongoose.disconnect();
  console.log("[migrate-sliders] done");
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrateSliders, SLIDER_COMPONENT_IDS };
