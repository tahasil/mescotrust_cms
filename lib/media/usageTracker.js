const { connectDB } = require("../db");
const mongoose = require("mongoose");
const Media = require("../../models/Media");
const Blog = require("../../models/Blog");
const Event = require("../../models/Event");
const Page = require("../../models/Page");
const {
  normalizeUrlValue,
  toComparableMediaUrl,
  extractMediaIdFromUrl,
  looksLikeMediaReference,
} = require("./url");

function normalizeUrl(url) {
  return normalizeUrlValue(url);
}

function collectMediaUrlsFromUnknown(input, bucket = new Set(), seen = new WeakSet()) {
  if (!input) return bucket;

  if (typeof input === "string") {
    const value = normalizeUrl(input);
    if (value && looksLikeMediaReference(value)) bucket.add(value);
    return bucket;
  }

  if (Array.isArray(input)) {
    for (const item of input) collectMediaUrlsFromUnknown(item, bucket, seen);
    return bucket;
  }

  if (typeof input === "object") {
    if (seen.has(input)) return bucket;
    seen.add(input);

    for (const key of Object.keys(input)) {
      if (key.startsWith("$") || key.startsWith("__")) continue;
      collectMediaUrlsFromUnknown(input[key], bucket, seen);
    }
  }

  return bucket;
}

async function setMediaUsageByUrl(url, usageEntry) {
  const u = normalizeUrl(url);
  if (!u) return;
  const comparable = toComparableMediaUrl(u);
  await connectDB();

  const mediaId = extractMediaIdFromUrl(u);
  if (mediaId && mongoose.Types.ObjectId.isValid(mediaId)) {
    await Media.updateOne(
      { _id: mediaId },
      { $addToSet: { usedIn: usageEntry } },
    );
    return;
  }

  await Media.updateOne(
    {
      $or: [
        { url: u },
        { url: comparable },
        { originalUrl: u },
        { originalUrl: comparable },
        { webpUrl: u },
        { webpUrl: comparable },
        { avifUrl: u },
        { avifUrl: comparable },
        { publicUrl: u },
        { publicUrl: comparable },
      ],
    },
    { $addToSet: { usedIn: usageEntry } },
  );
}

async function clearUsageForRef(refType, refId) {
  if (!refId) return;
  await connectDB();
  await Media.updateMany(
    {},
    {
      $pull: {
        usedIn: {
          type: String(refType || ""),
          refId: String(refId),
        },
      },
    },
  );
}

async function syncMediaUsageForBlog(blog) {
  if (!blog?._id) return;
  await clearUsageForRef("blog", blog._id);
  const urls = [blog.featuredImage, blog.featuredImageMobile].filter(Boolean);
  for (const url of urls) {
    await setMediaUsageByUrl(url, {
      type: "blog",
      refId: String(blog._id),
      field: url === blog.featuredImage ? "featuredImage" : "featuredImageMobile",
      label: blog.title || "Blog",
    });
  }
}

async function syncMediaUsageForEvent(eventDoc) {
  if (!eventDoc?._id) return;
  await clearUsageForRef("event", eventDoc._id);
  const urls = [eventDoc.featuredImageDesktop, eventDoc.featuredImageMobile].filter(Boolean);
  for (const url of urls) {
    await setMediaUsageByUrl(url, {
      type: "event",
      refId: String(eventDoc._id),
      field:
        url === eventDoc.featuredImageDesktop
          ? "featuredImageDesktop"
          : "featuredImageMobile",
      label: eventDoc.title || "Event",
    });
  }
}

async function syncMediaUsageForPage(pageDoc) {
  if (!pageDoc?._id) return;
  await clearUsageForRef("page", pageDoc._id);

  // Convert Mongoose document/subdocuments to plain JSON-safe data before deep scan.
  const plainLayout = Array.isArray(pageDoc.layout)
    ? JSON.parse(JSON.stringify(pageDoc.layout))
    : [];

  const urls = Array.from(
    collectMediaUrlsFromUnknown(plainLayout),
  );

  for (const url of urls) {
    await setMediaUsageByUrl(url, {
      type: "page",
      refId: String(pageDoc._id),
      field: "layout",
      label: pageDoc.title || pageDoc.slug || "Page",
    });
  }
}

async function rebuildUsageIndexForBlogsEventsAndPages() {
  await connectDB();
  const [blogs, events, pages] = await Promise.all([
    Blog.find().select("_id title featuredImage featuredImageMobile").lean(),
    Event.find().select("_id title featuredImageDesktop featuredImageMobile").lean(),
    Page.find().select("_id title slug layout").lean(),
  ]);
  for (const b of blogs) await syncMediaUsageForBlog(b);
  for (const e of events) await syncMediaUsageForEvent(e);
  for (const p of pages) await syncMediaUsageForPage(p);
}

module.exports = {
  setMediaUsageByUrl,
  clearUsageForRef,
  syncMediaUsageForBlog,
  syncMediaUsageForEvent,
  syncMediaUsageForPage,
  rebuildUsageIndexForBlogsEventsAndPages,
};
