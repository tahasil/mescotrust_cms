"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Card, Space, message, Spin, Drawer, Collapse } from "antd";
import { ArrowLeftOutlined, SettingOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminPageEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [page, setPage] = useState(null);
  const [layout, setLayout] = useState([]);
  const layoutRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form] = Form.useForm();

  const setLayoutAndRef = useCallback((next) => {
    const nextLayout = typeof next === "function" ? next(layoutRef.current) : next;
    layoutRef.current = Array.isArray(nextLayout) ? nextLayout : [];
    setLayout(layoutRef.current);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("pageSaveSuccess") === "1") {
      sessionStorage.removeItem("pageSaveSuccess");
      message.success("Page updated successfully");
    }
  }, []);

  // Load page (including layout) from pages collection only — GET /api/admin/pages/[id] returns Page document
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
        const initialLayout = Array.isArray(data.layout) ? data.layout : [];
        layoutRef.current = initialLayout;
        setLayout(initialLayout);
        form.setFieldsValue({
          title: data.title,
          slug: data.slug,
          status: data.status,
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
      const layoutToSave = layoutRef.current;
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          slug: values.slug,
          status: values.status,
          layout: layoutToSave,
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pageSaveSuccess", "1");
      window.location.reload();
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
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/pages" style={{ textDecoration: "none", marginRight: 8 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" aria-label="Back to pages" />
          </Link>
          <span>{page?.title || "Edit Page"}</span>
        </>
      }
      extra={
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Page Settings
          </Button>
          <Link
            href={page?.slug ? `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/${page.slug}` : "#"}
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button disabled={!page?.slug} style={{ textDecoration: "none" }}>
              Preview
            </Button>
          </Link>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
        Reorder: drag blocks on canvas or use Move up/down in the Layers panel → Save to apply.
      </p>
      <PageBuilder layout={layout} onChange={setLayoutAndRef} showLayers={true} />

      {/* Page settings drawer — accordion style like components drawer */}
      <Drawer
        title="Page Settings"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={420}
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Update
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Collapse
            defaultActiveKey={[]}
            style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}
            items={[
              {
                key: "page-settings",
                label: "Page settings",
                children: (
                  <>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="slug"
                      label="Slug"
                      rules={[{ required: true }]}
                      extra="Use slug 'home' for the homepage (/) and Status 'Published' for the page to show on the site."
                    >
                      <Input placeholder="e.g. home, about" />
                    </Form.Item>
                    <Form.Item name="status" label="Status" initialValue="draft">
                      <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "seo",
                label: "SEO & Advanced",
                children: (
                  <>
                    <Form.Item name="metaTitle" label="Meta title">
                      <Input />
                    </Form.Item>
                    <Form.Item name="metaDescription" label="Meta description">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
    </ThemeAdminCard>
  );
}
