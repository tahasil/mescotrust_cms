"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Drawer,
  Switch,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateInput(v) {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function parseTimeRangeString(s) {
  const raw = (s || "").toString().trim();
  if (!raw) return { start: "", end: "" };
  const parts = raw
    .split(/–|-|to/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: raw, end: "" };
}

export default function AdminEventsPage() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const fetchEvents = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = list;
    if (filterStatus) result = result.filter((e) => e.status === filterStatus);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.slug?.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [list, filterStatus, searchText]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: "draft", isOnline: false });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    const tr = parseTimeRangeString(record.time);
    form.setFieldsValue({
      title: record.title,
      slug: record.slug,
      description: record.description,
      content: record.content,
      featuredImageDesktop: record.featuredImageDesktop,
      featuredImageMobile: record.featuredImageMobile,
      startDate: toDateInput(record.startDate),
      endDate: toDateInput(record.endDate),
      startTime: tr.start,
      endTime: tr.end,
      location: record.location,
      isOnline: !!record.isOnline,
      eventLink: record.eventLink,
      status: record.status,
      metaTitle: record.meta?.metaTitle,
      metaDescription: record.meta?.metaDescription,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete event?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/events/${record._id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Event deleted");
        fetchEvents();
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const startT = (values.startTime || "").toString().trim();
      const endT = (values.endTime || "").toString().trim();
      const timeStr =
        startT && endT ? `${startT} - ${endT}` : startT || endT || "";
      const payload = {
        title: values.title,
        slug: values.slug,
        description: values.description || "",
        content: values.content || "",
        featuredImageDesktop: values.featuredImageDesktop || "",
        featuredImageMobile: values.featuredImageMobile || "",
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        time: timeStr,
        location: values.isOnline ? "" : values.location || "",
        isOnline: !!values.isOnline,
        eventLink: values.eventLink || "",
        status: values.status,
        meta: {
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
        },
      };
      const url = editingId
        ? `/api/admin/events/${editingId}`
        : "/api/admin/events";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success(editingId ? "Event updated" : "Event created");
      setModalOpen(false);
      fetchEvents();
    } catch (e) {
      if (e.errorFields) {
        setSaving(false);
        return;
      }
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t, r) => <Link href={`/admin/events/${r._id}`}>{t}</Link>,
    },
    {
      title: "Start date",
      dataIndex: "startDate",
      key: "startDate",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Quick edit
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
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Events"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search title or slug"
            allowClear
            style={{ width: 220 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add event
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Drawer
        title={editingId ? "Edit event" : "New event"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        width={560}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            {editingId ? "Update" : "Save"}
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="isOnline"
                label="Online event"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Input
                  placeholder="Event title"
                  onChange={(e) => {
                    if (!editingId) {
                      form.setFieldValue("slug", slugify(e.target.value));
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[{ required: true }]}
                extra="Auto-generated from title."
                className="mb-0"
              >
                <Input placeholder="event-slug" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="draft"
                className="mb-0"
              >
                <Select
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="startDate" label="Start date" className="mb-0">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endDate" label="End date" className="mb-0">
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="startTime" label="Start time" className="mb-0">
                <Input type="time" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endTime" label="End time" className="mb-0">
                <Input type="time" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.isOnline !== cur.isOnline}
              >
                {({ getFieldValue }) =>
                  getFieldValue("isOnline") ? (
                    <Form.Item label="Location">
                      <Input disabled placeholder="Online event" />
                    </Form.Item>
                  ) : (
                    <Form.Item name="location" label="Location">
                      <Input placeholder="Venue or address" />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="eventLink"
                label="Event / registration link"
                className="mb-0"
              >
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
                className="mb-0"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Short description for listings"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="featuredImageDesktop"
                label="Featured image URL (Desktop)"
                className="mb-0"
              >
                <MediaPickerInput placeholder="/media/..." />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="featuredImageMobile"
                label="Featured image URL (Mobile)"
                extra="Optional. Falls back to desktop image."
                className="mb-0"
              >
                <MediaPickerInput placeholder="/media/..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="content" label="Content" className="mb-0">
                <RichTextEditor />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="metaTitle" label="Meta title" className="mb-0">
                <Input placeholder="SEO title" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="metaDescription"
                label="Meta description"
                className="mb-0"
              >
                <Input.TextArea rows={2} placeholder="SEO description" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </ThemeAdminCard>
  );
}
