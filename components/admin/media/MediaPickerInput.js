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
  const id = String(item?._id || "").trim();
  if (id) return `/media/${id}?size=thumbnail&format=auto`;
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
  requiredImageWidth,
  requiredImageHeight,
  uploadResolutionErrorMessage = "",
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

  // Optional exact-resolution enforcement. When a caller passes
  // requiredImageWidth/requiredImageHeight (e.g. brand logos), uploads and library
  // selections that don't match those exact pixel dimensions are rejected.
  const expectedWidth = Number(requiredImageWidth);
  const expectedHeight = Number(requiredImageHeight);
  const needsResolutionValidation =
    Number.isFinite(expectedWidth) &&
    Number.isFinite(expectedHeight) &&
    expectedWidth > 0 &&
    expectedHeight > 0;
  const resolutionErrorMessage =
    uploadResolutionErrorMessage ||
    "Image resolution is not correct. Please upload an image with the required size.";

  const getUploadFileBlob = useCallback((uploadFile) => {
    if (!uploadFile) return null;
    if (uploadFile instanceof Blob) return uploadFile;
    if (uploadFile.originFileObj instanceof Blob) return uploadFile.originFileObj;
    return null;
  }, []);

  const readImageDimensions = useCallback(
    (uploadFile) => {
      const fileBlob = getUploadFileBlob(uploadFile);
      if (!fileBlob) return Promise.reject(new Error("Invalid file selected"));
      return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(fileBlob);
        const img = new Image();
        img.onload = () => {
          const width = Number(img.naturalWidth || img.width) || 0;
          const height = Number(img.naturalHeight || img.height) || 0;
          URL.revokeObjectURL(objectUrl);
          resolve({ width, height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to validate image resolution"));
        };
        img.src = objectUrl;
      });
    },
    [getUploadFileBlob],
  );

  const isMatchingRequiredResolution = useCallback(
    (width, height) => {
      if (!needsResolutionValidation) return true;
      const w = Number(width) || 0;
      const h = Number(height) || 0;
      // MESCO media docs don't yet store extracted dimensions (width/height default 0).
      // When the stored size is unknown we can't validate a library selection, so allow
      // it rather than reject every existing image. Uploads are still validated against
      // the actual file dimensions in onUpload below.
      if (w === 0 || h === 0) return true;
      return w === expectedWidth && h === expectedHeight;
    },
    [expectedHeight, expectedWidth, needsResolutionValidation],
  );

  const ensureMediaItemResolution = useCallback(
    async (item) => {
      if (!needsResolutionValidation) return;
      if (isMatchingRequiredResolution(item?.width, item?.height)) return;
      const id = String(item?._id || "").trim();
      if (!id) throw new Error(resolutionErrorMessage);
      const res = await fetch(`/api/admin/media/${id}`);
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to validate image resolution");
      if (!isMatchingRequiredResolution(data?.width, data?.height)) {
        throw new Error(resolutionErrorMessage);
      }
    },
    [isMatchingRequiredResolution, needsResolutionValidation, resolutionErrorMessage],
  );

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

  const selectMedia = async (item) => {
    if (!item?._id) return;
    try {
      await ensureMediaItemResolution(item);
    } catch (err) {
      message.error(err.message || resolutionErrorMessage);
      return;
    }
    setActiveMedia(item);
    applyVariantUrl(item._id, size || "original", format || "auto");
    setLibraryOpen(false);
  };

  const onUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      if (needsResolutionValidation) {
        const { width, height } = await readImageDimensions(file);
        if (width !== expectedWidth || height !== expectedHeight) {
          throw new Error(resolutionErrorMessage);
        }
      }
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
        destroyOnHidden
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
