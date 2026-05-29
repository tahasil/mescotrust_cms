"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Select, Space, Table, Tag, message } from "antd";
import {
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ThemeAdminCard } from "@/styles/Theme";
import { toText } from "@/lib/portfolioUtils";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canCreate, canEdit, hasPermission } from "@/lib/rbac/clientPermissions";

const PAGE_SIZE = 6;

function SortableRow(props) {
  const { children } = props;
  const rowProps = { ...props };
  const baseClassName = rowProps.className;
  const baseStyle = rowProps.style;
  delete rowProps.children;
  delete rowProps.className;
  delete rowProps.style;
  delete rowProps.record;
  delete rowProps.index;
  const sortableEnabled = rowProps["data-sortable"] !== false;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rowProps["data-row-key"], disabled: !sortableEnabled });
  const rowClassName = [
    baseClassName,
    "portfolio-row-sortable",
    isDragging ? "portfolio-row-active-drag" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const style = {
    ...baseStyle,
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition:
      isDragging
        ? "none"
        : transition || "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 1,
        }
      : {}),
  };
  const dragBindings = sortableEnabled
    ? {
        ...attributes,
        ...listeners,
      }
    : {};

  return (
    <tr
      ref={setNodeRef}
      {...rowProps}
      style={style}
      className={rowClassName}
      {...dragBindings}
    >
      {children}
    </tr>
  );
}

function PortfolioDragPreview({ item }) {
  if (!item) return null;
  const name = toText(item?.name) || "Untitled portfolio item";
  const slug = toText(item?.slug) || "-";
  const category = toText(item?.categoryName) || "Uncategorized";
  const status = item?.status ? "Active" : "Inactive";

  return (
    <div className="portfolio-drag-overlay" role="presentation">
      <span className="portfolio-drag-overlay-handle" aria-hidden>
        <HolderOutlined />
      </span>
      {toText(item?.image) ? (
        <img
          src={String(item.image)}
          alt=""
          className="portfolio-drag-overlay-image"
          aria-hidden
        />
      ) : (
        <span className="portfolio-drag-overlay-image-fallback" aria-hidden>
          No Image
        </span>
      )}
      <div className="portfolio-drag-overlay-main">
        <div className="portfolio-drag-overlay-title">{name}</div>
        <div className="portfolio-drag-overlay-subtitle">{slug}</div>
      </div>
      <div className="portfolio-drag-overlay-meta">
        <Tag>{category}</Tag>
        <span className="portfolio-drag-overlay-status">{status}</span>
      </div>
    </div>
  );
}

export default function PortfolioModule() {
  const auth = useAdminAuth();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDragId, setActiveDragId] = useState(null);
  const [overDragId, setOverDragId] = useState(null);
  const canCreatePortfolio = canCreate(auth, "portfolio");
  const canEditPortfolio = canEdit(auth, "portfolio");
  const canManagePortfolio = hasPermission(auth, "portfolio.manage");

  const fetchPortfolio = useCallback((categoryId = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (toText(categoryId)) params.set("categoryId", toText(categoryId));
    const query = params.toString();
    fetch(`/api/admin/portfolio${query ? `?${query}` : ""}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        const next = Array.isArray(data?.items) ? data.items : [];
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setList(
          next.map((item, index) => ({
            ...item,
            key: item?._id || item?.slug || index,
          })),
        );
      })
      .catch(() => message.error("Failed to load portfolio"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPortfolio(selectedCategoryId);
  }, [fetchPortfolio, selectedCategoryId]);

  const rows = useMemo(
    () =>
      list.map((item, index) => ({
        ...item,
        key: item.key || item._id || item.slug || index,
      })),
    [list],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedCategoryId]);

  useEffect(() => {
    setActiveDragId(null);
    setOverDragId(null);
  }, [searchText, selectedCategoryId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filteredRows = useMemo(() => {
    const query = toText(searchText).toLowerCase();
    if (!query) return rows;
    return rows.filter((item) => {
      const name = toText(item?.name).toLowerCase();
      const category = toText(item?.categoryName).toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [rows, searchText]);
  const dragSortingEnabled = canManagePortfolio && !searchText && !!selectedCategoryId;
  const activeDragItem = useMemo(
    () => filteredRows.find((item) => item.key === activeDragId) || null,
    [activeDragId, filteredRows],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        label: `${toText(item?.name)}${item?.isActive === false ? " (Inactive)" : ""}`,
        value: toText(item?._id),
      })),
    [categories],
  );

  const columns = [
    {
      title: "",
      key: "drag",
      width: 44,
      render: () => (
        <span
          className="portfolio-row-drag-handle"
          style={{
            cursor: dragSortingEnabled ? "grab" : "not-allowed",
            color: "#8c8c8c",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
          }}
          title={
            !selectedCategoryId
              ? "Select a category to reorder"
              : searchText
                ? "Clear search to reorder items"
                : "Drag to reorder"
          }
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: "#",
      key: "order",
      width: 70,
      render: (_, __, index) =>
        dragSortingEnabled ? index + 1 : (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: "Photo",
      dataIndex: "image",
      key: "image",
      width: 90,
      render: (image) =>
        toText(image) ? (
          <img
            src={String(image)}
            alt="Portfolio image"
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          <div style={{ fontSize: 12, color: "#777" }}>{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 180,
      render: (value) => <Tag>{toText(value) || "Uncategorized"}</Tag>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (value) => toText(value) || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (enabled) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        canEditPortfolio ? (
          <Link href={`/admin/portfolio/${encodeURIComponent(record.slug || "")}`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        )
      ),
    },
  ];

  const persistOrder = useCallback(async (nextList) => {
    if (!canManagePortfolio) {
      throw new Error("You do not have permission to reorder portfolio items");
    }
    const categoryId = toText(selectedCategoryId);
    if (!categoryId) {
      throw new Error("Select a category before reordering");
    }
    const orderedIds = nextList
      .map((item) => toText(item?._id))
      .filter(Boolean);
    if (orderedIds.length === 0) return true;
    const res = await fetch("/api/admin/portfolio/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, orderedIds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to save portfolio order");
    }
    return true;
  }, [canManagePortfolio, selectedCategoryId]);

  const clearDragState = useCallback(() => {
    setActiveDragId(null);
    setOverDragId(null);
  }, []);

  const handleDragStart = useCallback(
    ({ active }) => {
      if (!dragSortingEnabled || savingOrder) return;
      const id = active?.id ?? null;
      setActiveDragId(id);
      setOverDragId(id);
    },
    [dragSortingEnabled, savingOrder],
  );

  const handleDragOver = useCallback(
    ({ over }) => {
      if (!dragSortingEnabled) return;
      setOverDragId(over?.id ?? null);
    },
    [dragSortingEnabled],
  );

  const handleDragCancel = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      if (!dragSortingEnabled || savingOrder || !over || active.id === over.id) {
        clearDragState();
        return;
      }
      const oldIndex = rows.findIndex((item) => item.key === active.id);
      const newIndex = rows.findIndex((item) => item.key === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        clearDragState();
        return;
      }

      const previous = rows;
      const reordered = arrayMove(rows, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));
      setList(reordered);
      setSavingOrder(true);
      try {
        await persistOrder(reordered);
        message.success("Portfolio order updated");
      } catch (err) {
        setList(previous);
        message.error(err?.message || "Failed to save portfolio order");
      } finally {
        setSavingOrder(false);
        clearDragState();
      }
    },
    [clearDragState, dragSortingEnabled, persistOrder, rows, savingOrder],
  );

  return (
    <ThemeAdminCard
      title="All Portfolio"
      extra={
        <Space>
          {canCreatePortfolio ? (
            <Link href="/admin/portfolio/new">
              <Button type="primary" icon={<PlusOutlined />}>
                Add Portfolio
              </Button>
            </Link>
          ) : null}
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            allowClear
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name or category"
            style={{ width: 320 }}
          />
          <Select
            allowClear
            value={selectedCategoryId || undefined}
            onChange={(value) => setSelectedCategoryId(toText(value))}
            placeholder="Filter by category"
            style={{ width: 260 }}
            options={categoryOptions}
          />
        </Space>
        {!canManagePortfolio ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
            You can view items, but reordering requires portfolio manage permission.
          </div>
        ) : !selectedCategoryId ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
            Select a category to manage portfolio order. Each category has an independent order.
          </div>
        ) : searchText ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
            Clear search to enable drag-and-drop sorting.
          </div>
        ) : null}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredRows.map((item) => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            rowKey="key"
            columns={columns}
            dataSource={filteredRows}
            loading={loading || savingOrder}
            components={{
              body: {
                row: SortableRow,
              },
            }}
            onRow={(record) => ({
              className: [
                dragSortingEnabled ? "portfolio-row-draggable" : "",
                activeDragId === record.key ? "portfolio-row-placeholder" : "",
                overDragId === record.key && activeDragId !== record.key
                  ? "portfolio-row-drop-target"
                  : "",
              ]
                .filter(Boolean)
                .join(" "),
              style: dragSortingEnabled ? { touchAction: "none" } : undefined,
              "data-sortable": dragSortingEnabled,
              "data-drag-active": activeDragId === record.key,
              "data-drag-over":
                overDragId === record.key && activeDragId !== record.key,
            })}
            pagination={
              dragSortingEnabled
                ? false
                : {
                    current: currentPage,
                    pageSize: PAGE_SIZE,
                    total: filteredRows.length,
                    showSizeChanger: false,
                    onChange: (page) => setCurrentPage(page),
                  }
            }
          />
        </SortableContext>
        <DragOverlay
          dropAnimation={{
            duration: 180,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {activeDragItem ? <PortfolioDragPreview item={activeDragItem} /> : null}
        </DragOverlay>
      </DndContext>
      <style jsx global>{`
        .portfolio-row-sortable {
          will-change: transform;
        }
        .portfolio-row-draggable > td {
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }
        .portfolio-row-draggable .portfolio-row-drag-handle {
          cursor: grab;
          transition: color 180ms ease, transform 180ms ease;
        }
        .portfolio-row-draggable .portfolio-row-drag-handle:active {
          cursor: grabbing;
        }
        .portfolio-row-active-drag .portfolio-row-drag-handle {
          color: #1677ff !important;
          transform: scale(1.08);
          cursor: grabbing !important;
        }
        .portfolio-row-placeholder > td {
          background: #f6fbff !important;
          border-top: 1px dashed #91caff !important;
          border-bottom: 1px dashed #91caff !important;
          box-shadow: inset 0 0 0 1px rgba(22, 119, 255, 0.12);
        }
        .portfolio-row-drop-target > td {
          background: #e6f4ff !important;
          border-top: 1px solid #91caff !important;
          border-bottom: 1px solid #91caff !important;
        }
        .portfolio-drag-overlay {
          display: grid;
          grid-template-columns: 20px 52px minmax(180px, 1fr) auto;
          align-items: center;
          gap: 12px;
          width: min(920px, calc(100vw - 32px));
          padding: 10px 12px;
          background: #ffffff;
          border: 1px solid rgba(22, 119, 255, 0.24);
          border-radius: 12px;
          box-shadow:
            0 16px 30px rgba(15, 23, 42, 0.2),
            0 6px 10px rgba(15, 23, 42, 0.12);
          transform: scale(1.01);
          pointer-events: none;
        }
        .portfolio-drag-overlay-handle {
          color: #1677ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .portfolio-drag-overlay-image,
        .portfolio-drag-overlay-image-fallback {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          border: 1px solid #f0f0f0;
        }
        .portfolio-drag-overlay-image {
          object-fit: cover;
          display: block;
        }
        .portfolio-drag-overlay-image-fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          color: #8c8c8c;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 4px;
          text-align: center;
        }
        .portfolio-drag-overlay-main {
          min-width: 0;
        }
        .portfolio-drag-overlay-title {
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
          color: #1f1f1f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .portfolio-drag-overlay-subtitle {
          font-size: 12px;
          color: #8c8c8c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .portfolio-drag-overlay-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-self: end;
        }
        .portfolio-drag-overlay-status {
          font-size: 12px;
          color: #595959;
        }
        @media (max-width: 768px) {
          .portfolio-drag-overlay {
            grid-template-columns: 20px 44px minmax(120px, 1fr);
            gap: 10px;
            padding: 9px 10px;
          }
          .portfolio-drag-overlay-image,
          .portfolio-drag-overlay-image-fallback {
            width: 44px;
            height: 44px;
            border-radius: 8px;
          }
          .portfolio-drag-overlay-meta {
            display: none;
          }
        }
      `}</style>
    </ThemeAdminCard>
  );
}

