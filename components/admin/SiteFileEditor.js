"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Spin,
} from "antd";
import {
  ReloadOutlined,
  SaveOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

const FILE_CONFIG = Object.freeze({
  sitemap: {
    title: "Sitemap",
    generateLabel: "Generate Sitemap",
    saveLabel: "Save Sitemap",
  },
  robots: {
    title: "Robots",
    generateLabel: "Generate Robots",
    saveLabel: "Save Robots",
  },
});

export default function SiteFileEditor({ type }) {
  const config = FILE_CONFIG[type];
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const endpoint = useMemo(() => `/api/admin/settings/${type}`, [type]);

  const applyResponse = useCallback((data) => {
    setContent(String(data?.content || ""));
    setDirty(false);
  }, []);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Failed to load ${config.title.toLowerCase()}`);
      applyResponse(data);
    } catch (error) {
      message.error(error.message || `Failed to load ${config.title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [applyResponse, config.title, endpoint]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const generateContent = async () => {
    setGenerating(true);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Failed to generate ${config.title.toLowerCase()}`);
      applyResponse(data);
      message.success(`${config.title} generated and published`);
    } catch (error) {
      message.error(error.message || `Failed to generate ${config.title.toLowerCase()}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (!dirty) {
      generateContent();
      return;
    }
    Modal.confirm({
      title: `Replace unsaved ${config.title.toLowerCase()} changes?`,
      content: `Generating will replace the current editor content with fresh frontend data.`,
      okText: "Generate",
      cancelText: "Cancel",
      onOk: generateContent,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Failed to save ${config.title.toLowerCase()}`);
      applyResponse(data);
      message.success(`${config.title} saved and published`);
    } catch (error) {
      message.error(error.message || `Failed to save ${config.title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  const headerActions = (
    <Space wrap size={8} className="site-file-editor-actions">
      <Button
        icon={<ReloadOutlined />}
        onClick={loadContent}
        disabled={loading || saving || generating}
      >
        Refresh
      </Button>
      <Button
        icon={<SyncOutlined />}
        onClick={handleGenerate}
        loading={generating}
        disabled={loading || saving}
      >
        {config.generateLabel}
      </Button>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        loading={saving}
        disabled={loading || generating || !content.trim() || !dirty}
      >
        {config.saveLabel}
      </Button>
    </Space>
  );

  return (
    <ThemeAdminCard
      className="site-file-editor-card"
      title={config.title}
      extra={headerActions}
    >
      <div className="site-file-editor">
        <Spin spinning={loading}>
          <Input.TextArea
            className="site-file-editor-textarea"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setDirty(true);
            }}
            placeholder={`Enter ${config.title.toLowerCase()} content`}
            spellCheck={false}
            wrap="off"
            aria-label={`${config.title} content`}
          />
        </Spin>
      </div>

      <style jsx global>{`
        .site-file-editor {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .site-file-editor-actions {
          display: flex;
          justify-content: flex-end;
        }
        .site-file-editor-textarea.ant-input {
          display: block;
          width: 100%;
          min-height: clamp(360px, calc(100vh - 360px), 680px);
          resize: vertical;
          overflow: auto;
          font-family: Consolas, "Courier New", monospace;
          font-size: 13px;
          line-height: 1.6;
          tab-size: 2;
          white-space: pre;
        }
        @media (max-width: 767px) {
          .site-file-editor-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .site-file-editor-actions .ant-space-item {
            flex: 1 1 auto;
          }
          .site-file-editor-textarea.ant-input {
            min-height: 52vh;
            font-size: 12px;
          }
        }
      `}</style>
    </ThemeAdminCard>
  );
}
