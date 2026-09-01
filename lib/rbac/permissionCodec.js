import { PERMISSION_CATALOG_VERSION, buildPermissionDefinitions } from "@/lib/rbac/catalog";

// The session JWT travels as a cookie, so it is echoed in a Set-Cookie header on
// every sign-in and in a Cookie header on every request. Spelling out all 92
// catalog permissions costs ~1.5KB of JSON there; a bitmask over the catalog
// order costs 24 hex characters and carries exactly the same information.
export const WILDCARD_PERMISSION_CODE = "*";

let orderCache = null;
let indexCache = null;

function getCatalogOrder() {
  if (!orderCache) {
    orderCache = buildPermissionDefinitions().map((definition) => definition.key);
  }
  return orderCache;
}

function getCatalogIndex() {
  if (!indexCache) {
    indexCache = new Map();
    getCatalogOrder().forEach((key, position) => indexCache.set(key, position));
  }
  return indexCache;
}

/**
 * Pack permission keys into a hex bitmask over the current catalog order.
 * Super admins carry the wildcard verbatim, so their snapshot stays valid
 * regardless of catalog changes.
 */
export function encodePermissionKeys(permissionKeys) {
  const keys = Array.isArray(permissionKeys) ? permissionKeys : [];
  if (keys.includes(WILDCARD_PERMISSION_CODE)) return WILDCARD_PERMISSION_CODE;

  const index = getCatalogIndex();
  const bytes = new Uint8Array(Math.ceil(getCatalogOrder().length / 8));
  for (const key of keys) {
    const position = index.get(String(key || "").trim().toLowerCase());
    if (position === undefined) continue;
    bytes[position >> 3] |= 1 << (position & 7);
  }

  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

/**
 * Expand a bitmask back into permission keys. Returns null when the snapshot
 * cannot be trusted — a catalog version the mask was not built against, or a
 * malformed value — so callers can fall back to role defaults instead of
 * silently granting or revoking access.
 */
export function decodePermissionKeys(encoded, catalogVersion) {
  const value = String(encoded ?? "");
  if (value === WILDCARD_PERMISSION_CODE) return [WILDCARD_PERMISSION_CODE];
  if (value === "") return [];
  if (String(catalogVersion || "") !== PERMISSION_CATALOG_VERSION) return null;
  if (value.length % 2 !== 0 || !/^[0-9a-f]+$/.test(value)) return null;

  const order = getCatalogOrder();
  const keys = [];
  for (let position = 0; position < order.length; position += 1) {
    const byteOffset = (position >> 3) * 2;
    if (byteOffset + 2 > value.length) break;
    const byte = Number.parseInt(value.slice(byteOffset, byteOffset + 2), 16);
    if (byte & (1 << (position & 7))) keys.push(order[position]);
  }
  return keys;
}

/**
 * Read the permission snapshot off a next-auth JWT, tolerating tokens issued
 * before the bitmask existed. Null means "unknown, resolve it another way".
 */
export function readTokenPermissionKeys(token) {
  if (!token) return null;
  if (typeof token.pk === "string") return decodePermissionKeys(token.pk, token.pkc);
  if (Array.isArray(token.permissionKeys)) return token.permissionKeys;
  return null;
}

export function isPermissionSnapshotStale(token) {
  if (typeof token?.pk !== "string") return true;
  if (token.pk === WILDCARD_PERMISSION_CODE) return false;
  return String(token?.pkc || "") !== PERMISSION_CATALOG_VERSION;
}

export function writeTokenPermissionKeys(token, permissionKeys) {
  token.pk = encodePermissionKeys(permissionKeys);
  token.pkc = PERMISSION_CATALOG_VERSION;
  // Purge the expanded list left behind by pre-bitmask sessions.
  delete token.permissionKeys;
  return token;
}
