import { RBAC_ACTIONS, ROLE_KEYS, normalizeRoleKey } from "@/lib/rbac/constants";

export const PERMISSION_CATALOG_VERSION = "mescotrust-admin-v8-2026-10-23";

const CONTENT_ACTIONS = ["view", "create", "edit", "delete", "manage", "publish"];
const CRUD_ACTIONS = ["view", "create", "edit", "delete", "manage"];

// This manifest is the single source of truth for the current MESCO Trust admin.
// Permission rows, route checks, and sidebar visibility are generated from it.
export const ADMIN_MODULES = Object.freeze([
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "pages", label: "Pages", actions: CONTENT_ACTIONS },
  { key: "components", label: "Components", actions: CRUD_ACTIONS },
  { key: "appearance", label: "Appearance", actions: ["view", "edit", "manage"] },
  { key: "social_wall", label: "Social Wall", actions: ["view", "edit", "delete", "manage", "settings_access"] },
  { key: "form_builder", label: "Form Builder", actions: [...CONTENT_ACTIONS, "export_data"] },
  { key: "sliders", label: "Sliders", actions: ["view", "edit", "manage"] },
  { key: "popups", label: "Popups", actions: CONTENT_ACTIONS },
  { key: "team", label: "Team", actions: CRUD_ACTIONS },
  { key: "gallery", label: "Gallery", actions: CRUD_ACTIONS },
  { key: "blogs", label: "Blogs", actions: CONTENT_ACTIONS },
  { key: "events", label: "Events", actions: CONTENT_ACTIONS },
  { key: "media", label: "Media", actions: [...CRUD_ACTIONS, "settings_access"] },
  { key: "menus", label: "Menus", actions: [...CRUD_ACTIONS, "settings_access"] },
  { key: "chatbot", label: "Chatbot", actions: ["view", "create", "edit", "delete", "manage", "settings_access"] },
  { key: "theme", label: "Theme", actions: ["view", "edit", "manage", "settings_access"] },
  { key: "settings", label: "Settings", actions: ["view", "edit", "manage", "settings_access"] },
  { key: "submissions", label: "Submissions", actions: ["view", "edit", "delete", "manage", "export_data"] },
  { key: "push_notifications", label: "Push Notifications", actions: CRUD_ACTIONS },
  { key: "users", label: "Users", actions: [...CRUD_ACTIONS, "user_management"] },
  { key: "rbac", label: "Roles & Permissions", actions: [...CRUD_ACTIONS, "role_management"] },
]);

const MODULE_MAP = new Map(ADMIN_MODULES.map((moduleDefinition) => [moduleDefinition.key, moduleDefinition]));
const ACTION_LABELS = Object.freeze({
  view: "View Access",
  create: "Add/Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage",
  publish: "Publish",
  export_data: "Export Data",
  settings_access: "Settings Access",
  user_management: "User Management",
  role_management: "Roles & Permissions Management",
});

const SLIDER_COMPONENT_IDS = new Set(["imageslider", "storiesslider", "eventsslider"]);
const TEAM_COMPONENT_IDS = new Set(["committeemembers"]);

const API_MODULE_ALIASES = Object.freeze({
  dashboard: "dashboard",
  pages: "pages",
  components: "components",
  appearance: "appearance",
  "social-wall": "social_wall",
  "social-wall-config": "social_wall",
  forms: "form_builder",
  media: "media",
  menus: "menus",
  chatbot: "chatbot",
  blogs: "blogs",
  "blog-categories": "blogs",
  "blog-comments": "blogs",
  events: "events",
  "event-registrations": "submissions",
  "career-submissions": "submissions",
  subscribers: "submissions",
  donations: "submissions",
  "volunteers-feedback": "submissions",
  contacts: "submissions",
  fonts: "theme",
  settings: "settings",
  users: "users",
  rbac: "rbac",
  popups: "popups",
  team: "team",
  teams: "team",
  gallery: "gallery",
  galleries: "gallery",
  "site-components": "components",
  "push-notifications": "push_notifications",
});

const MENU_PERMISSIONS = Object.freeze({
  "/admin": "dashboard.view",
  "/admin/pages": "pages.view",
  "/admin/components": "components.view",
  "/admin/appearance/header": "appearance.edit",
  "/admin/appearance/header-ribbon": "appearance.edit",
  "/admin/appearance/footer": "appearance.edit",
  "/admin/social-wall": "social_wall.view",
  "/admin/form-builder": "form_builder.view",
  "/admin/sliders": "sliders.view",
  "/admin/popups": "popups.view",
  "/admin/team": "team.view",
  "/admin/gallery": "gallery.view",
  "/admin/blogs": "blogs.view",
  "/admin/blogs/new": "blogs.create",
  "/admin/blog-categories": "blogs.manage",
  "/admin/blog-comments": "blogs.manage",
  "/admin/events": "events.view",
  "/admin/events/new": "events.create",
  "/admin/media": "media.view",
  "/admin/media/bulk-optimize": "media.manage",
  "/admin/media/settings": "media.settings_access",
  "/admin/menus": "menus.view",
  "/admin/chatbot": "chatbot.view",
  "/admin/subscribers": "submissions.view",
  "/admin/event-registrations": "submissions.view",
  "/admin/donations": "submissions.view",
  "/admin/volunteer-form": "submissions.view",
  "/admin/volunteers-feedback": "submissions.view",
  "/admin/contacts": "submissions.view",
  "/admin/career-submissions": "submissions.view",
  "/admin/push-notifications": "push_notifications.view",
  "/admin/theme": "theme.settings_access",
  "/admin/settings/admin-theme": "theme.settings_access",
  "/admin/settings/frontend-theme": "theme.settings_access",
  "/admin/settings/sitemap": "settings.settings_access",
  "/admin/settings/robots": "settings.settings_access",
  "/admin/users": "users.user_management",
  "/admin/rbac/roles": "rbac.role_management",
});

function normalizePathname(pathname) {
  return String(pathname || "").split("?")[0].replace(/\/$/, "") || "/";
}

function componentModule(componentId) {
  const normalized = String(componentId || "").trim().toLowerCase();
  if (SLIDER_COMPONENT_IDS.has(normalized)) return "sliders";
  if (TEAM_COMPONENT_IDS.has(normalized)) return "team";
  return "components";
}

function methodAction(pathname, method) {
  const path = String(pathname || "").toLowerCase();
  const upperMethod = String(method || "GET").toUpperCase();
  if (path.includes("/publish") || path.includes("/unpublish")) return "publish";
  if (path.includes("/settings")) return "settings_access";
  if (/(^|\/)export(\/|$)/.test(path)) return "export_data";
  if (path.includes("/bulk") || path.includes("/jobs") || path.includes("/sync") || path.includes("/reorder") || path.includes("/seed") || path.includes("/ensure")) return "manage";
  if (upperMethod === "GET" || upperMethod === "HEAD") return "view";
  if (upperMethod === "POST") return "create";
  if (upperMethod === "PUT" || upperMethod === "PATCH") return "edit";
  if (upperMethod === "DELETE") return "delete";
  return "manage";
}

export function getPermissionForAdminPage(pathname) {
  const path = normalizePathname(pathname);
  if (!path || path === "/admin/forbidden" || path === "/admin/login") return null;
  if (path === "/admin") return "dashboard.view";
  if (path.startsWith("/admin/rbac")) return "rbac.role_management";
  if (path.startsWith("/admin/users")) return "users.user_management";
  if (
    path.startsWith("/admin/settings/admin-theme") ||
    path.startsWith("/admin/settings/frontend-theme")
  ) {
    return "theme.settings_access";
  }
  if (path.startsWith("/admin/theme")) return "theme.settings_access";
  if (path.startsWith("/admin/settings")) return "settings.settings_access";
  if (path.startsWith("/admin/appearance")) return "appearance.edit";
  if (path === "/admin/pages/new") return "pages.create";
  if (/^\/admin\/pages\/[^/]+/.test(path)) return "pages.edit";
  if (path.startsWith("/admin/pages")) return "pages.view";
  if (path === "/admin/components/new") return "components.create";
  const componentEditMatch = path.match(/^\/admin\/components\/([^/]+)\/edit/);
  if (componentEditMatch) return `${componentModule(componentEditMatch[1])}.edit`;
  if (path.startsWith("/admin/components")) return "components.view";
  if (path.startsWith("/admin/social-wall")) return "social_wall.view";
  if (/^\/admin\/form-builder\/[^/]+\/edit/.test(path)) return "form_builder.edit";
  if (/^\/admin\/form-builder\/[^/]+\/submissions/.test(path)) return "form_builder.manage";
  if (path.startsWith("/admin/form-builder")) return "form_builder.view";
  if (path.startsWith("/admin/sliders")) return "sliders.view";
  if (/^\/admin\/popups\/[^/]+/.test(path)) return "popups.edit";
  if (path.startsWith("/admin/popups")) return "popups.view";
  if (path === "/admin/team/new" || path === "/admin/team/create") return "team.create";
  if (/^\/admin\/team\/[^/]+\/edit/.test(path)) return "team.edit";
  if (path.startsWith("/admin/team")) return "team.view";
  if (path === "/admin/gallery/new" || path === "/admin/gallery/create") return "gallery.create";
  if (/^\/admin\/gallery\/[^/]+\/edit/.test(path)) return "gallery.edit";
  if (path.startsWith("/admin/gallery")) return "gallery.view";
  if (path === "/admin/blogs/new") return "blogs.create";
  if (path.startsWith("/admin/blog-categories") || path.startsWith("/admin/blog-comments")) return "blogs.manage";
  if (/^\/admin\/blogs\/[^/]+/.test(path)) return "blogs.edit";
  if (path.startsWith("/admin/blogs")) return "blogs.view";
  if (path === "/admin/events/new") return "events.create";
  if (/^\/admin\/events\/[^/]+/.test(path)) return "events.edit";
  if (path.startsWith("/admin/events")) return "events.view";
  if (path.startsWith("/admin/media/settings")) return "media.settings_access";
  if (path.startsWith("/admin/media/bulk-optimize")) return "media.manage";
  if (path.startsWith("/admin/media")) return "media.view";
  if (path.startsWith("/admin/menus")) return "menus.view";
  if (path.startsWith("/admin/chatbot")) return "chatbot.view";
  if (["/admin/subscribers", "/admin/event-registrations", "/admin/donations", "/admin/volunteer-form", "/admin/volunteers-feedback", "/admin/contacts"].some((prefix) => path.startsWith(prefix))) return "submissions.view";
  if (path.startsWith("/admin/push-notifications")) return "push_notifications.view";
  return null;
}

export function getRequiredPermissionsForAdminApi(pathname, method = "GET") {
  const path = normalizePathname(pathname);
  const upperMethod = String(method || "GET").toUpperCase();

  if (path === "/api/theme") {
    return upperMethod === "GET" || upperMethod === "HEAD" ? null : "theme.settings_access";
  }
  const themeComponentMatch = path.match(/^\/api\/theme\/([^/]+)/);
  if (themeComponentMatch) {
    const id = themeComponentMatch[1];
    const moduleKey = ["header", "footer", "subscribe", "marquee", "home-hero"].includes(id.toLowerCase())
      ? "theme"
      : componentModule(id);
    const action = upperMethod === "GET" || upperMethod === "HEAD" ? "view" : "edit";
    return `${moduleKey}.${action}`;
  }

  if (!path.startsWith("/api/admin/")) return null;
  const segments = path.split("/").filter(Boolean);
  const apiSegment = String(segments[2] || "").toLowerCase();

  if (apiSegment === "social-wall-config") {
    return "social_wall.settings_access";
  }
  if (apiSegment === "social-wall") {
    const operation = String(segments[3] || "").toLowerCase();
    if (operation === "settings" || operation === "platforms") {
      return "social_wall.settings_access";
    }
    if (operation === "sync") return "social_wall.manage";
    if (operation === "jobs") {
      return ["social_wall.manage", "social_wall.delete"];
    }
  }

  if (apiSegment === "users") return "users.user_management";
  if (apiSegment === "rbac") {
    if (segments[3] === "roles" && (upperMethod === "GET" || upperMethod === "HEAD")) {
      return ["users.user_management", "rbac.role_management"];
    }
    return "rbac.role_management";
  }

  if (apiSegment === "site-components") {
    const componentId = segments[3] || "";
    if (!componentId && (upperMethod === "GET" || upperMethod === "HEAD")) {
      return ["components.view", "sliders.view", "team.view"];
    }
    if (!componentId) return "components.create";
    return `${componentModule(componentId)}.${methodAction(path, upperMethod)}`;
  }

  if (apiSegment === "blog-categories") {
    return upperMethod === "GET" || upperMethod === "HEAD" ? "blogs.view" : "blogs.manage";
  }
  if (apiSegment === "blog-comments") return "blogs.manage";

  const moduleKey = API_MODULE_ALIASES[apiSegment] || apiSegment.replace(/-/g, "_");
  return `${moduleKey}.${methodAction(path, upperMethod)}`;
}

export function getPermissionForMenuKey(menuKey) {
  return MENU_PERMISSIONS[String(menuKey || "")] || null;
}

export function buildPermissionDefinitions() {
  const definitions = [];
  for (const moduleDefinition of ADMIN_MODULES) {
    for (const action of moduleDefinition.actions) {
      if (!RBAC_ACTIONS.includes(action)) continue;
      const key = `${moduleDefinition.key}.${action}`;
      const actionLabel = ACTION_LABELS[action] || action.replace(/_/g, " ");
      definitions.push({
        key,
        module: moduleDefinition.key,
        moduleLabel: moduleDefinition.label,
        action,
        label: `${moduleDefinition.label} - ${actionLabel}`,
        description: `${actionLabel} for ${moduleDefinition.label}`,
        isProtected: key === "rbac.role_management",
      });
    }
  }
  return definitions;
}

export function getDefaultPermissionKeysForRole(roleKeyInput) {
  const roleKey = normalizeRoleKey(roleKeyInput);
  const definitions = buildPermissionDefinitions();
  if (roleKey === ROLE_KEYS.SUPER_ADMIN) return new Set(definitions.map((item) => item.key));
  if (roleKey === ROLE_KEYS.ADMIN) {
    return new Set(definitions.filter((item) => item.module !== "rbac").map((item) => item.key));
  }
  if (roleKey === ROLE_KEYS.EDITOR) {
    const blockedKeys = new Set([
      "components.create",
      "social_wall.manage",
      "social_wall.settings_access",
      "media.manage",
      "media.settings_access",
      "chatbot.settings_access",
      "form_builder.export_data",
      "submissions.export_data",
    ]);
    return new Set(
      definitions
        .filter((item) => !["rbac", "users", "theme", "settings"].includes(item.module))
        .filter((item) => !blockedKeys.has(item.key))
        .map((item) => item.key),
    );
  }
  if (roleKey === ROLE_KEYS.AUTHOR) {
    return new Set(
      definitions
        .filter((item) => ["dashboard", "blogs", "events"].includes(item.module))
        .filter((item) => item.key !== "blogs.manage")
        .map((item) => item.key),
    );
  }
  return new Set(["dashboard.view"]);
}

export function getSystemRoleSeedDefinitions() {
  return [
    { key: ROLE_KEYS.SUPER_ADMIN, name: "Super Admin", description: "Full unrestricted administrative access", priority: 1000 },
    { key: ROLE_KEYS.ADMIN, name: "Admin", description: "Administrative access to all existing CMS modules", priority: 500 },
    { key: ROLE_KEYS.EDITOR, name: "Editor", description: "Content and operations access", priority: 200 },
    { key: ROLE_KEYS.AUTHOR, name: "Author", description: "Blog and event publishing access", priority: 100 },
  ].map((role) => ({ ...role, isSystem: true, isActive: true }));
}

export function getModuleDefinition(moduleKey) {
  return MODULE_MAP.get(moduleKey) || null;
}
