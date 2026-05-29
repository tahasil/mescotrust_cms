function stripQueryAndHash(path) {
  const raw = String(path || "").trim();
  if (!raw) return "/";
  return raw.split("#")[0].split("?")[0] || "/";
}

function ensureLeadingSlash(path) {
  const raw = String(path || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function collapseSlashes(path) {
  return String(path || "").replace(/\/{2,}/g, "/");
}

function stripTrailingSlash(path) {
  const raw = String(path || "");
  if (raw === "/") return raw;
  return raw.replace(/\/+$/, "") || "/";
}

export function normalizePopupRoute(path) {
  const withNoQuery = stripQueryAndHash(path).toLowerCase();
  const withSlash = ensureLeadingSlash(withNoQuery);
  const collapsed = collapseSlashes(withSlash);
  const cleaned = stripTrailingSlash(collapsed);
  if (cleaned === "/" || cleaned === "/home") return "/home";
  return cleaned;
}

export function normalizePopupTargetRoutes(routes) {
  if (!Array.isArray(routes)) return [];
  const normalized = routes
    .map((route) => normalizePopupRoute(route))
    .filter(Boolean);
  return [...new Set(normalized)];
}

export function isPopupRouteMatch(currentRoute, targetRoutes) {
  const current = normalizePopupRoute(currentRoute);
  const targets = normalizePopupTargetRoutes(targetRoutes);
  return targets.includes(current);
}

