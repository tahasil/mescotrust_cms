"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Select, Space, message, Drawer, Collapse } from "antd";
import { ArrowLeftOutlined, SettingOutlined, SaveOutlined, FolderOutlined } from "@ant-design/icons";
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

function getBaseComponent(block) {
  return (
    block?.baseComponent ||
    (typeof block?.componentId === "object" && block.componentId?.baseComponent) ||
    (typeof block?.componentId === "string" ? block.componentId : null) ||
    "Paragraph"
  );
}

function ensureBlogsListingBlock(layout) {
  const list = Array.isArray(layout) ? [...layout] : [];
  const hasBlogsListing = list.some(
    (block) => getBaseComponent(block) === "BlogsListing",
  );
  if (hasBlogsListing) return list;
  const nextOrder =
    list.reduce((maxOrder, block, index) => {
      const n = Number(block?.order);
      return Number.isFinite(n)
        ? Math.max(maxOrder, n)
        : Math.max(maxOrder, index);
    }, -1) + 1;
  list.push({
    instanceId: `auto_blogs_listing_${Date.now()}`,
    baseComponent: "BlogsListing",
    props: { basePath: "/blogs" },
    order: nextOrder,
  });
  return list;
}

const PAGE_BUILDER_REQUEST_TIMEOUT_MS = 20000;

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = PAGE_BUILDER_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** New page: same UI as edit page (Page Builder, Layers, drag-and-drop). Save creates the page via POST then redirects to edit. */
export default function AdminPageNewPage() {
  const router = useRouter();
  const [layout, setLayout] = useState([]);
  const layoutRef = useRef([]);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form] = Form.useForm();
  const [parentFolders, setParentFolders] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const watchedSlug = Form.useWatch("slug", form);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/pages?limit=200").then((res) =>
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
            folders.add(p.slug.split("/")[0]);
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
        setParentFolders([...folders].sort());
      })
      .catch(() => {});
  }, []);

  const setLayoutAndRef = useCallback((next) => {
    const nextLayout = typeof next === "function" ? next(layoutRef.current) : next;
    layoutRef.current = Array.isArray(nextLayout) ? nextLayout : [];
    setLayout(layoutRef.current);
  }, []);

  useEffect(() => {
    const pageSlug = toUrlSlug(watchedSlug || "");
    const fullSlug = selectedParent ? `${selectedParent}/${pageSlug}` : pageSlug;
    if (fullSlug !== "blogs") return;
    const nextLayout = ensureBlogsListingBlock(layoutRef.current);
    if (nextLayout.length !== layoutRef.current.length) {
      setLayoutAndRef(nextLayout);
    }
  }, [selectedParent, setLayoutAndRef, watchedSlug]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const layoutToSave = layoutRef.current;
      const { response, data } = await fetchJsonWithTimeout("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title || "Untitled",
          slug: selectedParent
            ? `${selectedParent}/${toUrlSlug(values.slug || "")}`
            : toUrlSlug(values.slug || ""),
          status: values.status,
          layout: layoutToSave,
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
        }),
      });
      if (!response.ok) {
        message.error(data.error || "Create failed");
        return;
      }
      message.success("Page created");
      router.push(`/admin/pages/${data._id}`);
    } catch (e) {
      if (e.errorFields) {
        setSettingsOpen(true);
        return;
      }
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/pages" style={{ textDecoration: "none", marginRight: 8 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" aria-label="Back to pages" />
          </Link>
          <span>New Page</span>
        </>
      }
      extra={
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Page Settings
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
        Reorder: drag blocks on canvas or use the Layers panel (click Layers) → Save to create page.
      </p>
      <PageBuilder layout={layout} onChange={setLayoutAndRef} showLayers={true} />

      <Drawer
        title="Page Settings"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={420}
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" size="large" initialValues={{ title: "", slug: "", status: "draft" }}>
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
                        placeholder="Page title"
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
                        onChange={(val) => setSelectedParent(val || "")}
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
                    <Form.Item name="status" label="Status">
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

