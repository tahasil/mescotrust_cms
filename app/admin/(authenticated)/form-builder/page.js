"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

export default function AdminFormBuilderPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormStatus, setNewFormStatus] = useState("draft");

  const fetchForms = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/form-builder?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => message.error("Failed to load forms"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCanDelete(data?.user?.role === "Admin");
      })
      .catch(() => setCanDelete(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const haystack = [item.formId, item.name, item.shortcode, item.status]
        .map((entry) => String(entry || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [items, search]);

  const handleCreate = async () => {
    if (!newFormName.trim()) {
      message.error("Form name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/form-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFormName.trim(), status: newFormStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create form");
        return;
      }
      message.success("Form created");
      setCreateOpen(false);
      setNewFormName("");
      setNewFormStatus("draft");
      const formId = data?.form?.formId;
      if (formId) {
        router.push(`/admin/form-builder/${encodeURIComponent(formId)}`);
        return;
      }
      fetchForms();
    } catch {
      message.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (formId) => {
    if (!canDelete) return;
    Modal.confirm({
      title: `Delete ${formId}?`,
      content:
        "This deletes the form schema and all linked submissions/files. This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/form-builder/${encodeURIComponent(formId)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Form deleted");
        fetchForms();
      },
    });
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success("Copied");
    } catch {
      message.error("Failed to copy");
    }
  };

  return (
    <ThemeAdminCard
      title="Form Builder"
      extra={
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search form ID, name, shortcode"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || "")}
            style={{ width: 140 }}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Add Form
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="formId"
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: "Form ID",
            dataIndex: "formId",
            key: "formId",
            width: 130,
            render: (value) => <code>{value}</code>,
          },
          {
            title: "Form Name",
            dataIndex: "name",
            key: "name",
            render: (value) => value || "Untitled Form",
          },
          {
            title: "Shortcode",
            dataIndex: "shortcode",
            key: "shortcode",
            render: (value) => (
              <Space>
                <code>{value}</code>
                <Tooltip title="Copy shortcode">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(value)}
                  />
                </Tooltip>
              </Space>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (value) => (
              <Tag
                color={
                  value === "published"
                    ? "green"
                    : value === "archived"
                      ? "default"
                      : "gold"
                }
              >
                {String(value || "").toUpperCase()}
              </Tag>
            ),
          },
          {
            title: "Created Date",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 190,
            render: (value) => formatDateTime(value),
          },
          {
            title: "Actions",
            key: "actions",
            width: canDelete ? 180 : 130,
            render: (_, row) => (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() =>
                      router.push(`/admin/form-builder/${encodeURIComponent(row.formId)}`)
                    }
                  />
                </Tooltip>
                <Tooltip title="View">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() =>
                      router.push(
                        `/admin/form-builder/${encodeURIComponent(row.formId)}?mode=view`,
                      )
                    }
                  />
                </Tooltip>
                {canDelete ? (
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(row.formId)}
                    />
                  </Tooltip>
                ) : null}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={createOpen}
        title="Create Form"
        onCancel={() => {
          setCreateOpen(false);
          setNewFormName("");
          setNewFormStatus("draft");
        }}
        okText="Create & Open Builder"
        confirmLoading={creating}
        onOk={handleCreate}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ fontWeight: 500 }}>Form Name</label>
          <Input
            placeholder="e.g. Volunteer Application"
            value={newFormName}
            onChange={(e) => setNewFormName(e.target.value)}
            onPressEnter={handleCreate}
          />
          <label style={{ fontWeight: 500 }}>Initial Status</label>
          <Select
            value={newFormStatus}
            onChange={setNewFormStatus}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
        </div>
      </Modal>
    </ThemeAdminCard>
  );
}
