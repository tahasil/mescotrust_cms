"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Collapse,
  Select,
  message,
  Spin,
} from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/LatestEvents1";

function normalizeItem(it) {
  return {
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    buttonText: it?.buttonText != null ? String(it.buttonText).trim() : "Read Post",
    buttonLink: it?.buttonLink != null ? String(it.buttonLink).trim() : "/",
  };
}

/**
 * Edit form for LatestEvents1 — same pattern as HomeHero/Subscribe.
 * Loads/saves via /api/theme/LatestEvents1. Section titles + list of news items + theme color keys.
 */
function LatestEvents1EditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel },
  ref
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const items = Array.isArray(data?.latestEvents1Items)
        ? data.latestEvents1Items.map(normalizeItem)
        : [];
      form.setFieldsValue({
        latestEvents1SubTitle: data?.latestEvents1SubTitle != null ? String(data.latestEvents1SubTitle).trim() : "Latest News",
        latestEvents1MainTitle: data?.latestEvents1MainTitle != null ? String(data.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
        latestEvents1Items: items.length ? items : [normalizeItem({}), normalizeItem({})],
        latestEvents1SubTitleColorKey: data?.latestEvents1SubTitleColorKey != null ? String(data.latestEvents1SubTitleColorKey).trim() : "",
        latestEvents1MainTitleColorKey: data?.latestEvents1MainTitleColorKey != null ? String(data.latestEvents1MainTitleColorKey).trim() : "",
        latestEvents1ButtonColorKey: data?.latestEvents1ButtonColorKey != null ? String(data.latestEvents1ButtonColorKey).trim() : "",
        ...getManageSectionInitialValues("latestEvents1", data),
      });
      fetch("/api/theme", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : {}))
        .then((theme) => {
          const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
          const names = [...new Set(customColors.map((c) => c?.name).filter(Boolean))].sort();
          setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set(customColors.map((c) => c?.name).filter(Boolean))].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));

        const items = Array.isArray(data?.latestEvents1Items)
          ? data.latestEvents1Items.map(normalizeItem)
          : [];
        form.setFieldsValue({
          latestEvents1SubTitle: data?.latestEvents1SubTitle != null ? String(data.latestEvents1SubTitle).trim() : "Latest News",
          latestEvents1MainTitle: data?.latestEvents1MainTitle != null ? String(data.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
          latestEvents1Items: items.length ? items : [normalizeItem({}), normalizeItem({})],
          latestEvents1SubTitleColorKey: data?.latestEvents1SubTitleColorKey != null ? String(data.latestEvents1SubTitleColorKey).trim() : "",
          latestEvents1MainTitleColorKey: data?.latestEvents1MainTitleColorKey != null ? String(data.latestEvents1MainTitleColorKey).trim() : "",
          latestEvents1ButtonColorKey: data?.latestEvents1ButtonColorKey != null ? String(data.latestEvents1ButtonColorKey).trim() : "",
          ...getManageSectionInitialValues("latestEvents1", data),
        });
      })
      .catch(() => message.error("Failed to load Latest Events"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.latestEvents1Items ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        latestEvents1SubTitle: values.latestEvents1SubTitle != null ? String(values.latestEvents1SubTitle).trim() : "Latest News",
        latestEvents1MainTitle: values.latestEvents1MainTitle != null ? String(values.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
        latestEvents1Items: items,
        latestEvents1SubTitleColorKey: values.latestEvents1SubTitleColorKey != null ? String(values.latestEvents1SubTitleColorKey).trim() : "",
        latestEvents1MainTitleColorKey: values.latestEvents1MainTitleColorKey != null ? String(values.latestEvents1MainTitleColorKey).trim() : "",
        latestEvents1ButtonColorKey: values.latestEvents1ButtonColorKey != null ? String(values.latestEvents1ButtonColorKey).trim() : "",
        ...getManageSectionPayload("latestEvents1", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Latest Events saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Latest Events"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="latestEvents1" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "content",
            label: "Section headings",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="latestEvents1SubTitle" label="Subtitle">
                    <Input placeholder="e.g. Latest News" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="latestEvents1MainTitle" label="Main title">
                    <Input placeholder="e.g. Stay Informed. Stay Ahead." size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "items",
            label: "News items",
            children: (
              <Form.List name="latestEvents1Items">
                {(fields, { add, remove, move }) => (
                  <>
                    <Collapse
                      accordion
                      size="small"
                      style={{ marginBottom: 12 }}
                      items={fields.map(({ key, name, ...restField }) => ({
                        key: String(name),
                        label: (
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 8, gap: 4 }}>
                            <strong>Item {name + 1}</strong>
                            <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                              <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={name === 0} onClick={() => move(name, name - 1)} title="Move up" />
                              <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={name === fields.length - 1} onClick={() => move(name, name + 1)} title="Move down" />
                              {fields.length > 1 && (
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                              )}
                            </span>
                          </span>
                        ),
                        children: (
                          <Row gutter={[16, 16]}>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "imageUrl"]} label="Image URL">
                                <Input placeholder="/images/news-1.png" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "date"]} label="Date">
                                <Input placeholder="e.g. 02 Feb 2026" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "title"]} label="Title">
                                <Input placeholder="News title" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "description"]} label="Description">
                                <Input.TextArea rows={2} placeholder="Short description" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "buttonText"]} label="Button label">
                                <Input placeholder="Read Post" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item {...restField} name={[name, "buttonLink"]} label="Button link">
                                <Input placeholder="/" size="large" />
                              </Form.Item>
                            </Col>
                          </Row>
                        ),
                      }))}
                    />
                    <Button type="dashed" onClick={() => add(normalizeItem({}))} block icon={<PlusOutlined />} size="small">
                      Add item
                    </Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: "colors",
            label: "Theme colors",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="latestEvents1SubTitleColorKey" label="Subtitle color">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="latestEvents1MainTitleColorKey" label="Main title color">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="latestEvents1ButtonColorKey" label="Read Post button color">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(LatestEvents1EditForm);
