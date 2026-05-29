function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function hasPublishedSnapshot(page) {
  if (!isObject(page)) return false;
  if (toSafeString(page.publishedSlug)) return true;
  if ((Number(page.publishedRevision) || 0) > 0) return true;
  if (page.publishedAt) return true;
  if (hasOwn(page, "publishedLayout") && Array.isArray(page.publishedLayout)) return true;
  if (toSafeString(page.publishedTitle) && page.status === "published") return true;
  return false;
}

export function getPublishedSlug(page) {
  const published = toSafeString(page?.publishedSlug);
  if (published) return published;
  return toSafeString(page?.slug);
}

export function getPublishedTitle(page) {
  const published = toSafeString(page?.publishedTitle);
  if (published) return published;
  return toSafeString(page?.title);
}

export function getPublishedMeta(page) {
  if (isObject(page?.publishedMeta)) return page.publishedMeta;
  if (isObject(page?.meta)) return page.meta;
  return {};
}

export function getPublishedLayout(page) {
  // If the field exists (even as empty array), it is authoritative for live output.
  if (hasOwn(page, "publishedLayout") && Array.isArray(page?.publishedLayout)) {
    return page.publishedLayout;
  }
  return Array.isArray(page?.layout) ? page.layout : [];
}

export function toPublishedPageShape(page) {
  if (!isObject(page)) return null;
  return {
    ...page,
    slug: getPublishedSlug(page),
    title: getPublishedTitle(page),
    meta: getPublishedMeta(page),
    layout: getPublishedLayout(page),
  };
}

export function buildPublishedSlugFilter(slug, locale) {
  const safeSlug = toSafeString(slug);
  const filter = {
    status: "published",
    isDeleted: { $ne: 1 },
    $or: [
      { publishedSlug: safeSlug },
      { publishedSlug: { $exists: false }, slug: safeSlug },
      { publishedSlug: null, slug: safeSlug },
      { publishedSlug: "", slug: safeSlug },
    ],
  };
  if (toSafeString(locale)) filter.locale = locale;
  return filter;
}

export function buildPublishedSlugConflictFilter(slug, excludeId) {
  const safeSlug = toSafeString(slug);
  const filter = {
    status: "published",
    isDeleted: { $ne: 1 },
    $or: [
      { publishedSlug: safeSlug },
      { publishedSlug: { $exists: false }, slug: safeSlug },
      { publishedSlug: null, slug: safeSlug },
      { publishedSlug: "", slug: safeSlug },
    ],
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return filter;
}

export function extractCurrentPublishedSnapshot(page) {
  if (!isObject(page)) return null;
  if (!(page.status === "published" || hasPublishedSnapshot(page))) return null;
  return {
    slug: getPublishedSlug(page),
    title: getPublishedTitle(page),
    layout: getPublishedLayout(page),
    meta: getPublishedMeta(page),
    publishedAt: page?.publishedAt || null,
    publishedBy: toSafeString(page?.publishedBy),
    publishedRevision: Number(page?.publishedRevision) || 0,
  };
}

export function applyPublishedSnapshot(page, draftValues, publishedBy) {
  if (!page || !draftValues) return;
  page.publishedSlug = draftValues.slug;
  page.publishedTitle = draftValues.title;
  page.publishedLayout = Array.isArray(draftValues.layout) ? draftValues.layout : [];
  page.publishedMeta = isObject(draftValues.meta) ? draftValues.meta : {};
  page.publishedAt = new Date();
  page.publishedBy = toSafeString(publishedBy);
  page.publishedRevision = (Number(page.publishedRevision) || 0) + 1;
}
