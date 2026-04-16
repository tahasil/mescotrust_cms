"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, Collapse, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

/**
 * Edit form for Marquee — used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only, not components collection.
 * Exposes update() via ref for drawer header button.
 */
function MarqueeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "";
      const items = Array.isArray(data.marqueeItems)
        ? data.marqueeItems.map((it) => ({
            url: it?.url != null ? String(it.url).trim() : "",
            alt: it?.alt != null ? String(it.alt).trim() : "",
          }))
        : [];
      setInitialData({
        marqueeTitle: title,
        marqueeItems: items,
        marqueeTitleColorKey: data?.marqueeTitleColorKey != null ? String(data.marqueeTitleColorKey).trim() : "",
        ...getManageSectionInitialValues("marquee", data),
      });
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    setInitialData(null);
    Promise.all([
      fetch("/api/theme/marquee", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "Our CSR Partners | Awards & Recognition";
        const items = Array.isArray(data.marqueeItems)
          ? data.marqueeItems.map((it) => ({
              url: it?.url != null ? String(it.url).trim() : "",
              alt: it?.alt != null ? String(it.alt).trim() : "",
            }))
          : [];
        setInitialData({
          marqueeTitle: title,
          marqueeItems: items,
          marqueeTitleColorKey: data?.marqueeTitleColorKey != null ? String(data.marqueeTitleColorKey).trim() : "",
          ...getManageSectionInitialValues("marquee", data),
        });
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Marquee"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const title = values.marqueeTitle != null ? String(values.marqueeTitle).trim() : "";
      const rawItems = values.marqueeItems ?? [];
      const items = Array.isArray(rawItems)
        ? rawItems.map((it) => ({
            url: it?.url != null ? String(it.url).trim() : "",
            alt: it?.alt != null ? String(it.alt).trim() : "",
          }))
        : [];
      const payload = {
        marqueeTitle: title,
        marqueeItems: items,
        marqueeTitleColorKey: values.marqueeTitleColorKey != null ? String(values.marqueeTitleColorKey).trim() : "",
        ...getManageSectionPayload("marquee", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/marquee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Marquee saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Marquee"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData}
        key="marquee-edit-form"
      >
        <Collapse defaultActiveKey={["items"]} style={{ marginBottom: 16 }} items={[
          { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix="marquee" form={form} themeColorOptions={themeColorOptions} /> },
          { key: "title", label: "Title & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Marquee")} /> },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <Form.List name="marqueeItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add item"
                    defaultAddPayload={{ url: "", alt: "" }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={14}>
                          <Form.Item {...restField} name={[name, "url"]} label="Image URL" rules={[{ required: true, message: "Required" }]}>
                            <MediaPickerInput placeholder="/images/partner-1.png" />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, "alt"]} label="Alt text">
                            <Input placeholder="Partner" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
        ]} />
      </Form>
    </>
  );
}

export default forwardRef(MarqueeEditForm);
