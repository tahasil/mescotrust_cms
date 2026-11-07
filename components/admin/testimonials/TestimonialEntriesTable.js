"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
import { useAdminPermission } from "@/components/admin/AdminAuthContext";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { formatDateTime } from "@/lib/formatDate";

const ITEMS_API = "/api/admin/testimonial-items";
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const restrictToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });

async function requestJson(url, options, fallbackError) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || fallbackError);
  return data;
}

function jsonRequest(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const RowDragContext = createContext({});

function RowDragHandle({ disabled, title }) {
  const { setActivatorNodeRef, listeners, attributes } = useContext(RowDragContext);
  return (
    <Button
      ref={setActivatorNodeRef}
      type="text"
      size="small"
      icon={<HolderOutlined />}
      disabled={disabled}
      title={title}
      aria-label="Drag to reorder"
      style={{ cursor: disabled ? "not-allowed" : "grab", touchAction: "none" }}
      {...attributes}
      {...listeners}
    />
  );
}

function SortableRow({ rowId, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });

  const dragContext = useMemo(
    () => ({ setActivatorNodeRef, listeners, attributes }),
    [setActivatorNodeRef, listeners, attributes],
  );

  return (
    <RowDragContext.Provider value={dragContext}>
      <tr
        {...props}
        ref={setNodeRef}
        style={{
          ...props.style,
          transform: CSS.Translate.toString(transform),
          transition,
          ...(isDragging
            ? {
                position: "relative",
                zIndex: 2,
                background: "#fff",
                boxShadow: "0 6px 18px rgba(42, 40, 62, 0.16)",
              }
            : {}),
        }}
      />
    </RowDragContext.Provider>
  );
}

// The table's empty-state row also renders through this component and has no key.
function TableRow(props) {
  const rowId = props["data-row-key"];
  if (rowId === undefined) return <tr {...props} />;
  return <SortableRow rowId={rowId} {...props} />;
}

const TABLE_COMPONENTS = { body: { row: TableRow } };

function TestimonialEntryModal({ open, record, onClose, onSaved }) {
  const isEdit = Boolean(record?._id);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quote: values.quote.trim(),
        name: values.name.trim(),
        role: String(values.role || "").trim(),
        showInSlider: values.showInSlider === true,
      };
      const saved = await requestJson(
        isEdit ? `${ITEMS_API}/${encodeURIComponent(record._id)}` : ITEMS_API,
        jsonRequest(isEdit ? "PUT" : "POST", payload),
        "Failed to save testimonial",
      );
      message.success(isEdit ? "Testimonial updated" : "Testimonial added");
      onSaved(saved, isEdit);
    } catch (err) {
      message.error(err?.message || "Failed to save testimonial");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Testimonial" : "Add Testimonial"}
      open={open}
      width={640}
      maskClosable={false}
      okText={isEdit ? "Update" : "Add"}
      confirmLoading={saving}
      onOk={handleSave}
      onCancel={() => {
        if (!saving) onClose();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quote: record?.quote || "",
          name: record?.name || "",
          role: record?.role || "",
          showInSlider: isEdit ? record?.showInSlider === true : true,
        }}
      >
        <Form.Item
          name="quote"
          label="Quote"
          rules={[{ required: true, whitespace: true, message: "Quote is required" }]}
        >
          <Input.TextArea rows={5} placeholder="Donor testimonial text..." />
        </Form.Item>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, whitespace: true, message: "Name is required" }]}
        >
          <Input placeholder="e.g. Mr. Mohsin Shaikh" />
        </Form.Item>
        <Form.Item name="role" label="Role / Title">
          <Input placeholder="e.g. Education Sponsor" />
        </Form.Item>
        <Form.Item name="showInSlider" label="Show in Slider" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/**
 * Table for the shared testimonial pool. Every change saves straight away
 * through the per-item endpoints. Order here is the order on the website.
 */
export default function TestimonialEntriesTable() {
  const canCreate = useAdminPermission("testimonials.create");
  const canEdit = useAdminPermission("testimonials.edit");
  const canDelete = useAdminPermission("testimonials.delete");
  const canReorder = useAdminPermission("testimonials.manage");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // The key gives every open a fresh form, so one row never shows another row's values.
  const [modal, setModal] = useState({ open: false, record: null, key: 0 });
  const [reordering, setReordering] = useState(false);
  const [togglingIds, setTogglingIds] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson(
        ITEMS_API,
        { cache: "no-store" },
        "Failed to load testimonials",
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      message.error(err?.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const isSearching = Boolean(query);

  const visibleItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.role, item.quote].some((value) =>
        String(value || "").toLowerCase().includes(query),
      ),
    );
  }, [items, query]);

  const positionById = useMemo(
    () => new Map(items.map((item, index) => [item._id, index + 1])),
    [items],
  );

  const lastPage = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, lastPage);

  const pageIds = useMemo(
    () =>
      visibleItems
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .map((item) => item._id),
    [visibleItems, currentPage, pageSize],
  );

  // A filtered list has no complete order to save, so dragging waits for an empty search.
  const dragDisabled = !canReorder || isSearching || reordering || loading;

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item._id === active.id);
    const to = items.findIndex((item) => item._id === over.id);
    if (from < 0 || to < 0) return;

    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    setReordering(true);
    try {
      await requestJson(
        `${ITEMS_API}/reorder`,
        jsonRequest("PUT", { ids: next.map((item) => item._id) }),
        "Failed to save the new order",
      );
      message.success("Order updated");
    } catch (err) {
      setItems(previous);
      message.error(err?.message || "Failed to save the new order");
    } finally {
      setReordering(false);
    }
  };

  const handleToggleSlider = async (record, checked) => {
    const patchItem = (patch) =>
      setItems((prev) =>
        prev.map((item) => (item._id === record._id ? { ...item, ...patch } : item)),
      );

    patchItem({ showInSlider: checked });
    setTogglingIds((prev) => [...prev, record._id]);
    try {
      const saved = await requestJson(
        `${ITEMS_API}/${encodeURIComponent(record._id)}`,
        jsonRequest("PUT", { showInSlider: checked }),
        "Failed to update testimonial",
      );
      patchItem(saved);
    } catch (err) {
      patchItem({ showInSlider: !checked });
      message.error(err?.message || "Failed to update testimonial");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== record._id));
    }
  };

  const handleDelete = async (record) => {
    try {
      await requestJson(
        `${ITEMS_API}/${encodeURIComponent(record._id)}`,
        { method: "DELETE" },
        "Failed to delete testimonial",
      );
      setItems((prev) => prev.filter((item) => item._id !== record._id));
      message.success("Testimonial deleted");
    } catch (err) {
      message.error(err?.message || "Failed to delete testimonial");
    }
  };

  const openModal = (record) =>
    setModal((prev) => ({ open: true, record, key: prev.key + 1 }));
  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));

  const handleSaved = (saved, isEdit) => {
    closeModal();
    if (isEdit) {
      setItems((prev) => prev.map((item) => (item._id === saved._id ? saved : item)));
      return;
    }
    // New entries land at the end of the list, so jump there to show them.
    setItems((prev) => [...prev, saved]);
    setSearch("");
    setPage(Math.ceil((items.length + 1) / pageSize));
  };

  const columns = [
    ...(canReorder
      ? [
          {
            key: "drag",
            width: 48,
            align: "center",
            render: () => (
              <RowDragHandle
                disabled={dragDisabled}
                title={isSearching ? "Clear the search to reorder" : "Drag to reorder"}
              />
            ),
          },
        ]
      : []),
    {
      title: "#",
      key: "position",
      width: 56,
      render: (_, record) => positionById.get(record._id),
    },
    {
      title: "Quote",
      dataIndex: "quote",
      key: "quote",
      render: (quote) => (
        <div
          title={quote}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {quote}
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: "Role / Title",
      dataIndex: "role",
      key: "role",
      width: 190,
      render: (role) => role || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: (
        <Space size={4}>
          <span>Show in Slider</span>
          <Tooltip title="Card View shows every testimonial. Slider View shows only the ones turned on here.">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: "showInSlider",
      key: "showInSlider",
      width: 170,
      render: (value, record) => (
        <Switch
          size="small"
          checked={value === true}
          disabled={!canEdit}
          loading={togglingIds.includes(record._id)}
          aria-label={`Show ${record.name} in slider`}
          onChange={(checked) => handleToggleSlider(record, checked)}
        />
      ),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: (value) => formatDateTime(value),
    },
    ...(canEdit || canDelete
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 110,
            render: (_, record) => (
              <Space size={4}>
                {canEdit ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    style={{ color: "#2A283E", padding: "0 4px" }}
                    onClick={() => openModal(record)}
                  >
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Popconfirm
                    title="Delete this testimonial?"
                    description="It will be removed from every section that shows testimonials."
                    okText="Delete"
                    okType="danger"
                    onConfirm={() => handleDelete(record)}
                  >
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Delete testimonial from ${record.name}`}
                      title="Delete"
                    />
                  </Popconfirm>
                ) : null}
              </Space>
            ),
          },
        ]
      : []),
  ];

  let reorderHint = "";
  if (canReorder) {
    if (isSearching) {
      reorderHint = "Clear the search to reorder.";
    } else if (items.length > pageSize) {
      reorderHint =
        "Drag a row to change the website order. To move a row to another page, show more rows per page.";
    } else {
      reorderHint = "Drag a row to change the website order.";
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Typography.Text type="secondary">{reorderHint}</Typography.Text>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search by quote, name, or role"
            style={{ width: 280, maxWidth: "100%" }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
          {canCreate ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal(null)}
            >
              Add Testimonial
            </Button>
          ) : null}
        </Space>
      </div>

      <DndContext
        id="testimonial-entries-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pageIds}
          strategy={verticalListSortingStrategy}
          disabled={dragDisabled}
        >
          <Table
            rowKey="_id"
            components={TABLE_COMPONENTS}
            loading={adminTableLoading(loading)}
            locale={adminTableLocale(loading)}
            columns={columns}
            dataSource={visibleItems}
            scroll={{ x: 1040 }}
            pagination={{
              current: currentPage,
              pageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              showSizeChanger: true,
              showTotal: (value) => `${value} testimonial(s)`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
          />
        </SortableContext>
      </DndContext>

      <TestimonialEntryModal
        key={modal.key}
        open={modal.open}
        record={modal.record}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </>
  );
}
