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
      desktop: {
        jpgUrl: "/uploads/desktop.jpg",
        webpUrl: "",
        avifUrl: "",
      },
      medium: {
        jpgUrl: "/uploads/medium.jpg",
        webpUrl: "/uploads/medium.webp",
        avifUrl: "/uploads/medium.avif",
      },
    },
    ...overrides,
  };
}

test("normalizeRequestedSize treats 'original' as no explicit variant", () => {
  assert.equal(normalizeRequestedSize("original"), "");
  assert.equal(normalizeRequestedSize(" Original "), "");
  assert.equal(normalizeRequestedSize("desktop"), "desktop");
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

test("explicit variant + missing webp does not fall back to root webp", () => {
  const media = makeMedia({
    generatedSizes: {
      desktop: {
        jpgUrl: "/uploads/desktop.jpg",
        webpUrl: "",
        avifUrl: "",
      },
    },
  });

  const url = pickVariantUrl(media, "desktop", "webp");
  assert.equal(
    url,
    "/uploads/desktop.jpg",
    "desktop webp fallback must remain in desktop variant",
  );
});

test("explicit variant + missing avif/webp uses same-variant jpg fallback", () => {
  const media = makeMedia({
    generatedSizes: {
      desktop: {
        jpgUrl: "/uploads/desktop.jpg",
        webpUrl: "",
        avifUrl: "",
      },
    },
    webpUrl: "/uploads/original.webp",
    avifUrl: "/uploads/original.avif",
  });

  assert.equal(pickVariantUrl(media, "desktop", "avif"), "/uploads/desktop.jpg");
  assert.equal(pickVariantUrl(media, "desktop", "auto"), "/uploads/desktop.jpg");
});

test("explicit variant with available format stays on that variant", () => {
  const media = makeMedia();
  const url = pickVariantUrl(media, "medium", "webp");
  assert.equal(url, "/uploads/medium.webp");
});
