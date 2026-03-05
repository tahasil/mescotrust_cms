/**
 * Seed Subscribe block values from D:\tahasil-projects\mescotrust\src\components\Subscribe
 * into the components collection (Component model, baseComponent: "Subscribe").
 * Run: npm run seed-subscribe
 */
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

const SUBSCRIBE_VALUES_FROM_MESCOTRUST = {
  subscribeSubtitle: "Latest News",
  subscribeTitle: "To get weekly & monthly news, Subscribe to our newsletter.",
  subscribePlaceholder: "Enter email address",
  subscribeButtonText: "Subscribe",
  subscribeBgUrl: "/images/subscribe-bg.png",
};

async function seedSubscribe() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env or .env.local");
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
    doc.defaultProps = { ...(doc.defaultProps || {}), ...SUBSCRIBE_VALUES_FROM_MESCOTRUST };
    doc.markModified("defaultProps");
    await doc.save();
    console.log("Updated Subscribe component in components collection.");
  }

  console.log("Subscribe values from mescotrust stored (components collection):");
  console.log(SUBSCRIBE_VALUES_FROM_MESCOTRUST);

  await mongoose.disconnect();
  process.exit(0);
}

seedSubscribe().catch((err) => {
  console.error(err);
  process.exit(1);
});
