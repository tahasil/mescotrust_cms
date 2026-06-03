import { RBAC_ACTIONS, ROLE_KEYS, normalizeRoleKey } from "@/lib/rbac/constants";

const BASE_ACTIONS = ["view", "create", "edit", "delete", "manage", "publish", "settings_access"];

const MODULE_DEFINITIONS = Object.freeze([
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "pages", label: "Pages", actions: BASE_ACTIONS },
  { key: "components", label: "Components", actions: BASE_ACTIONS },
  { key: "forms", label: "Forms", actions: BASE_ACTIONS },
  // Sliders are a fixed core set (CORE_SLIDER_COMPONENT_IDS) — they can be viewed
  // and edited, but not created or deleted. Offering "create" was misleading: the
  // toggle gated nothing (there is no Add-Slider flow), so it's intentionally
  // omitted here. Re-add it only if a real custom-slider creation feature lands.
  { key: "sliders", label: "Sliders", actions: ["view", "edit", "manage", "settings_access"] },
  { key: "popups", label: "Popups", actions: BASE_ACTIONS },
  { key: "team", label: "Team", actions: BASE_ACTIONS },
  { key: "portfolio", label: "Portfolio", actions: BASE_ACTIONS },
  { key: "blogs", label: "Blogs", actions: BASE_ACTIONS },
  { key: "events", label: "Events", actions: BASE_ACTIONS },
  { key: "media", label: "Media", actions: BASE_ACTIONS },
  { key: "appearance", label: "Appearance", actions: BASE_ACTIONS },
  { key: "contacts", label: "Contacts", actions: BASE_ACTIONS },
  { key: "submissions", label: "Submissions", actions: BASE_ACTIONS },
  // MESCO-only modules (TSUV→MESCO port, decision 6.4). Default level: Super Admin
  // + Admin full access, Editor blocked (these keys are intentionally NOT in
  // EDITOR_ALLOWED_MODULES below). Volunteer rides on the `contacts` module (it has
  // no dedicated API — it reads /api/admin/contacts?submissionType=volunteer).
  { key: "donations", label: "Donations", actions: BASE_ACTIONS },
  { key: "event-registrations", label: "Event Registrations", actions: BASE_ACTIONS },
  { key: "subscribers", label: "Subscribers", actions: BASE_ACTIONS },
  {
    key: "users",
    label: "Users",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "manage",
      "user_management",
      "role_management",
    ],
  },
  {
    key: "rbac",
    label: "Roles & Permissions",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "manage",
      "user_management",
      "role_management",
    ],
  },
  { key: "system", label: "System", actions: ["view", "manage"] },
]);

const MODULE_MAP = new Map(MODULE_DEFINITIONS.map((item) => [item.key, item]));
const ACTION_LABEL_MAP = Object.freeze({
  view: "View Access",
  create: "Add/Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage",
  publish: "Publish",
  settings_access: "Settings Access",
  user_management: "User Management",
  role_management: "Roles & Permissions Management",
});

const PAGE_RULES = Object.freeze([
  { prefix: "/admin/forbidden", permission: null },
  { prefix: "/admin/users", permission: "users.user_management" },
  { prefix: "/admin/rbac", permission: "rbac.role_management" },
  { prefix: "/admin/theme", permission: "appearance.settings_access" },
  { prefix: "/admin/appearance", permission: "appearance.settings_access" },
  { prefix: "/admin/menus", permission: "appearance.settings_access" },
  { prefix: "/admin/pages/new", permission: "pages.create" },
  { prefix: "/admin/pages/", permission: "pages.edit" },
  { prefix: "/admin/components/new", permission: "components.create" },
  { prefix: "/admin/components/theme-components/new", permission: "components.create" },
  { prefix: "/admin/components/theme-components/", permission: "components.edit" },
  { prefix: "/admin/components/theme-components", permission: "components.view" },
  { prefix: "/admin/components/", permission: "components.edit" },
  { prefix: "/admin/forms/", permission: "forms.edit" },
  { prefix: "/admin/sliders/", permission: "sliders.edit" },
  { prefix: "/admin/popups/", permission: "popups.edit" },
  { prefix: "/admin/team/new", permission: "team.create" },
  { prefix: "/admin/team/categories", permission: "team.manage" },
  { prefix: "/admin/team/", permission: "team.edit" },
  { prefix: "/admin/portfolio/new", permission: "portfolio.create" },
  { prefix: "/admin/portfolio/categories", permission: "portfolio.manage" },
  { prefix: "/admin/portfolio/", permission: "portfolio.edit" },
  { prefix: "/admin/blogs/new", permission: "blogs.create" },
  { prefix: "/admin/blogs/", permission: "blogs.edit" },
  { prefix: "/admin/events/new", permission: "events.create" },
  { prefix: "/admin/events/", permission: "events.edit" },
  { prefix: "/admin/media/bulk-optimize", permission: "media.manage" },
  { prefix: "/admin/media/settings", permission: "media.settings_access" },
  { prefix: "/admin/media", permission: "media.view" },
  { prefix: "/admin/components", permission: "components.view" },
  { prefix: "/admin/component", permission: "components.view" },
  { prefix: "/admin/forms", permission: "forms.view" },
  { prefix: "/admin/sliders", permission: "sliders.view" },
  { prefix: "/admin/popups", permission: "popups.view" },
  { prefix: "/admin/team", permission: "team.view" },
  { prefix: "/admin/portfolio", permission: "portfolio.view" },
  { prefix: "/admin/blog-categories", permission: "blogs.manage" },
  { prefix: "/admin/blog-comments", permission: "blogs.manage" },
  { prefix: "/admin/blogs", permission: "blogs.view" },
  { prefix: "/admin/events", permission: "events.view" },
  { prefix: "/admin/submission", permission: "submissions.view" },
  { prefix: "/admin/submissions", permission: "submissions.view" },
  // MESCO-only admin pages (port decision 6.4). `/admin/event-registrations` must be
  // listed; it does not collide with `/admin/events` (neither is a prefix of the other).
  { prefix: "/admin/donations", permission: "donations.view" },
  { prefix: "/admin/event-registrations", permission: "event-registrations.view" },
  { prefix: "/admin/subscribers", permission: "subscribers.view" },
  { prefix: "/admin/volunteer-form", permission: "contacts.view" },
  { prefix: "/admin/contacts", permission: "contacts.view" },
  { prefix: "/admin/pages", permission: "pages.view" },
  { prefix: "/admin", permission: "dashboard.view" },
]);

const API_SEGMENT_TO_MODULE = Object.freeze({
  appearance: "appearance",
  "title-and-colors-config": "appearance",
  blogs: "blogs",
  "blog-categories": "blogs",
  "blog-comments": "blogs",
  components: "components",
  "site-components": "components",
  forms: "forms",
  "form-submissions": "submissions",
  sliders: "sliders",
  popups: "popups",
  teams: "team",
  "team-categories": "team",
  portfolio: "portfolio",
  "portfolio-categories": "portfolio",
  media: "media",
  pages: "pages",
  contacts: "contacts",
  notifications: "dashboard",
  events: "events",
  // MESCO-only admin API segments (port decision 6.4).
  donations: "donations",
  "event-registrations": "event-registrations",
  subscribers: "subscribers",
  users: "users",
  roles: "rbac",
  permissions: "rbac",
  menus: "appearance",
  fonts: "appearance",
});

const API_EXACT_RULES = Object.freeze([
  { prefix: "/api/admin/users", methods: ["*"], permission: "users.user_management" },
  { prefix: "/api/admin/rbac/roles", methods: ["POST", "PUT", "PATCH", "DELETE"], permission: "rbac.role_management" },
  { prefix: "/api/admin/rbac/permissions", methods: ["*"], permission: "rbac.role_management" },
  { prefix: "/api/admin/media/settings", methods: ["*"], permission: "media.settings_access" },
  { prefix: "/api/admin/appearance", methods: ["*"], permission: "appearance.settings_access" },
  { prefix: "/api/admin/title-and-colors-config", methods: ["*"], permission: "appearance.settings_access" },
  { prefix: "/api/admin/menus", methods: ["*"], permission: "appearance.settings_access" },
  { prefix: "/api/theme", methods: ["POST", "PUT", "PATCH", "DELETE"], permission: "appearance.settings_access" },
]);

const MENU_PERMISSION_MAP = Object.freeze({
  "/admin": "dashboard.view",
  "/admin/pages": "pages.view",
  "/admin/components": "components.view",
  "/admin/components/theme-components": "components.view",
  "/admin/forms": "forms.view",
  "/admin/sliders": "sliders.view",
  "/admin/popups": "popups.view",
  "/admin/team": "team.view",
  "/admin/team/new": "team.create",
  "/admin/team/categories": "team.manage",
  "/admin/portfolio": "portfolio.view",
  "/admin/portfolio/new": "portfolio.create",
  "/admin/portfolio/categories": "portfolio.manage",
  "/admin/blogs": "blogs.view",
  "/admin/blogs/new": "blogs.create",
  "/admin/blog-categories": "blogs.manage",
  "/admin/blog-comments": "blogs.manage",
  "/admin/events": "events.view",
  "/admin/events/new": "events.create",
  "/admin/media": "media.view",
  "/admin/media/bulk-optimize": "media.manage",
  "/admin/media/settings": "media.settings_access",
  "/admin/appearance": "appearance.settings_access",
  "/admin/appearance/header": "appearance.settings_access",
  "/admin/appearance/footer": "appearance.settings_access",
  "/admin/appearance/menu": "appearance.settings_access",
  "/admin/appearance/background": "appearance.settings_access",
  "/admin/appearance/colors": "appearance.settings_access",
  "/admin/appearance/layouts": "appearance.settings_access",
  "/admin/appearance/loader": "appearance.settings_access",
  "/admin/appearance/advanced": "appearance.settings_access",
  "/admin/appearance/branding": "appearance.settings_access",
  "/admin/submissions": "submissions.view",
  "/admin/contacts": "contacts.view",
  // MESCO-only admin nav (port decision 6.4).
  "/admin/donations": "donations.view",
  "/admin/event-registrations": "event-registrations.view",
  "/admin/subscribers": "subscribers.view",
  "/admin/volunteer-form": "contacts.view",
  "/admin/menus": "appearance.settings_access",
  "/admin/theme": "appearance.settings_access",
  "/admin/users": "users.user_management",
  "/admin/rbac/roles": "rbac.role_management",
});

const EDITOR_ALLOWED_MODULES = new Set([
  "dashboard",
  "pages",
  "components",
  "forms",
  "sliders",
  "popups",
  "team",
  "portfolio",
  "blogs",
  "events",
  "media",
  "contacts",
  "submissions",
]);

const EDITOR_BLOCKED_ACTIONS = new Set([
  "create",
  "delete",
  "manage",
  "publish",
  "settings_access",
  "user_management",
  "role_management",
]);

function startsWithRule(pathname, rules) {
  const path = String(pathname || "");
  return rules.find((rule) => path.startsWith(rule.prefix)) || null;
}

function normalizePathname(pathname) {
  return String(pathname || "").split("?")[0];
}

function buildPermissionKey(moduleKey, actionKey) {
  return `${moduleKey}.${actionKey}`;
}

function resolveApiAction(pathname, method) {
  const upperMethod = String(method || "GET").toUpperCase();
  if (pathname.includes("/publish")) return "publish";
  if (pathname.includes("/reorder")) return "manage";
  if (pathname.includes("/seed")) return "manage";
  if (pathname.includes("/ensure")) return "manage";
  if (pathname.includes("/settings")) return "settings_access";
  if (pathname.includes("/jobs")) return "manage";
  if (pathname.includes("/bulk")) return "manage";
  if (upperMethod === "GET" || upperMethod === "HEAD") return "view";
  if (upperMethod === "POST") return "create";
  if (upperMethod === "PUT" || upperMethod === "PATCH") return "edit";
  if (upperMethod === "DELETE") return "delete";
  return "manage";
}

function resolveApiModule(pathname) {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length < 3) return null;
  if (segments[0] !== "api" || segments[1] !== "admin") return null;
  const segment = String(segments[2] || "").toLowerCase();
  return API_SEGMENT_TO_MODULE[segment] || null;
}

export function getPermissionForAdminPage(pathname) {
  const normalized = normalizePathname(pathname);
  const rule = startsWithRule(normalized, PAGE_RULES);
  return rule ? rule.permission : null;
}

export function getPermissionForAdminApi(pathname, method) {
  const normalized = normalizePathname(pathname);
  const specialRule = API_EXACT_RULES.find((rule) => {
    if (!normalized.startsWith(rule.prefix)) return false;
    if (rule.methods.includes("*")) return true;
    return rule.methods.includes(String(method || "").toUpperCase());
  });
  if (specialRule) return specialRule.permission;

  const moduleKey = resolveApiModule(normalized);
  if (!moduleKey) return null;
  const action = resolveApiAction(normalized, method);
  return buildPermissionKey(moduleKey, action);
}

export function getPermissionForMenuKey(menuKey) {
  const key = String(menuKey || "");
  if (key.startsWith("/admin/submission/") || key.startsWith("/admin/submissions/")) {
    return "submissions.view";
  }
  return MENU_PERMISSION_MAP[key] || null;
}

export function buildPermissionDefinitions() {
  const list = [];
  for (const moduleDef of MODULE_DEFINITIONS) {
    for (const action of moduleDef.actions) {
      if (!RBAC_ACTIONS.includes(action)) continue;
      const key = buildPermissionKey(moduleDef.key, action);
      const isProtected = action === "role_management" || key === "rbac.manage";
      const actionLabel = ACTION_LABEL_MAP[action] || action.replace(/_/g, " ");
      list.push({
        key,
        module: moduleDef.key,
        action,
        label: `${moduleDef.label} - ${actionLabel}`,
        description: `${moduleDef.label} ${actionLabel}`,
        isProtected,
      });
    }
  }
  return list;
}

export function getDefaultPermissionKeysForRole(roleKeyInput) {
  const roleKey = normalizeRoleKey(roleKeyInput);
  const definitions = buildPermissionDefinitions();

  if (roleKey === ROLE_KEYS.SUPER_ADMIN) {
    return new Set(definitions.map((item) => item.key));
  }

  if (roleKey === ROLE_KEYS.ADMIN) {
    return new Set(definitions.filter((item) => !item.isProtected).map((item) => item.key));
  }

  if (roleKey === ROLE_KEYS.EDITOR) {
    return new Set(
      definitions
        .filter((item) => EDITOR_ALLOWED_MODULES.has(item.module))
        .filter((item) => !EDITOR_BLOCKED_ACTIONS.has(item.action))
        .map((item) => item.key),
    );
  }

  return new Set(
    definitions
      .filter((item) => item.module === "dashboard" && item.action === "view")
      .map((item) => item.key),
  );
}

export function getSystemRoleSeedDefinitions() {
  return [
    {
      key: ROLE_KEYS.SUPER_ADMIN,
      name: "Super Admin",
      description: "Full unrestricted administrative access",
      priority: 1000,
      isSystem: true,
      isActive: true,
    },
    {
      key: ROLE_KEYS.ADMIN,
      name: "Admin",
      description: "Administrative access with delegation constraints",
      priority: 500,
      isSystem: true,
      isActive: true,
    },
    {
      key: ROLE_KEYS.EDITOR,
      name: "Editor",
      description: "Content operations access",
      priority: 100,
      isSystem: true,
      isActive: true,
    },
  ];
}

export function getAllRbacActions() {
  return [...RBAC_ACTIONS];
}

export function getModuleDefinition(moduleKey) {
  return MODULE_MAP.get(moduleKey) || null;
}

export function hasKnownModule(moduleKey) {
  return MODULE_MAP.has(moduleKey);
}
