import {
  getDefaultPopupProps,
  POPUP_STATUSES,
} from "@/lib/popupConstants";
import { normalizePopupTargetRoutes } from "@/lib/popupRouteUtils";
import { parseShortcodeInput } from "@/lib/shortcode";

export function normalizeModalWidthPreset(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "full" ||
    value === "custom"
  ) {
    return value;
  }
  return "medium";
}

export function normalizeCustomModalWidthPx(raw, fallback = 560) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(280, Math.min(1600, Math.round(value)));
}

export function normalizePopupLinkTarget(raw) {
  return String(raw || "").trim().toLowerCase() === "_blank"
    ? "_blank"
    : "_self";
}

export function isValidPopupLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("#")) return true;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
  return false;
}

export function normalizePopupStatus(raw, fallback = "draft") {
  const value = String(raw || "").trim().toLowerCase();
  return POPUP_STATUSES.includes(value) ? value : fallback;
}

export function sanitizePopupLink(input) {
  const linkInput = input && typeof input === "object" ? input : {};
  const enabled = linkInput.enabled === true;
  const target = normalizePopupLinkTarget(linkInput.target);
  const url = String(linkInput.url || "").trim();

  if (!enabled) {
    return {
      enabled: false,
      url: "",
      target,
    };
  }
  if (!isValidPopupLinkUrl(url)) {
    throw new Error("Invalid popup link URL");
  }
  return {
    enabled: true,
    url,
    target,
  };
}

function normalizePopupCtaStyle(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "secondary" || value === "outline") return value;
  return "primary";
}

export function sanitizePopupCtaButtons(rawButtons) {
  const list = Array.isArray(rawButtons) ? rawButtons : [];
  return list
    .slice(0, 3)
    .map((button, index) => {
      const label = String(button?.label || "").trim();
      if (!label) return null;
      return {
        id: String(button?.id || `cta_${index + 1}`),
        label: label.slice(0, 48),
        enabled: button?.enabled !== false,
        style: normalizePopupCtaStyle(button?.style),
      };
    })
    .filter(Boolean);
}

export function hasPopupPayloadShape(raw) {
  if (!raw || typeof raw !== "object") return false;
  const keys = [
    "targetRoutes",
    "imageUrl",
    "title",
    "description",
    "openOnPageLoad",
    "dismissible",
    "reShowBehavior",
    "priority",
    "animation",
    "modalWidthPreset",
    "customModalWidthPx",
    "link",
    "linkEnabled",
    "linkUrl",
    "linkTarget",
    "ctaButtons",
    "formShortcode",
    "delayMs",
  ];
  return keys.some((key) => raw[key] !== undefined);
}

function sanitizePopupFormShortcode(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  const parsed = parseShortcodeInput(value);
  if (parsed?.isValidFormat && parsed?.targetKey) {
    return String(parsed.normalized || "").trim();
  }
  return value;
}

export function sanitizePopupPayload(raw, options = {}) {
  const input = raw && typeof raw === "object" ? raw : {};
  const { requireTargetRoutes = true, requireImageUrl = true } = options;
  const targetRoutes = normalizePopupTargetRoutes(input.targetRoutes);
  if (requireTargetRoutes && targetRoutes.length === 0) {
    throw new Error("Popup requires at least one target route");
  }

  const imageUrl = String(input.imageUrl || "").trim();
  if (requireImageUrl && !imageUrl) {
    throw new Error("Popup image is required");
  }

  const reShowBehavior =
    input.reShowBehavior === "session_until_browser_close"
      ? "session_until_browser_close"
      : "always";

  const animationInput =
    input.animation && typeof input.animation === "object"
      ? input.animation
      : {};
  const durationMsRaw = Number(animationInput.durationMs);
  const durationMs =
    Number.isFinite(durationMsRaw) &&
    durationMsRaw >= 120 &&
    durationMsRaw <= 1500
      ? Math.round(durationMsRaw)
      : 280;

  const priorityRaw = Number(input.priority);
  const priority =
    Number.isFinite(priorityRaw) && priorityRaw >= 0 && priorityRaw <= 9999
      ? Math.round(priorityRaw)
      : 100;

  const modalWidthPreset = normalizeModalWidthPreset(input.modalWidthPreset);
  const customModalWidthPx = normalizeCustomModalWidthPx(
    input.customModalWidthPx,
    560,
  );

  const legacyLinkInput = {
    enabled: input.linkEnabled === true,
    url: input.linkUrl,
    target: input.linkTarget,
  };

  const link = sanitizePopupLink(
    input.link && typeof input.link === "object" ? input.link : legacyLinkInput,
  );

  return {
    ...getDefaultPopupProps(),
    targetRoutes,
    imageUrl,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    openOnPageLoad: input.openOnPageLoad !== false,
    dismissible: input.dismissible !== false,
    reShowBehavior,
    priority,
    animation: {
      durationMs,
    },
    modalWidthPreset,
    customModalWidthPx,
    link,
    ctaButtons: sanitizePopupCtaButtons(input.ctaButtons),
    formShortcode: sanitizePopupFormShortcode(input.formShortcode),
    delayMs:
      Number.isFinite(Number(input.delayMs)) && Number(input.delayMs) >= 0
        ? Number(input.delayMs)
        : 0,
  };
}
