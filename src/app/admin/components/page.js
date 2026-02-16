'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Tabs, Modal, Form, Input, Select, message, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function ComponentsListPage() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/components');
      const data = await res.json();
      setComponents(data || []);
    } catch {
      message.error('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const name = values.name.replace(/\s+/g, '');
      const res = await fetch('/api/admin/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          displayName: values.displayName,
          category: values.category,
          propsSchema: [],
          defaultProps: {},
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const newComp = await res.json();
      message.success('Component created');
      setModalOpen(false);
      form.resetFields();
      router.push(`/admin/components/${newComp._id}`);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await fetch(`/api/admin/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchComponents();
    } catch {
      message.error('Failed to update component');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/components/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      message.success('Component deleted');
      fetchComponents();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'displayName', key: 'displayName' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={type === 'system' ? 'blue' : 'purple'}>{type}</Tag>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Fields',
      key: 'fields',
      render: (_, record) => record.propsSchema?.length || 0,
    },
    {
      title: 'Active',
      key: 'active',
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) => handleToggle(record._id, checked)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.type === 'custom' && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => router.push(`/admin/components/${record._id}`)} />
              <Popconfirm title="Delete this component?" onConfirm={() => handleDelete(record._id)}>
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {record.type === 'system' && <span style={{ color: '#999', fontSize: '12px' }}>System (read-only)</span>}
        </Space>
      ),
    },
  ];

  const systemComponents = components.filter((c) => c.type === 'system');
  const customComponents = components.filter((c) => c.type === 'custom');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Components</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Custom Component
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'all',
            label: `All (${components.length})`,
            children: <Table dataSource={components} columns={columns} loading={loading} rowKey="_id" pagination={false} />,
          },
          {
            key: 'system',
            label: `System (${systemComponents.length})`,
            children: <Table dataSource={systemComponents} columns={columns} loading={loading} rowKey="_id" pagination={false} />,
          },
          {
            key: 'custom',
            label: `Custom (${customComponents.length})`,
            children: <Table dataSource={customComponents} columns={columns} loading={loading} rowKey="_id" pagination={false} />,
          },
        ]}
      />

      <Modal title="Create Custom Component" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Component Name (no spaces)" rules={[{ required: true }]}>
            <Input placeholder="e.g., CustomBanner" />
          </Form.Item>
          <Form.Item name="displayName" label="Display Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Custom Banner" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Layout', value: 'layout' },
              { label: 'Content', value: 'content' },
              { label: 'Marketing', value: 'marketing' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
