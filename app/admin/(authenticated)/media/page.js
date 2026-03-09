"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button, Space, message, Modal, Upload, Input, Pagination, Empty, Spin } from "antd";
import { UploadOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminMediaPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = (p = page) => {
    setLoading(true);
    fetch(`/api/admin/media?page=${p}&limit=20`)
      .then((res) => (res.ok ? res.json() : { items: [], total: 0 }))
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => message.error("Failed to load media"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia(page);
  }, [page]);

  const handleUpload = async (info) => {
    const file = info.file;
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "Upload failed");
        return;
      }
      message.success("File uploaded");
      fetchMedia(1);
      setPage(1);
    } catch (e) {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item) => {
    Modal.confirm({
      title: "Delete file?",
      content: `Delete "${item.originalName}"? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/media/${item._id}`, { method: "DELETE" });
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
      () => message.error("Failed to copy")
    );
  };

  return (
    <ThemeAdminCard
      title="Media Library"
      extra={
        <Upload
          beforeUpload={() => false}
          onChange={handleUpload}
          showUploadList={false}
          accept=".png,.jpg,.jpeg,.webp,.gif,.svg"
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            Upload image
          </Button>
        </Upload>
      }
    >
      <p style={{ color: "#666", marginBottom: 16 }}>
        Upload and manage images. Allowed formats: .png, .jpg, .jpeg, .webp, .gif, .svg. Max size: 5MB.
      </p>

      {loading ? (
        <Spin size="large" />
      ) : items.length === 0 ? (
        <Empty description="No media uploaded yet" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {items.map((item) => (
              <Card
                key={item._id}
                size="small"
                cover={
                  <div style={{ height: 140, overflow: "hidden", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={item.url}
                      alt={item.alt || item.originalName}
                      style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }}
                    />
                  </div>
                }
                actions={[
                  <CopyOutlined key="copy" onClick={() => handleCopyUrl(item.url)} />,
                  <DeleteOutlined key="delete" onClick={() => handleDelete(item)} style={{ color: "#ff4d4f" }} />,
                ]}
              >
                <Card.Meta
                  title={<span style={{ fontSize: 12 }}>{item.originalName}</span>}
                  description={<span style={{ fontSize: 11, color: "#999" }}>{(item.size / 1024).toFixed(1)} KB</span>}
                />
              </Card>
            ))}
          </div>

          {total > 20 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination current={page} total={total} pageSize={20} onChange={setPage} showSizeChanger={false} />
            </div>
          )}
        </>
      )}
    </ThemeAdminCard>
  );
}
