"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Radio, Switch, Select, message } from "antd";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DynamicRenderer } from "@/components/renderer/DynamicRenderer";

type PageWithContent = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isHomePage: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  content: { contentJSON: string } | null;
};

type Section = { id: string; component: string; props?: Record<string, unknown>; order?: number };
type LayoutData = { sections: Section[]; modals: Section[]; overlays: Section[] };

type ComponentOption = { id: string; name: string; slug: string; category: string; defaultPropsJSON: string | null };

export function PageEditor({ page }: { page: PageWithContent }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [content, setContent] = useState<LayoutData>({ sections: [], modals: [], overlays: [] });
  const [components, setComponents] = useState<ComponentOption[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(page.content?.contentJSON || "{}");
      setContent({
        sections: parsed.sections ?? [],
        modals: parsed.modals ?? [],
        overlays: parsed.overlays ?? [],
      });
    } catch {
      setContent({ sections: [], modals: [], overlays: [] });
    }
  }, [page.content?.contentJSON]);

  useEffect(() => {
    fetch("/api/admin/components", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setComponents(Array.isArray(data) ? data.filter((c: { isActive: boolean }) => c.isActive) : []))
      .catch(() => {});
  }, []);

  const onFinish = async (values: {
    title: string;
    slug: string;
    status: string;
    isHomePage: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          seoTitle: values.seoTitle || null,
          seoDescription: values.seoDescription || null,
          contentJSON: JSON.stringify(content),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details ? data.details.join("; ") : data.error || "Failed to save");
      message.success("Saved");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = content.sections.findIndex((s) => s.id === active.id);
    const newIndex = content.sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(content.sections, oldIndex, newIndex);
    setContent((prev) => ({
      ...prev,
      sections: reordered.map((s, i) => ({ ...s, order: i })),
    }));
  };

  const addBlock = (componentName: string) => {
    const comp = components.find((c) => c.name === componentName);
    let props: Record<string, unknown> = {};
    if (comp?.defaultPropsJSON) {
      try {
        props = JSON.parse(comp.defaultPropsJSON);
      } catch {}
    }
    const section: Section = {
      id: crypto.randomUUID(),
      component: componentName,
      props,
      order: content.sections.length,
    };
    setContent((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
  };

  const removeBlock = (id: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  const updateBlockProps = (id: string, props: Record<string, unknown>) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, props } : s)),
    }));
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/admin/pages">Pages</Link>
        <span>/</span>
        <h2 className="text-lg font-medium">{page.title}</h2>
      </div>
      <Card className="max-w-2xl">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Radio.Group>
              <Radio value="draft">Draft</Radio>
              <Radio value="published">Published</Radio>
              <Radio value="dropped">Dropped</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Home page" name="isHomePage" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="SEO Title" name="seoTitle">
            <Input />
          </Form.Item>
          <Form.Item label="SEO Description" name="seoDescription">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card className="mt-4 max-w-2xl" title="Page builder">
        <div className="mb-4 flex items-center gap-2">
          <Select
            placeholder="Add block"
            style={{ width: 200 }}
            options={components.map((c) => ({ label: `${c.name} (${c.category})`, value: c.name }))}
            onSelect={addBlock}
            allowClear={false}
          />
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={content.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {content.sections.map((s) => (
                <SortableBlockRow
                  key={s.id}
                  section={s}
                  onRemove={() => removeBlock(s.id)}
                  onUpdateProps={(props) => updateBlockProps(s.id, props)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="mt-4 rounded border bg-white p-4">
          <p className="mb-2 text-sm font-medium text-gray-600">Live preview</p>
          <div className="min-h-[120px] rounded border border-dashed bg-gray-50/50 p-4">
            <DynamicRendererPreview content={content} />
          </div>
        </div>
      </Card>
      <RevisionsList pageId={page.id} onRestore={(contentJSON) => {
        try {
          const parsed = JSON.parse(contentJSON);
          setContent({
            sections: parsed.sections ?? [],
            modals: parsed.modals ?? [],
            overlays: parsed.overlays ?? [],
          });
        } catch {}
      }} />
    </div>
  );
}

function SortableBlockRow({
  section,
  onRemove,
  onUpdateProps,
}: {
  section: Section;
  onRemove: () => void;
  onUpdateProps: (props: Record<string, unknown>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editing, setEditing] = useState(false);
  const props = section.props ?? {};
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded border bg-gray-50 p-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <span {...attributes} {...listeners} className="cursor-grab touch-none pr-2 text-gray-400 hover:text-gray-600">
        ⋮⋮
      </span>
      <span className="flex-1 font-medium">{section.component}</span>
      <Button size="small" onClick={() => setEditing(true)}>Edit</Button>
      <Button size="small" danger onClick={onRemove}>Remove</Button>
      {editing && (
        <BlockPropsForm
          component={section.component}
          props={props}
          onSave={(p) => {
            onUpdateProps(p);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function DynamicRendererPreview({ content }: { content: LayoutData }) {
  return <DynamicRenderer contentJSON={JSON.stringify(content)} />;
}

function RevisionsList({ pageId, onRestore }: { pageId: string; onRestore: (contentJSON: string) => void }) {
  const [revisions, setRevisions] = useState<{ id: string; version: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch(`/api/admin/pages/${pageId}/revisions`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setRevisions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [pageId]);
  const handleRestore = async (revisionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/revisions/${revisionId}/restore`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.contentJSON) onRestore(data.contentJSON);
      message.success("Restored");
    } catch {
      message.error("Restore failed");
    } finally {
      setLoading(false);
    }
  };
  if (revisions.length === 0) return null;
  return (
    <Card className="mt-4 max-w-2xl" title="Revisions">
      <ul className="space-y-2">
        {revisions.slice(0, 10).map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded border p-2">
            <span>Version {r.version} · {new Date(r.createdAt).toLocaleString()}</span>
            <Button size="small" onClick={() => handleRestore(r.id)} disabled={loading}>Restore</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BlockPropsForm({
  component,
  props,
  onSave,
  onCancel,
}: {
  component: string;
  props: Record<string, unknown>;
  onSave: (p: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(props);
  }, [props, form]);
  return (
    <Card size="small" className="mt-2">
      <Form form={form} layout="vertical" onFinish={(v) => onSave(v)}>
        {Object.keys(props).map((key) => (
          <Form.Item key={key} name={key} label={key}>
            <Input />
          </Form.Item>
        ))}
        <Form.Item>
          <Button size="small" type="primary" htmlType="submit">Save</Button>
          <Button size="small" onClick={onCancel} className="ml-2">Cancel</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
