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

export function normalizeRole(input) {
  const raw = readRoleValue(input);
  if (!raw) return "";
  const canonical = CANONICAL_ROLE_BY_KEY[toRoleKey(raw)];
  if (canonical) return canonical;
  return String(raw).trim();
}

export function isAdmin(input) {
  return normalizeRole(input) === "Admin";
}

export function isEditor(input) {
  return normalizeRole(input) === "Editor";
}

export function isAuthor(input) {
  return normalizeRole(input) === "Author";
}
