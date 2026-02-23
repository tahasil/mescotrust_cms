"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message, Spin, Select, Space } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";

const CONTAINER_OPTIONS = [
  { value: "container", label: "Container (max-width)" },
  { value: "container-fluid", label: "Container fluid (full width)" },
];

export default function AdminComponentEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [component, setComponent] = useState(null);
  const [layout, setLayout] = useState([]);
  const [container, setContainer] = useState("container");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/components/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/admin/components");
          return;
        }
        const data = await res.json();
        setComponent(data);
        setLayout(Array.isArray(data.layout) ? data.layout : []);
        setContainer(data.container === "container-fluid" ? "container-fluid" : "container");
      } catch (e) {
        message.error("Failed to load component");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/components/${id}`, {
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
      message.success("Component layout saved");
    } catch (e) {
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  if (!component) return null;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/components">
            <Button icon={<ArrowLeftOutlined />} type="text">Components</Button>
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
              Design: {component.displayName || component.name}
            </h2>
            <span style={{ fontSize: 12, color: "#999" }}>{component.baseComponent}</span>
          </div>
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
            Save layout
          </Button>
        </Space>
      </div>

      <PageBuilder layout={layout} onChange={setLayout} paletteSource="core" />
    </div>
  );
}
