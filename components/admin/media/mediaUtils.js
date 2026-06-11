import { formatDateTime } from "@/lib/formatDate";
import { buildMediaVariantUrl } from "@/lib/media/url";

export const PAGE_SIZE = 24;

export const GENERATED_SIZE_ORDER = [
  ["original", "Original"],
  ["thumbnail", "Thumb"],
  ["medium", "Medium"],
  ["large", "Large"],
  ["mobile", "Mobile"],
  ["desktop", "Desktop"],
];

export function isImage(item) {
  return String(item?.mimeType || "").startsWith("image/");
}

export function formatBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** power;
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[power]}`;
}

export function formatDate(dateValue) {
  return formatDateTime(dateValue);
}

export function monthLabel(monthValue) {
  const match = String(monthValue || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return monthValue || "";
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function mediaProxyUrl(item, { size = "", format = "" } = {}) {
  const id = String(item?._id || "").trim();
  if (!id) return "";
  if (!size && !format) return `/media/${id}`;
  return buildMediaVariantUrl(id, {
    size: size || "original",
    format: format || "auto",
  });
}

export function getSizeVariant(item, key) {
  if (!item) {
    return {
      width: 0,
      height: 0,
      size: 0,
      jpgUrl: "",
      webpUrl: "",
      avifUrl: "",
    };
  }

  if (String(key || "") === "original") {
    return {
      width: Number(item?.width) || 0,
      height: Number(item?.height) || 0,
      size: Number(item?.originalSize || item?.size) || 0,
      jpgUrl: item?.originalUrl || item?.url || "",
      webpUrl: item?.webpUrl || "",
      avifUrl: item?.avifUrl || "",
    };
  }

  const variant = item?.generatedSizes?.[key] || {};
  return {
    width: Number(variant?.width) || 0,
    height: Number(variant?.height) || 0,
    size: Number(variant?.size) || 0,
    jpgUrl: variant?.jpgUrl || "",
    webpUrl: variant?.webpUrl || "",
    avifUrl: variant?.avifUrl || "",
  };
}

export function previewUrl(item) {
  if (!isImage(item)) return "";
  const proxy = mediaProxyUrl(item, { size: "thumbnail", format: "auto" });
  if (proxy) return proxy;
  const thumb = getSizeVariant(item, "thumbnail");
  const medium = getSizeVariant(item, "medium");
  const original = getSizeVariant(item, "original");
  return (
    thumb.jpgUrl ||
    thumb.webpUrl ||
    thumb.avifUrl ||
    medium.jpgUrl ||
    medium.webpUrl ||
    medium.avifUrl ||
    original.jpgUrl ||
    original.webpUrl ||
    original.avifUrl ||
    ""
  );
}

export function originalMediaUrl(item) {
  const proxy = mediaProxyUrl(item, { size: "original", format: "jpg" });
  return proxy || item?.originalUrl || item?.url || "";
}

export function publicMediaUrl(item) {
  const proxy = mediaProxyUrl(item, { size: "original", format: "auto" });
  return proxy || item?.publicUrl || item?.url || item?.originalUrl || "";
}

export function dimensionsText(item) {
  const w = Number(item?.width) || 0;
  const h = Number(item?.height) || 0;
  if (!w || !h) return "-";
  return `${w} x ${h}`;
}

export function mergeById(current, incomingItems) {
  if (!Array.isArray(incomingItems) || incomingItems.length === 0) return current;
  const byId = new Map(incomingItems.map((it) => [String(it._id), it]));
  return current.map((item) => byId.get(String(item._id)) || item);
}

export async function readJson(res) {
  return res.json().catch(() => ({}));
}
