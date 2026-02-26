"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, message, Spin, Select, Space } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";

const CONTAINER_OPTIONS = [
  { value: "container", label: "Container (max-width)" },
  { value: "container-fluid", label: "Container fluid (full width)" },
];

export default function AdminFooterComponentPage() {
  const router = useRouter();
  const [component, setComponent] = useState(null);
  const [layout, setLayout] = useState([]);
  const [container, setContainer] = useState("container-fluid");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/components/ensure/Footer");
        if (cancelled) return;
        if (!res.ok) {
          router.replace("/admin/components");
          return;
        }
        const data = await res.json();
        setComponent(data);
        setLayout(Array.isArray(data.layout) ? data.layout : []);
        setContainer(data.container === "container-fluid" ? "container-fluid" : "container");
      } catch {
        if (!cancelled) router.replace("/admin/components");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleSave = async () => {
    if (!component?._id) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/components/${component._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout, container }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      const updated = await res.json();
      setComponent(updated);
      setLayout(Array.isArray(updated.layout) ? updated.layout : []);
      setContainer(updated.container === "container-fluid" ? "container-fluid" : "container");
      message.success("Footer saved");
    } catch (e) {
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
        <Spin size="large" tip="Loading Footer…" />
      </div>
    );
  }
  if (!component) return null;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/components" style={{ display: "inline-block" }}>
            <Button type="default" icon={<ArrowLeftOutlined />}>Back to Components</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: 22 }}>Footer</h1>
        </div>
        <Space wrap>
          <span style={{ fontSize: 13, color: "#666" }}>Container:</span>
          <Select
            value={container}
            onChange={setContainer}
            options={CONTAINER_OPTIONS}
            style={{ minWidth: 200 }}
          />
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
      </div>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#666" }}>
        Design the site footer with <strong>drag and drop</strong>. Click <strong>Add Block</strong> to add Sections, Columns, Paragraph, Image, the <strong>Footer</strong> block (logo, links, social, copyright), Social Links, Divider, or any other block. Drag blocks to reorder; click a block to edit it in the drawer. Whatever you build here is shown as the site footer on every page when you save.
      </p>
      <PageBuilder
        layout={layout}
        onChange={setLayout}
        showLayers={true}
        includeAntdBlocks
        componentBase="Footer"
      />
    </div>
  );
}
