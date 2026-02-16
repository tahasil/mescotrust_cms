'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { Layout, Menu, Button, Dropdown, Avatar, Spin, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  EditOutlined,
  PictureOutlined,
  MailOutlined,
  BgColorsOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/pages', icon: <FileTextOutlined />, label: 'Pages' },
  { key: '/admin/components', icon: <AppstoreOutlined />, label: 'Components' },
  {
    key: 'blog-group',
    icon: <EditOutlined />,
    label: 'Blog',
    children: [
      { key: '/admin/blogs', label: 'All Posts' },
      { key: '/admin/blog-categories', label: 'Categories' },
    ],
  },
  { key: '/admin/media', icon: <PictureOutlined />, label: 'Media' },
  { key: '/admin/contacts', icon: <MailOutlined />, label: 'Contacts' },
  { key: '/admin/theme', icon: <BgColorsOutlined />, label: 'Theme' },
  { key: '/admin/users', icon: <UserOutlined />, label: 'Users' },
];

function AdminLayoutContent({ children, initialSession }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const effectiveSession = session ?? initialSession;

  // Don't show layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If we have no session and not loading, redirect to login (middleware should have caught this; safety net)
  if (status === 'unauthenticated' && !initialSession) {
    const loginUrl = `/admin/login?callbackUrl=${encodeURIComponent(pathname || '/admin')}`;
    router.replace(loginUrl);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Show loading only when we have no session data yet (neither from server nor from client)
  if (!effectiveSession && (status === 'loading' || !initialSession)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('/')) {
      router.push(key);
    }
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: effectiveSession?.user?.name || 'Admin' },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => signOut({ callbackUrl: '/admin/login' }),
    },
  ];

  const selectedKeys = [pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? '14px' : '18px' }}>
            {collapsed ? 'CMS' : 'MESCO CMS'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px' }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#CF372F' }} />
              {!collapsed && (
                <span style={{ fontSize: '14px' }}>
                  {effectiveSession?.user?.name || 'Admin'}
                </span>
              )}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function AdminLayoutClient({ children, session: initialSession }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#CF372F',
          borderRadius: 8,
        },
      }}
    >
      <SessionProvider session={initialSession}>
        <AdminLayoutContent initialSession={initialSession}>
          {children}
        </AdminLayoutContent>
      </SessionProvider>
    </ConfigProvider>
  );
}
