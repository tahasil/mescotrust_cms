"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Collapse, Input, InputNumber, Select, Switch, Button, ColorPicker, message, Row, Col } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

/** Convert menu API items to header nav items (flat label/url/hasDropdown/children). */
function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url = typeof item.url === "string" && item.url ? item.url : (item.type === "page" && item.pageSlug ? `/${String(item.pageSlug)}` : "#");
    const childList = Array.isArray(item.children) ? item.children : [];
    const children = menuItemsToNavItems(childList);
    const result = { label: String(item.label ?? ""), url, hasDropdown: children.length > 0 };
    if (children.length > 0) result.children = children;
    return result;
  });
}

/** Theme color dropdown + optional custom color picker (same as PageBuilder). */
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
          options={[
            ...options.map((o) => ({ label: o.label, value: o.value })),
            { label: "Custom…", value: "__custom__" },
          ]}
          allowClear={false}
          style={{ width: "100%" }}
        />
      )}
      {showPicker && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ColorPicker value={value || undefined} onChange={(_, hexStr) => onChange(hexStr)} allowClear size="small" />
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="e.g. #333 or inherit" style={{ flex: 1 }} allowClear />
        </div>
      )}
    </div>
  );
}

/** Keeps navItems (array) in form state without rendering; value is set via loadMenuIntoNav. */
function NavItemsPreserver() {
  return null;
}

/** Responsive grid: 1 col (xs), 2 (sm), 3 (md), 4 (lg). */
const FORM_COL = { xs: 24, sm: 12, md: 8, lg: 6 };
const EMPTY_MENU_LIST = [];

export default function HeaderEditorForm({ initialValues, onSave, saving, menuList = EMPTY_MENU_LIST }) {
  const [form] = Form.useForm();
  const [menus, setMenus] = useState(menuList);
  const [theme, setTheme] = useState(null);

  const themeColorOptions = useMemo(() => {
    const out = [];
    const structured = [
      ["Primary", theme?.primaryColor],
      ["Secondary", theme?.secondaryColor],
      ["Body Background", theme?.bodyBackground],
      ["Section Background", theme?.sectionBackground],
      ["Card Background", theme?.cardBackground],
      ["Header Background", theme?.headerBackground],
      ["Footer Background", theme?.footerBackground],
      ["Heading", theme?.headingColor],
      ["Paragraph", theme?.paragraphColor],
      ["Link", theme?.linkColor],
      ["Hover", theme?.hoverColor],
      ["Muted Text", theme?.mutedTextColor],
      ["Border", theme?.borderColor],
      ["Button", theme?.buttonBackground],
    ];
    structured.forEach(([label, value]) => { if (value) out.push({ label, value }); });
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
    if (menuList.length > 0) setMenus(menuList);
    else {
      fetch("/api/admin/menus")
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setMenus(Array.isArray(list) ? list : []))
        .catch(() => {});
    }
  }, [menuList]);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length) form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const loadMenuIntoNav = useCallback((menuName) => {
    if (!menuName) return;
    fetch(`/api/admin/menus/${encodeURIComponent(menuName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((menu) => {
        if (!menu?.items?.length) { message.info("Menu has no items"); return; }
        const navItems = menuItemsToNavItems(menu.items);
        form.setFieldValue("navItems", navItems);
        form.setFieldValue("menuName", menuName);
        message.success(`Loaded "${menuName}" (${navItems.length} items)`);
      })
      .catch(() => message.error("Could not load menu"));
  }, [form]);

  return (
    <Form form={form} layout="vertical" onFinish={(v) => onSave(v)} initialValues={initialValues}>
      <Collapse
        accordion
        defaultActiveKey={["logo", "menu", "navbar", "buttons"]}
        items={[
          {
            key: "logo",
            label: "Logo and link",
            children: (
              <Row gutter={[16, 16]}>
                <Col {...FORM_COL}><Form.Item name="logoImage" label="Logo image URL"><Input placeholder="https://..." /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoTitle" label="Logo title"><Input /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoTagline" label="Logo tagline"><Input /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoUrl" label="Logo link URL"><Input placeholder="https://..." /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoColor" label="Logo text color"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoFontSize" label="Logo font size (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="taglineFontSize" label="Tagline font size (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageWidth" label="Logo width (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageHeight" label="Logo height (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageWidthDesktop" label="Logo width – desktop (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageHeightDesktop" label="Logo height – desktop (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageWidthTablet" label="Logo width – tablet (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageHeightTablet" label="Logo height – tablet (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageWidthMobile" label="Logo width – mobile (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="logoImageHeightMobile" label="Logo height – mobile (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}>
                  <Form.Item name="sectionsOrder" label="Section order">
                    <Select
                      options={[
                        { value: "logo,nav,buttons", label: "Logo → Nav → Buttons" },
                        { value: "logo,buttons,nav", label: "Logo → Buttons → Nav" },
                        { value: "nav,logo,buttons", label: "Nav → Logo → Buttons" },
                        { value: "nav,buttons,logo", label: "Nav → Buttons → Logo" },
                        { value: "buttons,logo,nav", label: "Buttons → Logo → Nav" },
                        { value: "buttons,nav,logo", label: "Buttons → Nav → Logo" },
                      ]}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "menu",
            label: "Menu",
            children: (
              <Row gutter={[16, 16]}>
                <Col {...FORM_COL}>
                  <Form.Item label="Select menu" name="menuName">
                    <Select
                      placeholder="Choose a menu…"
                      allowClear
                      options={menus.map((m) => ({ value: m.name, label: m.name }))}
                      onChange={(name) => { if (name) loadMenuIntoNav(name); }}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="menuPosition" label="Menu position (desktop)">
                    <Select options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}><Form.Item name="navColor" label="Nav link color"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="navFontSize" label="Nav font size (px)"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                <Col {...FORM_COL}>
                  <Form.Item name="navFontWeight" label="Nav font weight">
                    <Select options={[{ value: "400", label: "400 (Normal)" }, { value: "500", label: "500 (Medium)" }, { value: "600", label: "600 (Semi-bold)" }, { value: "700", label: "700 (Bold)" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}><Form.Item name="navHoverColor" label="Nav hover color"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="navItemBackground" label="Nav item background"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Col {...FORM_COL}><Form.Item name="navItemHoverBackground" label="Nav item hover background"><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                <Form.Item name="navItems" noStyle><NavItemsPreserver /></Form.Item>
              </Row>
            ),
          },
          {
            key: "navbar",
            label: "Navbar (Bootstrap)",
            children: (
              <Row gutter={[16, 16]}>
                <Col {...FORM_COL}>
                  <Form.Item name="navbarExpand" label="Expand (responsive breakpoint)">
                    <Select
                      options={[
                        { value: "lg", label: "lg (collapse below 992px)" },
                        { value: "md", label: "md (collapse below 768px)" },
                        { value: "sm", label: "sm (collapse below 576px)" },
                        { value: "xl", label: "xl (collapse below 1200px)" },
                        { value: "xxl", label: "xxl (collapse below 1400px)" },
                        { value: "false", label: "Never expand" },
                      ]}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="navbarFixed" label="Fixed position">
                    <Select options={[{ value: "", label: "None" }, { value: "top", label: "Fixed top" }, { value: "bottom", label: "Fixed bottom" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="navbarSticky" label="Sticky position">
                    <Select options={[{ value: "", label: "None" }, { value: "top", label: "Sticky top" }, { value: "bottom", label: "Sticky bottom" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}><Form.Item name="collapseOnSelect" label="Collapse when link selected" valuePropName="checked"><Switch /></Form.Item></Col>
                <Col {...FORM_COL}>
                  <Form.Item name="navbarMobileMenu" label="Mobile menu style">
                    <Select options={[{ value: "collapse", label: "Collapse" }, { value: "offcanvas", label: "Offcanvas (drawer)" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="navbarOffcanvasPlacement" label="Offcanvas slide from">
                    <Select options={[{ value: "end", label: "Right" }, { value: "start", label: "Left" }]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "buttons",
            label: "Custom buttons",
            children: (
              <Form.List name="actionButtons">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} style={{ marginBottom: 16, padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Button #{name + 1}</span>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                        </div>
                        <Row gutter={[16, 16]}>
                          <Col {...FORM_COL}><Form.Item name={[name, "label"]} label="Label" style={{ marginBottom: 8 }}><Input /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "url"]} label="URL" style={{ marginBottom: 8 }}><Input placeholder="https://..." /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "image"]} label="Icon image URL" style={{ marginBottom: 8 }}><Input placeholder="https://..." /></Form.Item></Col>
                          <Col {...FORM_COL}>
                            <Form.Item name={[name, "imagePosition"]} label="Icon placement" style={{ marginBottom: 8 }}>
                              <Select options={[{ value: "left", label: "Left of text" }, { value: "right", label: "Right of text" }]} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "imageHeight"]} label="Icon height (px)" style={{ marginBottom: 8 }}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "fontSize"]} label="Font size (px)" style={{ marginBottom: 8 }}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                          <Col {...FORM_COL}>
                            <Form.Item name={[name, "fontWeight"]} label="Font weight" style={{ marginBottom: 8 }}>
                              <Select options={[{ value: "400", label: "400" }, { value: "500", label: "500" }, { value: "600", label: "600" }, { value: "700", label: "700" }]} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "letterSpacing"]} label="Letter spacing" style={{ marginBottom: 8 }}><Input placeholder="0.5px or 0.02em" /></Form.Item></Col>
                          <Col {...FORM_COL}>
                            <Form.Item name={[name, "textTransform"]} label="Text transform" style={{ marginBottom: 8 }}>
                              <Select options={[{ value: "none", label: "None" }, { value: "uppercase", label: "Uppercase" }, { value: "lowercase", label: "Lowercase" }, { value: "capitalize", label: "Capitalize" }]} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "background"]} label="Background color" style={{ marginBottom: 8 }}><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "color"]} label="Text color" style={{ marginBottom: 8 }}><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "borderColor"]} label="Border color" style={{ marginBottom: 8 }}><ThemeColorField themeColorOptions={themeColorOptions} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "borderRadius"]} label="Border radius (px)" style={{ marginBottom: 8 }}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "paddingY"]} label="Padding top/bottom (px)" style={{ marginBottom: 8 }}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "paddingX"]} label="Padding left/right (px)" style={{ marginBottom: 8 }}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
                          <Col {...FORM_COL}><Form.Item name={[name, "boxShadow"]} label="Box shadow (CSS)" style={{ marginBottom: 8 }}><Input placeholder="0 2px 4px rgba(0,0,0,0.1)" /></Form.Item></Col>
                        </Row>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add({ label: "Button", url: "#", image: "", imagePosition: "left" })} block icon={<PlusOutlined />}>Add button</Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: "section-settings",
            label: "Section Settings",
            children: (
              <Row gutter={[16, 16]}>
                <Col {...FORM_COL}>
                  <Form.Item name="_containerType" label="Container">
                    <Select
                      options={[
                        { value: "container", label: "Container (max-width)" },
                        { value: "container-fluid", label: "Container fluid (full width)" },
                      ]}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionBg" label="Background">
                    <ThemeColorField themeColorOptions={themeColorOptions} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionPadding" label="Padding (e.g. 2rem 1rem)">
                    <Input placeholder="2rem 1rem" />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionBorderSize" label="Border size (e.g. 1px 2px 3px 4px)">
                    <Input placeholder="0px 0px 0px 0px" />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionBorderStyle" label="Border type">
                    <Select
                      options={[
                        { value: "solid", label: "Solid" },
                        { value: "dashed", label: "Dashed" },
                        { value: "dotted", label: "Dotted" },
                        { value: "double", label: "Double" },
                        { value: "groove", label: "Groove" },
                        { value: "ridge", label: "Ridge" },
                        { value: "inset", label: "Inset" },
                        { value: "outset", label: "Outset" },
                        { value: "none", label: "None" },
                      ]}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionBorderColor" label="Border color">
                    <ThemeColorField themeColorOptions={themeColorOptions} />
                  </Form.Item>
                </Col>
                <Col {...FORM_COL}>
                  <Form.Item name="_sectionShadow" label="Shadow (e.g. 0 2px 8px rgba(0,0,0,0.08))">
                    <Input placeholder="0 2px 8px rgba(0,0,0,0.08)" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={saving}>Save header</Button>
      </div>
    </Form>
  );
}
