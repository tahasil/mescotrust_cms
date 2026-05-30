"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";
import { valueToDisplay } from "@/lib/formBuilder/submissionUtils";

const NON_DATA_TYPES = new Set(["section_heading", "divider"]);

function formatSubmissionValue(value) {
  if (Array.isArray(value)) {
    return valueToDisplay(value);
  }
  if (typeof value === "object" && value !== null) {
    return valueToDisplay(value);
  }
  return valueToDisplay(value);
}

export default function AdminFormSubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forms, setForms] = useState([]);
  const [canDelete, setCanDelete] = useState(false);
  const [activeFormId, setActiveFormId] = useState("");
  const [loadingForms, setLoadingForms] = useState(true);
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFiles, setViewFiles] = useState([]);

  const submissionIdParam = String(searchParams.get("submissionId") || "");

  const updateUrl = (nextFormId, nextSubmissionId = "") => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextFormId) params.set("formId", nextFormId);
    else params.delete("formId");
    if (nextSubmissionId) params.set("submissionId", nextSubmissionId);
    else params.delete("submissionId");
    router.replace(`/admin/form-submissions?${params.toString()}`);
  };

  const fetchForms = () => {
    setLoadingForms(true);
    fetch("/api/admin/form-builder?limit=500", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        const list = Array.isArray(data.items) ? data.items : [];
        setForms(list);
        const urlFormId = String(searchParams.get("formId") || "");
        const selected = urlFormId || list[0]?.formId || "";
        setActiveFormId(selected);
      })
      .catch(() => message.error("Failed to load forms"))
      .finally(() => setLoadingForms(false));
  };

  const fetchSubmissions = (formId, nextPage = page, nextSearch = search, unread = unreadOnly) => {
    if (!formId) {
      setItems([]);
      setFields([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: "20",
    });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (unread) params.set("unreadOnly", "true");
    fetch(`/api/admin/form-builder/${encodeURIComponent(formId)}/submissions?${params.toString()}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { items: [], fields: [] }))
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setFields(Array.isArray(data.fields) ? data.fields : []);
        setTotal(Number(data.total || 0));
      })
      .catch(() => message.error("Failed to load submissions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCanDelete(data?.user?.role === "Admin");
      })
      .catch(() => setCanDelete(false));
  }, []);

  useEffect(() => {
    if (!activeFormId) return;
    setPage(1);
    updateUrl(activeFormId, "");
    fetchSubmissions(activeFormId, 1, search, unreadOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormId, search, unreadOnly]);

  const markRead = async (submissionId) => {
    if (!activeFormId || !submissionId) return;
    const res = await fetch(
      `/api/admin/form-builder/${encodeURIComponent(activeFormId)}/submissions/${submissionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      message.error(data.error || "Failed to mark read");
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item._id === submissionId ? { ...item, isRead: true, status: "read" } : item,
      ),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("new-form-submission"));
    }
  };

  const openDetail = async (submissionId) => {
    if (!activeFormId || !submissionId) return;
    setViewLoading(true);
    try {
      const res = await fetch(
        `/api/admin/form-builder/${encodeURIComponent(activeFormId)}/submissions/${submissionId}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to load submission details");
        return;
      }
      setViewItem(data.submission || null);
      setViewFiles(Array.isArray(data.files) ? data.files : []);
      updateUrl(activeFormId, submissionId);
      if (data.submission && !data.submission.isRead) {
        markRead(submissionId);
      }
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    if (!activeFormId || !submissionIdParam) return;
    if (viewItem?._id === submissionIdParam) return;
    openDetail(submissionIdParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormId, submissionIdParam]);

  const dynamicColumns = useMemo(() => {
    const visibleFields = fields.filter((field) => !NON_DATA_TYPES.has(field.type));
    return visibleFields.map((field) => ({
      title: field.label || field.name || field.fieldKey,
      key: field.fieldKey,
      render: (_, row) => formatSubmissionValue(row.payloadByFieldKey?.[field.fieldKey]),
      ellipsis: true,
    }));
  }, [fields]);

  const columns = [
    ...dynamicColumns,
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Read",
      dataIndex: "isRead",
      key: "isRead",
      width: 110,
      render: (isRead, row) =>
        isRead ? (
          <Tag color="green">Read</Tag>
        ) : (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => markRead(row._id)}>
            Mark read
          </Button>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: canDelete ? 110 : 70,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row._id)} />
          {canDelete ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: "Delete this submission?",
                  onOk: async () => {
                    const res = await fetch(
                      `/api/admin/form-builder/${encodeURIComponent(activeFormId)}/submissions/${row._id}`,
                      { method: "DELETE" },
                    );
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      message.error(data.error || "Delete failed");
                      return;
                    }
                    message.success("Submission deleted");
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("new-form-submission"));
                    }
                    fetchSubmissions(activeFormId, page, search, unreadOnly);
                  },
                });
              }}
            />
          ) : null}
        </Space>
      ),
    },
  ];

  const renderDetailDescriptions = () => {
    if (!viewItem) return null;
    const currentFieldByKey = Object.fromEntries((fields || []).map((field) => [field.fieldKey, field]));
    const snapshot = Array.isArray(viewItem.fieldSnapshot) ? viewItem.fieldSnapshot : [];

    const known = [];
    const legacy = [];

    for (const snapshotField of snapshot) {
      const value = viewItem.payloadByFieldKey?.[snapshotField.fieldKey];
      const currentField = currentFieldByKey[snapshotField.fieldKey];
      const title =
        currentField?.label ||
        snapshotField.label ||
        currentField?.name ||
        snapshotField.name ||
        snapshotField.fieldKey;
      const row = { key: snapshotField.fieldKey, title, value };
      if (currentField) known.push(row);
      else legacy.push(row);
    }

    for (const [key, value] of Object.entries(viewItem.payloadByFieldKey || {})) {
      const existsInSnapshot = snapshot.some((item) => item.fieldKey === key);
      if (!existsInSnapshot) {
        const currentField = currentFieldByKey[key];
        if (currentField) {
          known.push({ key, title: currentField.label || currentField.name || key, value });
        } else {
          legacy.push({ key, title: key, value });
        }
      }
    }

    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Form ID">{viewItem.formId}</Descriptions.Item>
          <Descriptions.Item label="Schema Version">{viewItem.schemaVersion}</Descriptions.Item>
          <Descriptions.Item label="Status">{viewItem.isRead ? "Read" : "Unread"}</Descriptions.Item>
          <Descriptions.Item label="Submitted">{formatDateTime(viewItem.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Source">{viewItem.source || "-"}</Descriptions.Item>
          <Descriptions.Item label="Page">{viewItem.page || "-"}</Descriptions.Item>
        </Descriptions>

        <Card size="small" title="Submission Values">
          <Descriptions bordered column={1} size="small">
            {known.map((row) => (
              <Descriptions.Item key={row.key} label={row.title}>
                {formatSubmissionValue(row.value) || "-"}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>

        <Card size="small" title="Submission Files">
          {viewFiles.length === 0 ? (
            <Empty description="No files uploaded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {viewFiles.map((file) => (
                <Card
                  key={file._id}
                  size="small"
                  bodyStyle={{ padding: 10 }}
                  title={file.originalName}
                  extra={
                    <Button
                      size="small"
                      onClick={() =>
                        window.open(`/api/admin/form-builder/files/${file._id}/download`, "_blank")
                      }
                    >
                      Open / Download
                    </Button>
                  }
                >
                  <Space direction="vertical">
                    <Typography.Text type="secondary">
                      {file.mimeType || "unknown"} - {(Number(file.size || 0) / 1024).toFixed(1)} KB
                    </Typography.Text>
                    {String(file.mimeType || "").startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={file.originalName}
                        src={`/api/admin/form-builder/files/${file._id}/download`}
                        style={{ maxWidth: 240, borderRadius: 6, border: "1px solid #eee" }}
                      />
                    ) : null}
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>

        {legacy.length > 0 ? (
          <Card size="small" title="Legacy Fields">
            <Descriptions bordered column={1} size="small">
              {legacy.map((row) => (
                <Descriptions.Item key={row.key} label={row.title}>
                  {formatSubmissionValue(row.value) || "-"}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        ) : null}
      </div>
    );
  };

  return (
    <ThemeAdminCard
      title="Form Submissions"
      extra={
        <Space wrap>
          <Select
            loading={loadingForms}
            value={activeFormId || undefined}
            style={{ width: 280 }}
            placeholder="Select a form"
            onChange={(value) => setActiveFormId(value)}
            options={forms.map((form) => ({
              value: form.formId,
              label: `${form.name} (${form.formId})`,
            }))}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search submission values"
            allowClear
            style={{ width: 240 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={unreadOnly ? "unread" : "all"}
            style={{ width: 130 }}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
            ]}
            onChange={(value) => setUnreadOnly(value === "unread")}
          />
        </Space>
      }
    >
      {!activeFormId ? (
        <Empty description="No forms found. Create a form first." />
      ) : (
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={items}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (nextPage) => {
              setPage(nextPage);
              fetchSubmissions(activeFormId, nextPage, search, unreadOnly);
            },
          }}
        />
      )}

      <Modal
        open={!!viewItem}
        onCancel={() => {
          setViewItem(null);
          setViewFiles([]);
          updateUrl(activeFormId, "");
        }}
        title="Submission Details"
        footer={null}
        width={900}
        styles={{ body: { maxHeight: "75vh", overflow: "auto" } }}
      >
        {viewLoading ? <Typography.Text>Loading...</Typography.Text> : renderDetailDescriptions()}
      </Modal>
    </ThemeAdminCard>
  );
}
