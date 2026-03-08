"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Button, Dropdown, Space } from "antd";
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
            padding: "0 16px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <UserOutlined />
              <span>
                {userName || "Admin"}
                {userRole ? ` (${userRole})` : ""}
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
