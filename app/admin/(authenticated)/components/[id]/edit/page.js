"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message, Spin, Select, Space, Divider } from "antd";
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import PageBuilder from "@/components/admin/PageBuilder";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

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

  const isSystem = component.type === "system";

  /** For system/view: if no layout, show one block with defaultProps so the default component UI is visible */
  const previewLayout =
    isSystem && layout.length === 0 && component.baseComponent
      ? [{ instanceId: "default-view", baseComponent: component.baseComponent, props: component.defaultProps || {}, order: 0 }]
      : layout;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/components" style={{ display: "inline-block" }}>
            <Button type="default" icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
            {component.displayName || component.name}
          </h2>
        </div>
        {!isSystem && (
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
        )}
      </div>

      {!isSystem && (
        <PageBuilder layout={layout} onChange={setLayout} showLayers={false} includeAntdBlocks />
      )}

      <Divider style={{ margin: "24px 0 12px" }} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#666", fontSize: 13 }}>
          <EyeOutlined />
          <span style={{ fontWeight: 500 }}>Component UI preview</span>
          <span style={{ color: "#999" }}>— how it will look when used on a page</span>
        </div>
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden", background: "#fafafa", padding: 16 }}>
          {previewLayout.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#999" }}>
              Add blocks above to see the component preview here.
            </div>
          ) : (
            <ComponentRenderer layout={previewLayout} wrapperContainer={container} />
          )}
        </div>
      </div>
    </div>
  );
}
