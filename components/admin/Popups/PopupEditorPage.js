"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Drawer,
  Empty,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import PopupPreview from "./PopupPreview";
import PopupSettingsForm from "./PopupSettingsForm";

export default function PopupEditorPage({ componentId }) {
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [enabledSaving, setEnabledSaving] = useState(false);
  const [previewOverride, setPreviewOverride] = useState({});
  const formRef = useRef(null);

  const loadPopup = useCallback(async () => {
    if (!componentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/popups/${encodeURIComponent(componentId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load popup");
      }
      setPopup(data);
      setPreviewOverride({});
    } catch (err) {
      message.error(err?.message || "Failed to load popup");
      setPopup(null);
    } finally {
      setLoading(false);
    }
  }, [componentId]);

  useEffect(() => {
    loadPopup();
  }, [loadPopup]);

  const togglePublish = async () => {
    if (!popup?.componentId) return;
    try {
      setStatusSaving(true);
      const nextStatus = popup.status === "published" ? "draft" : "published";
      const res = await fetch(
        `/api/admin/popups/${encodeURIComponent(popup.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      setPopup(data);
      message.success(nextStatus === "published" ? "Popup published" : "Popup unpublished");
    } catch (err) {
      message.error(err?.message || "Failed to update popup status");
    } finally {
      setStatusSaving(false);
    }
  };

  const toggleEnabled = async () => {
    if (!popup?.componentId) return;
    try {
      setEnabledSaving(true);
      const res = await fetch(
        `/api/admin/popups/${encodeURIComponent(popup.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !popup.enabled }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update enabled status");
      setPopup(data);
      message.success(data.enabled ? "Popup enabled" : "Popup disabled");
    } catch (err) {
      message.error(err?.message || "Failed to update popup enabled status");
    } finally {
      setEnabledSaving(false);
    }
  };

  const previewData = useMemo(() => {
    const base =
      popup?.defaultProps && typeof popup.defaultProps === "object"
        ? popup.defaultProps
        : {};
    return {
      ...base,
      ...(previewOverride || {}),
    };
  }, [popup, previewOverride]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!popup) {
    return (
      <ThemeAdminCard
        title={
          <>
            <Link href="/admin/popups" style={{ marginRight: 8 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                aria-label="Back to popups"
              />
            </Link>
            Popup
          </>
        }
      >
        <Empty description="Popup not found" />
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/popups" style={{ marginRight: 8 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              aria-label="Back to popups"
            />
          </Link>
          {popup.displayName || popup.componentId}
        </>
      }
      extra={
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Tag color={popup.status === "published" ? "green" : "default"}>
            {popup.status === "published" ? "Published" : "Draft"}
          </Tag>
          <Tag color={popup.enabled ? "green" : "default"}>
            {popup.enabled ? "Enabled" : "Disabled"}
          </Tag>
          <Button
            type="default"
            icon={<UploadOutlined />}
            loading={statusSaving}
            onClick={togglePublish}
          >
            {popup.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            type="default"
            icon={popup.enabled ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            loading={enabledSaving}
            onClick={toggleEnabled}
          >
            {popup.enabled ? "Disable" : "Enable"}
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Edit
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: 10 }}>
        <Typography.Text type="secondary">
          Component ID: <code>{popup.componentId}</code>
        </Typography.Text>
      </div>

      <PopupPreview
        imageUrl={previewData.imageUrl}
        title={previewData.title}
        description={previewData.description}
        formShortcode={previewData.formShortcode}
      />

      <Drawer
        title={`Edit ${popup.displayName || popup.componentId}`}
        placement="right"
        width={Math.min(
          520,
          typeof window !== "undefined" ? window.innerWidth * 0.9 : 520,
        )}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={drawerSaving}
            disabled={drawerSaving}
            onClick={async () => {
              try {
                setDrawerSaving(true);
                await formRef.current?.update?.();
                await loadPopup();
                setDrawerOpen(false);
              } catch {
                // already handled in form
              } finally {
                setDrawerSaving(false);
              }
            }}
          >
            Update
          </Button>
        }
      >
        <PopupSettingsForm
          ref={formRef}
          componentId={popup.componentId}
          onLivePreviewChange={setPreviewOverride}
          onSuccess={(updated) => {
            if (updated && typeof updated === "object") {
              setPopup(updated);
            }
          }}
        />
      </Drawer>
    </ThemeAdminCard>
  );
}
