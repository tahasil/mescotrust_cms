/**
 * Admin list search/filter state helpers.
 *
 * Admin list pages remember their search box and filters in `sessionStorage` so
 * that going into an edit screen and coming back keeps the list filtered.
 *
 * Restoring on *every* visit is wrong: leaving Pages for another admin section and
 * coming back should show a clean list, not the previous search.
 *
 * These helpers restore the stored value only when the page was actually reached
 * through browser back/forward (or when the value is present in the URL).
 */

const HISTORY_NAV_FLAG = "__mescoAdminHistoryNav";
const HISTORY_NAV_TTL_MS = 1500;

/** Call from a long-lived client shell so a popstate is visible to mounting pages. */
export function markAdminHistoryNavigation() {
  if (typeof window === "undefined") return;
  window[HISTORY_NAV_FLAG] = true;
  window.setTimeout(() => {
    window[HISTORY_NAV_FLAG] = false;
  }, HISTORY_NAV_TTL_MS);
}

/** True when the current document/mount came from browser back or forward. */
export function isAdminHistoryNavigation() {
  if (typeof window === "undefined") return false;
  if (window[HISTORY_NAV_FLAG] === true) return true;
  const entry = window.performance?.getEntriesByType?.("navigation")?.[0];
  if (entry?.type === "back_forward") return true;
  // Legacy browsers: 1 === TYPE_BACK_FORWARD
  return window.performance?.navigation?.type === 1;
}

/**
 * Resolves the initial value for a search box / filter.
 * URL value wins; the stored value is only reused on back/forward navigation.
 */
export function resolveAdminStoredFilter(storageKey, urlValue) {
  const cleanUrl = urlValue == null ? "" : String(urlValue).trim();
  if (cleanUrl) return cleanUrl;
  if (!storageKey) return "";
  if (!isAdminHistoryNavigation()) return "";
  try {
    return sessionStorage.getItem(storageKey) || "";
  } catch {
    return "";
  }
}

/**
 * Clears every stored admin search / filter so a sidebar navigation always lands
 * on a clean list. List *caches* (e.g. `*-list-cache-*`) are kept — they only
 * speed up loading and are not user-visible state.
 */
export function clearStoredAdminFilters() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key) keys.push(key);
    }
    keys.forEach((key) => {
      const isAdminKey = key.startsWith("admin-");
      const isSearchOrFilter =
        key.includes("search") || key.includes("filter");
      const isCache = key.includes("cache");
      if (isAdminKey && isSearchOrFilter && !isCache) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // sessionStorage unavailable (private mode / disabled) — nothing to clear.
  }
}
