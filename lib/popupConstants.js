export const CORE_POPUP_COMPONENT_IDS = ["MarketingPopup"];

export const CORE_POPUP_LABELS = {
  MarketingPopup: "Marketing Popup",
};

export const POPUP_STATUSES = ["draft", "published"];

export function isCorePopupComponentId(componentId) {
  return CORE_POPUP_COMPONENT_IDS.includes(String(componentId || "").trim());
}

export function derivePopupComponentId(displayName) {
  if (!displayName || typeof displayName !== "string") return "";
  let base = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!/^[a-zA-Z]/.test(base) && base.length) base = `C${base}`;
  return base;
}

export function getDefaultPopupProps() {
  return {
    targetRoutes: ["/home"],
    imageUrl: "",
    title: "",
    description: "",
    openOnPageLoad: true,
    dismissible: true,
    reShowBehavior: "always",
    priority: 100,
    animation: {
      durationMs: 280,
    },
    modalWidthPreset: "medium",
    customModalWidthPx: 560,
    link: {
      enabled: false,
      url: "",
      target: "_self",
    },
    ctaButtons: [],
    formShortcode: "",
    delayMs: 0,
  };
}
