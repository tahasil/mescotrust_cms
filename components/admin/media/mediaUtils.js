export const PAGE_SIZE = 24;

export const GENERATED_SIZE_ORDER = [
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
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function monthLabel(monthValue) {
  const match = String(monthValue || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return monthValue || "";
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function previewUrl(item) {
  if (!isImage(item)) return "";
  return (
    item?.generatedSizes?.thumbnail?.jpgUrl ||
    item?.generatedSizes?.medium?.jpgUrl ||
    item?.url ||
    item?.originalUrl ||
    ""
  );
}

export function publicMediaUrl(item) {
  return item?.publicUrl || item?.url || item?.originalUrl || "";
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
