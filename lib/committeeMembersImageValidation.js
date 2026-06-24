import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const COMMITTEE_MEMBERS_DESKTOP_REQUIRED_WIDTH = 290;
export const COMMITTEE_MEMBERS_DESKTOP_REQUIRED_HEIGHT = 400;
export const COMMITTEE_MEMBERS_DESKTOP_REQUIRED_TEXT =
  `${COMMITTEE_MEMBERS_DESKTOP_REQUIRED_WIDTH} \u00D7 ${COMMITTEE_MEMBERS_DESKTOP_REQUIRED_HEIGHT} px`;

function resolveDesktopImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  const directValue = item.imageDesktop ?? item.image ?? "";
  if (typeof directValue === "string") return String(directValue).trim();
  if (directValue && typeof directValue === "object") {
    const nestedValue =
      directValue.url ??
      directValue.originalUrl ??
      directValue.publicUrl ??
      directValue.src ??
      "";
    return String(nestedValue || "").trim();
  }
  return String(directValue || "").trim();
}

export async function validateCommitteeMembersImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = Array.isArray(props?.committeeMembersItems)
    ? props.committeeMembersItems
    : [];
  if (items.length === 0) return [];

  const cache = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const imageUrl = resolveDesktopImageUrl(items[index]);
    if (!imageUrl) continue;

    try {
      let dims = cache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        cache.set(imageUrl, dims);
      }

      const width = Number(dims?.width) || 0;
      const height = Number(dims?.height) || 0;
      if (
        width === COMMITTEE_MEMBERS_DESKTOP_REQUIRED_WIDTH &&
        height === COMMITTEE_MEMBERS_DESKTOP_REQUIRED_HEIGHT
      ) {
        continue;
      }

      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Member #${index + 1} Desktop Image must be exactly ${COMMITTEE_MEMBERS_DESKTOP_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ];
    } catch {
      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Unable to validate member #${index + 1} desktop image size. Please use ${COMMITTEE_MEMBERS_DESKTOP_REQUIRED_TEXT}.`,
      ];
    }
  }

  return [];
}
