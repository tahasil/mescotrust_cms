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
    "photoGalleryTabs",
    "photoGalleryItems",
  ].forEach((field) => assert.match(source, new RegExp(field)));
});
