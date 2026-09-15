"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Descriptions,
  Dropdown,
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
  DownloadOutlined,
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

const DATE_API_FORMAT = "YYYY-MM-DD";
const DATE_DISPLAY_FORMAT = "DD-MM-YYYY";

const EXPORT_MENU_ITEMS = [
  { key: "csv_filtered", label: "Export as CSV" },
  { key: "xlsx_all", label: "Export as Excel (All)" },
  { key: "custom", label: "Custom Export" },
];

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toDateValue(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const parsed = dayjs(text, DATE_API_FORMAT, true);
  return parsed.isValid() ? parsed : null;
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

function parseFilenameFromDisposition(value) {
  const text = normalizeText(value);
  if (!text) return "";
  const utfMatch = text.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const basicMatch = text.match(/filename="?([^"]+)"?/i);
  return normalizeText(basicMatch?.[1]);
}

function saveBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "form-submissions-export";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function triggerUrlDownload(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  if (fileName) anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
  const [snapshotColumns, setSnapshotColumns] = useState({
    primary: { label: "Email" },
    secondary: { label: "Phone Number" },
  });
  const [exportColumns, setExportColumns] = useState([]);

  const getStorageKey = (key) => `admin-form-submissions-${formId || "all"}-${key}-v1`;

  const [searchInput, setSearchInput] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("search") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-search-v1`) : "") || "";
  });
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("search") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-search-v1`) : "") || "";
  });
  const [isRead, setIsRead] = useState(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search);
    return p.get("isRead") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-isRead-v1`) : "") || "all";
  });
  const [sort, setSort] = useState(() => {
    if (typeof window === "undefined") return "createdAt_desc";
    const p = new URLSearchParams(window.location.search);
    return p.get("sort") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-sort-v1`) : "") || "createdAt_desc";
  });
  const [dateFrom, setDateFrom] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("dateFrom") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-dateFrom-v1`) : "") || "";
  });
  const [dateTo, setDateTo] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("dateTo") || (formId ? sessionStorage.getItem(`admin-form-submissions-${formId}-dateTo-v1`) : "") || "";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !formId) return;
    const url = new URL(window.location.href);
    if (search.trim()) {
      sessionStorage.setItem(getStorageKey("search"), search);
      url.searchParams.set("search", search);
    } else {
      sessionStorage.removeItem(getStorageKey("search"));
      url.searchParams.delete("search");
    }
    if (isRead && isRead !== "all") {
      sessionStorage.setItem(getStorageKey("isRead"), isRead);
      url.searchParams.set("isRead", isRead);
    } else {
      sessionStorage.removeItem(getStorageKey("isRead"));
      url.searchParams.delete("isRead");
    }
    if (sort && sort !== "createdAt_desc") {
      sessionStorage.setItem(getStorageKey("sort"), sort);
      url.searchParams.set("sort", sort);
    } else {
      sessionStorage.removeItem(getStorageKey("sort"));
      url.searchParams.delete("sort");
    }
    if (dateFrom) {
      sessionStorage.setItem(getStorageKey("dateFrom"), dateFrom);
      url.searchParams.set("dateFrom", dateFrom);
    } else {
      sessionStorage.removeItem(getStorageKey("dateFrom"));
      url.searchParams.delete("dateFrom");
    }
    if (dateTo) {
      sessionStorage.setItem(getStorageKey("dateTo"), dateTo);
      url.searchParams.set("dateTo", dateTo);
    } else {
      sessionStorage.removeItem(getStorageKey("dateTo"));
      url.searchParams.delete("dateTo");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [formId, search, isRead, sort, dateFrom, dateTo]);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const [exportingType, setExportingType] = useState("");
  const [customExportOpen, setCustomExportOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState([]);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

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
        setSnapshotColumns({
          primary: {
            label: normalizeText(data?.form?.snapshotColumns?.primary?.label, "Email"),
          },
          secondary: {
            label: normalizeText(data?.form?.snapshotColumns?.secondary?.label, "Phone Number"),
          },
        });
        const nextExportColumns = Array.isArray(data?.form?.exportColumns) ? data.form.exportColumns : [];
        setExportColumns(nextExportColumns);
        setCustomColumns((prev) => {
          if (!prev.length) return nextExportColumns.map((column) => column.key);
          const available = new Set(nextExportColumns.map((column) => column.key));
          const retained = prev.filter((key) => available.has(key));
          return retained.length > 0 ? retained : nextExportColumns.map((column) => column.key);
        });
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

  const openDetail = useCallback(
    async (submission) => {
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
    },
    [fetchList, formId, page, patchReadState],
  );

  const deleteSubmission = useCallback(async (submissionId) => {
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
  }, [fetchList, formId, page]);

  const runExport = useCallback(
    async ({ type, columns, dateFrom: exportDateFrom, dateTo: exportDateTo }) => {
      if (!formId) return;
      try {
        setExportingType(type);
        const payload = { type };
        if (type === "csv_filtered") {
          payload.filters = { search, isRead, sort, dateFrom, dateTo };
          payload.format = "csv";
        } else if (type === "xlsx_all") {
          payload.format = "xlsx";
        } else if (type === "custom") {
          payload.format = "xlsx";
          payload.columns = Array.isArray(columns) ? columns : [];
          payload.dateFrom = exportDateFrom || "";
          payload.dateTo = exportDateTo || "";
          payload.sort = sort;
        }

        const res = await fetch(
          `/api/admin/forms/${encodeURIComponent(formId)}/submissions/export`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        const contentType = normalizeText(res.headers.get("content-type")).toLowerCase();
        if (!res.ok) {
          const errorPayload = contentType.includes("application/json")
            ? await res.json().catch(() => ({}))
            : {};
          throw new Error(errorPayload?.error || "Failed to export submissions");
        }

        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          if (!data?.downloadUrl) {
            throw new Error("Export file URL is missing");
          }
          triggerUrlDownload(data.downloadUrl, data.fileName);
          message.success("Large export is ready. Download started.");
          return;
        }

        const blob = await res.blob();
        const fileName =
          parseFilenameFromDisposition(res.headers.get("content-disposition")) ||
          `form-submissions-${type === "xlsx_all" || type === "custom" ? "all" : "filtered"}.${type === "csv_filtered" ? "csv" : "xlsx"}`;
        saveBlob(blob, fileName);
        message.success("Export downloaded");
      } catch (err) {
        message.error(err?.message || "Failed to export submissions");
      } finally {
        setExportingType("");
      }
    },
    [dateFrom, dateTo, formId, isRead, search, sort],
  );

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
        title: snapshotColumns?.primary?.label || "Email",
        key: "snapshotPrimary",
        width: 220,
        ellipsis: true,
        render: (_, record) => normalizeText(record?.snapshot?.primary?.value, "-"),
      },
      {
        title: snapshotColumns?.secondary?.label || "Phone Number",
        key: "snapshotSecondary",
        width: 220,
        ellipsis: true,
        render: (_, record) => normalizeText(record?.snapshot?.secondary?.value, "-"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 140,
        render: (_, row) => (
          <Space>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)}>
              View
            </Button>
            <Popconfirm
              title="Delete this submission?"
              description="The record will be soft-deleted and removed from the default listing."
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
    [
      deleteSubmission,
      fetchList,
      openDetail,
      page,
      patchReadState,
      snapshotColumns?.primary?.label,
      snapshotColumns?.secondary?.label,
    ],
  );

  const customColumnOptions = useMemo(
    () =>
      exportColumns.map((column) => ({
        label: column.label,
        value: column.key,
      })),
    [exportColumns],
  );

  return (
    <ThemeAdminCard
      title={
        <Space wrap>
          <Link href={`/admin/form-builder/${encodeURIComponent(formId)}/edit`}>
            <Button icon={<ArrowLeftOutlined />} aria-label="Back" title="Back" />
          </Link>
          <Typography.Text strong>{formName || "Form"}</Typography.Text>
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
          <Select style={{ width: 120 }} options={READ_FILTER_OPTIONS} value={isRead} onChange={setIsRead} />
          <Select style={{ width: 140 }} options={SORT_OPTIONS} value={sort} onChange={setSort} />
          <DatePicker
            style={{ width: 140 }}
            format={DATE_DISPLAY_FORMAT}
            placeholder="dd-mm-yyyy"
            value={toDateValue(dateFrom)}
            allowClear
            onChange={(value) =>
              setDateFrom(value && value.isValid() ? value.format(DATE_API_FORMAT) : "")
            }
            disabledDate={(current) => {
              const to = toDateValue(dateTo);
              return Boolean(to && current && current.endOf("day").isAfter(to.endOf("day")));
            }}
          />
          <DatePicker
            style={{ width: 140 }}
            format={DATE_DISPLAY_FORMAT}
            placeholder="dd-mm-yyyy"
            value={toDateValue(dateTo)}
            allowClear
            onChange={(value) =>
              setDateTo(value && value.isValid() ? value.format(DATE_API_FORMAT) : "")
            }
            disabledDate={(current) => {
              const from = toDateValue(dateFrom);
              return Boolean(from && current && current.startOf("day").isBefore(from.startOf("day")));
            }}
          />
          <Dropdown
            menu={{
              items: EXPORT_MENU_ITEMS,
              onClick: ({ key }) => {
                if (key === "custom") {
                  setCustomExportOpen(true);
                  return;
                }
                runExport({ type: key });
              },
            }}
            trigger={["click"]}
          >
            <Button icon={<DownloadOutlined />} loading={Boolean(exportingType)}>
              Export
            </Button>
          </Dropdown>
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
                description="The record will be soft-deleted and removed from the default listing."
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

      <Modal
        title="Custom Export"
        open={customExportOpen}
        onCancel={() => setCustomExportOpen(false)}
        onOk={async () => {
          if (!customColumns.length) {
            message.warning("Select at least one column for custom export");
            return;
          }
          await runExport({
            type: "custom",
            columns: customColumns,
            dateFrom: customDateFrom,
            dateTo: customDateTo,
          });
          setCustomExportOpen(false);
        }}
        confirmLoading={exportingType === "custom"}
        okText="Export"
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Columns</Typography.Text>
            <Select
              mode="multiple"
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select columns"
              value={customColumns}
              options={customColumnOptions}
              maxTagCount="responsive"
              onChange={setCustomColumns}
            />
          </div>
          <div>
            <Typography.Text strong>Date Range</Typography.Text>
            <DatePicker.RangePicker
              style={{ width: "100%", marginTop: 8 }}
              format={DATE_DISPLAY_FORMAT}
              value={[toDateValue(customDateFrom), toDateValue(customDateTo)]}
              allowClear
              onChange={(value) => {
                const from = value?.[0];
                const to = value?.[1];
                setCustomDateFrom(from && from.isValid() ? from.format(DATE_API_FORMAT) : "");
                setCustomDateTo(to && to.isValid() ? to.format(DATE_API_FORMAT) : "");
              }}
            />
          </div>
        </Space>
      </Modal>
    </ThemeAdminCard>
  );
}
