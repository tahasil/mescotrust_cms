const CANONICAL_ROLE_BY_KEY = {
  admin: "Admin",
  administrator: "Admin",
  superadmin: "Admin",
  superadministrator: "Admin",
  editor: "Editor",
  contenteditor: "Editor",
  author: "Author",
  contentauthor: "Author",
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const DEFAULT_SUPER_ADMIN_EMAILS = ["superadmin@aiolos.cloud"];
const ENV_SUPER_ADMIN_EMAILS = String(process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((v) => normalizeEmail(v))
  .filter(Boolean);

const SUPER_ADMIN_EMAILS = new Set([
  ...DEFAULT_SUPER_ADMIN_EMAILS.map((v) => normalizeEmail(v)),
  ...ENV_SUPER_ADMIN_EMAILS,
]);

function toRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function readRoleValue(input) {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return "";
  if (typeof input.role === "string") return input.role;
  if (typeof input.user?.role === "string") return input.user.role;
  return "";
}

function readEmailValue(input) {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return "";
  if (typeof input.email === "string") return input.email;
  if (typeof input.user?.email === "string") return input.user.email;
  return "";
}

export function isSuperAdminEmail(email) {
  return SUPER_ADMIN_EMAILS.has(normalizeEmail(email));
}

export function isSuperAdmin(input) {
  return isSuperAdminEmail(readEmailValue(input));
}

export function normalizeRole(input) {
  if (isSuperAdmin(input)) return "Admin";
  const raw = readRoleValue(input);
  if (!raw) return "";
  const canonical = CANONICAL_ROLE_BY_KEY[toRoleKey(raw)];
  if (canonical) return canonical;
  return String(raw).trim();
}

export function isAdmin(input) {
  return isSuperAdmin(input) || normalizeRole(input) === "Admin";
}

export function isEditor(input) {
  return normalizeRole(input) === "Editor";
}

export function isAuthor(input) {
  return normalizeRole(input) === "Author";
}
