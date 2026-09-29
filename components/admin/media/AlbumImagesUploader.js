"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Modal, Spin, message, Typography, Pagination, Input, Checkbox, Empty } from "antd";
import {
  UploadOutlined,
  PictureOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { buildMediaVariantUrl } from "@/lib/media/url";
import { readJson } from "./mediaUtils";

function normalizeImg(img) {
  if (typeof img === "string") {
    const url = img.trim();
    return { urlDesktop: url, url, alt: "" };
  }
  const url =
    img?.urlDesktop != null
      ? String(img.urlDesktop).trim()
      : img?.url != null
        ? String(img.url).trim()
        : img?.src != null
          ? String(img.src).trim()
          : "";
  return {
    urlDesktop: url,
    url,
    alt: img?.alt != null ? String(img.alt).trim() : "",
  };
}

export default function AlbumImagesUploader({ value = [], onChange }) {
  const images = Array.isArray(value) ? value.map(normalizeImg) : [];
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loadingLib, setLoadingLib] = useState(false);
  const [libItems, setLibItems] = useState([]);
  const [libTotal, setLibTotal] = useState(0);
  const [libPage, setLibPage] = useState(1);
  const [libQuery, setLibQuery] = useState("");
  const [libQueryInput, setLibQueryInput] = useState("");
  const [selectedLibIds, setSelectedLibIds] = useState(new Set());

  // Debounced search for library
  useEffect(() => {
    const timer = setTimeout(() => {
      setLibPage(1);
      setLibQuery(libQueryInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [libQueryInput]);

  const fetchLibrary = useCallback(
    async (nextPage = libPage) => {
      setLoadingLib(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: "18",
          type: "image",
        });
        if (libQuery) params.set("q", libQuery);
        const res = await fetch(`/api/admin/media?${params.toString()}`);
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Failed to load media");
        setLibItems(Array.isArray(data.items) ? data.items : []);
        setLibTotal(Number(data.total) || 0);
      } catch (err) {
        message.error(err.message || "Failed to load media");
      } finally {
        setLoadingLib(false);
      }
    },
    [libPage, libQuery],
  );

  useEffect(() => {
    if (!libraryOpen) return;
    fetchLibrary(libPage);
  }, [libraryOpen, libPage, libQuery, fetchLibrary]);

function getImageDimensions(file) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file || typeof file.type !== "string" || !file.type.startsWith("image/")) {
      resolve({ width: 800, height: 600 });
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 800, height: 600 });
    };
    img.src = url;
  });
}

  // Handle direct multiple file upload
  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUploaded = [];
    let failureCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      const isRaster = file.type?.startsWith("image/") && !file.type?.includes("svg");
      if (isRaster) {
        const { width, height } = await getImageDimensions(file);
        formData.append("crop", JSON.stringify({ x: 0, y: 0, width, height }));
        formData.append("width", String(width));
        formData.append("height", String(height));
      }

      try {
        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const item = data.item || data;
        const mediaId = String(item._id || "");
        const url = mediaId
          ? buildMediaVariantUrl(mediaId, { size: "original", format: "auto" })
          : item.url || item.originalUrl || "";
        if (url) {
          newUploaded.push({
            urlDesktop: url,
            url,
            alt: item.altText || item.alt || file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      } catch {
        failureCount++;
      }
    }

    if (newUploaded.length > 0) {
      const updated = [...images, ...newUploaded];
      onChange?.(updated);
      message.success(`Added ${newUploaded.length} image${newUploaded.length > 1 ? "s" : ""}`);
    }
    if (failureCount > 0) {
      message.error(`${failureCount} image(s) failed to upload`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove single image from album
  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange?.(updated);
  };

  // Toggle selection in library modal
  const toggleLibSelect = (item) => {
    const id = String(item._id);
    setSelectedLibIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Confirm selection from library modal
  const handleConfirmLibrary = () => {
    const selectedItems = libItems.filter((it) => selectedLibIds.has(String(it._id)));
    const newImgs = selectedItems.map((it) => {
      const mediaId = String(it._id);
      const url = buildMediaVariantUrl(mediaId, { size: "original", format: "auto" });
      return {
        urlDesktop: url,
        url,
        alt: it.altText || it.alt || it.title || "",
      };
    });

    if (newImgs.length > 0) {
      const updated = [...images, ...newImgs];
      onChange?.(updated);
      message.success(`Added ${newImgs.length} image${newImgs.length > 1 ? "s" : ""}`);
    }
    setSelectedLibIds(new Set());
    setLibraryOpen(false);
  };

  return (
    <div style={{ marginTop: 4 }}>
      {/* Hidden native multiple file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      {/* Top Single Upload & Library Action Bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
          size="middle"
        >
          {uploading ? "Uploading Images..." : "Upload Album Images"}
        </Button>
        <Button
          icon={<PictureOutlined />}
          onClick={() => {
            setSelectedLibIds(new Set());
            setLibraryOpen(true);
          }}
          size="middle"
        >
          Media Library
        </Button>
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>
          {images.length} {images.length === 1 ? "image" : "images"}
        </span>
      </div>

      {/* Uploaded Images Thumbnails: 3 images per row */}
      {images.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {images.map((img, idx) => (
            <div
              key={`${img.urlDesktop || img.url}-${idx}`}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.urlDesktop || img.url}
                alt={img.alt || `Album image ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Image Number Badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  background: "rgba(0, 0, 0, 0.6)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  pointerEvents: "none",
                }}
              >
                #{idx + 1}
              </div>
              {/* Delete Button on top right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                title="Remove image"
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s ease, transform 0.15s ease",
                  fontSize: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ef4444";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <DeleteOutlined />
              </button>
            </div>
          ))}

          {/* Quick Add More Tile */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 8,
              border: "2px dashed #d1d5db",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backgroundColor: "#fafafa",
              color: "#6b7280",
              transition: "all 0.2s ease",
              gap: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1677ff";
              e.currentTarget.style.color = "#1677ff";
              e.currentTarget.style.backgroundColor = "#f0f7ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.backgroundColor = "#fafafa";
            }}
          >
            <PlusOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Add More</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #d9d9d9",
            borderRadius: 10,
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#fafafa",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#1677ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#d9d9d9";
          }}
        >
          <PictureOutlined style={{ fontSize: 32, color: "#1677ff", marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
            Click to Upload Album Images
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
            Select multiple images at once (PNG, JPG, WebP)
          </div>
        </div>
      )}

      {/* Media Library Multi-Select Modal */}
      <Modal
        title="Select Images from Media Library"
        open={libraryOpen}
        onCancel={() => setLibraryOpen(false)}
        width={800}
        onOk={handleConfirmLibrary}
        okText={`Add Selected (${selectedLibIds.size})`}
        okButtonProps={{ disabled: selectedLibIds.size === 0 }}
      >
        <div style={{ marginBottom: 16, marginTop: 8 }}>
          <Input
            placeholder="Search media..."
            prefix={<SearchOutlined />}
            value={libQueryInput}
            onChange={(e) => setLibQueryInput(e.target.value)}
            allowClear
          />
        </div>

        {loadingLib ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin tip="Loading media library..." />
          </div>
        ) : libItems.length === 0 ? (
          <Empty description="No images found" />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: 10,
                maxHeight: 420,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {libItems.map((item) => {
                const id = String(item._id);
                const isSelected = selectedLibIds.has(id);
                const thumb = buildMediaVariantUrl(id, { size: "original", format: "auto" });
                return (
                  <div
                    key={id}
                    onClick={() => toggleLibSelect(item)}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: isSelected ? "2px solid #1677ff" : "1px solid #e5e7eb",
                      position: "relative",
                      cursor: "pointer",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={item.altText || item.title || ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: isSelected ? "#1677ff" : "rgba(0,0,0,0.4)",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        style={{ pointerEvents: "none", transform: "scale(0.8)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Pagination
                size="small"
                current={libPage}
                pageSize={18}
                total={libTotal}
                onChange={setLibPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
