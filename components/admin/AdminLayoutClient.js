"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Space,
  Badge,
  Avatar,
  Popover,
  List,
  Typography,
  Divider,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BookOutlined,
  AppstoreOutlined,
  MenuOutlined,
  BgColorsOutlined,
  TeamOutlined,
  MailOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  DollarOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import { roleLabelFromKey } from "@/lib/rbac/constants";
import { canAccessMenu } from "@/lib/rbac/clientPermissions";
import { AdminAuthProvider } from "@/components/admin/AdminAuthContext";

const { Header, Content } = Layout;

const SIDEBAR_WIDTH = 200;
const HEADER_HEIGHT = 64;
const MOBILE_BREAKPOINT = 992;
const ADMIN_ROUTE_LOADER_DELAY_MS = 60;
const ADMIN_ROUTE_LOADER_MIN_MS = 280;
const ADMIN_ROUTE_LOADER_POST_PATHNAME_SETTLE_MS = 160;
const ADMIN_ROUTE_LOADER_MAX_MS = 3500;
const ADMIN_NOTIFICATION_POLL_MS = 15000;
const ADMIN_FETCH_CACHE_TTL_MS = 12000;
const ADMIN_FETCH_CACHE_MAX_ENTRIES = 120;

const linkStyle = { textDecoration: "none" };

const baseMenuItems = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: (
      <Link href="/admin" style={linkStyle}>
        Dashboard
      </Link>
    ),
  },
  {
    key: "/admin/pages",
    icon: <FileTextOutlined />,
    label: (
      <Link href="/admin/pages" style={linkStyle}>
        Pages
      </Link>
    ),
  },
  {
    key: "/admin/components",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/components" style={linkStyle}>
        Components
      </Link>
    ),
  },
  {
    key: "group:admin:appearance",
    icon: <BgColorsOutlined />,
    label: "Appearance",
    children: [
      {
        key: "/admin/appearance/header",
        label: (
          <Link href="/admin/appearance/header" style={linkStyle}>
            Header
          </Link>
        ),
      },
      {
        key: "/admin/appearance/header-ribbon",
        label: (
          <Link href="/admin/appearance/header-ribbon" style={linkStyle}>
            Header Ribbon
          </Link>
        ),
      },
      {
        key: "/admin/appearance/footer",
        label: (
          <Link href="/admin/appearance/footer" style={linkStyle}>
            Footer
          </Link>
        ),
      },
    ],
  },
  {
    key: "/admin/social-wall",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/social-wall" style={linkStyle}>
        Social Wall
      </Link>
    ),
  },
  {
    key: "/admin/form-builder",
    icon: <FileTextOutlined />,
    label: (
      <Link href="/admin/form-builder" style={linkStyle}>
        Form Builder
      </Link>
    ),
  },
  {
    key: "/admin/sliders",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/sliders" style={linkStyle}>
        Sliders
      </Link>
    ),
  },
  {
    key: "/admin/popups",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/popups" style={linkStyle}>
        Popups
      </Link>
    ),
  },
  {
    key: "/admin/team",
    icon: <TeamOutlined />,
    label: (
      <Link href="/admin/team" style={linkStyle}>
        Team
      </Link>
    ),
  },
  {
    key: "group:admin:blogs",
    icon: <BookOutlined />,
    label: "Blogs",
    children: [
      {
        key: "/admin/blogs",
        label: (
          <Link href="/admin/blogs" style={linkStyle}>
            View All Posts
          </Link>
        ),
      },
      {
        key: "/admin/blogs/new",
        label: (
          <Link href="/admin/blogs/new" style={linkStyle}>
            Add Post
          </Link>
        ),
      },
      {
        key: "/admin/blog-categories",
        label: (
          <Link href="/admin/blog-categories" style={linkStyle}>
            Categories
          </Link>
        ),
      },
      {
        key: "/admin/blog-comments",
        label: (
          <Link href="/admin/blog-comments" style={linkStyle}>
            Comments
          </Link>
        ),
      },
    ],
  },
  {
    key: "group:admin:events",
    icon: <ClockCircleOutlined />,
    label: "Events",
    children: [
      {
        key: "/admin/events",
        label: (
          <Link href="/admin/events" style={linkStyle}>
            View All Events
          </Link>
        ),
      },
      {
        key: "/admin/events/new",
        label: (
          <Link href="/admin/events/new" style={linkStyle}>
            Add Event
          </Link>
        ),
      },
    ],
  },
  {
    key: "/admin/media",
    icon: <AppstoreOutlined />,
    label: "Media",
    children: [
      {
        key: "/admin/media",
        label: (
          <Link href="/admin/media" style={linkStyle}>
            Library
          </Link>
        ),
      },
      {
        key: "/admin/media/bulk-optimize",
        label: (
          <Link href="/admin/media/bulk-optimize" style={linkStyle}>
            Bulk Optimize
          </Link>
        ),
      },
      {
        key: "/admin/media/settings",
        label: (
          <Link href="/admin/media/settings" style={linkStyle}>
            Settings
          </Link>
        ),
      },
    ],
  },
  {
    key: "/admin/menus",
    icon: <MenuOutlined />,
    label: (
      <Link href="/admin/menus" style={linkStyle}>
        Menus
      </Link>
    ),
  },
  {
    key: "/admin/chatbot",
    icon: <MessageOutlined />,
    label: (
      <Link href="/admin/chatbot" style={linkStyle}>
        Chatbot
      </Link>
    ),
  },
  {
    key: "/admin/theme",
    icon: <BgColorsOutlined />,
    label: (
      <Link href="/admin/theme" style={linkStyle}>
        Theme
      </Link>
    ),
  },
  {
    key: "/admin/submissions",
    icon: <MailOutlined />,
    label: "Submissions",
    children: [
      {
        key: "/admin/subscribers",
        label: (
          <Link href="/admin/subscribers" style={linkStyle}>
            Subscribers
          </Link>
        ),
      },
      {
        key: "/admin/event-registrations",
        label: (
          <Link href="/admin/event-registrations" style={linkStyle}>
            Event Register
          </Link>
        ),
      },
      {
        key: "/admin/donations",
        label: (
          <Link href="/admin/donations" style={linkStyle}>
            Donate
          </Link>
        ),
      },
      {
        key: "/admin/volunteer-form",
        label: (
          <Link href="/admin/volunteer-form" style={linkStyle}>
            Volunteer Form
          </Link>
        ),
      },
      {
        key: "/admin/volunteers-feedback",
        label: (
          <Link href="/admin/volunteers-feedback" style={linkStyle}>
            Volunteers Feedback
          </Link>
        ),
      },
      {
        key: "/admin/contacts",
        label: (
          <Link href="/admin/contacts" style={linkStyle}>
            Contact Us
          </Link>
        ),
      },
    ],
  },
  {
    key: "/admin/users",
    icon: <TeamOutlined />,
    label: (
      <Link href="/admin/users" style={linkStyle}>
        Users
      </Link>
    ),
  },
  {
    key: "/admin/rbac/roles",
    icon: <SafetyCertificateOutlined />,
    label: (
      <Link href="/admin/rbac/roles" style={linkStyle}>
        Roles & Permissions
      </Link>
    ),
  },
];

function filterMenuItemsByPermission(items, authContext) {
  return items
    .map((item) => {
      if (Array.isArray(item.children)) {
        const children = filterMenuItemsByPermission(item.children, authContext);
        return children.length > 0 ? { ...item, children } : null;
      }
      return canAccessMenu(authContext, item.key) ? item : null;
    })
    .filter(Boolean);
}

const DEFAULT_ADMIN_THEME = {
  adminSiteName: "",
  adminLogoUrl: "",
  adminTextColor: "#333333",
  adminBorderColor: "rgba(0,0,0,0.06)",
  adminCtaBgColor: "#1677ff",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
  adminSidebarBg: "#ffffff",
  adminSidebarText: "rgba(0,0,0,0.65)",
  adminSidebarHoverBg: "rgba(0,0,0,0.04)",
  adminSidebarHoverText: "#1677ff",
  adminSidebarActiveBg: "#e6f4ff",
  adminSidebarActiveText: "#1677ff",
  adminLoaderColor: "#1677ff",
  adminLoaderBgColor: "rgba(255,255,255,0.5)",
};

export default function AdminLayoutClient({ children, userName, userRole, userRoleKey, permissionKeys = [] }) {
  const router = useRouter();
  const normalizedRoleKey = String(userRoleKey || userRole || "").trim().toLowerCase();
  const roleLabel = userRole || roleLabelFromKey(normalizedRoleKey);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const [adminTheme, setAdminTheme] = useState(DEFAULT_ADMIN_THEME);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeLoadingRef = useRef(false);
  const routeStartedAtRef = useRef(0);
  const routeShowTimerRef = useRef(null);
  const routeHideTimerRef = useRef(null);
  const routeSettleTimerRef = useRef(null);
  const routeMaxTimerRef = useRef(null);
  const prevCountRef = useRef(0);
  const adminFetchCacheRef = useRef(new Map());
  const adminFetchInFlightRef = useRef(new Map());
  const applyAdminTheme = useCallback((data) => {
    const next = { ...DEFAULT_ADMIN_THEME };
    if (data && typeof data === "object") {
      for (const key of Object.keys(DEFAULT_ADMIN_THEME)) {
        if (data[key] !== undefined && data[key] !== "") {
          next[key] = data[key];
        }
      }
    }
    setAdminTheme(next);
  }, []);

  const clearRouteLoaderTimers = useCallback(() => {
    if (routeShowTimerRef.current) {
      window.clearTimeout(routeShowTimerRef.current);
      routeShowTimerRef.current = null;
    }
    if (routeHideTimerRef.current) {
      window.clearTimeout(routeHideTimerRef.current);
      routeHideTimerRef.current = null;
    }
    if (routeSettleTimerRef.current) {
      window.clearTimeout(routeSettleTimerRef.current);
      routeSettleTimerRef.current = null;
    }
    if (routeMaxTimerRef.current) {
      window.clearTimeout(routeMaxTimerRef.current);
      routeMaxTimerRef.current = null;
    }
  }, []);

  const startRouteLoader = useCallback(() => {
    if (routeLoadingRef.current || routeShowTimerRef.current) return;
    clearRouteLoaderTimers();
    routeShowTimerRef.current = window.setTimeout(() => {
      routeStartedAtRef.current = Date.now();
      routeLoadingRef.current = true;
      setRouteLoading(true);
      routeMaxTimerRef.current = window.setTimeout(() => {
        routeLoadingRef.current = false;
        setRouteLoading(false);
        routeMaxTimerRef.current = null;
      }, ADMIN_ROUTE_LOADER_MAX_MS);
      routeShowTimerRef.current = null;
    }, ADMIN_ROUTE_LOADER_DELAY_MS);
  }, [clearRouteLoaderTimers]);

  const stopRouteLoader = useCallback(() => {
    if (routeSettleTimerRef.current) {
      window.clearTimeout(routeSettleTimerRef.current);
      routeSettleTimerRef.current = null;
    }
    if (routeMaxTimerRef.current) {
      window.clearTimeout(routeMaxTimerRef.current);
      routeMaxTimerRef.current = null;
    }
    if (routeShowTimerRef.current) {
      window.clearTimeout(routeShowTimerRef.current);
      routeShowTimerRef.current = null;
    }
    if (!routeLoadingRef.current) return;
    const elapsed = Date.now() - routeStartedAtRef.current;
    const wait = Math.max(0, ADMIN_ROUTE_LOADER_MIN_MS - elapsed);
    if (routeHideTimerRef.current) {
      window.clearTimeout(routeHideTimerRef.current);
      routeHideTimerRef.current = null;
    }
    routeHideTimerRef.current = window.setTimeout(() => {
      routeLoadingRef.current = false;
      setRouteLoading(false);
      routeHideTimerRef.current = null;
    }, wait);
  }, []);

  // Fetch admin theme settings
  useEffect(() => {
    const handleAdminThemeUpdated = (event) => {
      applyAdminTheme(event?.detail);
    };
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyAdminTheme(data))
      .catch(() => {});
    window.addEventListener("admin-theme-updated", handleAdminThemeUpdated);
    return () =>
      window.removeEventListener("admin-theme-updated", handleAdminThemeUpdated);
  }, [applyAdminTheme]);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
      else setMobileOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
    if (routeSettleTimerRef.current) {
      window.clearTimeout(routeSettleTimerRef.current);
      routeSettleTimerRef.current = null;
    }
    // Let destination content mount, then close the transition loader quickly.
    if (routeLoadingRef.current) {
      routeSettleTimerRef.current = window.setTimeout(() => {
        if (routeLoadingRef.current) {
          stopRouteLoader();
        }
        routeSettleTimerRef.current = null;
      }, ADMIN_ROUTE_LOADER_POST_PATHNAME_SETTLE_MS);
    }
  }, [pathname, isMobile, stopRouteLoader]);

  // Single global admin route loader for sidebar/link/programmatic navigation.
  useEffect(() => {
    const isAdminHref = (href) =>
      typeof href === "string" && href.startsWith("/admin");

    const onClickCapture = (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") return;
      const raw = anchor.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!isAdminHref(url.pathname)) return;
      // Only show route transition loader for real page-path transitions.
      if (url.pathname === window.location.pathname) return;
      startRouteLoader();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const originalFetch = window.fetch;
    const adminFetchCache = adminFetchCacheRef.current;
    const adminFetchInFlight = adminFetchInFlightRef.current;
    const handleHistoryTarget = (targetLike) => {
      if (targetLike == null) return;
      try {
        const target = new URL(String(targetLike), window.location.href);
        const current = new URL(window.location.href);
        // Query/hash-only updates should not trigger route-level loader.
        if (target.pathname !== current.pathname && isAdminHref(target.pathname)) {
          startRouteLoader();
        }
      } catch {}
    };

    window.history.pushState = function patchedPushState(...args) {
      handleHistoryTarget(args[2]);
      return originalPushState.apply(window.history, args);
    };
    window.history.replaceState = function patchedReplaceState(...args) {
      handleHistoryTarget(args[2]);
      return originalReplaceState.apply(window.history, args);
    };

    window.fetch = function patchedFetch(input, init) {
      const method =
        String(
          init?.method ||
            (typeof input === "object" && input?.method) ||
            "GET",
        ).toUpperCase();

      let url = null;
      try {
        url =
          typeof input === "string"
            ? new URL(input, window.location.href)
            : new URL(input?.url || "", window.location.href);
      } catch {}

      const isSameOriginApi =
        !!url &&
        url.origin === window.location.origin &&
        (url.pathname.startsWith("/api/admin") ||
          url.pathname.startsWith("/api/theme") ||
          url.pathname.startsWith("/api/public"));

      if (
        isSameOriginApi &&
        (method === "POST" ||
          method === "PUT" ||
          method === "PATCH" ||
          method === "DELETE")
      ) {
        adminFetchCache.clear();
        adminFetchInFlight.clear();
      }

      const requestCacheMode = String(
        init?.cache ||
          (typeof input === "object" ? input?.cache : "") ||
          "",
      ).toLowerCase();
      const canUseCache =
        method === "GET" &&
        isSameOriginApi &&
        requestCacheMode !== "no-store" &&
        requestCacheMode !== "reload" &&
        !url.searchParams.has("_ts");

      if (!canUseCache || !url) {
        return originalFetch.call(window, input, init);
      }

      const cacheKey = `${method}:${url.pathname}${url.search}`;
      const now = Date.now();
      const cache = adminFetchCache;
      const inFlight = adminFetchInFlight;
      const cached = cache.get(cacheKey);
      if (cached && now - cached.time < ADMIN_FETCH_CACHE_TTL_MS) {
        return Promise.resolve(cached.response.clone());
      }
      if (cached) {
        cache.delete(cacheKey);
      }
      if (inFlight.has(cacheKey)) {
        return inFlight.get(cacheKey).then((response) => response.clone());
      }

      const requestPromise = Promise.resolve(originalFetch.call(window, input, init))
        .then((response) => {
          if (response?.ok) {
            cache.set(cacheKey, { response: response.clone(), time: Date.now() });
            if (cache.size > ADMIN_FETCH_CACHE_MAX_ENTRIES) {
              const oldestKey = cache.keys().next().value;
              if (oldestKey) cache.delete(oldestKey);
            }
          }
          return response;
        })
        .finally(() => {
          inFlight.delete(cacheKey);
        });

      inFlight.set(cacheKey, requestPromise);
      return requestPromise.then((response) => response.clone());
    };

    const onPopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin") && currentPath !== pathname) {
        startRouteLoader();
      }
    };
    const onWindowError = () => stopRouteLoader();
    const onUnhandledRejection = () => stopRouteLoader();

    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.fetch = originalFetch;
      adminFetchCache.clear();
      adminFetchInFlight.clear();
      clearRouteLoaderTimers();
    };
  }, [clearRouteLoaderTimers, pathname, startRouteLoader, stopRouteLoader]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const sidebarVisible = isMobile ? mobileOpen : !collapsed;
  const contentMarginLeft = isMobile ? 0 : collapsed ? 0 : SIDEBAR_WIDTH;
  const authContext = {
    role: userRole,
    roleKey: normalizedRoleKey,
    permissionKeys,
  };
  const menuItems = filterMenuItemsByPermission(baseMenuItems, authContext);
  const selectedMenuKey = String(pathname || "").startsWith("/admin/popups/")
    ? "/admin/popups"
    : String(pathname || "").startsWith("/admin/form-builder/")
      ? "/admin/form-builder"
    : String(pathname || "").startsWith("/admin/social-wall/")
      ? "/admin/social-wall"
    : pathname;

  const fetchNotifications = useCallback(() => {
    if (normalizedRoleKey === "author") {
      setNotifications([]);
      prevCountRef.current = 0;
      return;
    }
    Promise.all([
      fetch("/api/admin/contacts?limit=20").then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
      fetch("/api/admin/donations?limit=20").then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
      fetch("/api/admin/subscribers?limit=10").then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
      fetch("/api/admin/event-registrations?limit=20").then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
      fetch("/api/admin/forms/submissions/unread?limit=10").then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
    ])
      .then(([contacts, donations, subscribers, eventRegs, formSubmissions]) => {
        const notifs = [];
        (contacts.items || []).forEach((c) => {
          if (!c.isRead) {
            notifs.push({
              id: c._id,
              type: "contact",
              icon: <MessageOutlined style={{ color: "#1677ff" }} />,
              title: `New message from ${c.payload?.name || "Unknown"}`,
              time: c.createdAt,
              link: "/admin/contacts",
            });
          }
        });
        (donations.items || []).forEach((d) => {
          if (d.status === "success") {
            notifs.push({
              id: d._id,
              type: "donation",
              icon: <DollarOutlined style={{ color: "#52c41a" }} />,
              title: `₹${Number(d.amount).toLocaleString("en-IN")} donation from ${d.donor?.name || "Unknown"}`,
              time: d.createdAt,
              link: "/admin/donations",
            });
          }
        });
        const oneDayAgo = Date.now() - 86400000;
        (subscribers.items || []).forEach((s) => {
          if (
            s.status === "active" &&
            new Date(s.createdAt).getTime() > oneDayAgo
          ) {
            notifs.push({
              id: s._id,
              type: "subscriber",
              icon: <MailOutlined style={{ color: "#722ed1" }} />,
              title: `New subscriber: ${s.email}`,
              time: s.createdAt,
              link: "/admin/subscribers",
            });
          }
        });
        (eventRegs.items || []).forEach((r) => {
          if (!r.isRead) {
            notifs.push({
              id: r._id,
              type: "event-registration",
              icon: <ClockCircleOutlined style={{ color: "#fa8c16" }} />,
              title: `New event registration: ${r.payload?.name || "Unknown"} → ${r.eventTitle || "Event"}`,
              time: r.createdAt,
              link: "/admin/event-registrations",
            });
          }
        });
        (formSubmissions.items || []).forEach((submission) => {
          const payload = submission?.payloadByFieldNameSnapshot || {};
          const identity =
            payload?.name ||
            payload?.full_name ||
            payload?.email ||
            payload?.phone ||
            "New response";
          notifs.push({
            id: submission._id,
            type: "form-submission",
            icon: <FileTextOutlined style={{ color: "#13c2c2" }} />,
            title: `New form submission (${submission.formId}): ${identity}`,
            time: submission.createdAt,
            link: `/admin/form-builder/${encodeURIComponent(submission.formId)}/submissions`,
          });
        });
        notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
        const sliced = notifs.slice(0, 10);
        if (
          sliced.length > prevCountRef.current &&
          prevCountRef.current !== 0
        ) {
          setBellShake(true);
          setTimeout(() => setBellShake(false), 1500);
        }
        prevCountRef.current = sliced.length;
        setNotifications(sliced);
      })
      .catch(() => {});
  }, [normalizedRoleKey]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, ADMIN_NOTIFICATION_POLL_MS);
    const handleNewSubmission = () => setTimeout(fetchNotifications, 500);
    window.addEventListener("new-contact-submission", handleNewSubmission);
    window.addEventListener("new-donation", handleNewSubmission);
    window.addEventListener("new-form-submission", handleNewSubmission);
    return () => {
      clearInterval(interval);
      window.removeEventListener("new-contact-submission", handleNewSubmission);
      window.removeEventListener("new-donation", handleNewSubmission);
      window.removeEventListener("new-form-submission", handleNewSubmission);
    };
  }, [fetchNotifications]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hrs ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const notificationContent = (
    <div style={{ width: 320, maxWidth: "90vw" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
        }}
      >
        <Typography.Text strong>
          {notifications.length} New Notifications
        </Typography.Text>
        <Typography.Link
          onClick={() => {
            setNotifications([]);
            setNotifOpen(false);
          }}
          style={{ fontSize: 13 }}
        >
          Clear all
        </Typography.Link>
      </div>
      <Divider style={{ margin: 0 }} />
      <List
        dataSource={notifications}
        locale={{ emptyText: "No new notifications" }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onClick={() => {
              setNotifOpen(false);
              router.push(item.link);
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.02)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={36}
                  icon={item.icon}
                  style={{ background: "rgba(0,0,0,0.04)" }}
                />
              }
              title={
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {item.title}
                </span>
              }
              description={
                <span
                  style={{
                    fontSize: 12,
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 11 }} />{" "}
                  {timeAgo(item.time)}
                </span>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ textAlign: "center", padding: "10px 16px" }}>
            <Typography.Link
              onClick={() => {
                setNotifOpen(false);
                router.push("/admin/form-builder");
              }}
              style={{ fontSize: 13 }}
            >
              View all
            </Typography.Link>
          </div>
        </>
      )}
    </div>
  );

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Sign out",
        onClick: () => signOut({ callbackUrl: "/admin/login" }),
      },
    ],
  };

  const at = adminTheme;
  const logoDisplay = at.adminLogoUrl ? (
    <img
      src={at.adminLogoUrl}
      alt="logo"
      style={{ maxHeight: 36, maxWidth: 140, objectFit: "contain" }}
    />
  ) : (
    at.adminSiteName || "CMS"
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <style>{`
        @keyframes bellShake {
          0% { transform: rotate(0); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        @keyframes badgePulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 77, 79, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); }
        }
        .bell-shake .anticon-bell {
          display: inline-block;
          animation: bellShake 0.8s ease-in-out;
          transform-origin: top center;
        }
        .bell-shake + .ant-badge-count,
        .ant-badge .ant-badge-count {
          animation: badgePulse 1.5s infinite;
        }
        .admin-route-loader {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${at.adminLoaderBgColor};
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .admin-route-loader.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .admin-content.admin-route-loading .ant-spin-nested-loading > .ant-spin {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .admin-content.admin-route-loading .ant-spin {
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .admin-content .ant-spin-nested-loading > .ant-spin {
          position: fixed !important;
          inset: 0 !important;
          max-height: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
          z-index: 1100 !important;
        }
        .admin-route-loader-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid rgba(0, 0, 0, 0.12);
          border-top-color: ${at.adminLoaderColor};
          animation: adminRouteSpin 0.8s linear infinite;
          background: transparent;
        }
        @keyframes adminRouteSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Admin sidebar overlay drawer */
        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 199;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .admin-sidebar-backdrop.visible {
          opacity: 1;
          visibility: visible;
        }

        .admin-sidebar {
          position: fixed !important;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 200;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 5px 0 15px rgba(0, 0, 0, 0.04);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s ease;
        }
        .admin-sidebar-menu-wrap {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-sidebar-menu-wrap::-webkit-scrollbar {
          display: none;
        }

        .admin-sidebar .ant-menu-item:hover {
          background: ${at.adminSidebarHoverBg} !important;
          color: ${at.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item:hover a {
          color: ${at.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item-selected {
          background: ${at.adminSidebarActiveBg} !important;
          color: ${at.adminSidebarActiveText} !important;
        }
        .admin-sidebar .ant-menu-item-selected a {
          color: ${at.adminSidebarActiveText} !important;
        }
        .admin-sidebar .ant-menu-submenu-title:hover {
          background: ${at.adminSidebarHoverBg} !important;
          color: ${at.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item a {
          color: ${at.adminSidebarText};
        }
        .admin-sidebar .ant-menu-submenu-title {
          color: ${at.adminSidebarText} !important;
        }
        .admin-sidebar .ant-menu-light {
          background: transparent;
        }

        /* Inject admin loader color as CSS variable */
        :root {
          --admin-loader-color: ${at.adminLoaderColor};
          --admin-text-color: ${at.adminTextColor};
          --admin-border-color: ${at.adminBorderColor};
          --admin-cta-bg-color: ${at.adminCtaBgColor};
          --admin-cta-text-color: ${at.adminCtaTextColor};
          --admin-cta-hover-bg-color: ${at.adminCtaHoverBgColor || at.adminCtaBgColor};
          --admin-cta-hover-text-color: ${at.adminCtaHoverTextColor || at.adminCtaTextColor};
        }

        /* Override Ant Design Spin color globally for admin */
        .admin-content .ant-spin .ant-spin-dot-item,
        .ant-drawer .ant-spin .ant-spin-dot-item,
        .ant-modal-root .ant-spin .ant-spin-dot-item {
          background-color: ${at.adminLoaderColor} !important;
        }
        .admin-content .ant-spin {
          color: ${at.adminLoaderColor} !important;
        }

        /* Admin form controls default colors (content + drawers + modals + popovers) */
        .admin-content .ant-input,
        .admin-content .ant-input-affix-wrapper,
        .admin-content .ant-input-number,
        .admin-content .ant-select-selector,
        .admin-content .ant-picker,
        .ant-drawer .ant-input,
        .ant-drawer .ant-input-affix-wrapper,
        .ant-drawer .ant-input-number,
        .ant-drawer .ant-select-selector,
        .ant-drawer .ant-picker,
        .ant-modal-root .ant-input,
        .ant-modal-root .ant-input-affix-wrapper,
        .ant-modal-root .ant-input-number,
        .ant-modal-root .ant-select-selector,
        .ant-modal-root .ant-picker,
        .ant-popover .ant-input,
        .ant-popover .ant-input-affix-wrapper,
        .ant-popover .ant-input-number,
        .ant-popover .ant-select-selector,
        .ant-popover .ant-picker {
          border-color: ${at.adminBorderColor} !important;
          color: ${at.adminTextColor} !important;
        }

        .admin-content .ant-form-item-label > label,
        .ant-drawer .ant-form-item-label > label,
        .ant-modal-root .ant-form-item-label > label,
        .ant-popover .ant-form-item-label > label,
        .admin-content .ant-typography,
        .ant-drawer .ant-typography,
        .ant-modal-root .ant-typography,
        .ant-popover .ant-typography,
        .admin-content .ant-select-selection-item,
        .admin-content .ant-select-selection-placeholder,
        .ant-drawer .ant-select-selection-item,
        .ant-drawer .ant-select-selection-placeholder,
        .ant-modal-root .ant-select-selection-item,
        .ant-modal-root .ant-select-selection-placeholder,
        .ant-popover .ant-select-selection-item,
        .ant-popover .ant-select-selection-placeholder {
          color: ${at.adminTextColor} !important;
        }

        .admin-content .ant-input:hover,
        .admin-content .ant-input-affix-wrapper:hover,
        .admin-content .ant-input-number:hover,
        .admin-content .ant-select:hover .ant-select-selector,
        .admin-content .ant-picker:hover,
        .ant-drawer .ant-input:hover,
        .ant-drawer .ant-input-affix-wrapper:hover,
        .ant-drawer .ant-input-number:hover,
        .ant-drawer .ant-select:hover .ant-select-selector,
        .ant-drawer .ant-picker:hover,
        .ant-modal-root .ant-input:hover,
        .ant-modal-root .ant-input-affix-wrapper:hover,
        .ant-modal-root .ant-input-number:hover,
        .ant-modal-root .ant-select:hover .ant-select-selector,
        .ant-modal-root .ant-picker:hover,
        .ant-popover .ant-input:hover,
        .ant-popover .ant-input-affix-wrapper:hover,
        .ant-popover .ant-input-number:hover,
        .ant-popover .ant-select:hover .ant-select-selector,
        .ant-popover .ant-picker:hover {
          border-color: ${at.adminCtaBgColor} !important;
        }

        .admin-content .ant-input:focus,
        .admin-content .ant-input-focused,
        .admin-content .ant-input-affix-wrapper:focus,
        .admin-content .ant-input-affix-wrapper-focused,
        .admin-content .ant-input-number-focused,
        .admin-content .ant-select-focused .ant-select-selector,
        .admin-content .ant-picker-focused,
        .ant-drawer .ant-input:focus,
        .ant-drawer .ant-input-focused,
        .ant-drawer .ant-input-affix-wrapper:focus,
        .ant-drawer .ant-input-affix-wrapper-focused,
        .ant-drawer .ant-input-number-focused,
        .ant-drawer .ant-select-focused .ant-select-selector,
        .ant-drawer .ant-picker-focused,
        .ant-modal-root .ant-input:focus,
        .ant-modal-root .ant-input-focused,
        .ant-modal-root .ant-input-affix-wrapper:focus,
        .ant-modal-root .ant-input-affix-wrapper-focused,
        .ant-modal-root .ant-input-number-focused,
        .ant-modal-root .ant-select-focused .ant-select-selector,
        .ant-modal-root .ant-picker-focused,
        .ant-popover .ant-input:focus,
        .ant-popover .ant-input-focused,
        .ant-popover .ant-input-affix-wrapper:focus,
        .ant-popover .ant-input-affix-wrapper-focused,
        .ant-popover .ant-input-number-focused,
        .ant-popover .ant-select-focused .ant-select-selector,
        .ant-popover .ant-picker-focused {
          border-color: ${at.adminCtaBgColor} !important;
          box-shadow: 0 0 0 2px color-mix(in srgb, ${at.adminCtaBgColor} 18%, transparent) !important;
        }

        .admin-content .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text),
        .ant-drawer .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text),
        .ant-modal-root .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text),
        .ant-popover .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text) {
          border-color: ${at.adminBorderColor} !important;
          color: ${at.adminTextColor} !important;
        }

        .admin-content .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text):hover,
        .ant-drawer .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text):hover,
        .ant-modal-root .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text):hover,
        .ant-popover .ant-btn:not(.ant-btn-primary):not(.ant-btn-link):not(.ant-btn-text):hover {
          border-color: ${at.adminCtaBgColor} !important;
          color: ${at.adminCtaBgColor} !important;
        }

        .admin-content .ant-switch.ant-switch-checked,
        .ant-drawer .ant-switch.ant-switch-checked,
        .ant-modal-root .ant-switch.ant-switch-checked,
        .ant-popover .ant-switch.ant-switch-checked {
          background: ${at.adminCtaBgColor} !important;
        }

        .admin-content .ant-checkbox-checked .ant-checkbox-inner,
        .admin-content .ant-checkbox-indeterminate .ant-checkbox-inner:after,
        .ant-drawer .ant-checkbox-checked .ant-checkbox-inner,
        .ant-drawer .ant-checkbox-indeterminate .ant-checkbox-inner:after,
        .ant-modal-root .ant-checkbox-checked .ant-checkbox-inner,
        .ant-modal-root .ant-checkbox-indeterminate .ant-checkbox-inner:after,
        .ant-popover .ant-checkbox-checked .ant-checkbox-inner,
        .ant-popover .ant-checkbox-indeterminate .ant-checkbox-inner:after {
          background-color: ${at.adminCtaBgColor} !important;
          border-color: ${at.adminCtaBgColor} !important;
        }

        .admin-content .ant-radio-checked .ant-radio-inner,
        .ant-drawer .ant-radio-checked .ant-radio-inner,
        .ant-modal-root .ant-radio-checked .ant-radio-inner,
        .ant-popover .ant-radio-checked .ant-radio-inner {
          border-color: ${at.adminCtaBgColor} !important;
        }
        .admin-content .ant-radio-checked .ant-radio-inner:after,
        .ant-drawer .ant-radio-checked .ant-radio-inner:after,
        .ant-modal-root .ant-radio-checked .ant-radio-inner:after,
        .ant-popover .ant-radio-checked .ant-radio-inner:after {
          background-color: ${at.adminCtaBgColor} !important;
        }

        /* Admin CTA button override — covers content, drawers, modals, popovers */
        .admin-content .ant-btn-primary,
        .ant-drawer .ant-btn-primary,
        .ant-modal-root .ant-btn-primary,
        .ant-popover .ant-btn-primary {
          background: ${at.adminCtaBgColor} !important;
          border-color: ${at.adminCtaBgColor} !important;
          color: ${at.adminCtaTextColor} !important;
        }
        .admin-content .ant-btn-primary:hover,
        .ant-drawer .ant-btn-primary:hover,
        .ant-modal-root .ant-btn-primary:hover,
        .ant-popover .ant-btn-primary:hover {
          background: ${at.adminCtaHoverBgColor || at.adminCtaBgColor} !important;
          border-color: ${at.adminCtaHoverBgColor || at.adminCtaBgColor} !important;
          color: ${at.adminCtaHoverTextColor || at.adminCtaTextColor} !important;
          opacity: ${at.adminCtaHoverBgColor ? 1 : 0.85};
        }

        /* Make all admin tables horizontally scrollable on small screens */
        .admin-content .ant-table-wrapper .ant-table {
          overflow-x: auto;
        }

        /* Responsive overrides */
        @media (max-width: ${MOBILE_BREAKPOINT - 1}px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }
          .admin-header {
            left: 0 !important;
            padding: 0 12px 0 4px !important;
          }
          .admin-header .admin-search-input {
            display: none;
          }
        }
      `}</style>

      {/* Mobile backdrop */}
      <div
        className={`admin-sidebar-backdrop ${isMobile && mobileOpen ? "visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`admin-sidebar ${isMobile && mobileOpen ? "mobile-open" : ""}`}
        style={{
          width: sidebarVisible ? SIDEBAR_WIDTH : 0,
          background: at.adminSidebarBg,
          ...(isMobile ? { width: SIDEBAR_WIDTH } : {}),
        }}
      >
        <div
          style={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            color: at.adminSidebarText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 600,
            overflow: "hidden",
            borderBottom: `1px solid ${at.adminBorderColor}`,
            padding: "0 12px",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {typeof logoDisplay === "string" ? (
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {logoDisplay}
            </span>
          ) : (
            logoDisplay
          )}
          {isMobile && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                color: at.adminSidebarText,
                fontSize: 16,
              }}
            />
          )}
        </div>
        <div className="admin-sidebar-menu-wrap">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            // defaultOpenKeys={["/admin/blogs"]}
            items={menuItems}
            style={{
              borderRight: 0,
              color: at.adminSidebarText,
              paddingTop: 8,
            }}
          />
        </div>
      </div>

      <Layout
        className={`admin-content ${routeLoading ? "admin-route-loading" : ""}`}
        style={{
          marginLeft: contentMarginLeft,
          minHeight: "100vh",
          transition: "margin-left 0.2s ease",
        }}
      >
        <Header
          className="admin-header"
          style={{
            position: "fixed",
            top: 0,
            left: contentMarginLeft,
            right: 0,
            zIndex: 99,
            padding: "0 16px 0 8px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            height: HEADER_HEIGHT,
            borderBottom: `1px solid ${at.adminBorderColor}`,
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.04)",
            transition: "left 0.2s ease",
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                mobileOpen ? (
                  <CloseOutlined />
                ) : (
                  <MenuUnfoldOutlined />
                )
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={toggleSidebar}
            style={{ fontSize: 18, color: at.adminTextColor }}
          />
          <Space size="middle" style={{ marginLeft: "auto" }}>
            {roleLabel ? (
              <Typography.Text
                style={{
                  color: at.adminTextColor,
                  background: "rgba(0, 0, 0, 0.05)",
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {roleLabel}
              </Typography.Text>
            ) : null}
            <Popover
              content={notificationContent}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
              arrow={false}
              overlayInnerStyle={{
                padding: 0,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Badge count={notifications.length} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  className={bellShake ? "bell-shake" : ""}
                  icon={
                    <BellOutlined
                      style={{ fontSize: 18, color: at.adminTextColor }}
                    />
                  }
                />
              </Badge>
            </Popover>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar
                size="default"
                icon={<UserOutlined />}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                  color: at.adminTextColor,
                  cursor: "pointer",
                }}
              />
            </Dropdown>
          </Space>
        </Header>
        <div
          style={{
            marginTop: HEADER_HEIGHT,
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
            position: "relative",
          }}
        >
          <Content style={{ padding: isMobile ? 8 : 10 }}>
            <AdminAuthProvider value={authContext}>
              {children}
            </AdminAuthProvider>
          </Content>
          <div className={`admin-route-loader ${routeLoading ? "visible" : ""}`}>
            <div className="admin-route-loader-spinner" />
          </div>
        </div>
      </Layout>
    </Layout>
  );
}
