"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  PictureOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { readJson } from "./mediaUtils";

const SIZE_OPTIONS = [
  { value: "original", label: "Original" },
  { value: "thumbnail", label: "Thumb" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
];

const FORMAT_OPTIONS = [
  { value: "auto", label: "Auto (AVIF/WebP/JPG)" },
  { value: "avif", label: "AVIF" },
  { value: "webp", label: "WebP" },
  { value: "original", label: "JPG/Original" },
];

function parseMediaValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return { mediaId: "", size: "original", format: "auto" };

  const match = raw.match(/\/media\/([a-fA-F0-9]{24})(?:\?([^#]+))?/);
  if (!match) return { mediaId: "", size: "original", format: "auto" };

  const mediaId = String(match[1] || "");
  const params = new URLSearchParams(match[2] || "");
  const size = params.get("size") || "original";
  const format = params.get("format") || "auto";
  return { mediaId, size, format };
}

function buildMediaUrl(mediaId, size, format) {
  const id = String(mediaId || "").trim();
  if (!id) return "";
  const params = new URLSearchParams();
  if (size && size !== "original") params.set("size", size);
  if (format && format !== "auto") params.set("format", format);
  const query = params.toString();
  return query ? `/media/${id}?${query}` : `/media/${id}`;
}

function getImagePreview(item) {
  if (!item) return "";
  return (
    item?.generatedSizes?.thumbnail?.jpgUrl ||
    item?.generatedSizes?.medium?.jpgUrl ||
    item?.url ||
    item?.originalUrl ||
    item?.publicUrl ||
    ""
  );
}

export default function MediaPickerInput({
  value,
  onChange,
  placeholder = "https://...",
  allowManual = true,
  showVariants = true,
  uiVariant = "default",
  hintText = "",
}) {
  const parsed = useMemo(() => parseMediaValue(value), [value]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeMedia, setActiveMedia] = useState(null);
  const [size, setSize] = useState(parsed.size || "original");
  const [format, setFormat] = useState(parsed.format || "auto");

  const mediaId = parsed.mediaId || String(activeMedia?._id || "");
  const pageSize = 18;

  useEffect(() => {
    setSize(parsed.size || "original");
    setFormat(parsed.format || "auto");
  }, [parsed.size, parsed.format]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(queryInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const fetchLibrary = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
          type: "image",
        });
        if (query) params.set("q", query);
        const res = await fetch(`/api/admin/media?${params.toString()}`);
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Failed to load media");
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) || 0);
      } catch (err) {
        message.error(err.message || "Failed to load media");
      } finally {
        setLoading(false);
      }
    },
    [page, query],
  );

  useEffect(() => {
    if (!libraryOpen) return;
    fetchLibrary(page);
  }, [libraryOpen, page, query, fetchLibrary]);

  useEffect(() => {
    const id = String(parsed.mediaId || "");
    if (!id) {
      setActiveMedia(null);
      return;
    }
    if (String(activeMedia?._id || "") === id) return;
    let cancelled = false;
    fetch(`/api/admin/media/${id}`)
      .then((res) => readJson(res).then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || cancelled) return;
        setActiveMedia(data);
      })
      .catch(() => {
        if (!cancelled) setActiveMedia(null);
      });
    return () => {
      cancelled = true;
    };
  }, [parsed.mediaId, activeMedia?._id]);

  const applyVariantUrl = useCallback(
    (targetMediaId, nextSize, nextFormat) => {
      const nextUrl = buildMediaUrl(
        targetMediaId,
        nextSize || "original",
        nextFormat || "auto",
      );
      onChange?.(nextUrl);
    },
    [onChange],
  );

  const selectMedia = (item) => {
    if (!item?._id) return;
    setActiveMedia(item);
    applyVariantUrl(item._id, size || "original", format || "auto");
    setLibraryOpen(false);
  };

  const onUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: fd,
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onSuccess?.(data);
      message.success("Image uploaded");
      setPage(1);
      fetchLibrary(1);
    } catch (err) {
      onError?.(err);
      message.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const variantAvailability = useMemo(() => {
    const sizes = activeMedia?.generatedSizes || {};
    const map = {};
    for (const option of SIZE_OPTIONS) {
      if (option.value === "original") {
        map[option.value] = true;
        continue;
      }
      const sizeData = sizes[option.value] || {};
      map[option.value] = Boolean(
        sizeData.jpgUrl || sizeData.webpUrl || sizeData.avifUrl,
      );
    }
    return map;
  }, [activeMedia]);

  const previewSrc = useMemo(() => {
    if (mediaId) return buildMediaUrl(mediaId, size, format);
    return String(value || "").trim();
  }, [mediaId, size, format, value]);
  const isStacked = uiVariant === "stacked";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {isStacked ? (
        <>
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 8,
              padding: 8,
              background: "#fafafa",
              width: "100%",
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Selected media preview"
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "contain",
                  borderRadius: 6,
                  background: "#fff",
                }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No image selected"
                style={{ margin: 0 }}
              />
            )}
          </div>

          <Input
            size="large"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={!allowManual}
          />

          <Space wrap>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setLibraryOpen(true)}
              type="default"
              size="large"
            >
              {value ? "Replace" : "Choose"}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              size="large"
              onClick={() => onChange?.("")}
              disabled={!value}
            >
              Delete
            </Button>
          </Space>

          {hintText ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {hintText}
            </Typography.Text>
          ) : null}
        </>
      ) : (
        <>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={value || ""}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={!allowManual}
            />
            <Button
              icon={<PictureOutlined />}
              onClick={() => setLibraryOpen(true)}
              type="default"
            >
              {value ? "Replace" : "Choose"}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => onChange?.("")}
              disabled={!value}
            />
          </Space.Compact>

          {showVariants && mediaId ? (
            <Space wrap style={{ width: "100%" }}>
              <Select
                value={size}
                onChange={(nextSize) => {
                  setSize(nextSize);
                  applyVariantUrl(mediaId, nextSize, format);
                }}
                style={{ minWidth: 140 }}
                options={SIZE_OPTIONS.map((option) => ({
                  value: option.value,
                  label:
                    option.value === "original" || variantAvailability[option.value]
                      ? option.label
                      : `${option.label} (not generated)`,
                }))}
              />
              <Select
                value={format}
                onChange={(nextFormat) => {
                  setFormat(nextFormat);
                  applyVariantUrl(mediaId, size, nextFormat);
                }}
                style={{ minWidth: 190 }}
                options={FORMAT_OPTIONS}
              />
              {activeMedia?.webpUrl ? <Tag color="green">WebP</Tag> : null}
              {activeMedia?.avifUrl ? <Tag color="purple">AVIF</Tag> : null}
            </Space>
          ) : null}

          {previewSrc ? (
            <div
              style={{
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                padding: 8,
                background: "#fafafa",
                maxWidth: 260,
              }}
            >
              <img
                src={previewSrc}
                alt="Selected media preview"
                style={{
                  width: "100%",
                  maxHeight: 110,
                  objectFit: "contain",
                  borderRadius: 6,
                  background: "#fff",
                }}
              />
              {activeMedia ? (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, marginTop: 6, display: "block" }}
                >
                  {activeMedia.originalName || activeMedia.title || "Selected image"}
                </Typography.Text>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <Modal
        title="Media Library"
        open={libraryOpen}
        onCancel={() => setLibraryOpen(false)}
        footer={null}
        width={980}
        destroyOnClose
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <Input
            allowClear
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Search media"
            style={{ width: 300, maxWidth: "100%" }}
          />
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={onUpload}
            disabled={uploading}
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              type="primary"
            >
              Upload image
            </Button>
          </Upload>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No images found" />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
              }}
            >
              {items.map((item) => {
                const thumb = getImagePreview(item);
                const isActive = String(item?._id || "") === mediaId;
                return (
                  <button
                    key={String(item._id)}
                    type="button"
                    onClick={() => selectMedia(item)}
                    style={{
                      textAlign: "left",
                      border: isActive ? "2px solid #1677ff" : "1px solid #e8e8e8",
                      borderRadius: 10,
                      background: "#fff",
                      padding: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 8,
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.originalName || item.title || "media"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <PictureOutlined style={{ fontSize: 24, color: "#999" }} />
                      )}
                    </div>
                    <Typography.Text
                      style={{
                        marginTop: 8,
                        display: "block",
                        fontSize: 12,
                      }}
                      ellipsis={{ tooltip: item.originalName || item.title }}
                    >
                      {item.originalName || item.title || "Image"}
                    </Typography.Text>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "end" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
