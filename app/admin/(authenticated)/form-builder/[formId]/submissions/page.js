"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

const READ_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "false", label: "Unread" },
  { value: "true", label: "Read" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
];

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toSearchSummary(payload) {
  if (!payload || typeof payload !== "object") return "-";
  const entries = Object.entries(payload).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return Boolean(value.trim());
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" | ");
}

function renderSubmissionValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    const maybeFiles = value.every((entry) => entry && typeof entry === "object" && entry.filename);
    if (maybeFiles) {
      return (
        <Space direction="vertical" size={4}>
          {value.map((file) => (
            <a
              key={String(file.submissionFileId || file.filename)}
              href={file.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {file.filename}
            </a>
          ))}
        </Space>
      );
    }
    return value.map((entry) => normalizeText(entry)).filter(Boolean).join(", ") || "-";
  }
  if (value && typeof value === "object") {
    return (
      <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  const text = normalizeText(value);
  return text || "-";
}

export default function FormSubmissionsPage() {
  const params = useParams();
  const formId = normalizeText(params?.formId);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [formName, setFormName] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isRead, setIsRead] = useState("all");
  const [sort, setSort] = useState("createdAt_desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const fetchList = useCallback(
    async (nextPage = page) => {
      if (!formId) return;
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(nextPage),
          limit: String(limit),
          isRead,
          sort,
        });
        if (search) query.set("search", search);
        if (dateFrom) query.set("dateFrom", dateFrom);
        if (dateTo) query.set("dateTo", dateTo);

        const res = await fetch(
          `/api/admin/forms/${encodeURIComponent(formId)}/submissions?${query.toString()}`,
          { cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load submissions");

        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
        setFormName(normalizeText(data?.form?.name));
      } catch (err) {
        message.error(err?.message || "Failed to load submissions");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [dateFrom, dateTo, formId, isRead, limit, page, search, sort],
  );

  useEffect(() => {
    fetchList(1);
    setPage(1);
  }, [formId, search, isRead, sort, dateFrom, dateTo, fetchList]);

  const patchReadState = useCallback(
    async (submissionId, nextIsRead) => {
      const res = await fetch(
        `/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: nextIsRead }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update read status");
      return data;
    },
    [formId],
  );

  const openDetail = async (submission) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submission._id)}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load submission detail");
      setDetailItem(data);

      if (!submission.isRead) {
        await patchReadState(submission._id, true);
        fetchList(page);
      }
    } catch (err) {
      message.error(err?.message || "Failed to load submission detail");
      setDetailItem(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      const res = await fetch(
        `/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete submission");
      message.success("Submission deleted");
      setDetailOpen(false);
      setDetailItem(null);
      fetchList(page);
    } catch (err) {
      message.error(err?.message || "Failed to delete submission");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Submitted",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Status",
        dataIndex: "isRead",
        key: "isRead",
        width: 120,
        render: (value, record) =>
          value ? (
            <Tag color="green">Read</Tag>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                try {
                  await patchReadState(record._id, true);
                  fetchList(page);
                } catch (err) {
                  message.error(err?.message || "Failed to mark read");
                }
              }}
            >
              Mark read
            </Button>
          ),
      },
      {
        title: "Snapshot",
        dataIndex: "payloadByFieldNameSnapshot",
        key: "summary",
        ellipsis: true,
        render: (payload) => <span>{toSearchSummary(payload)}</span>,
      },
      {
        title: "Source",
        key: "source",
        width: 200,
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{normalizeText(row.source) || "-"}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {normalizeText(row.pagePath) || "-"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, row) => (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetail(row)}
            >
              View
            </Button>
            <Popconfirm
              title="Delete this submission?"
              description="This action cannot be undone."
              okText="Delete"
              okType="danger"
              onConfirm={() => deleteSubmission(row._id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [fetchList, openDetail, page, patchReadState],
  );

  return (
    <ThemeAdminCard
      title={
        <Space wrap>
          <Link href={`/admin/form-builder/${encodeURIComponent(formId)}/edit`}>
            <Button icon={<ArrowLeftOutlined />}>Back to Editor</Button>
          </Link>
          <Typography.Text strong>{formId || "Form"}</Typography.Text>
          {formName ? <Typography.Text type="secondary">{formName}</Typography.Text> : null}
        </Space>
      }
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search submissions"
            style={{ width: 240 }}
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
              if (!normalizeText(value)) setSearch("");
            }}
            onSearch={(value) => setSearch(normalizeText(value))}
          />
          <Select
            style={{ width: 120 }}
            options={READ_FILTER_OPTIONS}
            value={isRead}
            onChange={setIsRead}
          />
          <Select style={{ width: 140 }} options={SORT_OPTIONS} value={sort} onChange={setSort} />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(normalizeText(e.target.value))}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(normalizeText(e.target.value))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchList(page)}>
            Refresh
          </Button>
        </Space>
      }
    >
      {items.length === 0 && !loading ? (
        <Empty description="No submissions found" />
      ) : (
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showTotal: (value) => `${value} submission(s)`,
            onChange: (nextPage) => {
              setPage(nextPage);
              fetchList(nextPage);
            },
          }}
        />
      )}

      <Modal
        title="Submission Detail"
        open={detailOpen}
        width={900}
        onCancel={() => {
          setDetailOpen(false);
          setDetailItem(null);
        }}
        footer={null}
      >
        {detailLoading ? (
          <Typography.Text type="secondary">Loading...</Typography.Text>
        ) : !detailItem ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No detail available" />
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Form ID">{detailItem.formId}</Descriptions.Item>
              <Descriptions.Item label="Schema Version">v{detailItem.schemaVersion}</Descriptions.Item>
              <Descriptions.Item label="Status">
                {detailItem.isRead ? <Tag color="green">Read</Tag> : <Tag color="orange">Unread</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted At">{formatDateTime(detailItem.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Source">{normalizeText(detailItem.source) || "-"}</Descriptions.Item>
              <Descriptions.Item label="Page Path">{normalizeText(detailItem.pagePath) || "-"}</Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="Answers"
              bordered
              size="small"
              column={1}
              items={Object.entries(detailItem.payloadByFieldNameSnapshot || {}).map(([key, value]) => ({
                key,
                label: key,
                children: renderSubmissionValue(value),
              }))}
            />

            <Space>
              {!detailItem.isRead ? (
                <Button
                  onClick={async () => {
                    try {
                      await patchReadState(detailItem._id, true);
                      setDetailItem((prev) => (prev ? { ...prev, isRead: true } : prev));
                      fetchList(page);
                    } catch (err) {
                      message.error(err?.message || "Failed to mark read");
                    }
                  }}
                >
                  Mark as Read
                </Button>
              ) : null}
              <Popconfirm
                title="Delete this submission?"
                description="This action cannot be undone."
                okText="Delete"
                okType="danger"
                onConfirm={() => deleteSubmission(detailItem._id)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          </Space>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
