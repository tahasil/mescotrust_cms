"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Button,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  EditOutlined,
  LockOutlined,
  PictureOutlined,
  SaveOutlined,
  UnlockOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import PhotoGalleryEditForm from "@/components/site/PhotoGallery/EditForm";
import VideogalleryEditForm from "@/components/site/Videogallery/EditForm";

const PhotoGalleryPreview = dynamic(
  () => import("@/components/site/PhotoGallery/PhotoGallery"),
  { ssr: false },
);
const VideoGalleryPreview = dynamic(
  () => import("@/components/site/Videogallery/Videogallery"),
  { ssr: false },
);

const TopActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 12px;

  .left-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      color: #1677ff;
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
`;

const ShortcodeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 4px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: #374151;
`;

const PreviewWrapper = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  min-height: 480px;
  position: relative;
`;

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminGalleryEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gallery, setGallery] = useState(null);
  const [status, setStatus] = useState("published");
  const [galleryName, setGalleryName] = useState("");
  const [shortcode, setShortcode] = useState("");

  // Edit Shortcode Modal
  const [editShortcodeOpen, setEditShortcodeOpen] = useState(false);
  const [tempShortcode, setTempShortcode] = useState("");

  const editFormRef = useRef(null);

  const fetchGallery = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/galleries/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load gallery");
      setGallery(data);
      setStatus(data?.status || "published");
      setGalleryName(data?.name || "");
      setShortcode(data?.shortcode || "");
    } catch (err) {
      message.error(err?.message || "Failed to load gallery");
      router.push("/admin/gallery");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const galleryType = gallery?.type || "image";

  // Build adapted data payload for EditForm and Preview
  const adaptedData = useMemo(() => {
    if (!gallery) return {};
    const config = gallery.config || {};
    const tabs = Array.isArray(gallery.tabs) && gallery.tabs.length > 0
      ? gallery.tabs
      : ["All", "Education", "Medical", "Events", "Community"];
    const items = Array.isArray(gallery.items) ? gallery.items : [];

    if (galleryType === "image") {
      return {
        ...config,
        photoGalleryMainTitle: config.photoGalleryMainTitle ?? gallery.name ?? "",
        photoGallerySubTitle: config.photoGallerySubTitle ?? gallery.description ?? "Gallery",
        photoGalleryTabs: tabs,
        photoGalleryItems: items,
        photoGalleryLimitEnabled: config.photoGalleryLimitEnabled ?? false,
        photoGalleryLimitCount: config.photoGalleryLimitCount ?? 6,
        photoGalleryViewMoreText: config.photoGalleryViewMoreText ?? "View More",
        photoGalleryViewMoreLink: config.photoGalleryViewMoreLink ?? "",
      };
    }

    return {
      ...config,
      videogalleryMainTitle: config.videogalleryMainTitle ?? gallery.name ?? "",
      videogallerySubTitle: config.videogallerySubTitle ?? gallery.description ?? "Video Gallery",
      videogalleryTabs: tabs,
      videogalleryItems: items,
      videogalleryLimitEnabled: config.videogalleryLimitEnabled ?? false,
      videogalleryLimitCount: config.videogalleryLimitCount ?? 6,
      videogalleryViewMoreText: config.videogalleryViewMoreText ?? "View More",
      videogalleryViewMoreLink: config.videogalleryViewMoreLink ?? "",
    };
  }, [gallery, galleryType]);

  const handleSaveToPage = async (formPayload) => {
    if (!id) return;
    setSaving(true);
    try {
      const tabs = galleryType === "image"
        ? (formPayload.photoGalleryTabs || gallery.tabs)
        : (formPayload.videogalleryTabs || gallery.tabs);

      const items = galleryType === "image"
        ? (formPayload.photoGalleryItems || gallery.items)
        : (formPayload.videogalleryItems || gallery.items);

      const payload = {
        name: galleryName.trim() || gallery.name,
        shortcode: shortcode.trim() || gallery.shortcode,
        status,
        type: galleryType,
        tabs,
        items,
        config: formPayload,
      };

      const res = await fetch(`/api/admin/galleries/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update gallery");

      setGallery(data);
      message.success("Gallery saved successfully");
      setDrawerOpen(false);
    } catch (err) {
      message.error(err?.message || "Failed to save gallery");
    } finally {
      setSaving(false);
    }
  };

  const onTriggerSave = () => {
    if (editFormRef.current?.update) {
      editFormRef.current.update();
    }
  };

  const handleSaveShortcode = async () => {
    const clean = slugify(tempShortcode);
    if (!clean) {
      message.error("Please enter a valid shortcode");
      return;
    }
    try {
      const res = await fetch(`/api/admin/galleries/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcode: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update shortcode");
      setShortcode(clean);
      setGallery((prev) => ({ ...prev, shortcode: clean }));
      setEditShortcodeOpen(false);
      message.success("Shortcode updated successfully");
    } catch (err) {
      message.error(err?.message || "Failed to update shortcode");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Spin size="large" tip="Loading gallery..." />
      </div>
    );
  }

  const shortcodeSnippet = `[shortcode="${shortcode}"]`;

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Top Action Bar */}
      <TopActionBar>
        <div className="left-section">
          <Link href="/admin/gallery" className="back-btn">
            <ArrowLeftOutlined />
            <span>{gallery?.name || "Gallery"}</span>
          </Link>
        </div>

        <div className="right-section">
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            options={[
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ]}
          />

          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => setDrawerOpen(true)}
            size="middle"
          >
            Edit
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={onTriggerSave}
            size="middle"
          >
            Save
          </Button>
        </div>
      </TopActionBar>

      {/* Main Preview Canvas */}
      <PreviewWrapper>
        {galleryType === "image" ? (
          <PhotoGalleryPreview {...adaptedData} />
        ) : (
          <VideoGalleryPreview {...adaptedData} />
        )}
      </PreviewWrapper>

      {/* Right Settings Drawer */}
      <Drawer
        title={
          <Space>
            {galleryType === "video" ? (
              <VideoCameraOutlined style={{ color: "#722ed1" }} />
            ) : (
              <PictureOutlined style={{ color: "#1677ff" }} />
            )}
            <span>
              Edit {galleryType === "video" ? "Video Gallery" : "Image Gallery"} &mdash;{" "}
              {galleryName || gallery?.name}
            </span>
          </Space>
        }
        placement="right"
        width={Math.min(
          580,
          typeof window !== "undefined" ? window.innerWidth * 0.95 : 580,
        )}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose={false}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={onTriggerSave}
            >
              Save
            </Button>
          </Space>
        }
      >
        {galleryType === "image" ? (
          <PhotoGalleryEditForm
            ref={editFormRef}
            source="page"
            initialData={adaptedData}
            onSaveToPage={handleSaveToPage}
          />
        ) : (
          <VideogalleryEditForm
            ref={editFormRef}
            source="page"
            initialData={adaptedData}
            onSaveToPage={handleSaveToPage}
          />
        )}
      </Drawer>

      {/* Shortcode Warning & Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LockOutlined style={{ color: "#fa8c16" }} />
            <span>Modify Shortcode</span>
          </div>
        }
        open={editShortcodeOpen}
        onCancel={() => setEditShortcodeOpen(false)}
        onOk={handleSaveShortcode}
        okText="Update Shortcode"
      >
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "#b42318", fontSize: "13px", marginBottom: 12 }}>
            ⚠️ <strong>Warning:</strong> Changing this shortcode will break pages where the old
            shortcode <code>{shortcodeSnippet}</code> was previously embedded in the Page Builder.
          </p>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>New Shortcode:</div>
          <Input
            value={tempShortcode}
            onChange={(e) => setTempShortcode(slugify(e.target.value))}
            prefix={<span style={{ color: "rgba(0,0,0,0.45)" }}>[shortcode="</span>}
            suffix={<span style={{ color: "rgba(0,0,0,0.45)" }}>"]</span>}
          />
        </div>
      </Modal>
    </div>
  );
}
