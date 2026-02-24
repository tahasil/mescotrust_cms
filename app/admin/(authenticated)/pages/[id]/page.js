"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Card, Space, message, Spin, Drawer, Collapse } from "antd";
import { ArrowLeftOutlined, SettingOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";

export default function AdminPageEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [page, setPage] = useState(null);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/pages/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/admin/pages");
          return;
        }
        const data = await res.json();
        setPage(data);
        setLayout(Array.isArray(data.layout) ? data.layout : []);
        form.setFieldsValue({
          title: data.title,
          slug: data.slug,
          status: data.status,
          locale: data.locale || "en",
          metaTitle: data.meta?.metaTitle,
          metaDescription: data.meta?.metaDescription,
        });
      } catch (e) {
        message.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, router]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          slug: values.slug,
          status: values.status,
          locale: values.locale || "en",
          layout,
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      const updated = await res.json();
      setPage(updated);
      setLayout(Array.isArray(updated.layout) ? updated.layout : []);
      message.success("Saved");
    } catch (e) {
      if (e.errorFields) {
        setSettingsOpen(true);
        return;
      }
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  return (
    <div>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/pages">
            <Button icon={<ArrowLeftOutlined />} type="text">Pages</Button>
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>{page?.title || "Edit Page"}</h2>
            <span style={{ fontSize: 12, color: "#999" }}>/{page?.slug}</span>
          </div>
        </div>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Page Settings
          </Button>
          <Button href={`/preview/${id}?type=page`} target="_blank">
            Preview
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
      </div>

      {/* Visual builder - this IS the editor now */}
      <PageBuilder layout={layout} onChange={setLayout} showLayers={false} />

      {/* Page settings drawer */}
      <Drawer
        title="Page Settings"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={420}
        extra={
          <Button type="primary" onClick={() => setSettingsOpen(false)}>Done</Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          </Form.Item>
          <Collapse ghost items={[{
            key: "seo",
            label: "SEO & Advanced",
            children: (
              <>
                <Form.Item name="locale" label="Locale">
                  <Input placeholder="en" />
                </Form.Item>
                <Form.Item name="metaTitle" label="Meta title">
                  <Input />
                </Form.Item>
                <Form.Item name="metaDescription" label="Meta description">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </>
            ),
          }]} />
        </Form>
      </Drawer>
    </div>
  );
}
