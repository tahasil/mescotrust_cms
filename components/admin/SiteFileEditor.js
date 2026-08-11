"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  ExportOutlined,
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
    publicUrl: "/sitemap.xml",
    description:
      "Generate the sitemap from published frontend pages, blogs, and events, or edit the XML manually.",
  },
  robots: {
    title: "Robots",
    generateLabel: "Generate Robots",
    saveLabel: "Save Robots",
    publicUrl: "/robots.txt",
    description:
      "Generate robots.txt from the configured website URL, or edit the crawler directives manually.",
  },
});

function displayDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not yet" : date.toLocaleString();
}

export default function SiteFileEditor({ type }) {
  const config = FILE_CONFIG[type];
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [details, setDetails] = useState({
    isSaved: false,
    generatedAt: null,
    updatedAt: null,
    updatedBy: "",
  });

  const endpoint = useMemo(() => `/api/admin/settings/${type}`, [type]);

  const applyResponse = useCallback((data) => {
    setContent(String(data?.content || ""));
    setDetails({
      isSaved: Boolean(data?.isSaved),
      generatedAt: data?.generatedAt || null,
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || "",
    });
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

  return (
    <ThemeAdminCard className="site-file-editor-card" title={config.title}>
      <div className="site-file-editor">
        <div className="site-file-editor-toolbar">
          <div className="site-file-editor-summary">
            <Typography.Text>{config.description}</Typography.Text>
            <Typography.Text type="secondary" className="site-file-editor-meta">
              Last updated: {displayDate(details.updatedAt)}
              {details.updatedBy ? ` by ${details.updatedBy}` : ""}
              {details.generatedAt ? ` · Last generated: ${displayDate(details.generatedAt)}` : ""}
            </Typography.Text>
          </div>
          <Space wrap className="site-file-editor-actions">
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
        </div>

        <Alert
          type="info"
          showIcon
          message={
            <span>
              Public URL:{" "}
              <Typography.Link href={config.publicUrl} target="_blank" rel="noreferrer">
                {config.publicUrl} <ExportOutlined />
              </Typography.Link>
            </span>
          }
          description={
            details.isSaved
              ? "The saved content below is currently published at this URL."
              : "No custom version has been saved yet. The editor is showing freshly generated content."
          }
        />

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
        .site-file-editor-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .site-file-editor-summary {
          display: flex;
          flex: 1 1 360px;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }
        .site-file-editor-meta {
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .site-file-editor-actions {
          display: flex;
          flex: 0 1 auto;
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
          .site-file-editor-toolbar {
            flex-direction: column;
          }
          .site-file-editor-summary,
          .site-file-editor-actions {
            width: 100%;
            flex-basis: auto;
          }
          .site-file-editor-actions {
            justify-content: stretch;
          }
          .site-file-editor-actions .ant-space-item {
            flex: 1 1 140px;
          }
          .site-file-editor-actions .ant-btn {
            width: 100%;
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
