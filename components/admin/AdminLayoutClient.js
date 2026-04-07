"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Space,
  Input,
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
  SearchOutlined,
  BellOutlined,
  GithubOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import { ThemeSider } from "@/styles/Theme";

const { Header, Content } = Layout;

const linkStyle = { textDecoration: "none" };

const menuItems = [
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
    key: "/admin/blogs",
    icon: <BookOutlined />,
    label: (
      <Link href="/admin/blogs" style={linkStyle}>
        Blogs
      </Link>
    ),
  },
  {
    key: "/admin/blog-categories",
    icon: <BookOutlined />,
    label: (
      <Link href="/admin/blog-categories" style={linkStyle}>
        Categories
      </Link>
    ),
  },
  {
    key: "/admin/media",
    icon: <AppstoreOutlined />,
    label: (
      <Link href="/admin/media" style={linkStyle}>
        Media
      </Link>
    ),
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
    key: "/admin/contacts",
    icon: <MailOutlined />,
    label: (
      <Link href="/admin/contacts" style={linkStyle}>
        Contacts
      </Link>
    ),
  },
  {
    key: "/admin/donations",
    icon: <HeartOutlined />,
    label: (
      <Link href="/admin/donations" style={linkStyle}>
        Donations
      </Link>
    ),
  },
  {
    key: "/admin/subscribers",
    icon: <MailOutlined />,
    label: (
      <Link href="/admin/subscribers" style={linkStyle}>
        Subscribers
      </Link>
    ),
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

export default function AdminLayoutClient({ children, userName, userRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const prevCountRef = useRef(0);

  const fetchNotifications = useCallback(() => {
    Promise.all([
      fetch("/api/admin/contacts?limit=20").then((r) => (r.ok ? r.json() : { items: [] })),
      fetch("/api/admin/donations?limit=20").then((r) => (r.ok ? r.json() : { items: [] })),
      fetch("/api/admin/subscribers?limit=10").then((r) => (r.ok ? r.json() : { items: [] })),
    ]).then(([contacts, donations, subscribers]) => {
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
      /* Show recent subscribers (last 24 hours) */
      const oneDayAgo = Date.now() - 86400000;
      (subscribers.items || []).forEach((s) => {
        if (s.status === "active" && new Date(s.createdAt).getTime() > oneDayAgo) {
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
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
      const sliced = notifs.slice(0, 10);
      if (sliced.length > prevCountRef.current && prevCountRef.current !== 0) {
        setBellShake(true);
        setTimeout(() => setBellShake(false), 1500);
      }
      prevCountRef.current = sliced.length;
      setNotifications(sliced);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    /* Listen for instant notification refresh from form submissions */
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
    <div style={{ width: 320 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <Typography.Text strong>{notifications.length} New Notifications</Typography.Text>
        <Typography.Link onClick={() => { setNotifications([]); setNotifOpen(false); }} style={{ fontSize: 13 }}>Clear all</Typography.Link>
      </div>
      <Divider style={{ margin: 0 }} />
      <List
        dataSource={notifications}
        locale={{ emptyText: "No new notifications" }}
        renderItem={(item) => (
          <List.Item
            style={{ padding: "10px 16px", cursor: "pointer", transition: "background 0.2s" }}
            onClick={() => { setNotifOpen(false); window.location.href = item.link; }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <List.Item.Meta
              avatar={<Avatar size={36} icon={item.icon} style={{ background: "rgba(0,0,0,0.04)" }} />}
              title={<span style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</span>}
              description={<span style={{ fontSize: 12, color: "#999", display: "flex", alignItems: "center", gap: 4 }}><ClockCircleOutlined style={{ fontSize: 11 }} /> {timeAgo(item.time)}</span>}
            />
          </List.Item>
        )}
      />
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ textAlign: "center", padding: "10px 16px" }}>
            <Typography.Link onClick={() => setNotifOpen(false)} href="/admin/contacts" style={{ fontSize: 13 }}>View all</Typography.Link>
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
      `}</style>
      <ThemeSider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={0}
        width={200}
      >
        <div
          style={{
            height: 64,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: collapsed ? 14 : 16,
            overflow: "hidden",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            marginBottom: 16,
          }}
        >
          {collapsed ? "CMS" : <img src="/images/logo.svg" alt="logo" />}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={["/admin/blogs"]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </ThemeSider>
      <Layout style={{ marginLeft: collapsed ? 0 : 200, minHeight: "100vh" }}>
        <Header
          style={{
            position: "fixed",
            top: 0,
            left: collapsed ? 0 : 200,
            right: 0,
            zIndex: 99,
            padding: "0 16px 0 8px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, color: "rgba(0, 0, 0, 0.65)" }}
          />
          <Input
            placeholder="Ctrl + K"
            prefix={
              <SearchOutlined
                style={{ color: "rgba(0, 0, 0, 0.25)", fontSize: 16 }}
              />
            }
            allowClear
            style={{
              maxWidth: 240,
              borderRadius: 8,
              backgroundColor: "#fff",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
            styles={{ input: { backgroundColor: "#fff" } }}
          />
          <Space size="middle" style={{ marginLeft: "auto" }}>
            <Button
              type="text"
              icon={
                <GithubOutlined
                  style={{ fontSize: 18, color: "rgba(0, 0, 0, 0.65)" }}
                />
              }
            />
            <Popover
              content={notificationContent}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
              arrow={false}
              overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: "hidden" }}
            >
              <Badge count={notifications.length} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  className={bellShake ? "bell-shake" : ""}
                  icon={
                    <BellOutlined
                      style={{ fontSize: 18, color: "rgba(0, 0, 0, 0.65)" }}
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
                  color: "rgba(0, 0, 0, 0.65)",
                  cursor: "pointer",
                }}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ marginTop: 64, padding: 10 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
