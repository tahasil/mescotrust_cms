"use client";

import { useMemo, useState, useEffect } from "react";
import { Table, Button, Space, Tag, Modal, Descriptions, message, Input, Select } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import { getContactSubmissionIdentifierCandidates } from "@/lib/contactSubmissionIdentifiers";

function getSubmissionTimestamp(item) {
  return item?.submittedAt || item?.createdAt || null;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

async function fetchJsonSafe(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data;
}

export default function AdminContactsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const fetchList = async () => {
    setLoading(true);
    try {
      const legacyData = await fetchJsonSafe("/api/admin/contacts?submissionType=contact&limit=200");
      const legacyItems = Array.isArray(legacyData)
        ? legacyData
        : Array.isArray(legacyData?.items)
          ? legacyData.items
          : [];

      let formData = null;
      for (const identifier of getContactSubmissionIdentifierCandidates()) {
        // eslint-disable-next-line no-await-in-loop
        const next = await fetchJsonSafe(
          `/api/admin/form-submissions?form=${encodeURIComponent(identifier)}&limit=200`,
        );
        if (next?.form && Array.isArray(next?.items)) {
          formData = next;
          break;
        }
      }

      const formItems = Array.isArray(formData?.items) ? formData.items : [];

      const normalizedFormItems = formItems.map((item) => ({
        ...item,
        createdAt: getSubmissionTimestamp(item),
        __source: "form",
        __sourceLabel: formData?.form?.name || "Contact Us",
        __rowKey: `form:${String(item?._id || "")}`,
      }));

      const normalizedLegacyItems = legacyItems.map((item) => ({
        ...item,
        createdAt: getSubmissionTimestamp(item),
        __source: "contact",
        __sourceLabel: "Contact API",
        __rowKey: `contact:${String(item?._id || "")}`,
      }));

      const merged = [...normalizedFormItems, ...normalizedLegacyItems].sort(
        (a, b) =>
          new Date(getSubmissionTimestamp(b) || 0).getTime() -
          new Date(getSubmissionTimestamp(a) || 0).getTime(),
      );

      setList(merged);
    } catch {
      message.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const markRead = async (record) => {
    const isFormSource = record?.__source === "form";
    const endpoint = isFormSource
      ? `/api/admin/form-submissions/${record?._id}`
      : `/api/admin/contacts/${record?._id}`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) return message.error("Failed");
    message.success("Marked as read");
    fetchList();
  };

  const handleDelete = (record) => {
    if (!confirm("Delete this submission?")) return;
    const isFormSource = record?.__source === "form";
    const endpoint = isFormSource
      ? `/api/admin/form-submissions/${record?._id}`
      : `/api/admin/contacts/${record?._id}`;
    fetch(endpoint, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        message.success("Deleted");
        fetchList();
      } else message.error("Delete failed");
    });
  };

  const filteredList = useMemo(() => {
    const query = normalizeText(searchText);
    return (Array.isArray(list) ? list : []).filter((item) => {
      const readMatched =
        readFilter === "all" ? true : readFilter === "read" ? item?.isRead === true : item?.isRead !== true;
      const sourceMatched = sourceFilter === "all" ? true : item?.__source === sourceFilter;
      if (!readMatched || !sourceMatched) return false;
      if (!query) return true;

      const haystack = normalizeText(
        [
          item?.payload?.name,
          item?.payload?.email,
          item?.payload?.phone,
          item?.payload?.subject,
          item?.payload?.message,
          item?.source,
          item?.page,
          item?.__sourceLabel,
        ].join(" "),
      );
      return haystack.includes(query);
    });
  }, [list, readFilter, searchText, sourceFilter]);

  return (
    <ThemeAdminCard
      title="Contact Us submissions"
      extra={(
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search name, email, subject, message"
            style={{ width: 300 }}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            value={readFilter}
            onChange={setReadFilter}
            style={{ width: 140 }}
            options={[
              { label: "All status", value: "all" },
              { label: "Read", value: "read" },
              { label: "Unread", value: "unread" },
            ]}
          />
          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 150 }}
            options={[
              { label: "All sources", value: "all" },
              { label: "Contact Form", value: "form" },
              { label: "Contact API", value: "contact" },
            ]}
          />
        </Space>
      )}
    >
      <Table
        rowKey="__rowKey"
        loading={loading}
        dataSource={filteredList}
        columns={[
          { title: "Name", dataIndex: ["payload", "name"], key: "name", render: (value) => value || "-" },
          { title: "Email", dataIndex: ["payload", "email"], key: "email", render: (value) => value || "-" },
          { title: "Message", dataIndex: ["payload", "message"], key: "message", ellipsis: true, render: (value) => value || "-" },
          {
            title: "Source",
            dataIndex: "__source",
            key: "source",
            render: (value) => (
              <Tag color={value === "form" ? "blue" : "default"}>
                {value === "form" ? "Contact Form" : "Contact API"}
              </Tag>
            ),
          },
          {
            title: "Read",
            dataIndex: "isRead",
            key: "isRead",
            render: (read, record) =>
              read ? (
                <Tag color="green">Read</Tag>
              ) : (
                <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => markRead(record)}>
                  Mark read
                </Button>
              ),
          },
          {
            title: "Submitted",
            key: "submittedAt",
            render: (_, record) => formatDateTime(getSubmissionTimestamp(record)),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)} />
                <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Submission Details"
        width={600}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{viewItem.payload?.name || "-"}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewItem.payload?.email || "-"}</Descriptions.Item>
            <Descriptions.Item label="Phone">{viewItem.payload?.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Subject">{viewItem.payload?.subject || "-"}</Descriptions.Item>
            <Descriptions.Item label="Message">{viewItem.payload?.message || "-"}</Descriptions.Item>
            <Descriptions.Item label="Page">{viewItem.page || "-"}</Descriptions.Item>
            <Descriptions.Item label="Source">{viewItem.source || "-"}</Descriptions.Item>
            <Descriptions.Item label="Data source">{viewItem.__sourceLabel || "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">{viewItem.isRead ? "Read" : "Unread"}</Descriptions.Item>
            <Descriptions.Item label="Submitted">{formatDateTime(getSubmissionTimestamp(viewItem))}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
