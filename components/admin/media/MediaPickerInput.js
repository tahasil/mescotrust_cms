"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FileTextOutlined,
  PictureOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { buildMediaVariantUrl, normalizeMediaFormatParam } from "@/lib/media/url";
import RasterCropConfirmModal from "./RasterCropConfirmModal";
import { getSizeVariant, readJson } from "./mediaUtils";
import { isRasterUploadFile } from "./rasterMedia";

const FORMAT_OPTIONS = [
  { value: "auto", label: "Auto (WebP/AVIF/JPG)" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "jpg", label: "JPG" },
];

function parseMediaValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return { mediaId: "", format: "auto" };

  const match = raw.match(/\/media\/([a-fA-F0-9]{24})(?:\?([^#]+))?/);
  if (!match) return { mediaId: "", format: "auto" };

  const mediaId = String(match[1] || "");
  const params = new URLSearchParams(match[2] || "");
  const format = normalizeMediaFormatParam(params.get("format") || "auto") || "auto";
  return { mediaId, format };
}

function getImagePreview(item) {
  if (!item) return "";
  const id = String(item?._id || "").trim();
  if (id) return buildMediaVariantUrl(id, { size: "original", format: "auto" });
  return item?.originalUrl || item?.url || item?.publicUrl || "";
}

function appendCropContractToFormData(formData, cropContract) {
  if (!cropContract?.crop) return;
  formData.append("crop", JSON.stringify(cropContract.crop));
  if (Number.isFinite(cropContract.rotationDegrees)) {
    formData.append("rotation", String(cropContract.rotationDegrees));
  }
  if (Number.isInteger(cropContract.width)) {
    formData.append("width", String(cropContract.width));
  }
  if (Number.isInteger(cropContract.height)) {
    formData.append("height", String(cropContract.height));
  }
}

export default function MediaPickerInput({
  value,
  onChange,
  placeholder = "https://...",
  allowManual = true,
  showVariants = true,
  uiVariant = "default",
  hintText = "",
  mediaType = "image",
}) {
  const normalizedMediaType =
    mediaType === "document" || mediaType === "all" ? mediaType : "image";
  const isDocumentMode = normalizedMediaType === "document";
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
  const [format, setFormat] = useState(parsed.format || "auto");
  const [cropRequest, setCropRequest] = useState(null);

  const cropQueueRef = useRef([]);
  const activeCropRequestRef = useRef(null);

  const mediaId = parsed.mediaId || String(activeMedia?._id || "");
  const pageSize = 18;

  useEffect(() => {
    setFormat(parsed.format || "auto");
  }, [parsed.format]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(queryInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const pumpCropQueue = () => {
    if (activeCropRequestRef.current) return;
    const next = cropQueueRef.current.shift();
    if (!next) return;
    activeCropRequestRef.current = next;
    setCropRequest({ file: next.file, title: next.title });
  };

  const requestRasterCrop = (file, title) =>
    new Promise((resolve, reject) => {
      cropQueueRef.current.push({ file, title, resolve, reject });
      pumpCropQueue();
    });

  const closeActiveCropRequest = () => {
    activeCropRequestRef.current = null;
    setCropRequest(null);
    pumpCropQueue();
  };

  const handleCropCancel = () => {
    const activeRequest = activeCropRequestRef.current;
    if (activeRequest) {
      const error = new Error("Crop confirmation is required");
      error.code = "CROP_CONFIRMATION_REQUIRED";
      activeRequest.reject(error);
    }
    closeActiveCropRequest();
  };

  const handleCropConfirm = (cropContract) => {
    const activeRequest = activeCropRequestRef.current;
    if (activeRequest) activeRequest.resolve(cropContract);
    closeActiveCropRequest();
  };

  const fetchLibrary = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
        });
        if (normalizedMediaType !== "all") {
          params.set("type", normalizedMediaType);
        }
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
    [normalizedMediaType, page, query],
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
    (targetMediaId, nextFormat) => {
      const nextUrl = buildMediaVariantUrl(targetMediaId, {
        size: "original",
        format: normalizeMediaFormatParam(nextFormat || "auto") || "auto",
      });
      onChange?.(nextUrl);
    },
    [onChange],
  );

  const selectMedia = (item) => {
    if (!item?._id) return;
    setActiveMedia(item);
    applyVariantUrl(item._id, format || "auto");
    setLibraryOpen(false);
  };

  const onUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      let cropContract = null;
      if (isRasterUploadFile(file)) {
        cropContract = await requestRasterCrop(file, "Crop image before upload");
      }

      const formData = new FormData();
      const uploadFile = cropContract?.processedFile || file;
      formData.append("file", uploadFile);
      appendCropContractToFormData(formData, cropContract);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = await readJson(res);
      if (!res.ok) {
        const error = new Error(data.error || "Upload failed");
        error.code = data.code || "";
        throw error;
      }

      onSuccess?.(data);
      message.success(
        normalizedMediaType === "document" ? "Document uploaded" : "Image uploaded",
      );
      setPage(1);
      fetchLibrary(1);
    } catch (err) {
      onError?.(err);
      if (err?.code !== "CROP_CONFIRMATION_REQUIRED") {
        message.error(err.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const activeOriginalVariant = useMemo(
    () => getSizeVariant(activeMedia, "original"),
    [activeMedia],
  );

  const previewSrc = useMemo(() => {
    if (mediaId) {
      return buildMediaVariantUrl(mediaId, {
        size: "original",
        format: normalizeMediaFormatParam(format || "auto") || "auto",
      });
    }
    return String(value || "").trim();
  }, [mediaId, format, value]);

  const isStacked = uiVariant === "stacked";
  const activeMediaMimeType = String(activeMedia?.mimeType || "").toLowerCase();
  const activeMediaIsImage = activeMediaMimeType.startsWith("image/");
  const previewLooksPdf = /\.pdf(?:[?#].*)?$/i.test(String(previewSrc || ""));
  const canShowImagePreview =
    Boolean(previewSrc) &&
    !isDocumentMode &&
    (activeMedia ? activeMediaIsImage : !previewLooksPdf);
  const documentPreviewName =
    activeMedia?.originalName ||
    activeMedia?.title ||
    String(value || "").trim() ||
    "Selected document";
  const uploadAccept =
    normalizedMediaType === "document"
      ? ".pdf,application/pdf"
      : normalizedMediaType === "all"
        ? "image/*,.svg,.pdf,application/pdf"
        : "image/*,.svg";

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
            {canShowImagePreview ? (
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
            ) : previewSrc ? (
              <div
                style={{
                  width: "100%",
                  minHeight: 120,
                  borderRadius: 6,
                  background: "#fff",
                  border: "1px dashed #d9d9d9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  textAlign: "center",
                  gap: 6,
                }}
              >
                <FileTextOutlined style={{ fontSize: 22, color: "#8c8c8c" }} />
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, wordBreak: "break-word" }}
                >
                  {documentPreviewName}
                </Typography.Text>
              </div>
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
            onChange={(event) => onChange?.(event.target.value)}
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
                value={format}
                onChange={(nextFormat) => {
                  setFormat(nextFormat);
                  applyVariantUrl(mediaId, nextFormat);
                }}
                style={{ minWidth: 220 }}
                options={FORMAT_OPTIONS}
              />
              {activeOriginalVariant?.webpUrl ? <Tag color="green">WebP</Tag> : null}
              {activeOriginalVariant?.avifUrl ? <Tag color="purple">AVIF</Tag> : null}
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
              onChange={(event) => onChange?.(event.target.value)}
              placeholder={placeholder}
              disabled={!allowManual}
            />
            <Button
              icon={isDocumentMode ? <FileTextOutlined /> : <PictureOutlined />}
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
                value={format}
                onChange={(nextFormat) => {
                  setFormat(nextFormat);
                  applyVariantUrl(mediaId, nextFormat);
                }}
                style={{ minWidth: 220 }}
                options={FORMAT_OPTIONS}
              />
              {activeOriginalVariant?.webpUrl ? <Tag color="green">WebP</Tag> : null}
              {activeOriginalVariant?.avifUrl ? <Tag color="purple">AVIF</Tag> : null}
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
              {canShowImagePreview ? (
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
              ) : (
                <div
                  style={{
                    width: "100%",
                    minHeight: 72,
                    borderRadius: 6,
                    background: "#fff",
                    border: "1px dashed #d9d9d9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 22, color: "#8c8c8c" }} />
                </div>
              )}
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
            onChange={(event) => setQueryInput(event.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Search media"
            style={{ width: 300, maxWidth: "100%" }}
          />
          <Upload
            accept={uploadAccept}
            showUploadList={false}
            customRequest={onUpload}
            disabled={uploading}
          >
            <Button icon={<UploadOutlined />} loading={uploading} type="primary">
              {normalizedMediaType === "document" ? "Upload document" : "Upload image"}
            </Button>
          </Upload>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty
            description={
              normalizedMediaType === "document" ? "No documents found" : "No images found"
            }
          />
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
                const itemMimeType = String(item?.mimeType || "").toLowerCase();
                const itemIsImage = itemMimeType.startsWith("image/");
                const thumb = itemIsImage ? getImagePreview(item) : "";
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
                        <FileTextOutlined style={{ fontSize: 24, color: "#999" }} />
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
                      {item.originalName || item.title || (itemIsImage ? "Image" : "Document")}
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

      <RasterCropConfirmModal
        open={Boolean(cropRequest?.file)}
        file={cropRequest?.file || null}
        title={cropRequest?.title || "Crop image before upload"}
        confirmText="Confirm crop"
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
