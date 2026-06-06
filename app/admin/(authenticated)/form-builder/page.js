"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

const STATUS_COLORS = {
  draft: "default",
  published: "green",
  archived: "orange",
};

function getShortcodeSnippet(shortcode) {
  const value = String(shortcode || "").trim();
  if (!value) return "";
  return `[form shortcode="${value}"]`;
}

export default function FormBuilderListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchForms = useCallback(async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "20",
      });
      if (String(nextSearch || "").trim()) params.set("search", String(nextSearch).trim());
      const res = await fetch(`/api/admin/forms?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load forms");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total) || 0);
    } catch (err) {
      message.error(err?.message || "Failed to load forms");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchForms(1, search);
    setPage(1);
  }, [search, fetchForms]);

  const onCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() || "Untitled Form" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create form");
      message.success("Form created");
      setCreateOpen(false);
      setCreateName("");
      if (data?.formId) {
        router.push(`/admin/form-builder/${encodeURIComponent(data.formId)}/edit`);
        return;
      }
      fetchForms(1, search);
      setPage(1);
    } catch (err) {
      message.error(err?.message || "Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (formId) => {
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(data?.error || "Form has submissions and cannot be deleted");
      }
      if (!res.ok) throw new Error(data?.error || "Failed to delete form");
      message.success("Form deleted");
      fetchForms(page, search);
    } catch (err) {
      message.error(err?.message || "Failed to delete form");
    }
  };

  const columns = useMemo(
    () => [
      { title: "Form ID", dataIndex: "formId", key: "formId", width: 140 },
      { title: "Name", dataIndex: "name", key: "name" },
      {
        title: "Shortcode",
        dataIndex: "shortcode",
        key: "shortcode",
        width: 220,
        render: (shortcode) => {
          const shortCodeValue = String(shortcode || "").trim();
          const snippet = getShortcodeSnippet(shortCodeValue);
          return (
          <Space size={8}>
            <Typography.Text code>{shortCodeValue}</Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              disabled={!snippet}
              aria-label="Copy shortcode"
              title="Copy shortcode"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(snippet);
                  message.success("Shortcode copied");
                } catch {
                  message.error("Copy failed");
                }
              }}
            />
          </Space>
        );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => <Tag color={STATUS_COLORS[status] || "default"}>{status}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        width: 300,
        render: (_, record) => (
          <Space size={6}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              href={`/admin/form-builder/${encodeURIComponent(record.formId)}/edit`}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              href={`/admin/form-builder/${encodeURIComponent(record.formId)}/edit?preview=1`}
            >
              Preview
            </Button>
            <Button
              type="link"
              size="small"
              icon={<UnorderedListOutlined />}
              href={`/admin/form-builder/${encodeURIComponent(record.formId)}/submissions`}
            >
              Submissions
            </Button>
            <Popconfirm
              title="Delete this form?"
              description="Forms with submissions cannot be deleted."
              okText="Delete"
              okType="danger"
              onConfirm={() => onDelete(record.formId)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 180,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (value) => formatDateTime(value),
      },
    ],
    [],
  );

  return (
    <ThemeAdminCard
      title="Form Builder"
      extra={(
        <Space>
          <Input.Search
            allowClear
            placeholder="Search by name/formId/shortcode"
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchForms(page, search)}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create Form
          </Button>
        </Space>
      )}
    >
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showTotal: (value) => `${value} form(s)`,
          onChange: (nextPage) => {
            setPage(nextPage);
            fetchForms(nextPage, search);
          },
        }}
      />

      <Modal
        title="Create Form"
        open={createOpen}
        onCancel={() => {
          if (creating) return;
          setCreateOpen(false);
        }}
        onOk={onCreate}
        okText="Create"
        confirmLoading={creating}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Typography.Text type="secondary">
            Creates a blank draft form with immutable Form ID and shortcode.
          </Typography.Text>
          <Input
            placeholder="Form Name"
            value={createName}
            maxLength={120}
            onChange={(e) => setCreateName(e.target.value)}
          />
        </Space>
      </Modal>
    </ThemeAdminCard>
  );
}
