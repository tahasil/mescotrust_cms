function normalizeRoutePath(pathname) {
  const raw = String(pathname || "").trim();
  if (!raw) return "/";
  const noQuery = raw.split("?")[0].split("#")[0];
  const withLeadingSlash = noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  if (collapsed.length === 1) return collapsed;
  return collapsed.replace(/\/+$/, "");
}

function getBlockBaseComponent(block) {
  if (!block || typeof block !== "object") return "";
  return (
    block.baseComponent ||
    (typeof block.componentId === "object" && block.componentId?.baseComponent) ||
    (typeof block.componentId === "string" ? block.componentId : "") ||
    ""
  );
}

function shouldHideSubscribeOnPath(pathname) {
  return normalizeRoutePath(pathname) === "/about-us/volunteer";
}

function filterGlobalComponentIdsForPath(componentIds) {
  if (!Array.isArray(componentIds)) return [];
  return componentIds.filter(
    (id) => String(id || "").trim() !== "Subscribe",
  );
}

function filterLayoutBlocksForPath(layoutBlocks, pathname) {
  if (!Array.isArray(layoutBlocks)) return [];
  if (!shouldHideSubscribeOnPath(pathname)) return layoutBlocks;
  return layoutBlocks.filter(
    (block) => String(getBlockBaseComponent(block)).trim() !== "Subscribe",
  );
}

export {
  normalizeRoutePath,
  shouldHideSubscribeOnPath,
  filterGlobalComponentIdsForPath,
  filterLayoutBlocksForPath,
};
