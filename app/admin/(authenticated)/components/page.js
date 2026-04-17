"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Button, message, Modal, Form, Input, Switch, Row, Col } from "antd";
import { EditOutlined, PlusOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

const EXCLUDED_COMPONENT_IDS = new Set([
  "ImageSlider",
  "StoriesSlider",
  "EventsSlider",
]);

function deriveComponentId(displayName) {
  if (!displayName || typeof displayName !== "string") return "";
  let base = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!/^[a-zA-Z]/.test(base) && base.length) base = "C" + base;
  return base;
}

export default function AdminComponentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const visibleList = list.filter(
      (c) => !EXCLUDED_COMPONENT_IDS.has(c.componentId),
    );
    if (!q) return visibleList;
    return visibleList.filter(
      (c) =>
        (c.displayName || "").toLowerCase().includes(q) ||
        (c.componentId || "").toLowerCase().includes(q),
    );
  }, [list, searchQuery]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setNewModalOpen(true);
      router.replace("/admin/components", { scroll: false });
    }
  }, [searchParams, router]);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => message.error("Failed to load components"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/site-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName?.trim(),
          global: values.global ?? false,
          position: values.position || "before",
          order: Number(values.order) ?? 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Create failed");
        return;
      }
      const cid = data.componentId;
      message.success(
        `Component created. Add code in components/site/${cid}.js — then use it on any page via Add Component.`,
        6,
      );
      setNewModalOpen(false);
      form.resetFields();
      form.setFieldsValue({ _derivedId: "", order: 0, global: false, position: "before" });
      fetchList();
      router.push(`/admin/components/${encodeURIComponent(cid)}/edit`);
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Component",
      key: "component",
      width: 200,
      render: (_, record) => record.displayName || record.componentId,
    },
    {
      title: "ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 140,
      render: (id) => <code>{id}</code>,
    },
    {
      title: "Show on all pages",
      key: "global",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: record.global ? 600 : 400 }}>
          {record.global ? "Yes" : "No"}
        </span>
      ),
    },
    {
      title: "Position (when global)",
      key: "position",
      width: 120,
      render: (_, r) =>
        r.global
          ? r.position === "after"
            ? "Below content"
            : "Above content"
          : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Link
          href={`/admin/components/${encodeURIComponent(record.componentId)}/edit`}
        >
          <Button type="link" size="small" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <ThemeAdminCard
        title="Components"
        extra={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewModalOpen(true)} disabled={saving}>
              New component
            </Button>
          </div>
        }
      >
        <Table
          rowKey="componentId"
          columns={columns}
          dataSource={filteredList}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 15, 25, 50], showTotal: (total) => `Total ${total} components` }}
          size="middle"
        />
      </ThemeAdminCard>

      <Modal
        title="New component"
        open={newModalOpen}
        onCancel={() => {
          if (saving) return;
          setNewModalOpen(false);
          form.resetFields();
          form.setFieldsValue({ _derivedId: "", order: 0, global: false, position: "before" });
        }}
        closable={!saving}
        maskClosable={!saving}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            global: false,
            position: "before",
            order: 0,
            _derivedId: "",
          }}
          onValuesChange={(_, all) =>
            form.setFieldValue("_derivedId", deriveComponentId(all.displayName))
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="Display name"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. Hero Banner" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="_derivedId"
                label="Component ID"
                tooltip="Generated from display name (no spaces). Cannot be edited."
              >
                <Input disabled placeholder="Generated from display name" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="global" label="Show on all pages (global)" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="position" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="order" hidden>
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleCreateSubmit} loading={saving}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
