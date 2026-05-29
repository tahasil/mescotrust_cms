"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Modal, Table, Tag, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canCreate, canDelete, canEdit } from "@/lib/rbac/clientPermissions";

export default function FormsModule() {
  const auth = useAdminAuth();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const canCreateForms = canCreate(auth, "forms");
  const canEditForms = canEdit(auth, "forms");
  const canDeleteForms = canDelete(auth, "forms");

  const fetchForms = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch("/api/admin/forms", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch forms");
      const data = await res.json().catch(() => ({}));
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      if (err?.name === "AbortError") {
        message.error("Forms request timeout. Please refresh.");
      } else {
        message.error(err.message || "Failed to load forms");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (it) =>
        String(it?.name || "").toLowerCase().includes(q) ||
        String(it?.formKey || "").toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const handleDelete = (record) => {
    if (!canDeleteForms) {
      message.warning("You do not have permission to delete forms.");
      return;
    }
    Modal.confirm({
      title: "Delete form?",
      content: `Delete "${record?.name || "this form"}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/forms/${encodeURIComponent(record?._id || "")}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          message.error(data?.error || "Failed to delete form");
          return;
        }
        message.success("Form deleted");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("admin-forms-updated"));
        }
        fetchForms();
      },
    });
  };

  const handleCreateForm = async () => {
    if (!canCreateForms) {
      message.warning("You do not have permission to create forms.");
      return;
    }
    const name = String(newFormName || "").trim();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Failed to create form");
        return;
      }
      message.success("Form created");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("admin-forms-updated"));
      }
      setCreateOpen(false);
      setNewFormName("");
      fetchForms();
    } catch (err) {
      message.error(err?.message || "Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      title: "Form Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Form Key",
      dataIndex: "formKey",
      key: "formKey",
      render: (v) => <code>{v}</code>,
    },
    {
      title: "Shortcode",
      dataIndex: "shortcode",
      key: "shortcode",
      render: (v) => <code>{v}</code>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (v) => (v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          {canEditForms && (
            <Link href={`/admin/forms/${encodeURIComponent(record?._id || "")}/edit`}>
              <Button type="link" size="small" icon={<EditOutlined />}>
                Edit
              </Button>
            </Link>
          )}
          {canDeleteForms && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          )}
          {!canEditForms && !canDeleteForms ? <span style={{ color: "#999" }}>-</span> : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <ThemeAdminCard
        title="Forms"
        extra={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            {canCreateForms && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                New Form
              </Button>
            )}
          </div>
        }
      >
        <Table
          rowKey="_id"
          dataSource={filteredList}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 15, 25, 50],
            showTotal: (total) => `Total ${total} forms`,
          }}
          size="middle"
        />
      </ThemeAdminCard>

      {canCreateForms && (
        <Modal
          title="Create Form"
          open={createOpen}
          confirmLoading={creating}
          onOk={handleCreateForm}
          onCancel={() => {
            if (creating) return;
            setCreateOpen(false);
          }}
          okText="Create"
        >
          <Input
            placeholder="Form name (e.g. Partner With Us)"
            value={newFormName}
            onChange={(e) => setNewFormName(e.target.value)}
            onPressEnter={() => {
              if (!creating) handleCreateForm();
            }}
          />
        </Modal>
      )}

    </>
  );
}
