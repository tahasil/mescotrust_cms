"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, Select, Collapse, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

/**
 * Edit form for Footer — used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Otherwise: load/save via /api/theme/footer (components collection).
 */
function FooterEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const componentDataLoadedRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const col1 = Array.isArray(data.footerCol1Links) ? data.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const col2 = Array.isArray(data.footerCol2Links) ? data.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      setInitialData({
        footerLogoUrl: data.footerLogoUrl != null ? String(data.footerLogoUrl).trim() : "",
        footerAddress: data.footerAddress != null ? String(data.footerAddress).trim() : "",
        footerEmail: data.footerEmail != null ? String(data.footerEmail).trim() : "",
        footerPhone: data.footerPhone != null ? String(data.footerPhone).trim() : "",
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerCopyrightText: data.footerCopyrightText != null ? String(data.footerCopyrightText).trim() : "",
        footerBgColorKey: data.footerBgColorKey != null ? String(data.footerBgColorKey).trim() : "",
        footerBackgroundImageUrl: data.footerBackgroundImageUrl != null ? String(data.footerBackgroundImageUrl).trim() : "",
        footerTextColorKey: data.footerTextColorKey != null ? String(data.footerTextColorKey).trim() : "",
        footerCopyrightBarColorKey: data.footerCopyrightBarColorKey != null ? String(data.footerCopyrightBarColorKey).trim() : "",
        ...getManageSectionInitialValues("footer", data),
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
    if (componentDataLoadedRef.current) {
      setLoading(false);
      return;
    }
    componentDataLoadedRef.current = true;
    setInitialData(null);
    Promise.all([
      fetch("/api/theme/footer", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([footer, theme]) => {
        const col1 = Array.isArray(footer?.footerCol1Links) ? footer.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
        const col2 = Array.isArray(footer?.footerCol2Links) ? footer.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
        setInitialData({
          footerLogoUrl: footer?.footerLogoUrl != null ? String(footer.footerLogoUrl).trim() : "",
          footerAddress: footer?.footerAddress != null ? String(footer.footerAddress).trim() : "",
          footerEmail: footer?.footerEmail != null ? String(footer.footerEmail).trim() : "",
          footerPhone: footer?.footerPhone != null ? String(footer.footerPhone).trim() : "",
          footerCol1Links: col1,
          footerCol2Links: col2,
          footerCopyrightText: footer?.footerCopyrightText != null ? String(footer.footerCopyrightText).trim() : "",
          footerBgColorKey: footer?.footerBgColorKey != null ? String(footer.footerBgColorKey).trim() : "",
          footerBackgroundImageUrl: footer?.footerBackgroundImageUrl != null ? String(footer.footerBackgroundImageUrl).trim() : "",
          footerTextColorKey: footer?.footerTextColorKey != null ? String(footer.footerTextColorKey).trim() : "",
          footerCopyrightBarColorKey: footer?.footerCopyrightBarColorKey != null ? String(footer.footerCopyrightBarColorKey).trim() : "",
          ...getManageSectionInitialValues("footer", footer),
        });
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Footer"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        footerBgType: initialData.footerBackgroundImageUrl ? "image" : "color",
      });
    }
  }, [initialData, form]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const col1 = Array.isArray(values.footerCol1Links) ? values.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const col2 = Array.isArray(values.footerCol2Links) ? values.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const bgType = values.footerBgType || "color";
      const payload = {
        footerLogoUrl: String(values.footerLogoUrl ?? "").trim(),
        footerAddress: String(values.footerAddress ?? "").trim(),
        footerEmail: String(values.footerEmail ?? "").trim(),
        footerPhone: String(values.footerPhone ?? "").trim(),
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerCopyrightText: String(values.footerCopyrightText ?? "").trim(),
        ...getManageSectionPayload("footer", values),
        footerBgColorKey: bgType === "color" ? String(values.footerBgColorKey ?? "").trim() : "",
        footerBackgroundImageUrl: bgType === "image" ? String(values.footerBackgroundImageUrl ?? "").trim() : "",
        footerTextColorKey: String(values.footerTextColorKey ?? "").trim(),
        footerCopyrightBarColorKey: String(values.footerCopyrightBarColorKey ?? "").trim(),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Footer saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Footer"))
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
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={[]} style={{ marginBottom: 16 }} items={[
        { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix="footer" form={form} themeColorOptions={themeColorOptions} /> },
        { key: "title", label: "Title & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Footer")} /> },
      ]} />
      <Form.Item name="footerLogoUrl" label="Footer logo image URL">
        <Input placeholder="/images/footer-logo.svg" />
      </Form.Item>
      <Form.Item name="footerAddress" label="Address">
        <Input.TextArea rows={2} placeholder="Full address" />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="footerEmail" label="Email">
            <Input placeholder="email@example.org" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="footerPhone" label="Phone">
            <Input placeholder="Phone numbers" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="footerBgType" label="Footer background" initialValue="color">
        <Select
          options={[
            { value: "color", label: "Color" },
            { value: "image", label: "Image" },
          ]}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.footerBgType !== curr.footerBgType}>
        {({ getFieldValue }) =>
          getFieldValue("footerBgType") === "image" ? (
            <Form.Item name="footerBackgroundImageUrl" label="Background image URL">
              <Input placeholder="/uploads/footer-bg.svg" />
            </Form.Item>
          ) : null
        }
      </Form.Item>
      <Form.Item name="footerCopyrightText" label="Copyright text">
        <Input placeholder="Copyright © 2023 All Rights Reserved." />
      </Form.Item>
      <Form.List name="footerCol1Links">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Column 1 links</div>
            {fields.map(({ key, name, ...rest }) => (
              <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                <Col xs={24} md={9}>
                  <Form.Item {...rest} name={[name, "label"]} label="Link text" rules={[{ required: true }]}>
                    <Input placeholder="Link text" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={9}>
                  <Form.Item {...rest} name={[name, "url"]} label="URL" rules={[{ required: true }]}>
                    <Input placeholder="/path" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} aria-label="Remove" />
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => add({ label: "", url: "" })} block>+ Add link</Button>
          </>
        )}
      </Form.List>
      <Form.List name="footerCol2Links">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Column 2 links</div>
            {fields.map(({ key, name, ...rest }) => (
              <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                <Col xs={24} md={9}>
                  <Form.Item {...rest} name={[name, "label"]} label="Link text" rules={[{ required: true }]}>
                    <Input placeholder="Link text" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={9}>
                  <Form.Item {...rest} name={[name, "url"]} label="URL" rules={[{ required: true }]}>
                    <Input placeholder="/path" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} aria-label="Remove" />
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => add({ label: "", url: "" })} block>+ Add link</Button>
          </>
        )}
      </Form.List>
    </Form>
  );
}

export default forwardRef(FooterEditForm);
