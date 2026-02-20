const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PASSWORD;

  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (or EMAIL and PASSWORD) to create the initial admin user.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const User = require(path.join(__dirname, "..", "models", "User"));
  const Component = require(path.join(__dirname, "..", "models", "Component"));

  const existingUser = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingUser) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "Admin",
      status: "active",
    });
    console.log("Created admin user:", ADMIN_EMAIL);
  } else {
    console.log("Admin user already exists:", ADMIN_EMAIL);
  }

  const defaultComponents = [
    { name: "Paragraph", displayName: "Paragraph", type: "system", category: "Content", baseComponent: "Paragraph", propsSchema: [{ key: "text", type: "text", label: "Text" }], defaultProps: { text: "" } },
    { name: "Heading", displayName: "Heading", type: "system", category: "Content", baseComponent: "Heading", propsSchema: [{ key: "level", type: "number", label: "Level (1-6)" }, { key: "text", type: "text", label: "Text" }], defaultProps: { level: 2, text: "" } },
    { name: "Image", displayName: "Image", type: "system", category: "Media", baseComponent: "Image", propsSchema: [{ key: "src", type: "url", label: "Image URL" }, { key: "alt", type: "text", label: "Alt text" }], defaultProps: { src: "", alt: "" } },
  ];

  for (const comp of defaultComponents) {
    const existing = await Component.findOne({ baseComponent: comp.baseComponent });
    if (!existing) {
      await Component.create(comp);
      console.log("Created component:", comp.baseComponent);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
