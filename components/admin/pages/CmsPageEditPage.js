"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  message,
  Spin,
  Drawer,
  Collapse,
  Modal,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  SettingOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import PageBuilder from "@/components/admin/PageBuilder";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { hasPermission } from "@/lib/rbac/clientPermissions";

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

function buildSnapshotFromDoc(doc) {
  return {
    title: doc?.title || "",
    slug: doc?.slug || "",
    layout: Array.isArray(doc?.layout) ? doc.layout : [],
    meta: {
      metaTitle: doc?.meta?.metaTitle || "",
      metaDescription: doc?.meta?.metaDescription || "",
    },
    locale: doc?.locale || "en",
  };
}

function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot || {});
}

function parseParentAndLeaf(fullSlug) {
  const slug = String(fullSlug || "").replace(/\/undefined$/, "");
  const lastSlash = slug.lastIndexOf("/");
  const parent = lastSlash > 0 ? slug.substring(0, lastSlash) : "";
  const leaf = lastSlash > 0 ? slug.substring(lastSlash + 1) : slug;
  return { parent, leaf };
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

export default function AdminPageEditPage() {
  const auth = useAdminAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const canPublishPages = hasPermission(auth, "pages.publish");

  const [page, setPage] = useState(null);
  const [layout, setLayout] = useState([]);
  const layoutRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [form] = Form.useForm();
  const [parentFolders, setParentFolders] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const selectedParentRef = useRef("");
  const lastSavedSnapshotRef = useRef("");
  const initializedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const backGuardActiveRef = useRef(false);
  const skipBackGuardCleanupRef = useRef(false);

  const watchedSlug = Form.useWatch("slug", form);

  const updateSelectedParent = (val) => {
    setSelectedParent(val);
    selectedParentRef.current = val;
  };

  const setDirtyState = useCallback((nextDirty) => {
    const normalized = Boolean(nextDirty);
    const previous = isDirtyRef.current;
    if (normalized === previous) {
      setIsDirty(normalized);
      return;
    }

    if (typeof window !== "undefined") {
      if (normalized && !backGuardActiveRef.current) {
        window.history.pushState(
          { ...(window.history.state || {}), __cmsUnsavedGuard: true },
          "",
          window.location.href,
        );
        backGuardActiveRef.current = true;
      } else if (!normalized && backGuardActiveRef.current) {
        const shouldSkipCleanup = skipBackGuardCleanupRef.current;
        skipBackGuardCleanupRef.current = false;
        backGuardActiveRef.current = false;
        if (!shouldSkipCleanup && window.history.state?.__cmsUnsavedGuard) {
          window.history.back();
        }
      }
    }

    isDirtyRef.current = normalized;
    setIsDirty(normalized);
  }, []);

  const clearDirtyState = useCallback(({ skipBackGuardCleanup = false } = {}) => {
    skipBackGuardCleanupRef.current = Boolean(skipBackGuardCleanup);
    setDirtyState(false);
  }, [setDirtyState]);

  const buildCurrentSnapshot = useCallback(
    (layoutOverride) => {
      const values = form.getFieldsValue(true);
      const parentFolder = values._parentFolder || selectedParentRef.current || "";
      const pageSlug = toUrlSlug(values.slug || "");
      const fullSlug = parentFolder ? `${parentFolder}/${pageSlug}` : pageSlug;
      return {
        title: values.title || "",
        slug: fullSlug,
        layout: Array.isArray(layoutOverride) ? layoutOverride : layoutRef.current,
        meta: {
          metaTitle: values.metaTitle || "",
          metaDescription: values.metaDescription || "",
        },
        locale: page?.locale || "en",
      };
    },
    [form, page?.locale],
  );

  const applyDocToEditor = useCallback(
    (doc) => {
      let initialLayout = Array.isArray(doc?.layout) ? doc.layout : [];
      if (String(doc?.slug || "").replace(/\/undefined$/, "") === "blogs") {
        initialLayout = ensureBlogsListingBlock(initialLayout);
      }
      const fullSlug = (doc?.slug || "").replace(/\/undefined$/, "");
      const { parent, leaf } = parseParentAndLeaf(fullSlug);
      updateSelectedParent(parent || "");
      layoutRef.current = initialLayout;
      setLayout(initialLayout);
      form.setFieldsValue({
        title: doc?.title || "",
        slug: toUrlSlug(leaf || ""),
        _parentFolder: parent || "",
        metaTitle: doc?.meta?.metaTitle || "",
        metaDescription: doc?.meta?.metaDescription || "",
      });
      setSlugManuallyEdited(false);
      const snapshot = buildSnapshotFromDoc({ ...doc, layout: initialLayout });
      lastSavedSnapshotRef.current = serializeSnapshot(snapshot);
      setDirtyState(false);
      initializedRef.current = true;
    },
    [form, setDirtyState],
  );

  const recomputeDirty = useCallback(
    (layoutOverride) => {
      if (!initializedRef.current) return;
      const current = serializeSnapshot(buildCurrentSnapshot(layoutOverride));
      setDirtyState(current !== lastSavedSnapshotRef.current);
    },
    [buildCurrentSnapshot, setDirtyState],
  );

  const setLayoutAndRef = useCallback(
    (next) => {
      const nextLayout = typeof next === "function" ? next(layoutRef.current) : next;
      layoutRef.current = Array.isArray(nextLayout) ? nextLayout : [];
      setLayout(layoutRef.current);
      recomputeDirty(layoutRef.current);
    },
    [recomputeDirty],
  );

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
        applyDocToEditor(data);
      } catch {
        message.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router, applyDocToEditor]);

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
        pageItems.forEach((p) => {
          if (p.slug && p.slug.includes("/")) {
            folders.add(p.slug.substring(0, p.slug.lastIndexOf("/")));
          }
        });
        (Array.isArray(menus) ? menus : []).forEach((menu) => {
          (Array.isArray(menu.items) ? menu.items : []).forEach((item) => {
            if (Array.isArray(item.children) && item.children.length > 0) {
              const slug = (item.label || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
              if (slug) folders.add(slug);
            }
          });
        });
        if (selectedParent) folders.add(selectedParent);
        setParentFolders([...folders].sort());
      })
      .catch(() => {});
  }, [selectedParent]);

  const persistDraft = useCallback(
    async ({ showSuccessMessage = true } = {}) => {
      try {
        await form.validateFields();
        setSaving(true);
        const payload = buildCurrentSnapshot();
        const { response, data } = await fetchJsonWithTimeout(`/api/admin/pages/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ifMatchUpdatedAt: page?.updatedAt,
          }),
        });
        if (!response.ok) {
          message.error(data.error || "Save draft failed");
          return null;
        }
        setPage(data);
        applyDocToEditor(data);
        if (showSuccessMessage) {
          message.success("Draft saved");
        }
        return data;
      } catch (e) {
        if (e?.errorFields) {
          setSettingsOpen(true);
          return null;
        }
        message.error(e?.message || "Save draft failed");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [applyDocToEditor, buildCurrentSnapshot, form, id, page?.updatedAt],
  );

  const runPublish = useCallback(async () => {
    if (!canPublishPages) {
      message.warning("You do not have permission to publish pages.");
      return;
    }

    const savedPage = await persistDraft({ showSuccessMessage: false });
    if (!savedPage) return;

    setPublishing(true);
    try {
      const { response, data } = await fetchJsonWithTimeout(`/api/admin/pages/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ifMatchUpdatedAt: savedPage?.updatedAt || page?.updatedAt }),
      });
      if (!response.ok) {
        message.error(data.error || "Publish failed");
        return;
      }
      setPage(data);
      applyDocToEditor(data);
      message.success("Changes published to live website");
    } catch (e) {
      message.error(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [applyDocToEditor, canPublishPages, id, page?.updatedAt, persistDraft]);

  const handlePublish = useCallback(() => {
    Modal.confirm({
      title: "Publish changes?",
      content: "Are you sure you want to publish these changes to the live website?",
      okText: "Yes",
      cancelText: "No",
      onOk: runPublish,
    });
  }, [runPublish]);

  const openPreviewWithToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/pages/${id}/preview-token`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        message.error(data.error || "Unable to open preview");
        return;
      }
      const relativePreviewPath = `/preview/${id}?type=page&token=${encodeURIComponent(data.token)}`;
      const previewBaseUrl = String(data.previewBaseUrl || "").trim().replace(/\/+$/, "");
      const href = previewBaseUrl ? `${previewBaseUrl}${relativePreviewPath}` : relativePreviewPath;
      window.open(href, "_blank", "noopener,noreferrer");
    } catch {
      message.error("Unable to open preview");
    }
  }, [id]);

  const handlePreview = useCallback(() => {
    if (isDirtyRef.current) {
      Modal.confirm({
        title: "Unsaved changes",
        content: "Save draft before preview?",
        okText: "Save Draft & Preview",
        cancelText: "Preview Last Saved Draft",
        onOk: async () => {
          const savedPage = await persistDraft({ showSuccessMessage: false });
          if (savedPage) {
            await openPreviewWithToken();
          }
        },
        onCancel: openPreviewWithToken,
      });
      return;
    }
    openPreviewWithToken();
  }, [openPreviewWithToken, persistDraft]);

  const confirmDiscardAndRun = useCallback(
    (run) => {
      if (!isDirtyRef.current) {
        run();
        return;
      }
      Modal.confirm({
        title: "Unsaved changes",
        content: "You have unsaved changes. Discard changes?",
        okText: "Discard",
        okType: "danger",
        cancelText: "Stay",
        onOk: () => {
          clearDirtyState({ skipBackGuardCleanup: true });
          run();
        },
      });
    },
    [clearDirtyState],
  );

  const handleBackToPages = useCallback(() => {
    confirmDiscardAndRun(() => router.push("/admin/pages"));
  }, [confirmDiscardAndRun, router]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      const prompt = "You have unsaved changes. Discard changes?";
      event.returnValue = prompt;
      return prompt;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onPopState = (event) => {
      if (!isDirtyRef.current) return;
      if (event?.state?.__cmsUnsavedGuard) return;

      const discard = window.confirm("You have unsaved changes. Discard changes?");
      if (!discard) {
        window.history.forward();
        return;
      }
      clearDirtyState({ skipBackGuardCleanup: true });
      window.history.back();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [clearDirtyState]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!isDirtyRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const destination = new URL(href, window.location.origin);
      if (destination.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const target = `${destination.pathname}${destination.search}`;
      if (current === target) return;

      event.preventDefault();
      confirmDiscardAndRun(() => {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      });
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [confirmDiscardAndRun, router]);

  const isPublishable =
    page?.status === "published" ||
    !!page?.publishedAt ||
    !!String(page?.publishedSlug || "").trim() ||
    Array.isArray(page?.publishedLayout);

  const primaryIsPublish = canPublishPages && isPublishable;

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  return (
    <ThemeAdminCard
      title={
        <>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            aria-label="Back to pages"
            onClick={handleBackToPages}
            style={{ marginRight: 8 }}
          />
          <span>{page?.title || "Edit Page"}</span>
        </>
      }
      extra={
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Page Settings
          </Button>
          <Button onClick={handlePreview}>Preview</Button>
          {primaryIsPublish ? (
            <>
              <Button icon={<SaveOutlined />} loading={saving} onClick={() => persistDraft()}>
                Save Draft
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={publishing}
                onClick={handlePublish}
              >
                Publish
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => persistDraft()}
            >
              Save Draft
            </Button>
          )}
        </Space>
      }
    >
      <PageBuilder
        layout={layout}
        onChange={setLayoutAndRef}
        showLayers={true}
      />

      <Drawer
        title="Page Settings"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={420}
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => persistDraft()}>
            Save Draft
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          size="large"
          onValuesChange={() => {
            recomputeDirty();
          }}
        >
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
                        onChange={(val) => {
                          updateSelectedParent(val || "");
                          form.setFieldValue("_parentFolder", val || "");
                          recomputeDirty();
                        }}
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
                      extra="Use slug 'home' for the homepage (/). Draft saves do not update live content until Publish."
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
                    <Form.Item label="Publication Status">
                      <Tag color={isPublishable ? "green" : "default"}>
                        {isPublishable ? "Published (live snapshot exists)" : "Draft"}
                      </Tag>
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
