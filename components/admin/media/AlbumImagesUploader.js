"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button, Modal, Spin, message, Typography, Pagination, Input, Checkbox, Empty } from "antd";
import {
  UploadOutlined,
  PictureOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  HolderOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "styled-components";
import { buildMediaVariantUrl } from "@/lib/media/url";
import { readJson } from "./mediaUtils";

function normalizeFeatureFlag(value) {
  if (value === true || value === "true" || value === 1 || value === "1") return 1;
  return Number(value) === 1 ? 1 : 0;
}

function normalizeImg(img) {
  if (typeof img === "string") {
    const url = img.trim();
    return { urlDesktop: url, url, alt: "", feature: 0 };
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
    feature: normalizeFeatureFlag(img?.feature),
  };
}

const ThumbTile = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  user-select: none;

  &[data-featured="true"] {
    border: 2px solid #faad14;
    box-shadow: 0 0 0 3px rgba(250, 173, 20, 0.2);
  }

  &[data-dragging="true"] {
    opacity: 0.35;
    border: 2px dashed #1677ff;
    box-shadow: none;
  }

  .album-thumb__feature {
    position: absolute;
    top: 5px;
    left: 5px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: calc(100% - 68px);
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    background: rgba(0, 0, 0, 0.62);
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.6;
    white-space: nowrap;
    cursor: pointer;
    z-index: 3;
    opacity: 0;
    transform: translateY(-3px);
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, color 0.2s ease;

    &:hover {
      background: rgba(250, 173, 20, 0.95);
      color: #1f2937;
    }

    &:focus-visible {
      outline: 2px solid #1677ff;
      outline-offset: 1px;
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover .album-thumb__feature,
  .album-thumb__feature[aria-checked="true"] {
    opacity: 1;
    transform: translateY(0);
  }

  .album-thumb__feature[aria-checked="true"] {
    background: #faad14;
    border-color: #d48806;
    color: #1f2937;
  }

  /* Drag handle in top area */
  .album-thumb__drag-handle {
    position: absolute;
    top: 5px;
    right: 33px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.65);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    z-index: 3;
    opacity: 0;
    transform: translateY(-3px);
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
    touch-action: none;

    &:hover {
      background: #1677ff;
      transform: scale(1.1);
    }

    &:active {
      cursor: grabbing;
    }
  }

  &:hover .album-thumb__drag-handle {
    opacity: 1;
    transform: translateY(0);
  }

  /* Reorder Nav Bar (Move Left & Move Right) at bottom right */
  .album-thumb__nav {
    position: absolute;
    bottom: 4px;
    right: 4px;
    display: inline-flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.65);
    border-radius: 5px;
    overflow: hidden;
    z-index: 3;
    opacity: 0;
    transform: translateY(3px);
    transition: opacity 0.2s ease, transform 0.2s ease;

    button {
      background: transparent;
      border: none;
      color: #ffffff;
      padding: 3px 6px;
      font-size: 10px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;

      &:hover:not(:disabled) {
        background: #1677ff;
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    .nav-divider {
      width: 1px;
      height: 10px;
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &:hover .album-thumb__nav {
    opacity: 1;
    transform: translateY(0);
  }

  /* Touch devices have no hover state, so keep the controls permanently visible. */
  @media (hover: none) {
    .album-thumb__feature,
    .album-thumb__drag-handle,
    .album-thumb__nav {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

function SortableImageTile({
  id,
  img,
  index,
  total,
  onToggleFeature,
  onRemove,
  onMove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const isFeatured = img.feature === 1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ThumbTile
        data-featured={isFeatured ? "true" : "false"}
        data-dragging={isDragging ? "true" : "false"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.urlDesktop || img.url}
          alt={img.alt || `Album image ${index + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
          }}
        />

        {/* Feature toggle: revealed on hover, always visible once marked featured */}
        <button
          type="button"
          className="album-thumb__feature"
          role="switch"
          aria-checked={isFeatured}
          aria-label={
            isFeatured
              ? `Remove Feature mark from image ${index + 1}`
              : `Mark image ${index + 1} as Feature`
          }
          title={isFeatured ? "Featured \u2014 tap to unmark" : "Mark as Feature"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFeature(index);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isFeatured ? <StarFilled /> : <StarOutlined />}
          <span>{isFeatured ? "Featured" : "Feature"}</span>
        </button>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="album-thumb__drag-handle"
          title="Drag to reorder"
          onPointerDown={(e) => {
            listeners?.onPointerDown?.(e);
          }}
        >
          <HolderOutlined />
        </div>

        {/* Delete Button on top right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          onPointerDown={(e) => e.stopPropagation()}
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
            zIndex: 3,
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

        {/* Image Number Badge */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 4,
            background: "rgba(0, 0, 0, 0.65)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          #{index + 1}
        </div>

        {/* Move controls: Move Left & Move Right buttons */}
        {total > 1 && (
          <div
            className="album-thumb__nav"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMove(index, index - 1);
              }}
              title="Move backward (Left)"
            >
              <LeftOutlined />
            </button>
            <div className="nav-divider" />
            <button
              type="button"
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMove(index, index + 1);
              }}
              title="Move forward (Right)"
            >
              <RightOutlined />
            </button>
          </div>
        )}
      </ThumbTile>
    </div>
  );
}

export default function AlbumImagesUploader({ value = [], onChange }) {
  const images = useMemo(() => {
    return Array.isArray(value) ? value.map(normalizeImg) : [];
  }, [value]);

  const featuredCount = useMemo(() => {
    return images.filter((img) => img.feature === 1).length;
  }, [images]);

  // Assign stable DND keys for each item in the array
  const itemsWithIds = useMemo(() => {
    return images.map((img, idx) => ({
      ...img,
      _dndKey: img._id ? String(img._id) : `img-${idx}-${img.urlDesktop || img.url || "item"}`,
    }));
  }, [images]);

  const itemIds = useMemo(() => itemsWithIds.map((item) => item._dndKey), [itemsWithIds]);

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        const oldIndex = itemsWithIds.findIndex((item) => item._dndKey === active.id);
        const newIndex = itemsWithIds.findIndex((item) => item._dndKey === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const updated = arrayMove(images, oldIndex, newIndex);
          onChange?.(updated);
        }
      }
    },
    [itemsWithIds, images, onChange]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleMoveImage = useCallback(
    (from, to) => {
      if (from < 0 || to < 0 || from >= images.length || to >= images.length || from === to) return;
      const updated = arrayMove(images, from, to);
      onChange?.(updated);
    },
    [images, onChange]
  );

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return itemsWithIds.find((item) => item._dndKey === activeId) || null;
  }, [activeId, itemsWithIds]);

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
            feature: 0,
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

  // Toggle the Featured flag (feature = 1 / 0) on a single album thumbnail
  const handleToggleFeature = (indexToToggle) => {
    const updated = images.map((img, idx) =>
      idx === indexToToggle ? { ...img, feature: img.feature === 1 ? 0 : 1 } : img,
    );
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
        feature: 0,
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
          {featuredCount > 0 ? (
            <span style={{ color: "#d48806", fontWeight: 600 }}> · {featuredCount} featured</span>
          ) : null}
        </span>
      </div>

      {/* Uploaded Images Thumbnails with Drag & Drop and Move buttons: 3 images per row */}
      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {itemsWithIds.map((img, idx) => (
                <SortableImageTile
                  key={img._dndKey}
                  id={img._dndKey}
                  img={img}
                  index={idx}
                  total={images.length}
                  onToggleFeature={handleToggleFeature}
                  onRemove={handleRemoveImage}
                  onMove={handleMoveImage}
                />
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
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "2px solid #1677ff",
                  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.28)",
                  transform: "scale(1.04)",
                  backgroundColor: "#f9fafb",
                  pointerEvents: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeItem.urlDesktop || activeItem.url}
                  alt={activeItem.alt || "Dragging image"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
