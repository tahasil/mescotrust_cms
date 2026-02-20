"use client";

import type { Session } from "next-auth";
import { Layout, Menu, Dropdown, Button } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  MailOutlined,
  SwapOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/pages", icon: <FileTextOutlined />, label: "Pages" },
  { key: "/admin/components", icon: <AppstoreOutlined />, label: "Components" },
  { key: "/admin/theme", icon: <SettingOutlined />, label: "Theme" },
  { key: "/admin/menu", icon: <MenuOutlined />, label: "Menus" },
  { key: "/admin/media", icon: <PictureOutlined />, label: "Media" },
  { key: "/admin/users", icon: <UserOutlined />, label: "Users" },
  { key: "/admin/roles", icon: <TeamOutlined />, label: "Roles" },
  { key: "/admin/blogs", icon: <BookOutlined />, label: "Blogs" },
  { key: "/admin/contacts", icon: <MailOutlined />, label: "Contacts" },
  { key: "/admin/redirects", icon: <SwapOutlined />, label: "Redirects" },
];

export function AdminShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const selectedKey = navItems.find((i) => pathname?.startsWith(i.key))?.key ?? "/admin";

  return (
    <Layout className="min-h-screen">
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div className="flex h-14 items-center justify-center text-white">
          <Link href="/admin">CMS</Link>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={navItems.map((item) => ({
            ...item,
            label: <Link href={item.key}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between bg-white px-4 shadow">
          <span className="text-gray-600">Admin</span>
          <Dropdown
            menu={{
              items: [
                {
                  key: "signout",
                  label: "Sign out",
                  onClick: () => signOut({ callbackUrl: "/admin/login" }),
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button type="text" icon={<UserOutlined />}>
              {session.user?.email ?? session.user?.name}
            </Button>
          </Dropdown>
        </Header>
        <Content className="m-4 bg-white p-4 min-h-[280px]">{children}</Content>
      </Layout>
    </Layout>
  );
}
