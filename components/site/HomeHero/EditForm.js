"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Select, Switch, Button, Row, Col, Collapse, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

/**
 * Edit form for HomeHero — used in page builder drawer or component edit.
 * Exposes update() via ref for drawer header button.
 */
function HomeHeroEditForm({ onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme.themePalette || {};
        const customColors = Array.isArray(theme.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));

        const slides = Array.isArray(theme?.homeHeroSlides)
          ? theme.homeHeroSlides.map((s) => ({
              bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
              title: s?.title != null ? String(s.title).trim() : "",
              description: s?.description != null ? String(s.description).trim() : "",
              buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              showButton: s?.showButton !== false,
            }))
          : [];
        form.setFieldsValue({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: theme.homeHeroSliderTitleColorKey != null ? String(theme.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: theme.homeHeroSliderDescColorKey != null ? String(theme.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: theme.homeHeroSliderButtonBgColorKey != null ? String(theme.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: theme.homeHeroSliderButtonTextColorKey != null ? String(theme.homeHeroSliderButtonTextColorKey).trim() : "",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawSlides = values.homeHeroSlides ?? [];
      const slides = Array.isArray(rawSlides)
        ? rawSlides.map((s) => ({
            bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
            title: s?.title != null ? String(s.title).trim() : "",
            description: s?.description != null ? String(s.description).trim() : "",
            buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
            buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
            showButton: s?.showButton !== false,
          }))
        : [];
      setSaving(true);
      fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: values.homeHeroSliderTitleColorKey != null ? String(values.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: values.homeHeroSliderDescColorKey != null ? String(values.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: values.homeHeroSliderButtonBgColorKey != null ? String(values.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: values.homeHeroSliderButtonTextColorKey != null ? String(values.homeHeroSliderButtonTextColorKey).trim() : "",
          homeHeroBackgroundContainer: "full",
          homeHeroContentContainer: "pageContainer",
        }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Home Hero saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Home Hero"))
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
    <>
      <Form form={form} layout="vertical">
        <Collapse
          defaultActiveKey={["slider", "colors"]}
          items={[
            {
              key: "slider",
              label: "Manage slides",
              children: (
                <Form.List name="homeHeroSlides">
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
                              <strong>Slide {name + 1}</strong>
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
                            <Row gutter={[0, 12]}>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "bgImageUrl"]} label="Background image URL">
                                  <Input placeholder="e.g. /images/slider.png" size="large" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "title"]} label="Title">
                                  <Input placeholder="Title" size="large" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "description"]} label="Description">
                                  <Input.TextArea rows={2} placeholder="Description" size="large" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "buttonText"]} label="Button label">
                                  <Input placeholder="e.g. Contact Us" size="large" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "buttonLink"]} label="Button link">
                                  <Input placeholder="/contact" size="large" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item {...restField} name={[name, "showButton"]} label="Show button" valuePropName="checked">
                                  <Switch />
                                </Form.Item>
                              </Col>
                            </Row>
                          ),
                        }))}
                      />
                      <Button type="dashed" onClick={() => add({ bgImageUrl: "", title: "", description: "", buttonText: "Contact Us", buttonLink: "/contact", showButton: true })} block icon={<PlusOutlined />} size="small">Add slide</Button>
                    </>
                  )}
                </Form.List>
              ),
            },
            {
              key: "colors",
              label: "Theme colors",
              children: (
                <Row gutter={[16, 12]}>
                  <Col span={24}>
                    <Form.Item name="homeHeroSliderTitleColorKey" label="Slider title color">
                      <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="homeHeroSliderDescColorKey" label="Slider description color">
                      <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="homeHeroSliderButtonBgColorKey" label="Button background">
                      <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="homeHeroSliderButtonTextColorKey" label="Button text color">
                      <Select size="large" options={themeColorOptions} placeholder="From theme" style={{ width: "100%" }} allowClear />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Form>
    </>
  );
}

export default forwardRef(HomeHeroEditForm);
