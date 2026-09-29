const { test, expect } = require("@playwright/test");
const { encode } = require("next-auth/jwt");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

const User = require("../models/User");
const Gallery = require("../models/Gallery");
const Media = require("../models/Media");

async function authenticateAdmin(context) {
  const admin = await User.findOne({
    status: "active",
    $or: [
      { roleKey: { $in: ["super_admin", "admin"] } },
      { role: { $in: ["Super Admin", "Admin"] } },
    ],
  })
    .sort({ roleKey: 1 })
    .lean();
  expect(admin, "An active admin user is required for the admin UI test").toBeTruthy();

  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60,
    token: {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      roleKey: admin.roleKey || admin.role,
      permissionVersion: admin.permissionVersion || 1,
      sessionVersion: admin.sessionVersion || 1,
      permissionKeys: ["*"],
    },
  });

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Gallery Management E2E", () => {
  let testGalleryId = null;

  test.beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  test.afterAll(async () => {
    if (testGalleryId) {
      await Gallery.deleteOne({ _id: testGalleryId }).catch(() => {});
    }
    // Cleanup any test media created during the test
    const testMediaDocs = await Media.find({ originalName: /convocation/i }).lean();
    for (const doc of testMediaDocs) {
      const mediaDir = path.join(process.cwd(), "public", "uploads", "media", "2026", "09", String(doc._id));
      if (fs.existsSync(mediaDir)) {
        fs.rmSync(mediaDir, { recursive: true, force: true });
      }
    }
    await Media.deleteMany({ originalName: /convocation/i }).catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });

  test("should create, edit with cover/album images, save to DB, and render in live preview", async ({
    page,
    context,
  }, testInfo) => {
    // 1. Auth as admin
    await authenticateAdmin(context);

    // 2. Setup clean test gallery in DB
    const stamp = Date.now();
    const testGallery = await Gallery.create({
      name: `Playwright Test Gallery ${stamp}`,
      slug: `playwright-test-gallery-${stamp}`,
      shortcode: `pw-gallery-${stamp}`,
      type: "image",
      status: "published",
      tabs: ["All", "Education", "Medical", "Events"],
      items: [],
      config: {},
    });
    testGalleryId = String(testGallery._id);

    // Track console and API errors
    const consoleLogs = [];
    page.on("console", (msg) => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => consoleLogs.push(`PAGEERROR: ${err.message}`));

    // 3. Navigate to Edit Page
    await page.goto(`/admin/gallery/${testGalleryId}/edit`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: testInfo.outputPath("01-edit-page-loaded.png"), fullPage: true });

    // 4. Open Settings Drawer
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.locator(".ant-drawer-title")).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: testInfo.outputPath("02-drawer-opened.png"), fullPage: true });

    // 5. Fill Album Item Details
    // Item Title
    const titleInput = page.locator('input[placeholder="e.g. Annual Function 2024"]').first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill("Annual Convocation 2026");

    // Verify accordion header displays Item Title instead of generic "Gallery item 1"
    await expect(page.locator('.sortable-form-list strong:has-text("Annual Convocation 2026")')).toBeVisible({ timeout: 5000 });

    // Category Select: Click category dropdown and select "Education"
    const catSelect = page.locator('.ant-select:has(.ant-select-selection-placeholder)').first();
    if (await catSelect.count()) {
      await catSelect.click({ force: true });
      await page.locator('.ant-select-item-option', { hasText: "Education" }).last().click();
      // Close dropdown
      await page.keyboard.press("Escape");
    }

    // Cover Image: Fill URL in the Cover Image input
    const coverInput = page.locator('input[placeholder="/uploads/album-cover.webp"]').first();
    await expect(coverInput).toBeVisible({ timeout: 5000 });
    await coverInput.fill("https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800");

    // Add Album Images via Single Multiple Upload
    const fileInput = page.locator('input[type="file"][multiple]').first();
    await fileInput.setInputFiles([
      {
        name: "convocation-1.png",
        mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
      },
      {
        name: "convocation-2.png",
        mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
      },
    ]);

    // Verify 2 thumbnails appear in the drawer 3-column grid
    await expect(page.getByText("2 images", { exact: true })).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: testInfo.outputPath("03-drawer-filled.png"), fullPage: true });

    // 6. Click Save in Drawer and wait for PUT API response
    const saveInDrawerBtn = page.locator('.ant-drawer-extra button:has-text("Save")').first();
    const [putResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/admin/galleries/${testGalleryId}`) &&
          res.request().method() === "PUT",
        { timeout: 15000 },
      ),
      saveInDrawerBtn.click(),
    ]);

    expect(putResponse.ok(), "PUT API must succeed").toBeTruthy();
    const putResponseBody = await putResponse.json();
    console.log("PUT Response Body:", JSON.stringify(putResponseBody, null, 2));

    // 8. Verify Database Document directly in MongoDB
    const updatedDoc = await Gallery.findById(testGalleryId).lean();
    console.log("MongoDB Saved Document Items:", JSON.stringify(updatedDoc?.items, null, 2));

    expect(updatedDoc.items.length, "MongoDB must have 1 item").toBe(1);
    const savedItem = updatedDoc.items[0];
    expect(savedItem.title).toBe("Annual Convocation 2026");
    expect(savedItem.imageDesktop).toBe("https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800");
    expect(savedItem.images.length, "MongoDB item must have 2 images").toBe(2);

    // 9. Verify Live Preview on the Canvas
    await page.screenshot({ path: testInfo.outputPath("04-live-preview-updated.png"), fullPage: true });

    const previewTitle = page.locator('.gallery-card-title:has-text("Annual Convocation 2026")');
    await expect(previewTitle).toBeVisible({ timeout: 10000 });

    const previewImg = page.locator('.gallery-cover img[src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800"]');
    await expect(previewImg).toBeVisible({ timeout: 10000 });

    // Photo count should display 2 photos
    const photoCount = page.locator('text=2 photos');
    await expect(photoCount).toBeVisible({ timeout: 10000 });

    // 10. Test LightGallery click
    const albumCard = page.locator('.gallery-cover').first();
    await albumCard.click();

    // LightGallery container should open
    await expect(page.locator(".lg-outer")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: testInfo.outputPath("05-lightgallery-open.png"), fullPage: true });
  });

  test("should create, edit video gallery, extract YouTube IDs, save to DB, and render in live preview", async ({
    page,
    context,
  }, testInfo) => {
    // 1. Auth as admin
    await authenticateAdmin(context);

    // 2. Setup clean test video gallery in DB
    const stamp = Date.now();
    const testVideoGallery = await Gallery.create({
      name: `Playwright Video Gallery ${stamp}`,
      slug: `playwright-video-gallery-${stamp}`,
      shortcode: `pw-video-${stamp}`,
      type: "video",
      status: "published",
      tabs: ["All", "Education", "Medical"],
      items: [],
      config: {},
    });
    const videoGalleryId = String(testVideoGallery._id);

    try {
      // 3. Navigate to Edit Page
      await page.goto(`/admin/gallery/${videoGalleryId}/edit`, { waitUntil: "networkidle" });
      await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible({ timeout: 15000 });

      // 4. Open Settings Drawer
      await page.getByRole("button", { name: "Edit" }).first().click();
      await expect(page.locator(".ant-drawer-title")).toBeVisible({ timeout: 10000 });

      // 5. Fill Video Item Details
      const titleInput = page.locator('input[placeholder="Video title"]').first();
      await expect(titleInput).toBeVisible({ timeout: 5000 });
      await titleInput.fill("Education Support Program 2026");

      const videoUrlInput = page.locator('input[placeholder="e.g. Mny8ziStg4w"]').first();
      await expect(videoUrlInput).toBeVisible({ timeout: 5000 });
      await videoUrlInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      // 6. Click Save in Drawer and wait for PUT API
      const saveInDrawerBtn = page.locator('.ant-drawer-extra button:has-text("Save")').first();
      const [putResponse] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes(`/api/admin/galleries/${videoGalleryId}`) &&
            res.request().method() === "PUT",
          { timeout: 15000 },
        ),
        saveInDrawerBtn.click(),
      ]);

      expect(putResponse.ok(), "PUT API must succeed").toBeTruthy();

      // 7. Verify Database Document directly in MongoDB
      const updatedDoc = await Gallery.findById(videoGalleryId).lean();
      expect(updatedDoc.items.length, "MongoDB must have 1 video item").toBe(1);
      const savedVideo = updatedDoc.items[0];
      expect(savedVideo.title).toBe("Education Support Program 2026");
      expect(savedVideo.videoId, "YouTube URL must be normalized to video ID").toBe("dQw4w9WgXcQ");

      // 8. Verify Live Preview on the Canvas
      const previewTitle = page.getByText("Education Support Program 2026").first();
      await expect(previewTitle).toBeVisible({ timeout: 10000 });

      const previewThumb = page.locator('img[src*="dQw4w9WgXcQ"]').first();
      await expect(previewThumb).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: testInfo.outputPath("06-video-preview-rendered.png"), fullPage: true });
    } finally {
      await Gallery.deleteOne({ _id: videoGalleryId }).catch(() => {});
    }
  });
});
