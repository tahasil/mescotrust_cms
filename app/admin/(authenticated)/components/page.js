"use client";

import { useState, useEffect } from "react";
import { Table, Button, message, Switch, Card } from "antd";
import { EditOutlined, PlusOutlined, CodeOutlined, FileAddOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function AdminComponentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    {
      title: "Component",
      key: "component",
      width: 200,
      render: (_, record) => record.displayName || record.componentId,
    },
    { title: "ID", dataIndex: "componentId", key: "componentId", width: 140, render: (id) => <code>{id}</code> },
    {
      title: "Show on all pages",
      key: "global",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: record.global ? 600 : 400 }}>{record.global ? "Yes" : "No"}</span>
      ),
    },
    {
      title: "Position (when global)",
      key: "position",
      width: 120,
      render: (_, r) => (r.global ? (r.position === "after" ? "Below content" : "Above content") : "—"),
    },
    {
      title: "Status",
      key: "enabled",
      width: 100,
      render: (_, record) => {
        const isHeaderOrFooter = record.componentId === "Header" || record.componentId === "Footer";
        if (isHeaderOrFooter) return <span style={{ color: "#999" }}>—</span>;
        return (
          <Switch
            checked={record.enabled !== false}
            checkedChildren="Enabled"
            unCheckedChildren="Disabled"
            onChange={async (checked) => {
              try {
                const res = await fetch(`/api/admin/site-components/${encodeURIComponent(record.componentId)}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ enabled: checked }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  message.error(data.error || "Failed to update");
                  return;
                }
                message.success(checked ? "Component enabled" : "Component disabled");
                fetchList();
              } catch {
                message.error("Failed to update");
              }
            }}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Link href={`/admin/components/${encodeURIComponent(record.componentId)}/edit`}>
          <Button type="link" size="small" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Components</h1>
          <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
            Each component is a file in <code>components/site/</code>. Use <strong>Status</strong> to enable or disable a component; disabled components do not appear in the Add Component list on pages. Use Edit to open the edit page, or create a new one below.
          </p>
        </div>
        <Link href="/admin/components/new">
          <Button type="primary" icon={<PlusOutlined />}>
            New component
          </Button>
        </Link>
      </div>

      {/* Platform: how to add code and use components on pages */}
      <Card
        size="small"
        title={
          <span>
            <CodeOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Component platform — code add karke pages par use karein
          </span>
        }
        style={{ marginBottom: 24, background: "#fafbff", borderColor: "#d6e4ff" }}
      >
        <ol style={{ margin: 0, paddingLeft: 20, color: "#333" }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Naya component banao:</strong> &quot;New component&quot; se ID aur display name daalein (e.g. <code>HeroBanner</code>, <code>Hero Banner</code>).
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Code add karein:</strong> File <code>components/site/&lt;ComponentId&gt;.js</code> me jaakar apna React component likhein. Ye file create hone ke baad auto-generate hoti hai; aap use edit karke UI/content set kar sakte ho.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Pages par use karein:</strong> Koi bhi page edit karte waqt <strong>Add Component</strong> drawer me ye components dikhenge. Wahan se add karke page layout me kahin bhi use kar sakte ho.
          </li>
        </ol>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#666" }}>
          <FileAddOutlined /> Naya component banate hi <code>components/site/</code> me file + <code>lib/siteComponentRegistry.js</code> aur <code>components/site/index.js</code> me entry add ho jati hai. Sirf file me code likhna baaki hai; phir Admin → Pages → kisi page par Add Component se use karein.
        </p>
      </Card>

      <Table
        rowKey="componentId"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        size="middle"
      />
    </div>
  );
}
