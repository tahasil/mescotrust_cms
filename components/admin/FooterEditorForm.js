"use client";

import { useState, useEffect, useMemo } from "react";
import { Form, Collapse, Input, InputNumber, Button, ColorPicker, Row, Col, Select } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const FORM_COL = { xs: 24, sm: 12, md: 8, lg: 6 };

function ThemeColorField({ value, onChange, themeColorOptions }) {
  const options = themeColorOptions || [];
  const matched = options.find((o) => o.value && String(o.value).toLowerCase() === String(value || "").toLowerCase());
  const isCustom = !matched && (value === undefined || value === null || value === "");
  const selectValue = matched ? matched.value : "__custom__";
  const showPicker = !matched || selectValue === "__custom__";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.length > 0 && (
        <Select
          value={matched ? matched.value : "__custom__"}
          onChange={(v) => { if (v !== "__custom__") onChange(v); }}
          options={[...options.map((o) => ({ label: o.label, value: o.value })), { label: "Custom…", value: "__custom__" }]}
          style={{ width: "100%" }}
        />
      )}
      {showPicker && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ColorPicker value={value || undefined} onChange={(_, hexStr) => onChange(hexStr)} allowClear size="small" />
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="e.g. #1a1a1a" style={{ flex: 1 }} allowClear />
        </div>
      )}
    </div>
  );
}

const DEFAULT_FOOTER_PROPS = {
  logoTitle: "MESCO",
  logoTagline: "A TRUST SINCE 1968",
  logoUrl: "/",
  logoImage: "",
  address: "",
  email: "",
  phone: "",
  columns: [
    { title: "Programmes", links: [{ label: "Educational Support Programmes", url: "#" }, { label: "Medical Aid", url: "#" }, { label: "Clinics & Dispensaries", url: "#" }] },
    { title: "", links: [{ label: "Relief of Poverty", url: "#" }, { label: "RC Mahim Mun. School Adoption", url: "#" }, { label: "Old Newspaper Units", url: "#" }] },
  ],
  socialLinks: [
    { platform: "facebook", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "twitter", url: "#" },
    { platform: "linkedin", url: "#" },
  ],
  copyrightText: "Copyright © 2023 All Rights Reserved.",
  backgroundColor: "#1a1a1a",
  textColor: "#ccc",
  linkColor: "#fff",
  copyrightBarColor: "#c0392b",
  paddingY: 48,
  paddingX: 24,
};

export default function FooterEditorForm({ initialValues, onSave, saving }) {
  const [form] = Form.useForm();
  const [theme, setTheme] = useState(null);

  const themeColorOptions = useMemo(() => {
    const out = [];
    if (theme?.footerBackground) out.push({ label: "Footer (theme)", value: theme.footerBackground });
    if (theme?.primaryColor) out.push({ label: "Primary", value: theme.primaryColor });
    if (theme?.secondaryColor) out.push({ label: "Secondary", value: theme.secondaryColor });
    (theme?.colors || []).filter((c) => c?.name && c?.value).forEach((c) => out.push({ label: c.name, value: c.value }));
    return out;
  }, [theme]);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setTheme(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const vals = initialValues && Object.keys(initialValues).length
      ? { ...DEFAULT_FOOTER_PROPS, ...initialValues }
      : DEFAULT_FOOTER_PROPS;
    if (vals.columns && !Array.isArray(vals.columns)) vals.columns = [];
    form.setFieldsValue(vals);
  }, [initialValues, form]);

  return (
    <Form form={form} layout="vertical" onFinish={(v) => onSave(v)} initialValues={DEFAULT_FOOTER_PROPS}>
      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: "logo",
            label: "Logo",
            children: (
              <Row gutter={[16, 16]}>
                <Col {...FORM_COL}><Form.Item name="logoImage" label="Logo image URL"><Input placeholder="https://..." /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoTitle" label="Logo title"><Input /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoTagline" label="Logo tagline"><Input /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoUrl" label="Logo link URL"><Input placeholder="/" /></Form.Item></Col>
              </Row>
            ),
          },
          {
            key: "contact",
            label: "Address & contact",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="address" label="Address (multi-line supported)">
                    <Input.TextArea rows={4} placeholder="1 & 2, Plot No 423, Landmark Building&#10;Next to Johnson & Johnson, Near Saraswati Mandir School&#10;Senapati Bapat Marg, Mahim(W), Mumbai - 400016." />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}><Form.Item name="email" label="Email"><Input placeholder="mescotrust@mescotrust.org" /></Form.Item></Col>
                <Col span={24}>
                  <Form.Item name="phone" label="Phone numbers (one per line or comma-separated)">
                    <Input.TextArea rows={4} placeholder="(+9122) 24441442 / (+9122) 24448637&#10;022-24466218 022-24440006&#10;022-24466241/2&#10;022-49731441 022-49670550" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "columns",
            label: "Link columns (programmes)",
            children: (
              <Form.List name="columns">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} style={{ marginBottom: 24, padding: 16, background: "#fafafa", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Column {name + 1}</span>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                        </div>
                        <Form.Item name={[name, "title"]} label="Column title (optional)" style={{ marginBottom: 12 }}>
                          <Input placeholder="e.g. Programmes" />
                        </Form.Item>
                        <Form.List name={[name, "links"]}>
                          {(linkFields, { add: addLink, remove: removeLink }) => (
                            <>
                              {linkFields.map(({ key: lk, name: linkName }) => (
                                <div key={lk} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                  <Form.Item name={[name, "links", linkName, "label"]} noStyle><Input placeholder="Link label" style={{ flex: 1 }} /></Form.Item>
                                  <Form.Item name={[name, "links", linkName, "url"]} noStyle><Input placeholder="URL" style={{ width: 180 }} /></Form.Item>
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeLink(linkName)} />
                                </div>
                              ))}
                              <Button type="dashed" size="small" onClick={() => addLink({ label: "", url: "#" })} icon={<PlusOutlined />}>Add link</Button>
                            </>
                          )}
                        </Form.List>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add({ title: "", links: [{ label: "", url: "#" }] })} block icon={<PlusOutlined />}>Add column</Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: "social",
            label: "Social links",
            children: (
              <Form.List name="socialLinks">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <Form.Item name={[name, "platform"]} style={{ marginBottom: 0, minWidth: 120 }}>
                          <Input placeholder="facebook, twitter, instagram, linkedin, youtube" />
                        </Form.Item>
                        <Form.Item name={[name, "url"]} style={{ marginBottom: 0, flex: 1 }}><Input placeholder="https://..." /></Form.Item>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </div>
                    ))}
                    <Button type="dashed" size="small" onClick={() => add({ platform: "", url: "#" })} icon={<PlusOutlined />}>Add social link</Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: "colors",
            label: "Colors & copyright",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="copyrightText" label="Copyright text (bottom bar)">
                    <Input placeholder="Copyright © 2023 All Rights Reserved." />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}><Form.Item name="backgroundColor" label="Main background"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="textColor" label="Text color"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="linkColor" label="Link color"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="copyrightBarColor" label="Copyright bar background (red-orange strip)"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="paddingY" label="Vertical padding (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="paddingX" label="Horizontal padding (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
              </Row>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={saving}>Save footer</Button>
      </div>
    </Form>
  );
}

export { DEFAULT_FOOTER_PROPS };
