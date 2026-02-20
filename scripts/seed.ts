import "dotenv/config";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { User, Role, Component } from "../src/models";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error("Set MONGODB_URI in .env to run seed.");
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to run seed.");
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  let role = await Role.findOne({ slug: "super_admin" });
  if (!role) {
    role = await Role.create({
      name: "Super Admin",
      slug: "super_admin",
      description: "Full access",
      permissions: [
        "pages:read",
        "pages:write",
        "media:read",
        "media:write",
        "users:read",
        "users:manage",
        "theme:manage",
        "menu:manage",
        "header_footer:manage",
        "components:manage",
      ],
    });
  }

  const hashed = await hash(password!, 10);
  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: "Admin",
        password: hashed,
        roleId: role._id,
        status: "active",
      },
    },
    { upsert: true, new: true }
  );

  const defaultComponents = [
    { name: "Hero", slug: "hero", category: "Sections", schemaJSON: JSON.stringify([{ key: "title", type: "text", label: "Title" }, { key: "subtitle", type: "text", label: "Subtitle" }]), defaultPropsJSON: JSON.stringify({ title: "Welcome", subtitle: "" }) },
    { name: "Card", slug: "card", category: "Sections", schemaJSON: JSON.stringify([{ key: "title", type: "text", label: "Title" }, { key: "body", type: "richtext", label: "Body" }]), defaultPropsJSON: JSON.stringify({ title: "Card", body: "" }) },
    { name: "Text", slug: "text", category: "Content", schemaJSON: JSON.stringify([{ key: "content", type: "richtext", label: "Content" }]), defaultPropsJSON: JSON.stringify({ content: "" }) },
    { name: "Image", slug: "image", category: "Media", schemaJSON: JSON.stringify([{ key: "src", type: "image", label: "Image" }, { key: "alt", type: "text", label: "Alt text" }]), defaultPropsJSON: JSON.stringify({ src: "", alt: "" }) },
    { name: "Buttons", slug: "buttons", category: "Content", schemaJSON: JSON.stringify([{ key: "primaryLabel", type: "text" }, { key: "primaryUrl", type: "url" }, { key: "secondaryLabel", type: "text" }, { key: "secondaryUrl", type: "url" }]), defaultPropsJSON: JSON.stringify({ primaryLabel: "Primary", primaryUrl: "#", secondaryLabel: "", secondaryUrl: "#" }) },
    { name: "Spacer", slug: "spacer", category: "Layout", schemaJSON: JSON.stringify([{ key: "height", type: "number", label: "Height (px)" }]), defaultPropsJSON: JSON.stringify({ height: 24 }) },
  ];

  for (const c of defaultComponents) {
    await Component.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          category: c.category,
          schemaJSON: c.schemaJSON,
          defaultPropsJSON: c.defaultPropsJSON,
          isSystemComponent: false,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seed done: admin user and default components.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
