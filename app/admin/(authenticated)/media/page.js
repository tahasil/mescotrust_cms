"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Upload,
  Input,
  Pagination,
  Empty,
  Spin,
  Form,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
  FilePdfOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminMediaPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState(null); // currently-edited media item
  const [savingAlt, setSavingAlt] = useState(false);
  const [altForm] = Form.useForm();

  const fetchMedia = (p = page, q = searchQuery) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (q && q.trim()) params.set("search", q.trim());
    fetch(`/api/admin/media?${params}`)
      .then((res) => (res.ok ? res.json() : { items: [], total: 0 }))
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => message.error("Failed to load media"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia(page, searchQuery);
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchMedia(1, searchQuery);
  }, [searchQuery]);

  const uploadQueue = useRef([]);
  const isProcessing = useRef(false);

  const processQueue = async () => {
    if (isProcessing.current || uploadQueue.current.length === 0) return;
    isProcessing.current = true;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    while (uploadQueue.current.length > 0) {
      const file = uploadQueue.current.shift();
      const isPdf = file.type === "application/pdf";
      const maxSize = isPdf ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error(`"${file.name}" too large. Max: ${maxSize / 1024 / 1024}MB`);
        failCount++;
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          message.error(data.error || `"${file.name}" upload failed`);
          failCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        message.error(`"${file.name}" upload failed`);
        failCount++;
      }
    }

    if (successCount > 0) {
      message.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
      fetchMedia(1);
      setPage(1);
    }
    setUploading(false);
    isProcessing.current = false;
  };

  const handleUpload = (info) => {
    if (info.file) {
      uploadQueue.current.push(info.file);
      processQueue();
    }
  };

  const handleDelete = (item) => {
    Modal.confirm({
      title: "Delete file?",
      content: `Delete "${item.originalName}"? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/media/${item._id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          message.error("Delete failed");
          return;
        }
        message.success("File deleted");
        fetchMedia(page);
      },
    });
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(
      () => message.success("URL copied"),
      () => message.error("Failed to copy"),
    );
  };

  const handleOpenEdit = (item) => {
    setEditing(item);
    altForm.setFieldsValue({ alt: item.alt || "" });
  };

  const handleSaveAlt = async () => {
    if (!editing) return;
    try {
      const values = await altForm.validateFields();
      setSavingAlt(true);
      const res = await fetch(`/api/admin/media/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: values.alt || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Alt text saved");
      // Update the item in-place so we don't need a full refetch
      setItems((prev) =>
        prev.map((it) =>
          it._id === editing._id ? { ...it, alt: data.alt ?? values.alt ?? "" } : it,
        ),
      );
      setEditing(null);
    } catch (e) {
      if (e?.errorFields) return; // form validation handled by AntD
      message.error(e?.message || "Save failed");
    } finally {
      setSavingAlt(false);
    }
  };

  return (
    <ThemeAdminCard
      title={
        <div>
          <span>Media Library</span>
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "#999",
              marginTop: 2,
            }}
          >
            Upload and manage files. Allowed formats: .webp, .pdf (max 50MB).
          </div>
        </div>
      }
      extra={
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Upload
            multiple
            beforeUpload={() => false}
            onChange={handleUpload}
            showUploadList={false}
            accept=".webp,.pdf"
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
            >
              Upload file
            </Button>
          </Upload>
        </div>
      }
    >
      {loading ? (
        <Spin size="large" />
      ) : items.length === 0 ? (
        <Empty description="No media uploaded yet" />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((item) => (
              <Card
                key={item._id}
                size="small"
                cover={
                  <div
                    style={{
                      height: 140,
                      overflow: "hidden",
                      background: "#fafafa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.mimeType === "application/pdf" ? (
                      <FilePdfOutlined
                        style={{ fontSize: 48, color: "#ff4d4f" }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.alt || item.originalName}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 140,
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </div>
                }
                actions={[
                  <Tooltip key="copy" title="Copy URL">
                    <CopyOutlined onClick={() => handleCopyUrl(item.url)} />
                  </Tooltip>,
                  <Tooltip
                    key="edit"
                    title={item.mimeType === "application/pdf" ? "Edit details" : "Edit alt text"}
                  >
                    <EditOutlined onClick={() => handleOpenEdit(item)} />
                  </Tooltip>,
                  <Tooltip key="delete" title="Delete">
                    <DeleteOutlined
                      onClick={() => handleDelete(item)}
                      style={{ color: "#ff4d4f" }}
                    />
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={
                    <span style={{ fontSize: 12 }}>{item.originalName}</span>
                  }
                  description={
                    <span style={{ fontSize: 11, color: "#999" }}>
                      {(item.size / 1024).toFixed(1)} KB
                    </span>
                  }
                />
              </Card>
            ))}
          </div>

          {total > 20 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}

      <Modal
        title="Edit alt text"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={handleSaveAlt}
        confirmLoading={savingAlt}
        okText="Save"
        destroyOnClose
      >
        {editing && (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  flexShrink: 0,
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {editing.mimeType === "application/pdf" ? (
                  <FilePdfOutlined style={{ fontSize: 36, color: "#ff4d4f" }} />
                ) : (
                  <img
                    src={editing.url}
                    alt={editing.alt || editing.originalName}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    wordBreak: "break-all",
                    marginBottom: 2,
                  }}
                >
                  {editing.originalName}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>
                  {(editing.size / 1024).toFixed(1)} KB &middot; {editing.mimeType}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#1677ff",
                    marginTop: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {editing.url}
                </div>
              </div>
            </div>
            <Form form={altForm} layout="vertical" preserve={false}>
              <Form.Item
                name="alt"
                label="Alt text"
                extra="Short description used by screen readers and search engines. Leave blank for purely decorative images."
              >
                <Input.TextArea
                  rows={3}
                  maxLength={300}
                  showCount
                  placeholder="e.g. Children at MESCO scholarship distribution event 2024"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
