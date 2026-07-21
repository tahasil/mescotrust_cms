/**
 * Seed the current finale-style Subscribe block into the components collection
 * (Component model, baseComponent: "Subscribe").
 * Run: npm run seed-subscribe
 */
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env"), override: true });

const mongoose = require("mongoose");

const SUBSCRIBE_VALUES_FROM_MESCOTRUST = {
  subscribeSubtitle: "Subscribe to our newsletter for weekly and monthly news",
  subscribeTitle: "Be someone's",
  subscribeHeadingAccent: "tomorrow.",
  subscribePrimaryButtonLabel: "Donate Now",
  subscribePrimaryButtonUrl: "/donate",
  subscribePrimaryButtonTarget: "_self",
  subscribeSecondaryButtonLabel: "Become a Volunteer",
  subscribeSecondaryButtonUrl: "/volunteer",
  subscribeSecondaryButtonTarget: "_self",
  subscribePlaceholder: "you@example.com",
  subscribeButtonText: "Subscribe",
  subscribeTitleColorKey: "black",
  subscribeAccentColorKey: "primary",
  subscribeOutlineColorKey: "blackLight",
  subscribePrimaryButtonBgColorKey: "primary",
  subscribePrimaryButtonTextColorKey: "white",
  subscribeSecondaryButtonBgColorKey: "dark",
  subscribeSecondaryButtonTextColorKey: "warmWhite",
  subscribeSubtitleColorKey: "blackLight",
  subscribeInputBgColorKey: "white",
  subscribeInputBorderColorKey: "border",
  subscribeInputTextColorKey: "black",
  subscribeFocusColorKey: "primary",
  subscribeButtonBgColorKey: "dark",
  subscribeButtonTextColorKey: "warmWhite",
  subscribeErrorColorKey: "primary",
};

async function seedSubscribe() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const Component = require(path.join(projectRoot, "models", "Component"));

  let doc = await Component.findOne({ baseComponent: "Subscribe" });
  if (!doc) {
    doc = await Component.create({
      name: "Subscribe",
      displayName: "Subscribe",
      type: "system",
      baseComponent: "Subscribe",
      defaultProps: SUBSCRIBE_VALUES_FROM_MESCOTRUST,
      layout: [],
      active: true,
    });
    console.log("Created Subscribe component in components collection.");
  } else {
    // Replace the legacy shape so obsolete background/layout fields cannot
    // survive a reseed and leak back into the component.
    doc.defaultProps = { ...SUBSCRIBE_VALUES_FROM_MESCOTRUST };
    doc.markModified("defaultProps");
    await doc.save();
    console.log("Updated Subscribe component in components collection.");
  }

  console.log("Finale Subscribe values stored (components collection):");
  console.log(SUBSCRIBE_VALUES_FROM_MESCOTRUST);

  await mongoose.disconnect();
  process.exit(0);
}

seedSubscribe().catch((err) => {
  console.error(err);
  process.exit(1);
});
