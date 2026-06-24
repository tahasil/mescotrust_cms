"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Space, message, Spin, Drawer, Collapse } from "antd";
import { ArrowLeftOutlined, SettingOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";
import { ThemeAdminCard } from "@/styles/Theme";

function toUrlSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  const [parentFolders, setParentFolders] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const selectedParentRef = useRef("");
  const watchedSlug = Form.useWatch("slug", form);

  const updateSelectedParent = (val) => {
    setSelectedParent(val);
    selectedParentRef.current = val;
  };

  const setLayoutAndRef = useCallback((next) => {
    const nextLayout = typeof next === "function" ? next(layoutRef.current) : next;
    layoutRef.current = Array.isArray(nextLayout) ? nextLayout : [];
    setLayout(layoutRef.current);
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
        // Split slug into parent folder and page slug
        const fullSlug = (data.slug || "").replace(/\/undefined$/,"");
        const lastSlash = fullSlug.lastIndexOf("/");
        const parent = lastSlash > 0 ? fullSlug.substring(0, lastSlash) : "";
        const pageSlug = lastSlash > 0 ? fullSlug.substring(lastSlash + 1) : fullSlug;
        if (parent) updateSelectedParent(parent);
        form.setFieldsValue({
          title: data.title,
          slug: toUrlSlug(pageSlug || ""),
          _parentFolder: parent || "",
          status: data.status,
          metaTitle: data.meta?.metaTitle,
          metaDescription: data.meta?.metaDescription,
          metaKeywords: data.meta?.metaKeywords,
        });
        setSlugManuallyEdited(false);
      } catch (e) {
        message.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/pages?limit=200&fields=slug&includeTotal=0").then((res) =>
        res.ok ? res.json() : { items: [] },
      ),
      fetch("/api/admin/menus").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([pages, menus]) => {
        const folders = new Set();
        const pageItems = Array.isArray(pages?.items) ? pages.items : [];
        // From existing page slugs
        pageItems.forEach((p) => {
          if (p.slug && p.slug.includes("/")) {
            folders.add(p.slug.substring(0, p.slug.lastIndexOf("/")));
          }
        });
        // From menu items that have children (act as parent groups)
        (Array.isArray(menus) ? menus : []).forEach((menu) => {
          (Array.isArray(menu.items) ? menu.items : []).forEach((item) => {
            if (Array.isArray(item.children) && item.children.length > 0) {
              const slug = (item.label || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
              if (slug) folders.add(slug);
            }
          });
        });
        // Also include the current page's parent so it appears in the dropdown
        setParentFolders([...folders].sort());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedParent) return;
    setParentFolders((prev) => {
      if (prev.includes(selectedParent)) return prev;
      return [...prev, selectedParent].sort();
    });
  }, [selectedParent]);

  const handleSave = async () => {
    try {
      const values = await form.getFieldsValue(true);
      await form.validateFields();
      setSaving(true);
      const layoutToSave = layoutRef.current;
      const parentFolder = values._parentFolder || selectedParentRef.current || "";
      const pageSlug = toUrlSlug(values.slug || "");
      const fullSlug = parentFolder ? `${parentFolder}/${pageSlug}` : pageSlug;
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          slug: fullSlug,
          status: values.status,
          layout: layoutToSave,
          meta: {
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            metaKeywords: values.metaKeywords,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      setPage((prev) =>
        prev
          ? {
              ...prev,
              title: values.title,
              slug: fullSlug,
              status: values.status,
              layout: layoutToSave,
              meta: {
                metaTitle: values.metaTitle,
                metaDescription: values.metaDescription,
                metaKeywords: values.metaKeywords,
              },
            }
          : prev,
      );
      message.success("Page updated successfully");
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

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

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
        <Form form={form} layout="vertical" size="large">
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
                      <Input
                        onChange={(e) => {
                          const nextTitle = e.target.value;
                          if (!slugManuallyEdited) {
                            form.setFieldValue("slug", toUrlSlug(nextTitle));
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="Parent Menu">
                      <Select
                        showSearch
                        allowClear
                        placeholder="None (root level)"
                        value={selectedParent || undefined}
                        onChange={(val) => { updateSelectedParent(val || ""); form.setFieldValue("_parentFolder", val || ""); }}
                        onSearch={() => {}}
                        options={parentFolders.map((f) => ({ label: f, value: f }))}
                      />
                      {selectedParent && (
                        <span style={{ fontSize: 12, color: "#999", marginTop: 4, display: "block" }}>
                          URL: /{selectedParent}/{watchedSlug || "page-slug"}
                        </span>
                      )}
                    </Form.Item>
                    <Form.Item
                      name="slug"
                      label="Slug"
                      rules={[
                        { required: true, message: "Slug is required" },
                        {
                          pattern: /^[a-z0-9-]+$/,
                          message: "Use only lowercase letters, numbers, and hyphens",
                        },
                      ]}
                      extra="Use slug 'home' for the homepage (/) and Status 'Published' for the page to show on the site."
                    >
                      <Input
                        placeholder="e.g. home, about"
                        onChange={(e) => {
                          setSlugManuallyEdited(true);
                          form.setFieldValue("slug", toUrlSlug(e.target.value));
                        }}
                        onBlur={(e) => form.setFieldValue("slug", toUrlSlug(e.target.value))}
                      />
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
                    <Form.Item
                      name="metaKeywords"
                      label="Meta keywords"
                      extra="Comma separated. Example: education, scholarship, ngo"
                    >
                      <Input />
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
