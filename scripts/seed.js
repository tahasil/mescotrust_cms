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
  const ThemeConfig = require(path.join(__dirname, "..", "models", "ThemeConfig"));
  const Menu = require(path.join(__dirname, "..", "models", "Menu"));
  const Page = require(path.join(__dirname, "..", "models", "Page"));

  // --- Admin user ---
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

  // --- Components: none seeded; add/edit/delete from Admin > Components ---

  // --- Default theme ---
  const existingTheme = await ThemeConfig.findOne();
  if (!existingTheme) {
    await ThemeConfig.create({
      fontFamily: "system-ui, sans-serif",
      fontSize: 16,
      primaryColor: "#1890ff",
      secondaryColor: "#722ed1",
      backgroundColor: "#ffffff",
      textColor: "#333333",
      layoutWidth: 1200,
      direction: "ltr",
      googleFonts: [],
    });
    console.log("Created default theme");
  }

  // --- Default header menu ---
  const existingMenu = await Menu.findOne({ name: "header" });
  if (!existingMenu) {
    await Menu.create({
      name: "header",
      items: [
        { label: "Home", url: "/", order: 0, openInNewTab: false },
        { label: "Blog", url: "/blog", order: 1, openInNewTab: false },
        { label: "Contact", url: "/contact", order: 2, openInNewTab: false },
      ],
    });
    console.log("Created default header menu");
  }

  // --- Default footer menu ---
  const existingFooter = await Menu.findOne({ name: "footer" });
  if (!existingFooter) {
    await Menu.create({
      name: "footer",
      items: [
        { label: "Home", url: "/", order: 0, openInNewTab: false },
        { label: "Contact", url: "/contact", order: 1, openInNewTab: false },
      ],
    });
    console.log("Created default footer menu");
  }

  // --- Default home page ---
  const existingHome = await Page.findOne({ slug: "home" });
  if (!existingHome) {
    await Page.create({
      title: "Home",
      slug: "home",
      status: "published",
      layout: [
        { instanceId: "seed_h1", baseComponent: "Heading", props: { level: 1, text: "Welcome to Mesco Trust" }, order: 0 },
        { instanceId: "seed_p1", baseComponent: "Paragraph", props: { text: "This is the default home page. Edit it from the admin panel." }, order: 1 },
        { instanceId: "seed_b1", baseComponent: "Buttons", props: { buttons: [{ label: "View Blog", url: "/blog", variant: "solid" }, { label: "Contact Us", url: "/contact", variant: "outline" }] }, order: 2 },
      ],
      meta: { metaTitle: "Mesco Trust", metaDescription: "Welcome to Mesco Trust" },
    });
    console.log("Created default home page");
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
