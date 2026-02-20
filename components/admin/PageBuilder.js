"use client";

import { useState, useEffect } from "react";
import { Card, Button, Select, Drawer, Form, Input, InputNumber, Space, message } from "antd";
import { PlusOutlined, DeleteOutlined, CopyOutlined, UpOutlined, DownOutlined, EditOutlined } from "@ant-design/icons";

function generateId() {
  return "block_" + Math.random().toString(36).slice(2, 11);
}

const CORE_PAGE_BUILDER_COMPONENTS = [
  { _id: "core-Paragraph", name: "Paragraph", displayName: "Paragraph", baseComponent: "Paragraph", defaultProps: { text: "" }, active: true },
  { _id: "core-Heading", name: "Heading", displayName: "Heading", baseComponent: "Heading", defaultProps: { level: 2, text: "" }, active: true },
  { _id: "core-Image", name: "Image", displayName: "Image", baseComponent: "Image", defaultProps: { src: "", alt: "" }, active: true },
];

export default function PageBuilder({ layout = [], onChange }) {
  const [components, setComponents] = useState(CORE_PAGE_BUILDER_COMPONENTS);
  const [addComponentId, setAddComponentId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const active = (list || []).filter((c) => c.active);
        setComponents(active.length > 0 ? active : CORE_PAGE_BUILDER_COMPONENTS);
      })
      .catch(() => setComponents(CORE_PAGE_BUILDER_COMPONENTS));
  }, []);

  const blocks = Array.isArray(layout) ? [...layout] : [];
  const sorted = blocks
    .map((b, i) => ({ ...b, _index: i }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const triggerChange = (newLayout) => {
    const withOrder = newLayout.map(({ _index, ...b }, i) => ({ ...b, order: i }));
    onChange(withOrder);
  };

  const handleAdd = () => {
    const comp = components.find((c) => c._id === addComponentId);
    if (!comp) return;
    const newBlock = {
      instanceId: generateId(),
      componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
      baseComponent: comp.baseComponent,
      props: { ...(comp.defaultProps || {}) },
      order: blocks.length,
    };
    triggerChange([...blocks, newBlock]);
    setAddComponentId(null);
  };

  const handleRemove = (index) => {
    const newLayout = sorted.filter((_, i) => i !== index);
    triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
  };

  const handleDuplicate = (index) => {
    const block = sorted[index];
    const clone = {
      instanceId: generateId(),
      componentId: block.componentId,
      baseComponent: block.baseComponent,
      props: { ...(block.props || {}) },
      order: blocks.length,
    };
    triggerChange([...blocks, clone]);
  };

  const handleMove = (index, dir) => {
    if (dir === -1 && index === 0) return;
    if (dir === 1 && index === sorted.length - 1) return;
    const newSorted = [...sorted];
    const swap = newSorted[index + dir];
    newSorted[index + dir] = newSorted[index];
    newSorted[index] = swap;
    triggerChange(newSorted.map((b, i) => ({ ...b, order: i })));
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    const block = sorted[index];
    form.setFieldsValue(block.props || {});
    setDrawerOpen(true);
  };

  const handleEditSave = () => {
    form.validateFields().then((values) => {
      const block = sorted[editingIndex];
      const newLayout = blocks.map((b) =>
        b.instanceId === block.instanceId ? { ...b, props: values } : b
      );
      triggerChange(newLayout);
      setDrawerOpen(false);
      setEditingIndex(null);
    });
  };

  const getPropsFields = (baseComponent) => {
    if (baseComponent === "Paragraph") {
      return (
        <Form.Item name="text" label="Text">
          <Input.TextArea rows={3} />
        </Form.Item>
      );
    }
    if (baseComponent === "Heading") {
      return (
        <>
          <Form.Item name="level" label="Level (1-6)">
            <InputNumber min={1} max={6} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="text" label="Text">
            <Input />
          </Form.Item>
        </>
      );
    }
    if (baseComponent === "Image") {
      return (
        <>
          <Form.Item name="src" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="alt" label="Alt text">
            <Input />
          </Form.Item>
        </>
      );
    }
    return (
      <Form.Item name="text" label="Content">
        <Input.TextArea rows={2} />
      </Form.Item>
    );
  };

  const editingBlock = editingIndex !== null ? sorted[editingIndex] : null;

  return (
    <Card title="Page builder" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Select
          placeholder="Add block"
          style={{ width: 200 }}
          value={addComponentId}
          onChange={setAddComponentId}
          options={components.map((c) => ({ value: c._id, label: c.displayName || c.baseComponent }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!addComponentId}>
          Add block
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: "#999" }}>No blocks yet. Add a block above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((block, index) => (
            <Card
              key={block.instanceId}
              size="small"
              title={<span>{block.baseComponent}</span>}
              extra={
                <Space>
                  <Button type="text" size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMove(index, -1)} />
                  <Button type="text" size="small" icon={<DownOutlined />} disabled={index === sorted.length - 1} onClick={() => handleMove(index, 1)} />
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(index)} />
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleDuplicate(index)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemove(index)} />
                </Space>
              }
            >
              <div style={{ color: "#666", fontSize: 12 }}>
                {block.baseComponent === "Paragraph" && (block.props?.text || "(empty)")}
                {block.baseComponent === "Heading" && `H${block.props?.level ?? 2}: ${block.props?.text || "(empty)"}`}
                {block.baseComponent === "Image" && (block.props?.src ? "Image: " + block.props.src : "(no image)")}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        title={`Edit ${editingBlock?.baseComponent || "block"}`}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingIndex(null); }}
        onOk={handleEditSave}
        okText="Save"
        width={400}
      >
        <Form form={form} layout="vertical">
          {editingBlock && getPropsFields(editingBlock.baseComponent)}
        </Form>
      </Drawer>
    </Card>
  );
}
