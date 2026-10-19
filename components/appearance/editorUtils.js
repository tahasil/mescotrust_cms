export const LINK_TARGET_OPTIONS = [
  { value: "_self", label: "Same Tab (_self)" },
  { value: "_blank", label: "New Tab (_blank)" },
];

export function normalizeTarget(value) {
  return String(value || "").trim() === "_blank" ? "_blank" : "_self";
}

export function normalizeLinkItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    label: String(item?.label || ""),
    url: String(item?.url || ""),
    target: normalizeTarget(item?.target),
  }));
}

export function normalizeSocialItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    platform: String(item?.platform || "website"),
    url: String(item?.url || ""),
    target: normalizeTarget(item?.target),
  }));
}

export function menuItemsToNavItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.enabled !== false)
    .map((item) => {
      const children = menuItemsToNavItems(item?.children);
      return {
        label: String(item?.label || ""),
        url:
          String(item?.url || "").trim() ||
          (item?.type === "page" && item?.pageSlug
            ? `/${String(item.pageSlug).replace(/^\/+/, "")}`
            : "#"),
        openInNewTab:
          item?.openInNewTab === true || item?.target === "_blank",
        target:
          item?.target === "modal" || item?.type === "modal"
            ? "modal"
            : item?.openInNewTab === true || item?.target === "_blank"
              ? "_blank"
              : "_self",
        hasDropdown: children.length > 0,
        children,
      };
    });
}
