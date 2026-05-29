function toTrimmedString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizePathname(pathname) {
  const raw = toTrimmedString(pathname);
  if (!raw) return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const normalized = withLeadingSlash.replace(/\/+$/, "") || "/";
  return normalized;
}

function decodeHashId(rawHash) {
  const hash = toTrimmedString(rawHash).replace(/^#/, "");
  if (!hash) return "";
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

function getElementByIdSafe(id) {
  if (typeof document === "undefined") return null;
  const rawId = toTrimmedString(id);
  if (!rawId) return null;
  const directMatch = document.getElementById(rawId);
  if (directMatch) return directMatch;
  const decodedId = decodeHashId(rawId);
  if (decodedId && decodedId !== rawId) {
    const decodedMatch = document.getElementById(decodedId);
    if (decodedMatch) return decodedMatch;
  }
  // Case-insensitive fallback to avoid CMS input case mismatches.
  const lookup = (decodedId || rawId).toLowerCase();
  const allWithIds = document.querySelectorAll("[id]");
  for (const node of allWithIds) {
    if (!(node instanceof HTMLElement)) continue;
    if (
      String(node.id || "")
        .trim()
        .toLowerCase() === lookup
    )
      return node;
  }
  return null;
}

export function extractHashIdFromHref(href) {
  if (typeof window === "undefined") return "";
  const rawHref = toTrimmedString(href);
  if (!rawHref || rawHref === "#") return "";

  if (rawHref.startsWith("#")) {
    return decodeHashId(rawHref);
  }

  let parsed;
  try {
    parsed = new URL(rawHref, window.location.href);
  } catch {
    return "";
  }

  const hashId = decodeHashId(parsed.hash);
  if (!hashId) return "";
  if (parsed.origin !== window.location.origin) return "";

  const currentPath = normalizePathname(window.location.pathname);
  const targetPath = normalizePathname(parsed.pathname);
  if (currentPath !== targetPath) return "";

  return hashId;
}

export function resolveSamePageHashFromHref(href) {
  const hashId = extractHashIdFromHref(href);
  if (!hashId) return null;

  return {
    hashId,
    hash: `#${hashId}`,
  };
}

export function getStickyHeaderOffset(extraOffset = 12) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 0;
  }

  const candidates = Array.from(
    document.querySelectorAll(
      "header, [data-sticky-header='true'], [data-site-header='true']",
    ),
  );

  let maxBottom = 0;
  candidates.forEach((node) => {
    if (!node || !(node instanceof HTMLElement)) return;
    const style = window.getComputedStyle(node);
    const isStickyLike =
      style.position === "fixed" || style.position === "sticky";
    if (
      !isStickyLike ||
      style.display === "none" ||
      style.visibility === "hidden"
    ) {
      return;
    }
    const rect = node.getBoundingClientRect();
    if (rect.height <= 0 || rect.bottom <= 0) return;
    if (rect.top > 24) return;
    maxBottom = Math.max(maxBottom, rect.bottom);
  });

  const fallback = window.matchMedia("(max-width: 991px)").matches ? 56 : 88;
  const baseOffset = maxBottom > 0 ? maxBottom : fallback;
  const safeExtra = Number.isFinite(Number(extraOffset))
    ? Number(extraOffset)
    : 0;
  return Math.max(0, Math.round(baseOffset + safeExtra));
}

export function smoothScrollToSectionId(sectionId, { updateHash = true } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const target = getElementByIdSafe(sectionId);
  if (!target) return false;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  // Keep target content visible below fixed/sticky header.
  // Product requirement: section should stop 100px below viewport top.
  const offset = 200;
  const top = Math.max(
    0,
    Math.round(window.scrollY + target.getBoundingClientRect().top - offset),
  );

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  if (updateHash) {
    const nextHash = `#${encodeURIComponent(toTrimmedString(sectionId))}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }

  return true;
}

export function trySmoothScrollFromHref(href, { target = "_self" } = {}) {
  const resolvedTarget =
    toTrimmedString(target).toLowerCase() === "_blank" ? "_blank" : "_self";
  if (resolvedTarget !== "_self") return false;

  const hashTarget = resolveSamePageHashFromHref(href);
  if (!hashTarget?.hashId) return false;

  return smoothScrollToSectionId(hashTarget.hashId, { updateHash: true });
}
