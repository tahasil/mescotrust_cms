'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  AppstoreOutlined,
  PictureOutlined,
  MailOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      setData(json);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recent || {};

  const statCards = [
    { title: 'Total Pages', value: stats.pages?.total || 0, icon: <FileTextOutlined />, color: '#1890ff', suffix: `(${stats.pages?.published || 0} published)` },
    { title: 'Blog Posts', value: stats.blogs?.total || 0, icon: <EditOutlined />, color: '#52c41a', suffix: `(${stats.blogs?.published || 0} published)` },
    { title: 'Components', value: stats.components?.total || 0, icon: <AppstoreOutlined />, color: '#722ed1', suffix: `(${stats.components?.custom || 0} custom)` },
    { title: 'Media Files', value: stats.media || 0, icon: <PictureOutlined />, color: '#faad14' },
    { title: 'Contact Submissions', value: stats.contacts?.total || 0, icon: <MailOutlined />, color: '#CF372F', suffix: `(${stats.contacts?.unread || 0} unread)` },
    { title: 'Users', value: stats.users || 0, icon: <UserOutlined />, color: '#13c2c2' },
  ];

  const pageColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (text, record) => <Link href={`/admin/pages/${record._id}`}>{text}</Link> },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (slug) => <code>/{slug}</code> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'published' ? 'green' : 'orange'}>{status}</Tag> },
    { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (date) => new Date(date).toLocaleDateString() },
  ];

  const blogColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (text, record) => <Link href={`/admin/blogs/${record._id}`}>{text}</Link> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'published' ? 'green' : 'orange'}>{status}</Tag> },
    { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (date) => new Date(date).toLocaleDateString() },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Dashboard</h1>

      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
                suffix={stat.suffix ? <small style={{ fontSize: '12px', color: '#999' }}>{stat.suffix}</small> : null}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Pages" extra={<Link href="/admin/pages">View All</Link>}>
            <Table
              dataSource={recent.pages || []}
              columns={pageColumns}
              pagination={false}
              size="small"
              rowKey="_id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Blog Posts" extra={<Link href="/admin/blogs">View All</Link>}>
            <Table
              dataSource={recent.blogs || []}
              columns={blogColumns}
              pagination={false}
              size="small"
              rowKey="_id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
