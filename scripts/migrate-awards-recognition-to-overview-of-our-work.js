/**
 * One-time migration: rename component AwardsRecognition → OverviewOfOurWork
 * and all prop keys awardsRecognition* → overviewOfOurWork* in DB.
 *
 * Run from project root: node scripts/migrate-awards-recognition-to-overview-of-our-work.js
 * Requires MONGODB_URI in .env
 */

const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

const OLD_ID = "AwardsRecognition";
const NEW_ID = "OverviewOfOurWork";
const NEW_DISPLAY_NAME = "Overview of Our Work";

const PROP_RENAMES = {
  awardsRecognitionItems: "overviewOfOurWorkItems",
  awardsRecognitionSectionBgType: "overviewOfOurWorkSectionBgType",
  awardsRecognitionSectionBgImage: "overviewOfOurWorkSectionBgImage",
  awardsRecognitionSectionBgColorKey: "overviewOfOurWorkSectionBgColorKey",
  awardsRecognitionSectionPaddingTop: "overviewOfOurWorkSectionPaddingTop",
  awardsRecognitionSectionPaddingBottom: "overviewOfOurWorkSectionPaddingBottom",
  awardsRecognitionSectionMarginTop: "overviewOfOurWorkSectionMarginTop",
  awardsRecognitionSectionMarginBottom: "overviewOfOurWorkSectionMarginBottom",
  awardsRecognitionPageContainerBgType: "overviewOfOurWorkPageContainerBgType",
  awardsRecognitionPageContainerBgImage: "overviewOfOurWorkPageContainerBgImage",
  awardsRecognitionPageContainerBgColorKey: "overviewOfOurWorkPageContainerBgColorKey",
  awardsRecognitionPageContainerPaddingTop: "overviewOfOurWorkPageContainerPaddingTop",
  awardsRecognitionPageContainerPaddingRight: "overviewOfOurWorkPageContainerPaddingRight",
  awardsRecognitionPageContainerPaddingBottom: "overviewOfOurWorkPageContainerPaddingBottom",
  awardsRecognitionPageContainerPaddingLeft: "overviewOfOurWorkPageContainerPaddingLeft",
  awardsRecognitionPageContainerMarginTop: "overviewOfOurWorkPageContainerMarginTop",
  awardsRecognitionPageContainerMarginBottom: "overviewOfOurWorkPageContainerMarginBottom",
  awardsRecognitionCardTitleColorKey: "overviewOfOurWorkCardTitleColorKey",
  awardsRecognitionCardBorderColorKey: "overviewOfOurWorkCardBorderColorKey",
  awardsRecognitionButtonColorKey: "overviewOfOurWorkButtonColorKey",
  awardsRecognitionHoverColorKey: "overviewOfOurWorkHoverColorKey",
};

function renamePropsInObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = PROP_RENAMES[k] ?? k;
    out[newKey] = v;
  }
  return out;
}

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const SiteComponentMeta = require(path.join(projectRoot, "models", "SiteComponentMeta"));
  const Component = require(path.join(projectRoot, "models", "Component"));
  const Page = require(path.join(projectRoot, "models", "Page"));

  // 1. SiteComponentMeta: create new doc with NEW_ID, delete old
  const oldMeta = await SiteComponentMeta.findOne({ componentId: OLD_ID }).lean();
  if (oldMeta) {
    await SiteComponentMeta.deleteOne({ componentId: OLD_ID });
    await SiteComponentMeta.create({
      componentId: NEW_ID,
      displayName: NEW_DISPLAY_NAME,
      global: oldMeta.global ?? false,
      order: oldMeta.order ?? 0,
      position: oldMeta.position ?? "before",
      enabled: oldMeta.enabled !== false,
    });
    console.log("SiteComponentMeta: migrated %s → %s", OLD_ID, NEW_ID);
  } else {
    await SiteComponentMeta.create({
      componentId: NEW_ID,
      displayName: NEW_DISPLAY_NAME,
      global: false,
      order: 0,
      position: "after",
      enabled: true,
    });
    console.log("SiteComponentMeta: created %s with displayName '%s'", NEW_ID, NEW_DISPLAY_NAME);
  }

  // 2. Component: update baseComponent and defaultProps keys
  const comps = await Component.find({ baseComponent: OLD_ID });
  for (const doc of comps) {
    doc.baseComponent = NEW_ID;
    doc.name = doc.name === OLD_ID ? NEW_ID : doc.name;
    doc.displayName = NEW_DISPLAY_NAME;
    if (doc.defaultProps && typeof doc.defaultProps === "object") {
      doc.defaultProps = renamePropsInObject(doc.defaultProps);
    }
    await doc.save();
  }
  if (comps.length > 0) {
    console.log("Component: updated %d doc(s) %s → %s", comps.length, OLD_ID, NEW_ID);
  }

  // 3. Page layout blocks: baseComponent and props
  const pages = await Page.find({ "layout.baseComponent": OLD_ID });
  let blocksUpdated = 0;
  for (const page of pages) {
    let changed = false;
    const layout = Array.isArray(page.layout) ? page.layout : [];
    for (const block of layout) {
      const bc = block?.baseComponent || block?.componentId?.baseComponent;
      if (bc === OLD_ID) {
        block.baseComponent = NEW_ID;
        if (block.componentId && typeof block.componentId === "object") {
          block.componentId.baseComponent = NEW_ID;
        }
        if (block.props && typeof block.props === "object") {
          block.props = renamePropsInObject(block.props);
        }
        changed = true;
        blocksUpdated++;
      }
      if (block?.props?.layout && Array.isArray(block.props.layout)) {
        for (const inner of block.props.layout) {
          const ibc = inner?.baseComponent || inner?.componentId?.baseComponent;
          if (ibc === OLD_ID) {
            inner.baseComponent = NEW_ID;
            if (inner.props) inner.props = renamePropsInObject(inner.props);
            changed = true;
            blocksUpdated++;
          }
        }
      }
    }
    if (changed) await page.save();
  }
  if (blocksUpdated > 0) {
    console.log("Page: updated %d block(s) across %d page(s)", blocksUpdated, pages.length);
  }

  await mongoose.disconnect();
  console.log("Done. Component is now %s (Overview of Our Work).", NEW_ID);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
