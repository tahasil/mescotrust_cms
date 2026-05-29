"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { toText } from "@/lib/portfolioUtils";

export default function PortfolioCategoriesPage() {
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/portfolio-categories")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setList(Array.isArray(data?.items) ? data.items : []))
      .catch(() => message.error("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const rows = useMemo(
    () =>
      [...list].sort((a, b) =>
        Number(a?.order || 0) !== Number(b?.order || 0)
          ? Number(a?.order || 0) - Number(b?.order || 0)
          : String(a?.name || "").localeCompare(String(b?.name || "")),
      ),
    [list],
  );

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      name: "",
      description: "",
      order: rows.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: toText(record?.name),
      description: toText(record?.description),
      order: Number.isFinite(Number(record?.order)) ? Number(record.order) : 0,
      isActive: record?.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const endpoint = editingCategory?._id
        ? `/api/admin/portfolio-categories/${encodeURIComponent(editingCategory._id)}`
        : "/api/admin/portfolio-categories";
      const method = editingCategory?._id ? "PUT" : "POST";
      const payload = {
        name: values.name,
        description: values.description,
        order:
          values.order != null && Number.isFinite(Number(values.order))
            ? Number(values.order)
            : 0,
        isActive: values.isActive !== false,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to save category");
        return;
      }
      message.success(editingCategory?._id ? "Category updated" : "Category created");
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete category?",
      content: `Delete "${record?.name}" category?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await fetch(
          `/api/admin/portfolio-categories/${encodeURIComponent(record?._id || "")}`,
          { method: "DELETE" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          message.error(data.error || "Failed to delete category");
          return;
        }
        message.success("Category deleted");
        fetchCategories();
      },
    });
  };

  const handleMove = async (record, direction) => {
    const currentIndex = rows.findIndex((item) => item._id === record._id);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    const current = rows[currentIndex];
    const target = rows[targetIndex];
    const currentOrder = Number.isFinite(Number(current?.order))
      ? Number(current.order)
      : currentIndex;
    const targetOrder = Number.isFinite(Number(target?.order))
      ? Number(target.order)
      : targetIndex;

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/admin/portfolio-categories/${encodeURIComponent(current._id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetOrder }),
        }),
        fetch(`/api/admin/portfolio-categories/${encodeURIComponent(target._id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ]);
      if (!resA.ok || !resB.ok) {
        message.error("Failed to reorder categories");
        return;
      }
      fetchCategories();
    } catch {
      message.error("Failed to reorder categories");
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "order",
      key: "order",
      width: 70,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          <div style={{ color: "#777", fontSize: 12 }}>{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_, record) => {
        const idx = rows.findIndex((row) => row._id === record._id);
        const canMoveUp = idx > 0;
        const canMoveDown = idx < rows.length - 1;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={!canMoveUp}
              onClick={() => handleMove(record, "up")}
            >
              Up
            </Button>
            <Button
              type="link"
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={!canMoveDown}
              onClick={() => handleMove(record, "down")}
            >
              Down
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <ThemeAdminCard
        title="Manage Categories"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Category
          </Button>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
      </ThemeAdminCard>

      <Modal
        title={editingCategory?._id ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onCancel={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        onOk={handleSave}
        okText={editingCategory?._id ? "Update" : "Create"}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Category name is required" }]}
          >
            <Input placeholder="e.g. Leadership" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="order" label="Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

