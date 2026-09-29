const { test, expect } = require("@playwright/test");
const { encode } = require("next-auth/jwt");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: ".env" });

const User = require("../models/User");
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

const sampleImagePath = path.join(process.cwd(), "public", "images", "about-mesco-1.png");

async function uploadAndVerifyCropModal(page, {
  triggerLocator,
  expectedWidth,
  expectedHeight,
  expectedPresets = [],
  confirm = true,
}) {
  // 1. Scroll and click choose/replace button to open Media Library
  await triggerLocator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await expect(triggerLocator).toBeVisible({ timeout: 10000 });
  await triggerLocator.click();

  // 2. Wait for Media Library modal
  const mediaLibraryModal = page.locator('.ant-modal-content:has(.ant-modal-title:has-text("Media Library"))').last();
  await expect(mediaLibraryModal).toBeVisible({ timeout: 15000 });

  // 3. Upload the sample image file
  const fileInput = mediaLibraryModal.locator('input[type="file"]').first();
  await fileInput.setInputFiles(sampleImagePath);

  // 4. Wait for Crop image before upload modal
  const cropModal = page.locator('.ant-modal-content:has(.ant-modal-title:has-text("Crop image before upload"))').last();
  await expect(cropModal).toBeVisible({ timeout: 20000 });

  // 5. Verify Output settings Width and Height
  const widthInput = cropModal.locator('input[placeholder="Width"]').first();
  const heightInput = cropModal.locator('input[placeholder="Height"]').first();

  await expect(widthInput).toHaveValue(String(expectedWidth), { timeout: 10000 });
  await expect(heightInput).toHaveValue(String(expectedHeight), { timeout: 10000 });

  // 6. Verify preset buttons if any
  for (const preset of expectedPresets) {
    const presetBtn = cropModal.locator(`button:has-text("${preset.width} × ${preset.height}")`).first();
    await expect(presetBtn).toBeVisible({ timeout: 5000 });
  }

  // 7. Verify Output label displays the resolution
  const outputText = cropModal.locator('text=Output').locator("xpath=following-sibling::div[1]").first();
  await expect(outputText).toContainText(`${expectedWidth} x ${expectedHeight}`);

  if (confirm) {
    // Click "Confirm crop" button
    const confirmBtn = cropModal.locator('button.ant-btn-primary:has-text("Confirm crop")').first();
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Wait for Crop modal to close
    await expect(cropModal).toBeHidden({ timeout: 20000 });
  } else {
    // Cancel modal
    const cancelBtn = cropModal.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();
    await expect(cropModal).toBeHidden({ timeout: 10000 });
  }

  // Close media library if still open
  if (await mediaLibraryModal.isVisible()) {
    const closeBtn = mediaLibraryModal.locator('.ant-modal-close').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click().catch(() => {});
    }
  }
}

test.describe("Dynamic Image Crop and Dimension Validation Across CMS", () => {
  test.beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  test.afterAll(async () => {
    // Cleanup any test media uploaded during testing
    await Media.deleteMany({ originalName: /about-mesco-1/i }).catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });

  test("1. Verify Blog Creation Desktop Image crop defaults to 1200 x 1000 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/blogs/new");
    await page.waitForLoadState("networkidle");

    const chooseBtn = page.locator('.ant-card:has-text("Desktop Image") button:has-text("Choose"), .ant-card:has-text("Desktop Image") button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 1200,
      expectedHeight: 1000,
      confirm: true,
    });
  });

  test("2. Verify Event Creation Desktop Image crop defaults to 800 x 400 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/events/new");
    await page.waitForLoadState("networkidle");

    const chooseBtn = page.locator('.ant-card:has-text("Desktop Image") button:has-text("Choose"), .ant-card:has-text("Desktop Image") button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 800,
      expectedHeight: 400,
      confirm: true,
    });
  });

  test("3. Verify Popups Image crop defaults to 600 x 600 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/popups");
    await page.waitForLoadState("networkidle");

    // Click Edit on the first popup in table
    const editLink = page.locator('.ant-table tbody tr a:has-text("Edit"), .ant-table tbody tr button:has-text("Edit")').first();
    await expect(editLink).toBeVisible({ timeout: 10000 });
    await editLink.click();
    await page.waitForLoadState("networkidle");

    // Click "Edit" in PopupEditorPage to open settings drawer
    const openDrawerBtn = page.locator('button.ant-btn-primary:has-text("Edit")').first();
    await expect(openDrawerBtn).toBeVisible({ timeout: 10000 });
    await openDrawerBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Open "Popup Content" collapse if closed
    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Popup Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('.ant-form-item:has-text("Popup image") button').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('.ant-form-item:has-text("Popup image") button:has-text("Choose"), .ant-form-item:has-text("Popup image") button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 600,
      expectedHeight: 600,
      confirm: true,
    });
  });

  test("4. Verify OverviewOfOurWork Component crop defaults to 700 x 550 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/components/OverviewOfOurWork/edit");
    await page.waitForLoadState("networkidle");

    // Open component edit drawer
    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Open "Content" collapse if closed
    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('.ant-collapse-content:has-text("Cards per row")').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    // If no item exists, click "Add item"
    const addItemBtn = drawer.locator('button:has-text("Add item")').first();
    if (await addItemBtn.isVisible()) {
      const chooseCount = await drawer.locator('button:has-text("Choose"), button:has-text("Replace")').count();
      if (chooseCount === 0) {
        await addItemBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Expand first item collapse if collapsed
    const itemHeader = drawer.locator('.ant-collapse-item .ant-collapse-header').first();
    if (await itemHeader.isVisible()) {
      const isExpanded = await itemHeader.getAttribute("aria-expanded");
      if (isExpanded === "false") {
        await itemHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 700,
      expectedHeight: 550,
      expectedPresets: [
        { width: 700, height: 550 },
        { width: 580, height: 704 },
      ],
      confirm: true,
    });
  });

  test("5. Verify VideoPlaying Component crop defaults to 2164 x 1200 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/components/VideoPlaying/edit");
    await page.waitForLoadState("networkidle");

    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 2164,
      expectedHeight: 1200,
      confirm: true,
    });
  });

  test("6. Verify Cards Component crop defaults to 210 x 170 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/components/Cards/edit");
    await page.waitForLoadState("networkidle");

    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 210,
      expectedHeight: 170,
      confirm: true,
    });
  });

  test("7. Verify StoriesSlider Component crop defaults to 800 x 415 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/components/StoriesSlider/edit");
    await page.waitForLoadState("networkidle");

    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 800,
      expectedHeight: 415,
      confirm: true,
    });
  });

  test("8. Verify PhotoGallery Component crop defaults to 446 x 334 px", async ({ page, context }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/components/PhotoGallery/edit");
    await page.waitForLoadState("networkidle");

    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    const drawer = page.locator('.ant-drawer-content').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const contentHeader = drawer.locator('.ant-collapse-header:has-text("Content")').first();
    if (await contentHeader.isVisible()) {
      const isExpanded = await contentHeader.getAttribute("aria-expanded");
      if (isExpanded === "false" || !(await drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first().isVisible())) {
        await contentHeader.click();
        await page.waitForTimeout(400);
      }
    }

    const chooseBtn = drawer.locator('button:has-text("Choose"), button:has-text("Replace")').first();
    await uploadAndVerifyCropModal(page, {
      triggerLocator: chooseBtn,
      expectedWidth: 446,
      expectedHeight: 334,
      confirm: true,
    });
  });
});
