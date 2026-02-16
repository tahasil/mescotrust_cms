'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Input, Upload, message, Modal, Form, Spin, Popconfirm, Select, Empty } from 'antd';
import { UploadOutlined, DeleteOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMedia();
  }, [search, typeFilter]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      setMedia(data.media || []);
    } catch {
      message.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (info) => {
    const file = info.file;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      message.success('File uploaded successfully');
      fetchMedia();
    } catch (error) {
      message.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      message.success('Media deleted');
      setDetailModalOpen(false);
      setSelectedMedia(null);
      fetchMedia();
    } catch {
      message.error('Failed to delete media');
    }
  };

  const handleUpdate = async () => {
    if (!selectedMedia) return;
    try {
      const values = form.getFieldsValue();
      await fetch(`/api/admin/media/${selectedMedia._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Media updated');
      fetchMedia();
    } catch {
      message.error('Failed to update');
    }
  };

  const openDetail = (item) => {
    setSelectedMedia(item);
    form.setFieldsValue({ altText: item.altText, caption: item.caption });
    setDetailModalOpen(true);
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard');
  };

  const isImage = (mimetype) => mimetype?.startsWith('image/');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Media Library</h1>
        <Upload
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleUpload}
          multiple
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            Upload File
          </Button>
        </Upload>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Input
          placeholder="Search media..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
          allowClear
        />
        <Select
          placeholder="Filter by type"
          value={typeFilter}
          onChange={setTypeFilter}
          allowClear
          style={{ width: '150px' }}
          options={[
            { label: 'Images', value: 'image' },
            { label: 'Videos', value: 'video' },
            { label: 'Documents', value: 'document' },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /></div>
      ) : media.length === 0 ? (
        <Empty description="No media files" />
      ) : (
        <Row gutter={[16, 16]}>
          {media.map((item) => (
            <Col key={item._id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => openDetail(item)}
                bodyStyle={{ padding: '8px' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isImage(item.mimetype) ? (
                    <img src={item.url} alt={item.altText || item.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '8px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>📄</div>
                      {item.mimetype}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.originalName}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Media Details"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Popconfirm key="delete" title="Delete this file?" onConfirm={() => handleDelete(selectedMedia?._id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>,
          <Button key="save" type="primary" onClick={handleUpdate}>Save Changes</Button>,
        ]}
        width={700}
      >
        {selectedMedia && (
          <Row gutter={24}>
            <Col xs={24} md={12}>
              {isImage(selectedMedia.mimetype) ? (
                <img src={selectedMedia.url} alt={selectedMedia.altText} style={{ width: '100%', borderRadius: '8px' }} />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                  📄 {selectedMedia.originalName}
                </div>
              )}
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '12px' }}>
                <strong>URL:</strong>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Input value={selectedMedia.url} readOnly size="small" />
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyUrl(selectedMedia.url)} />
                </div>
              </div>
              <p><strong>Name:</strong> {selectedMedia.originalName}</p>
              <p><strong>Type:</strong> {selectedMedia.mimetype}</p>
              <p><strong>Size:</strong> {(selectedMedia.size / 1024).toFixed(1)} KB</p>
              <p><strong>Uploaded:</strong> {new Date(selectedMedia.createdAt).toLocaleString()}</p>

              <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
                <Form.Item name="altText" label="Alt Text">
                  <Input placeholder="Describe the image" />
                </Form.Item>
                <Form.Item name="caption" label="Caption">
                  <Input.TextArea rows={2} placeholder="Caption" />
                </Form.Item>
              </Form>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
