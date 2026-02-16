'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Popconfirm, Badge } from 'antd';
import { EyeOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

export default function ContactsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, [page]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/admin/contacts?${params}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
    } catch {
      message.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/admin/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      fetchSubmissions();
    } catch {
      message.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
      message.success('Submission deleted');
      fetchSubmissions();
    } catch {
      message.error('Failed to delete');
    }
  };

  const columns = [
    {
      title: 'Status',
      key: 'isRead',
      width: 80,
      render: (_, record) => record.isRead ? <Tag color="default">Read</Tag> : <Badge status="processing" text="New" />,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => record.data?.name || record.data?.Name || '-',
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.data?.email || record.data?.Email || '-',
    },
    {
      title: 'Page',
      dataIndex: 'page',
      key: 'page',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setDetailModal(record); if (!record.isRead) markAsRead(record._id); }} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Contact Submissions</h1>

      <Table
        dataSource={submissions}
        columns={columns}
        loading={loading}
        rowKey="_id"
        pagination={{ total, pageSize: 20, current: page, onChange: (p) => setPage(p) }}
        rowClassName={(record) => record.isRead ? '' : 'ant-table-row-highlight'}
      />

      <Modal
        title="Submission Details"
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={600}
      >
        {detailModal && (
          <div>
            <p><strong>Date:</strong> {new Date(detailModal.createdAt).toLocaleString()}</p>
            <p><strong>Page:</strong> {detailModal.page}</p>
            <p><strong>Form ID:</strong> {detailModal.formId}</p>
            <hr style={{ margin: '16px 0' }} />
            <h4>Form Data:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(detailModal.data || {}).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600, width: '30%' }}>{key}</td>
                    <td style={{ padding: '8px' }}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
