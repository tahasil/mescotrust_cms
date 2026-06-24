const UTM_MEDIUM = "social";
const UTM_CAMPAIGN = "content_share";

const PLATFORM_KEYS = [
  "facebook",
  "x",
  "linkedin",
  "whatsapp",
  "telegram",
  "email",
  "copy",
] as const;

export type SharePlatform = (typeof PLATFORM_KEYS)[number];

export const SHARE_PLATFORMS: SharePlatform[] = [...PLATFORM_KEYS];

export type ShareData = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
};

export type ShareMetadataInput = {
  canonicalUrl?: string;
  url?: string;
  title?: string;
  metaTitle?: string;
  description?: string;
  metaDescription?: string;
  shortDescription?: string;
  excerpt?: string;
  featuredImageDesktop?: string;
  featuredImage?: string;
  featuredImageMobile?: string;
  seoImage?: string;
  globalFallbackImage?: string;
};

function toTrimmedString(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function isHttpLikeUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function toAbsoluteUrl(url: string, baseUrl?: string): string {
  const rawUrl = toTrimmedString(url);
  const rawBase = toTrimmedString(baseUrl);

  if (!rawUrl) return "";

  try {
    if (isHttpLikeUrl(rawUrl)) {
      return new URL(rawUrl).toString();
    }

    if (!rawBase) return "";
    return new URL(rawUrl, rawBase).toString();
  } catch {
    return "";
  }
}

export function buildCanonicalUrl(baseUrl: string, pathname: string): string {
  const cleanBase = toTrimmedString(baseUrl).replace(/\/+$/, "");
  const cleanPath = `/${toTrimmedString(pathname).replace(/^\/+/, "")}`;

  const absolute = toAbsoluteUrl(cleanPath, cleanBase);
  if (absolute) return absolute;

  return `${cleanBase}${cleanPath}`;
}

export function getGlobalFallbackImageFromTheme(theme: Record<string, unknown> | null | undefined): string {
  if (!theme) return "";

  const candidates = [
    theme.defaultMetaImage,
    theme.seoImage,
    theme.ogImage,
    theme.socialShareImage,
    theme.logoLightUrl,
    theme.logoImageUrl,
    theme.logoMobileUrl,
    theme.logoDarkUrl,
    theme.faviconUrl,
  ];

  for (const candidate of candidates) {
    const value = toTrimmedString(candidate);
    if (value) return value;
  }

  return "";
}

export function resolveShareMetadata(input: ShareMetadataInput): ShareData {
  const title =
    toTrimmedString(input.metaTitle) || toTrimmedString(input.title) || "";

  const description =
    toTrimmedString(input.metaDescription) ||
    toTrimmedString(input.shortDescription) ||
    toTrimmedString(input.excerpt) ||
    toTrimmedString(input.description) ||
    "";

  const image =
    toTrimmedString(input.featuredImageDesktop) ||
    toTrimmedString(input.featuredImage) ||
    toTrimmedString(input.featuredImageMobile) ||
    toTrimmedString(input.seoImage) ||
    toTrimmedString(input.globalFallbackImage) ||
    "";

  const url =
    toTrimmedString(input.canonicalUrl) || toTrimmedString(input.url) || "";

  return { title, description, image, url };
}

export function buildTrackedUrl(url: string, platform: SharePlatform): string {
  const clean = toTrimmedString(url);
  if (!clean || platform === "copy") return clean;

  try {
    const tracked = new URL(clean);
    tracked.searchParams.set("utm_source", platform);
    tracked.searchParams.set("utm_medium", UTM_MEDIUM);
    tracked.searchParams.set("utm_campaign", UTM_CAMPAIGN);
    return tracked.toString();
  } catch {
    return clean;
  }
}

function encode(value: string): string {
  return encodeURIComponent(toTrimmedString(value));
}

export function generateShareUrl(platform: SharePlatform, data: ShareData): string {
  const cleanUrl = toTrimmedString(data.url);
  const title = toTrimmedString(data.title);
  const trackedUrl = buildTrackedUrl(cleanUrl, platform);
  const text = [title, trackedUrl].filter(Boolean).join(" ").trim();

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encode(trackedUrl)}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${encode(trackedUrl)}&text=${encode(title)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encode(trackedUrl)}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encode(text)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encode(trackedUrl)}&text=${encode(title)}`;
    case "email": {
      const subject = title;
      const body = [title, trackedUrl].filter(Boolean).join("\n");
      return `mailto:?subject=${encode(subject)}&body=${encode(body)}`;
    }
    case "copy":
    default:
      return cleanUrl;
  }
}

export async function copyShareLink(url: string): Promise<boolean> {
  const cleanUrl = toTrimmedString(url);
  if (!cleanUrl) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      return true;
    } catch {
      // fallback below
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = cleanUrl;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

