"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  HeartOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  DollarOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import { canAccessMenu, hasPermission } from "@/lib/rbac/clientPermissions";
import { getDefaultPermissionKeysForRole } from "@/lib/rbac/catalog";
import { AdminAuthProvider } from "@/components/admin/AdminAuthContext";

const { Header, Content } = Layout;

const SIDEBAR_WIDTH = 200;
const HEADER_HEIGHT = 64;
const MOBILE_BREAKPOINT = 992;
const ADMIN_ROUTE_LOADER_DELAY_MS = 60;
const ADMIN_ROUTE_LOADER_MIN_MS = 280;
const ADMIN_ROUTE_LOADER_POST_PATHNAME_SETTLE_MS = 450;

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
    key: "/admin/sliders",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/sliders" style={linkStyle}>
        Sliders
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
    key: "/admin/theme",
    icon: <BgColorsOutlined />,
    label: (
      <Link href="/admin/theme" style={linkStyle}>
        Theme
      </Link>
    ),
  },
  {
    key: "/admin/appearance",
    icon: <BgColorsOutlined />,
    label: (
      <Link href="/admin/appearance" style={linkStyle}>
        Appearance
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
];

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

export default function AdminLayoutClient({
  children,
  userName,
  userRole,
  userRoleKey,
  userType,
  permissionKeys,
}) {
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
  const routeChangedRef = useRef(false);
  const navPendingFetchRef = useRef(0);
  const prevCountRef = useRef(0);

  // RBAC: build the permission context for menu gating + AdminAuthProvider.
  // Falls back to the role's default permission set if no explicit keys are passed.
  const effectivePermissionKeys = useMemo(() => {
    if (Array.isArray(permissionKeys)) {
      return permissionKeys;
    }
    return Array.from(getDefaultPermissionKeysForRole(userRoleKey || userRole || "editor"));
  }, [permissionKeys, userRole, userRoleKey]);

  const authContext = useMemo(
    () => ({
      role: userRole,
      roleKey: userRoleKey || userRole,
      userType: userType || "",
      permissionKeys: effectivePermissionKeys,
    }),
    [effectivePermissionKeys, userRole, userRoleKey, userType],
  );

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
  }, []);

  const startRouteLoader = useCallback(() => {
    if (routeLoadingRef.current || routeShowTimerRef.current) return;
    clearRouteLoaderTimers();
    routeChangedRef.current = false;
    navPendingFetchRef.current = 0;
    routeShowTimerRef.current = window.setTimeout(() => {
      routeStartedAtRef.current = Date.now();
      routeLoadingRef.current = true;
      setRouteLoading(true);
      routeShowTimerRef.current = null;
    }, ADMIN_ROUTE_LOADER_DELAY_MS);
  }, [clearRouteLoaderTimers]);

  const stopRouteLoader = useCallback(() => {
    if (routeSettleTimerRef.current) {
      window.clearTimeout(routeSettleTimerRef.current);
      routeSettleTimerRef.current = null;
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
      routeChangedRef.current = false;
      navPendingFetchRef.current = 0;
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
    routeChangedRef.current = true;
    if (routeSettleTimerRef.current) {
      window.clearTimeout(routeSettleTimerRef.current);
      routeSettleTimerRef.current = null;
    }
    // Let the destination page mount and fire initial data fetches first.
    // If no tracked fetch starts, close loader after a short settle window.
    if (routeLoadingRef.current) {
      routeSettleTimerRef.current = window.setTimeout(() => {
        if (routeLoadingRef.current && navPendingFetchRef.current <= 0) {
          stopRouteLoader();
        }
        routeSettleTimerRef.current = null;
      }, ADMIN_ROUTE_LOADER_POST_PATHNAME_SETTLE_MS);
    }
  }, [pathname, isMobile]);

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
      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) return;
      startRouteLoader();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const originalFetch = window.fetch;
    const handleHistoryTarget = (targetLike) => {
      if (targetLike == null) return;
      try {
        const target = new URL(String(targetLike), window.location.href);
        const current = new URL(window.location.href);
        const nextPath = `${target.pathname}${target.search}${target.hash}`;
        const currentPath = `${current.pathname}${current.search}${current.hash}`;
        if (nextPath !== currentPath && isAdminHref(target.pathname)) startRouteLoader();
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
      let trackForRoute = false;
      if (routeLoadingRef.current) {
        try {
          const url =
            typeof input === "string"
              ? new URL(input, window.location.href)
              : new URL(input?.url || "", window.location.href);
          if (
            url.origin === window.location.origin &&
            (url.pathname.startsWith("/api/admin") ||
              url.pathname.startsWith("/api/theme") ||
              url.pathname.startsWith("/api/public"))
          ) {
            trackForRoute = true;
          }
        } catch {}
      }
      if (trackForRoute) {
        navPendingFetchRef.current += 1;
      }

      const done = () => {
        if (trackForRoute) {
          navPendingFetchRef.current = Math.max(0, navPendingFetchRef.current - 1);
          if (
            routeLoadingRef.current &&
            routeChangedRef.current &&
            navPendingFetchRef.current === 0
          ) {
            stopRouteLoader();
          }
        }
      };

      try {
        const result = originalFetch.call(window, input, init);
        return Promise.resolve(result).finally(done);
      } catch (err) {
        done();
        throw err;
      }
    };

    const onPopState = () => {
      if (window.location.pathname.startsWith("/admin")) startRouteLoader();
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
      clearRouteLoaderTimers();
    };
  }, [clearRouteLoaderTimers, startRouteLoader, stopRouteLoader]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const sidebarVisible = isMobile ? mobileOpen : !collapsed;
  const contentMarginLeft = isMobile ? 0 : collapsed ? 0 : SIDEBAR_WIDTH;
  // RBAC: filter nav by the active user's permissions. Submenu/group nodes
  // (containers) are kept only if at least one child survives; leaf items are
  // kept only if canAccessMenu allows their path. Replaces the old Author/Admin
  // role-string gating (Author is dropped per migration decision 6.1).
  const filteredMenuItems = useMemo(() => {
    const filterItems = (items) => {
      const source = Array.isArray(items) ? items : [];
      const result = [];
      for (const item of source) {
        const hasChildContainer = Array.isArray(item?.children);
        const children = hasChildContainer ? filterItems(item.children) : undefined;
        const itemKey = String(item?.key || "");
        const isGroupNode = itemKey.startsWith("group:");
        const selfAllowed = isGroupNode ? true : canAccessMenu(authContext, itemKey);
        const hasChildren = Array.isArray(children) && children.length > 0;
        if (hasChildContainer) {
          if (hasChildren) result.push({ ...item, children });
          continue;
        }
        if (isGroupNode) continue;
        if (!selfAllowed) continue;
        result.push(item);
      }
      return result;
    };
    return filterItems(baseMenuItems);
  }, [authContext]);

  const fetchNotifications = useCallback(() => {
    if (!hasPermission(authContext, "contacts.view")) {
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
    ])
      .then(([contacts, donations, subscribers, eventRegs]) => {
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
  }, [authContext]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const handleNewSubmission = () => setTimeout(fetchNotifications, 500);
    window.addEventListener("new-contact-submission", handleNewSubmission);
    window.addEventListener("new-donation", handleNewSubmission);
    return () => {
      clearInterval(interval);
      window.removeEventListener("new-contact-submission", handleNewSubmission);
      window.removeEventListener("new-donation", handleNewSubmission);
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
              window.location.href = item.link;
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
              onClick={() => setNotifOpen(false)}
              href="/admin/contacts"
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
    <AdminAuthProvider value={authContext}>
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
          position: absolute;
          inset: 0;
          z-index: 20;
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
            selectedKeys={[pathname]}
            // defaultOpenKeys={["/admin/blogs"]}
            items={filteredMenuItems}
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
            {userRole ? (
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
                {userRole}
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
            {children}
          </Content>
          <div className={`admin-route-loader ${routeLoading ? "visible" : ""}`}>
            <div className="admin-route-loader-spinner" />
          </div>
        </div>
      </Layout>
    </Layout>
    </AdminAuthProvider>
  );
}
