'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import slugify from 'slugify';

export default function PagesListPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchPages();
  }, [search]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/pages?${params}`);
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      message.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const slug = slugify(values.title, { lower: true, strict: true });
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          slug,
          status: 'draft',
          metaTitle: values.title,
          layout: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const newPage = await res.json();
      message.success('Page created');
      setModalOpen(false);
      form.resetFields();
      router.push(`/admin/pages/${newPage._id}`);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      message.success('Page deleted');
      fetchPages();
    } catch {
      message.error('Failed to delete page');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => router.push(`/admin/pages/${record._id}`)} style={{ cursor: 'pointer' }}>
          {text}
        </a>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <code>/{slug}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Components',
      key: 'components',
      render: (_, record) => record.layout?.length || 0,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/pages/${record._id}`)}
          />
          <Button
            type="link"
            icon={<EyeOutlined />}
            href={`/${record.slug}`}
            target="_blank"
          />
          <Popconfirm
            title="Delete this page?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Pages</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Page
        </Button>
      </div>

      <Input
        placeholder="Search pages..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '16px', maxWidth: '400px' }}
        allowClear
      />

      <Table
        dataSource={pages}
        columns={columns}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="Create New Page"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="Page Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="Enter page title" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
