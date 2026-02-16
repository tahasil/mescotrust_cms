'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function BlogsListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
  }, [search, page]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/blogs?${params}`);
      const data = await res.json();
      setBlogs(data.blogs || []);
      setTotal(data.total || 0);
    } catch {
      message.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      message.success('Blog deleted');
      fetchBlogs();
    } catch {
      message.error('Failed to delete blog');
    }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (text, record) => <a onClick={() => router.push(`/admin/blogs/${record._id}`)}>{text}</a> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'published' ? 'green' : 'orange'}>{status}</Tag> },
    { title: 'Category', key: 'category', render: (_, record) => record.category?.name || '-' },
    { title: 'Author', key: 'author', render: (_, record) => record.author?.name || '-' },
    { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (date) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => router.push(`/admin/blogs/${record._id}`)} />
          <Button type="link" icon={<EyeOutlined />} href={`/blog/${record.slug}`} target="_blank" />
          <Popconfirm title="Delete this blog?" onConfirm={() => handleDelete(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Blog Posts</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/blogs/new')}>
          New Post
        </Button>
      </div>

      <Input
        placeholder="Search blogs..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '16px', maxWidth: '400px' }}
        allowClear
      />

      <Table
        dataSource={blogs}
        columns={columns}
        loading={loading}
        rowKey="_id"
        pagination={{ total, pageSize: 20, current: page, onChange: (p) => setPage(p) }}
      />
    </div>
  );
}
