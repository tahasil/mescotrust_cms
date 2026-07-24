const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("PhotoGallery preserves managed wrappers and responsive grid design", () => {
  const source = readFile("components/site/PhotoGallery/PhotoGallery.js");
  assert.match(source, /<FullWidthBackground className=\{sectionBgClassName\} \$managedStyle=\{sectionBgStyle\}>/);
  assert.match(source, /<PageContainer \$managedStyle=\{pageContainerBgStyle\}>/);
  assert.match(source, /grid-template-columns:\s*repeat\(var\(--gallery-columns\)/);
  assert.match(source, /@media \(max-width: 991px\)/);
  assert.match(source, /@media \(max-width: 620px\)/);
  assert.match(source, /16 \/ 9\.6/);
  assert.match(source, /object-fit:\s*contain/);
  assert.match(source, /object-position:\s*center/);
  assert.doesNotMatch(source, /object-fit:\s*cover/);
  assert.doesNotMatch(source, /&:hover img\s*\{[^}]*scale\(/);
});

test("PhotoGallery defers cards and opens the selected album with one dynamic lightbox", () => {
  const source = readFile("components/site/PhotoGallery/PhotoGallery.js");
  assert.match(source, /loading="lazy"/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /content-visibility:\s*auto/);
  assert.match(source, /import\("lightgallery"\)/);
  assert.match(source, /dynamic:\s*true/);
  assert.match(source, /dynamicEl:\s*slides/);
  assert.match(source, /lightboxRef\.current\.refresh\(slides\)/);
  assert.match(source, /lightboxRef\.current\.openGallery\(0\)/);
  assert.match(source, /preload:\s*2/);
  assert.doesNotMatch(source, /galleryRefs\.current\[photo\.itemIndex\]/);
});

test("PhotoGallery drawer persists reusable display and typography settings", () => {
  const source = readFile("components/site/PhotoGallery/EditForm.js");
  [
    "photoGalleryTitleVisible",
    "photoGallerySubTitleVisible",
    "photoGalleryFiltersVisible",
    "photoGalleryPhotoCountVisible",
    "photoGalleryHoverArrowVisible",
    "photoGalleryColumns",
    "photoGalleryGridGap",
    "photoGalleryAspectRatio",
    "photoGalleryCardShadow",
    "photoGalleryOverlayOpacity",
    "photoGalleryTitleFontSize",
    "photoGalleryCardTitleFontSize",
    "photoGalleryModalTitleColorKey",
    "photoGalleryTabs",
    "photoGalleryItems",
  ].forEach((field) => assert.match(source, new RegExp(field)));
});

test("PhotoGallery exposes and applies the complete card color set", () => {
  const config = readFile("lib/titleAndColorsConfig.js");
  const editForm = readFile("components/site/PhotoGallery/EditForm.js");
  const renderer = readFile("components/site/PhotoGallery/PhotoGallery.js");
  const fields = [
    "photoGalleryCardBgColorKey",
    "photoGalleryCardBorderColorKey",
    "photoGalleryCardShadowColorKey",
    "photoGalleryCardTitleColorKey",
    "photoGalleryCardDescriptionColorKey",
    "photoGalleryDateColorKey",
    "photoGalleryButtonBgColorKey",
    "photoGalleryButtonTextColorKey",
    "photoGalleryButtonBorderColorKey",
    "photoGalleryButtonHoverBgColorKey",
    "photoGalleryButtonHoverTextColorKey",
    "photoGalleryButtonHoverBorderColorKey",
    "photoGalleryOverlayColorKey",
    "photoGalleryOverlayTextColorKey",
    "photoGallerySectionBgColorKey",
    "photoGalleryTitleColorKey",
    "photoGallerySubTitleColorKey",
  ];

  fields.forEach((field) => {
    assert.match(config, new RegExp(field));
    assert.match(editForm, new RegExp(field));
    assert.match(renderer, new RegExp(field));
  });
  assert.match(renderer, /--gallery-button-hover-bg/);
  assert.match(renderer, /--gallery-overlay/);
  assert.match(renderer, /--gallery-card-shadow-color/);
});
