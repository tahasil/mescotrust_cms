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

  // --- Default components ---
  const defaultComponents = [
    // Text
    {
      name: "Paragraph", displayName: "Paragraph", type: "system", category: "Text",
      baseComponent: "Paragraph",
      propsSchema: [{ key: "text", type: "richtext", label: "Text", required: false }],
      defaultProps: { text: "" },
    },
    {
      name: "Heading", displayName: "Heading", type: "system", category: "Text",
      baseComponent: "Heading",
      propsSchema: [
        { key: "level", type: "number", label: "Level (1-6)", required: false },
        { key: "text", type: "text", label: "Text", required: false },
        { key: "style", type: "select", label: "Style", options: ["default", "underline", "accent", "uppercase", "light"] },
      ],
      defaultProps: { level: 2, text: "", style: "default" },
    },
    {
      name: "List", displayName: "List", type: "system", category: "Text",
      baseComponent: "List",
      propsSchema: [
        { key: "items", type: "json", label: "Items (JSON array of strings)", required: false },
        { key: "ordered", type: "boolean", label: "Numbered list" },
      ],
      defaultProps: { items: ["Item 1", "Item 2"], ordered: false },
    },
    {
      name: "Quote", displayName: "Quote", type: "system", category: "Text",
      baseComponent: "Quote",
      propsSchema: [
        { key: "text", type: "text", label: "Quote text", required: false },
        { key: "citation", type: "text", label: "Citation" },
      ],
      defaultProps: { text: "", citation: "" },
    },
    {
      name: "CodeSnippet", displayName: "Code Snippet", type: "system", category: "Text",
      baseComponent: "CodeSnippet",
      propsSchema: [
        { key: "code", type: "text", label: "Code", required: false },
        { key: "language", type: "text", label: "Language" },
      ],
      defaultProps: { code: "", language: "" },
    },
    // Media
    {
      name: "Image", displayName: "Image", type: "system", category: "Media",
      baseComponent: "Image",
      propsSchema: [
        { key: "src", type: "image", label: "Image URL", required: true },
        { key: "alt", type: "text", label: "Alt text", required: false },
      ],
      defaultProps: { src: "", alt: "" },
    },
    {
      name: "Gallery", displayName: "Gallery", type: "system", category: "Media",
      baseComponent: "Gallery",
      propsSchema: [
        { key: "images", type: "json", label: "Images (JSON: [{src, alt}])", required: false },
        { key: "columns", type: "number", label: "Columns (1-6)" },
        { key: "gap", type: "number", label: "Gap (px)" },
      ],
      defaultProps: { images: [], columns: 3, gap: 8 },
    },
    {
      name: "Video", displayName: "Video", type: "system", category: "Media",
      baseComponent: "Video",
      propsSchema: [
        { key: "url", type: "url", label: "Video URL (YouTube/Vimeo/file)", required: false },
        { key: "caption", type: "text", label: "Caption" },
      ],
      defaultProps: { url: "", caption: "" },
    },
    {
      name: "FileDownload", displayName: "File Download", type: "system", category: "Media",
      baseComponent: "FileDownload",
      propsSchema: [
        { key: "url", type: "url", label: "File URL", required: false },
        { key: "label", type: "text", label: "Label" },
        { key: "description", type: "text", label: "Description" },
      ],
      defaultProps: { url: "", label: "", description: "" },
    },
    {
      name: "Cover", displayName: "Cover", type: "system", category: "Media",
      baseComponent: "Cover",
      propsSchema: [
        { key: "src", type: "image", label: "Background image URL", required: true },
        { key: "alt", type: "text", label: "Alt text" },
        { key: "heading", type: "text", label: "Heading" },
        { key: "text", type: "text", label: "Text" },
        { key: "overlayColor", type: "text", label: "Overlay color" },
        { key: "minHeight", type: "number", label: "Min height (px)" },
      ],
      defaultProps: { src: "", alt: "", heading: "", text: "", overlayColor: "rgba(0,0,0,0.45)", minHeight: 300 },
    },
    // Layout
    {
      name: "Buttons", displayName: "Buttons", type: "system", category: "Layout",
      baseComponent: "Buttons",
      propsSchema: [
        { key: "buttons", type: "json", label: "Buttons (JSON array: [{label, url, variant, openInNewTab}])", required: false },
      ],
      defaultProps: { buttons: [{ label: "Click me", url: "#", variant: "solid", openInNewTab: false }] },
    },
    {
      name: "Spacer", displayName: "Spacer / Divider", type: "system", category: "Layout",
      baseComponent: "Spacer",
      propsSchema: [
        { key: "height", type: "number", label: "Height (px)", required: false },
        { key: "showDivider", type: "boolean", label: "Show divider line" },
      ],
      defaultProps: { height: 40, showDivider: false },
    },
    {
      name: "Columns", displayName: "Columns", type: "system", category: "Layout",
      baseComponent: "Columns",
      propsSchema: [
        { key: "columns", type: "number", label: "Number of columns (1-4)", required: false },
        { key: "gap", type: "number", label: "Gap (px)", required: false },
        { key: "content", type: "json", label: "Column content (JSON array: [{text}])", required: false },
      ],
      defaultProps: { columns: 2, gap: 24, content: [] },
    },
    // Content
    {
      name: "CallToAction", displayName: "Call to Action", type: "system", category: "Content",
      baseComponent: "CallToAction",
      propsSchema: [
        { key: "heading", type: "text", label: "Heading" },
        { key: "text", type: "text", label: "Text" },
        { key: "buttonLabel", type: "text", label: "Button label" },
        { key: "buttonUrl", type: "url", label: "Button URL" },
        { key: "buttonVariant", type: "select", label: "Button style", options: ["solid", "outline"] },
        { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] },
      ],
      defaultProps: { heading: "", text: "", buttonLabel: "Learn more", buttonUrl: "#", buttonVariant: "solid", align: "center" },
    },
    {
      name: "Embed", displayName: "Embed", type: "system", category: "Content",
      baseComponent: "Embed",
      propsSchema: [
        { key: "url", type: "url", label: "Embed URL (YouTube/Vimeo/other)", required: false },
        { key: "caption", type: "text", label: "Caption" },
      ],
      defaultProps: { url: "", caption: "" },
    },
    // Navigation
    {
      name: "Breadcrumbs", displayName: "Breadcrumbs", type: "system", category: "Navigation",
      baseComponent: "Breadcrumbs",
      propsSchema: [
        { key: "items", type: "json", label: "Items (JSON: [{label, url}])", required: false },
        { key: "separator", type: "text", label: "Separator" },
      ],
      defaultProps: { items: [{ label: "Home", url: "/" }], separator: "/" },
    },
  ];

  for (const comp of defaultComponents) {
    const existing = await Component.findOne({ baseComponent: comp.baseComponent });
    if (!existing) {
      await Component.create(comp);
      console.log("Created component:", comp.baseComponent);
    }
  }

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
