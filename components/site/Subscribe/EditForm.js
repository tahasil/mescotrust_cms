"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, Select, message, Spin } from "antd";

/**
 * Edit form for Subscribe — used in component edit page or page builder drawer.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Theme colors: same pattern as HomeHero — Select from theme palette.
 */
function SubscribeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onDataLoad }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    const normalize = (data) => ({
      subscribeSubtitle: data?.subscribeSubtitle != null ? String(data.subscribeSubtitle).trim() : "",
      subscribeTitle: data?.subscribeTitle != null ? String(data.subscribeTitle).trim() : "",
      subscribePlaceholder: data?.subscribePlaceholder != null ? String(data.subscribePlaceholder).trim() : "",
      subscribeButtonText: data?.subscribeButtonText != null ? String(data.subscribeButtonText).trim() : "",
      subscribeBgUrl: data?.subscribeBgUrl != null ? String(data.subscribeBgUrl).trim() : "",
      subscribeSubtitleColorKey: data?.subscribeSubtitleColorKey != null ? String(data.subscribeSubtitleColorKey).trim() : "",
      subscribeTitleColorKey: data?.subscribeTitleColorKey != null ? String(data.subscribeTitleColorKey).trim() : "",
      subscribeButtonBgColorKey: data?.subscribeButtonBgColorKey != null ? String(data.subscribeButtonBgColorKey).trim() : "",
      subscribeButtonTextColorKey: data?.subscribeButtonTextColorKey != null ? String(data.subscribeButtonTextColorKey).trim() : "",
    });

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const normalized = normalize(data);
      setInitialData(normalized);
      onDataLoad?.(normalized);
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
      return;
    }

    setInitialData(null);
    Promise.all([
      fetch("/api/theme/subscribe", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const normalized = normalize(data);
        setInitialData(normalized);
        onDataLoad?.(normalized);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Subscribe"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  useEffect(() => {
    if (initialData) form.setFieldsValue(initialData);
  }, [initialData, form]);

  const handleUpdate = () => {
    return form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        subscribeSubtitle: String(values.subscribeSubtitle ?? "").trim(),
        subscribeTitle: String(values.subscribeTitle ?? "").trim(),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        subscribeBgUrl: String(values.subscribeBgUrl ?? "").trim(),
        subscribeSubtitleColorKey: String(values.subscribeSubtitleColorKey ?? "").trim(),
        subscribeTitleColorKey: String(values.subscribeTitleColorKey ?? "").trim(),
        subscribeButtonBgColorKey: String(values.subscribeButtonBgColorKey ?? "").trim(),
        subscribeButtonTextColorKey: String(values.subscribeButtonTextColorKey ?? "").trim(),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.(payload);
        return;
      }
      setSaving(true);
      return fetch("/api/theme/subscribe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d?.error || d));
          return res.json();
        })
        .then((savedTheme) => {
          message.success("Subscribe saved");
          onSuccess?.(savedTheme || payload);
        })
        .catch((err) => {
          message.error(err?.error || "Failed to save Subscribe");
          throw err;
        })
        .finally(() => setSaving(false));
    });
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
    <Form form={form} layout="vertical" initialValues={initialData} key="subscribe-edit-form">
      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="subscribeSubtitle" label="Subtitle">
                    <Input placeholder="e.g. Latest News" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeTitle" label="Title">
                    <Input placeholder="e.g. To get weekly updates" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribePlaceholder" label="Email placeholder">
                    <Input placeholder="e.g. Enter email address" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeButtonText" label="Button text">
                    <Input placeholder="e.g. Subscribe" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeBgUrl" label="Background image URL">
                    <Input placeholder="/uploads/..." size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "colors",
            label: "Theme colors",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="subscribeSubtitleColorKey" label="Subtitle color">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeTitleColorKey" label="Title color">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeButtonBgColorKey" label="Button background">
                    <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeButtonTextColorKey" label="Button text color">
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

export default forwardRef(SubscribeEditForm);
