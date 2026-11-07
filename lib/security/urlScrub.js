/**
 * Removes dangerous links from saved CMS data, however deeply they're nested.
 *
 * The site has over 100 places that render a stored link, and many of them
 * reach `href`, `window.location` or an iframe `src` directly. React doesn't
 * block `javascript:` URLs, so instead of relying on each component, admin
 * routes clean what they save and the renderers clean what they read.
 * `sanitizeUrl` in `sanitize.js` is still the right tool for one known URL.
 *
 * No imports, so client components can use this and scripts can `require` it.
 */

// Browsers ignore control characters and spaces inside a URL's scheme, so
// "java\tscript:" still runs. Matching is done with them removed.
const IGNORED_IN_SCHEME = /[\u0000- ]/g;
const SCRIPT_SCHEME = /^(?:javascript|vbscript):/;
const DATA_SCHEME = /^data:/;
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);/;

// Dropdown parents in menus are saved with these. They do nothing when clicked.
const HARMLESS_PLACEHOLDER = /^javascript:(?:void\(0\);?|;?)$/;

// Measured against real content: links live in keys containing these words.
const LINK_KEY = /url|link|href|src/i;
const NON_LINK_KEY_SUFFIX = /(?:label|text|title|target|color|colour|enabled|new|tab)$/i;

// What a script has that a sentence doesn't. It keeps a heading like
// "JavaScript: The Good Parts (2nd edition)" out of the filter.
const LOOKS_LIKE_CODE = /\w\(|`|=/;

function isLinkKey(key) {
  return LINK_KEY.test(key) && !NON_LINK_KEY_SUFFIX.test(key);
}

/** True for a link that would run script, whatever its field is called. */
export function isUnsafeLink(value) {
  const compact = String(value ?? "").replace(IGNORED_IN_SCHEME, "").toLowerCase();
  if (SCRIPT_SCHEME.test(compact)) return !HARMLESS_PLACEHOLDER.test(compact);
  return DATA_SCHEME.test(compact) && !SAFE_DATA_IMAGE.test(compact);
}

function isUnsafeValue(value, key) {
  if (isLinkKey(key)) return isUnsafeLink(value);

  // Any other field is usually prose, so it needs to look like a real script.
  const raw = value.trimStart();
  const compact = raw.replace(IGNORED_IN_SCHEME, "").toLowerCase();
  if (!SCRIPT_SCHEME.test(compact) || HARMLESS_PLACEHOLDER.test(compact)) return false;
  const afterColon = raw.slice(raw.indexOf(":") + 1);
  return !/^\s/.test(afterColon) || LOOKS_LIKE_CODE.test(afterColon);
}

function isPlainObject(value) {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Returns the value with dangerous links emptied. Anything unchanged keeps its
 * identity, and dates, ObjectIds and other class instances are left alone.
 */
export function scrubUnsafeUrls(value, key = "") {
  if (typeof value === "string") {
    return isUnsafeValue(value, key) ? "" : value;
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const scrubbed = scrubUnsafeUrls(item, key);
      if (scrubbed !== item) changed = true;
      return scrubbed;
    });
    return changed ? next : value;
  }
  if (value && typeof value === "object" && isPlainObject(value)) {
    let next = value;
    for (const [childKey, child] of Object.entries(value)) {
      const scrubbed = scrubUnsafeUrls(child, childKey);
      if (scrubbed !== child) {
        if (next === value) next = { ...value };
        next[childKey] = scrubbed;
      }
    }
    return next;
  }
  return value;
}

/**
 * Last line of defence, run in the browser before React loads. Links that never
 * pass through the filters above, such as social feed posts from other
 * platforms, still can't run script. `a.protocol` is the browser's own reading
 * of the link, so disguised schemes are caught too.
 */
export const UNSAFE_LINK_GUARD_SCRIPT =
  'document.addEventListener("click",function(e){' +
  'var t=e.target,a=t&&t.closest&&t.closest("a[href]");' +
  'if(a&&(a.protocol==="javascript:"||a.protocol==="vbscript:"))e.preventDefault();' +
  "},true);";
