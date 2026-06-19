const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeRequestedSize,
  normalizeRequestedFormat,
  pickVariantUrl,
} = require("../lib/media/delivery");

function makeMedia(overrides = {}) {
  return {
    url: "/uploads/original.jpg",
    originalUrl: "/uploads/original.jpg",
    webpUrl: "/uploads/original.webp",
    avifUrl: "/uploads/original.avif",
    generatedSizes: {
      original: {
        jpgUrl: "/uploads/original.jpg",
        webpUrl: "/uploads/original.webp",
        avifUrl: "/uploads/original.avif",
      },
    },
    ...overrides,
  };
}

test("normalizeRequestedSize maps all values to original-only selection", () => {
  assert.equal(normalizeRequestedSize("original"), "");
  assert.equal(normalizeRequestedSize(" Original "), "");
  assert.equal(normalizeRequestedSize("desktop"), "");
  assert.equal(normalizeRequestedSize("medium"), "");
  assert.equal(normalizeRequestedSize("thumbnail"), "");
  assert.equal(normalizeRequestedSize("any-unknown-size"), "");
});

test("normalizeRequestedFormat only allows webp/avif for conversion path", () => {
  assert.equal(normalizeRequestedFormat("webp"), "webp");
  assert.equal(normalizeRequestedFormat(" AVIF "), "avif");
  assert.equal(normalizeRequestedFormat("auto"), "");
  assert.equal(normalizeRequestedFormat("original"), "");
});

test("original + webp uses original webp and keeps original variant", () => {
  const media = makeMedia();
  const url = pickVariantUrl(media, "original", "webp");
  assert.equal(url, "/uploads/original.webp");
});

test("legacy size request still resolves to original delivery", () => {
  const media = makeMedia({
    generatedSizes: {
      desktop: {
        jpgUrl: "/uploads/desktop.jpg",
        webpUrl: "/uploads/desktop.webp",
        avifUrl: "/uploads/desktop.avif",
      },
    },
  });

  assert.equal(pickVariantUrl(media, "desktop", "webp"), "/uploads/original.webp");
  assert.equal(pickVariantUrl(media, "medium", "avif"), "/uploads/original.avif");
  assert.equal(pickVariantUrl(media, "thumbnail", "jpg"), "/uploads/original.jpg");
});

test("auto format fallback order is webp -> avif -> original/jpg", () => {
  const media = makeMedia({
    webpUrl: "",
    generatedSizes: { original: { jpgUrl: "/uploads/original.jpg", webpUrl: "", avifUrl: "/uploads/original.avif" } },
  });
  assert.equal(pickVariantUrl(media, "original", "auto"), "/uploads/original.avif");

  const mediaWithoutWebpOrAvif = makeMedia({
    webpUrl: "",
    avifUrl: "",
    generatedSizes: { original: { jpgUrl: "/uploads/original.jpg", webpUrl: "", avifUrl: "" } },
  });
  assert.equal(pickVariantUrl(mediaWithoutWebpOrAvif, "desktop", "auto"), "/uploads/original.jpg");
});

test("explicit format fallback stays within original set", () => {
  const media = makeMedia({
    webpUrl: "",
    avifUrl: "",
    generatedSizes: {
      original: {
        jpgUrl: "/uploads/original.jpg",
        webpUrl: "",
        avifUrl: "",
      },
    },
  });
  assert.equal(pickVariantUrl(media, "desktop", "webp"), "/uploads/original.jpg");
  assert.equal(pickVariantUrl(media, "mobile", "avif"), "/uploads/original.jpg");
  assert.equal(pickVariantUrl(media, "large", "original"), "/uploads/original.jpg");
});
