'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Form, Input, Select, Button, Space, message, Spin, Row, Col, Tag } from 'antd';
import { SaveOutlined, CheckCircleOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import slugify from 'slugify';

export default function BlogEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';

  const [blog, setBlog] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([fetchBlog(), fetchCategories()]).then(() => setLoading(false));
  }, [id]);

  const fetchBlog = async () => {
    if (isNew) {
      setBlog({ status: 'draft' });
      return;
    }
    try {
      const res = await fetch(`/api/admin/blogs/${id}`);
      if (!res.ok) throw new Error('Blog not found');
      const data = await res.json();
      setBlog(data);
      form.setFieldsValue({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        category: data.category?._id,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        tags: data.tags?.join(', '),
        status: data.status,
      });
    } catch {
      message.error('Blog not found');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/blog-categories');
      const data = await res.json();
      setCategories(data || []);
    } catch {}
  };

  const handleSave = async (status) => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const body = {
        title: values.title,
        slug: values.slug || slugify(values.title, { lower: true, strict: true }),
        content: values.content,
        excerpt: values.excerpt,
        featuredImage: values.featuredImage,
        category: values.category || null,
        status: status || values.status || 'draft',
        metaTitle: values.metaTitle || values.title,
        metaDescription: values.metaDescription,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      const url = isNew ? '/api/admin/blogs' : `/api/admin/blogs/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const saved = await res.json();
      message.success(status === 'published' ? 'Blog published!' : 'Blog saved!');

      if (isNew) {
        router.replace(`/admin/blogs/${saved._id}`);
      } else {
        setBlog(saved);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/blogs')}>Back</Button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            {isNew ? 'New Blog Post' : `Edit: ${blog?.title}`}
          </h1>
        </Space>
        <Space>
          <Button onClick={() => handleSave('draft')} loading={saving} icon={<SaveOutlined />}>Save Draft</Button>
          <Button type="primary" onClick={() => handleSave('published')} loading={saving} icon={<CheckCircleOutlined />}>Publish</Button>
          {!isNew && blog?.status === 'published' && (
            <Button icon={<EyeOutlined />} href={`/blog/${blog.slug}`} target="_blank">Preview</Button>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical" initialValues={blog}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Content" style={{ marginBottom: '16px' }}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input
                  placeholder="Blog post title"
                  size="large"
                  onChange={(e) => {
                    if (isNew) {
                      form.setFieldValue('slug', slugify(e.target.value, { lower: true, strict: true }));
                    }
                  }}
                />
              </Form.Item>
              <Form.Item name="slug" label="Slug">
                <Input addonBefore="/blog/" placeholder="post-slug" />
              </Form.Item>
              <Form.Item name="content" label="Content">
                <Input.TextArea rows={16} placeholder="Write your blog post content here (HTML supported)" />
              </Form.Item>
              <Form.Item name="excerpt" label="Excerpt">
                <Input.TextArea rows={3} placeholder="Short summary for listing pages" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Settings" style={{ marginBottom: '16px' }}>
              <Form.Item name="status" label="Status">
                <Select options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Published', value: 'published' },
                ]} />
              </Form.Item>
              <Form.Item name="category" label="Category">
                <Select
                  placeholder="Select category"
                  allowClear
                  options={categories.map((c) => ({ label: c.name, value: c._id }))}
                />
              </Form.Item>
              <Form.Item name="featuredImage" label="Featured Image URL">
                <Input placeholder="/uploads/2026/01/image.jpg" />
              </Form.Item>
              <Form.Item name="tags" label="Tags (comma-separated)">
                <Input placeholder="news, events, education" />
              </Form.Item>
            </Card>

            <Card title="SEO">
              <Form.Item name="metaTitle" label="Meta Title">
                <Input placeholder="SEO title" />
              </Form.Item>
              <Form.Item name="metaDescription" label="Meta Description">
                <Input.TextArea rows={3} placeholder="SEO description" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
