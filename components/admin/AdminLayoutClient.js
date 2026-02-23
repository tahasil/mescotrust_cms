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

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/admin", icon: <DashboardOutlined />, label: <Link href="/admin">Dashboard</Link> },
  { key: "/admin/pages", icon: <FileTextOutlined />, label: <Link href="/admin/pages">Pages</Link> },
  { key: "/admin/components", icon: <AppstoreOutlined />, label: <Link href="/admin/components">Components</Link> },
  { key: "/admin/blogs", icon: <BookOutlined />, label: <Link href="/admin/blogs">Blogs</Link> },
  { key: "/admin/blog-categories", icon: <BookOutlined />, label: <Link href="/admin/blog-categories">Categories</Link> },
  { key: "/admin/media", icon: <AppstoreOutlined />, label: <Link href="/admin/media">Media</Link> },
  { key: "/admin/menus", icon: <MenuOutlined />, label: <Link href="/admin/menus">Menus</Link> },
  { key: "/admin/theme", icon: <BgColorsOutlined />, label: <Link href="/admin/theme">Theme</Link> },
  { key: "/admin/contacts", icon: <MailOutlined />, label: <Link href="/admin/contacts">Contacts</Link> },
  { key: "/admin/users", icon: <TeamOutlined />, label: <Link href="/admin/users">Users</Link> },
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
      <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" collapsedWidth={0}>
        <div style={{ height: 32, margin: 16, color: "#fff", fontSize: collapsed ? 14 : 16, overflow: "hidden" }}>
          {collapsed ? "CMS" : "Mesco Trust CMS"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={["/admin/blogs"]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 16px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <UserOutlined />
              <span>{userName || "Admin"}{userRole ? ` (${userRole})` : ""}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: "24px 16px", padding: 24, background: "#fff", minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
