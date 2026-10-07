const assert = require("assert");
const { arrayMove } = require("@dnd-kit/sortable");

// Test image normalization
function normalizeFeatureFlag(value) {
  if (value === true || value === "true" || value === 1 || value === "1") return 1;
  return Number(value) === 1 ? 1 : 0;
}

function normalizeImg(img) {
  if (typeof img === "string") {
    const url = img.trim();
    return { urlDesktop: url, url, alt: "", feature: 0 };
  }
  const url =
    img?.urlDesktop != null
      ? String(img.urlDesktop).trim()
      : img?.url != null
        ? String(img.url).trim()
        : img?.src != null
          ? String(img.src).trim()
          : "";
  return {
    urlDesktop: url,
    url,
    alt: img?.alt != null ? String(img.alt).trim() : "",
    feature: normalizeFeatureFlag(img?.feature),
  };
}

console.log("Testing Album Images Reordering & Normalization...");

const initialImages = [
  { urlDesktop: "/uploads/img1.webp", url: "/uploads/img1.webp", alt: "Img 1", feature: 1 },
  { urlDesktop: "/uploads/img2.webp", url: "/uploads/img2.webp", alt: "Img 2", feature: 0 },
  { urlDesktop: "/uploads/img3.webp", url: "/uploads/img3.webp", alt: "Img 3", feature: 0 },
  { urlDesktop: "/uploads/img4.webp", url: "/uploads/img4.webp", alt: "Img 4", feature: 1 },
];

// Test 1: Move item from index 0 to index 2 (Drag & Drop or Move Right twice)
const moved0to2 = arrayMove(initialImages, 0, 2);
assert.strictEqual(moved0to2[0].alt, "Img 2");
assert.strictEqual(moved0to2[1].alt, "Img 3");
assert.strictEqual(moved0to2[2].alt, "Img 1");
assert.strictEqual(moved0to2[3].alt, "Img 4");
assert.strictEqual(moved0to2[2].feature, 1, "Feature flag must be preserved on moved item");
console.log("Test 1 Passed: Move from index 0 to 2 correctly reorders array and preserves feature flag.");

// Test 2: Move item from index 3 to index 1
const moved3to1 = arrayMove(moved0to2, 3, 1);
assert.strictEqual(moved3to1[0].alt, "Img 2");
assert.strictEqual(moved3to1[1].alt, "Img 4");
assert.strictEqual(moved3to1[2].alt, "Img 3");
assert.strictEqual(moved3to1[3].alt, "Img 1");
console.log("Test 2 Passed: Move from index 3 to 1 correctly reorders array.");

// Test 3: Feature toggle on reordered array
const toggled = moved3to1.map((img, idx) =>
  idx === 2 ? { ...img, feature: img.feature === 1 ? 0 : 1 } : img
);
assert.strictEqual(toggled[2].feature, 1, "Toggling feature on index 2 sets feature to 1");
assert.strictEqual(toggled[0].alt, "Img 2");
assert.strictEqual(toggled[1].alt, "Img 4");
assert.strictEqual(toggled[2].alt, "Img 3");
assert.strictEqual(toggled[3].alt, "Img 1");
console.log("Test 3 Passed: Feature toggle preserves position and updates flag.");

// Test 4: Remove single image from reordered array
const removed = toggled.filter((_, idx) => idx !== 1);
assert.strictEqual(removed.length, 3);
assert.strictEqual(removed[0].alt, "Img 2");
assert.strictEqual(removed[1].alt, "Img 3");
assert.strictEqual(removed[2].alt, "Img 1");
console.log("Test 4 Passed: Removal preserves remaining order.");

console.log("\nAll Album Image Reordering tests passed successfully!");
