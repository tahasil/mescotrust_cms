"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Select, Collapse, message } from "antd";
import { renderSchemaField, enrichSchema } from "@/components/admin/schemaFormUtils";
import {
  NAVBAR_SCHEMA,
  LOGO_RESPONSIVE_SCHEMA,
  MENU_SCHEMA,
  HEADER_FIELD_GROUPS,
  SECTION_SETTINGS_SCHEMA,
} from "./headerDrawerSchemas";

/** Pure helper: convert API menu items to header nav items (no server imports). */
function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url =
      typeof item.url === "string" && item.url
        ? item.url
        : item.type === "page" && item.pageSlug
          ? `/${String(item.pageSlug)}`
          : "#";
    const childList = Array.isArray(item.children) ? item.children : [];
    const children = menuItemsToNavItems(childList);
    const result = {
      label: String(item.label ?? ""),
      url,
      hasDropdown: children.length > 0,
      openInNewTab: !!item.openInNewTab,
    };
    if (children.length > 0) result.children = children;
    return result;
  });
}

/**
 * Header edit form – drawer lives in component; PageBuilder only calls this.
 * source="page" (or block in layout): save via onSaveToPage → pages/components layout.
 * Otherwise: load/save via /api/theme/header → components collection.
 */
function HeaderEditForm(
  {
    source,
    initialData,
    onSaveToPage,
    onSuccess,
    onCancel,
    paletteComponent = null,
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menusList, setMenusList] = useState([]);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const lastLoadedNavItemsRef = useRef(null);
  const isPageBlock = source === "page";

  useEffect(() => {
    fetch("/api/admin/menus")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setMenusList(Array.isArray(list) ? list : []))
      .catch(() => setMenusList([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock && initialData != null) {
      form.setFieldsValue(initialData);
      setLoading(false);
      return;
    }
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((theme) => {
        const flat = theme?.header ? { ...theme.header } : {};
        if (theme?.logoType != null) flat.logoType = theme.logoType;
        if (theme?.logoLightUrl != null) flat.logoImage = theme.logoLightUrl;
        if (theme?.logoTitle != null) flat.logoTitle = theme.logoTitle;
        if (theme?.logoTagline != null) flat.logoTagline = theme.logoTagline;
        if (theme?.headerVolunteerLabel != null) flat.headerVolunteerLabel = theme.headerVolunteerLabel;
        if (theme?.headerDonateLabel != null) flat.headerDonateLabel = theme.headerDonateLabel;
        if (theme?.navItems != null) flat.navItems = theme.navItems;
        form.setFieldsValue(flat);
        const palette = theme?.themePalette || {};
        const opts = Object.entries(palette)
          .filter(([, v]) => v != null && String(v).trim() !== "")
          .map(([k, v]) => ({ label: k, value: String(v).trim() }));
        if (Array.isArray(theme?.colors))
          theme.colors.forEach((c) => {
            if (c?.name && c.value != null) opts.push({ label: c.name, value: String(c.value) });
          });
        setThemeColorOptions(opts);
      })
      .catch(() => message.error("Failed to load header"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialData]);

  const loadMenuIntoNavItems = (menuName) => {
    if (!menuName || !menuName.trim()) return;
    const name = String(menuName).trim();
    fetch(`/api/admin/menus/${encodeURIComponent(name)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Menu not found" : "Failed to load menu");
        return r.json();
      })
      .then((menu) => {
        const items = Array.isArray(menu?.items) ? menu.items : [];
        const navItems = menuItemsToNavItems(items);
        form.setFieldsValue({ navItems, menuName: name });
        lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
        message.success(`Loaded "${name}" (${navItems.length} item(s)). Click Apply to save.`);
      })
      .catch((e) => message.error(e?.message || "Could not load menu"));
  };

  const handleUpdate = () => {
    form.validateFields().then(() => {
      let values = form.getFieldsValue(true);
      if (Array.isArray(values?.navItems)) {
        const loaded = lastLoadedNavItemsRef.current;
        const formItems = values.navItems;
        values = {
          ...values,
          navItems:
            Array.isArray(loaded) && loaded.length === formItems.length
              ? formItems.map((item, i) => ({
                  label: item?.label ?? loaded[i]?.label ?? "",
                  url: item?.url ?? loaded[i]?.url ?? "#",
                  hasDropdown: item?.hasDropdown ?? loaded[i]?.hasDropdown ?? false,
                  children: Array.isArray(loaded[i]?.children) ? loaded[i].children : Array.isArray(item?.children) ? item.children : [],
                }))
              : formItems.map((item) => ({
                  ...item,
                  children: Array.isArray(item?.children) ? item.children : [],
                })),
        };
      }
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(values);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
        .then((r) => { if (!r.ok) return r.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Header saved"); onSuccess?.(); })
        .catch((e) => message.error(e?.error || "Failed to save header"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Loading…</div>;
  }

  const compPropsSchema = Array.isArray(paletteComponent?.propsSchema) ? paletteComponent.propsSchema : [];
  const raw = [
    ...compPropsSchema,
    ...NAVBAR_SCHEMA,
    ...LOGO_RESPONSIVE_SCHEMA,
    ...MENU_SCHEMA,
  ];
  const schema = enrichSchema("Header", raw);
  const byKey = Object.fromEntries((Array.isArray(schema) ? schema : raw).map((f) => [f.key, f]));

  const renderField = (field) => renderSchemaField(field, themeColorOptions);

  const headerItems = [
    ...HEADER_FIELD_GROUPS.map((grp) => ({
      key: grp.label.replace(/\s+/g, "-").toLowerCase().replace(/&/g, "and"),
      label: grp.label,
      children: (
        <>
          {grp.label === "Menu" && (
            <Form.Item key="select-menu" label="Select menu" name="menuName">
              <Select
                placeholder="Choose a menu…"
                allowClear
                options={menusList.map((m) => ({ value: m.name, label: m.name }))}
                onChange={(name) => name && loadMenuIntoNavItems(name)}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
          {grp.keys.map((k) => (byKey[k] ? renderField(byKey[k]) : null)).filter(Boolean)}
        </>
      ),
    })),
    {
      key: "section-settings",
      label: "Section Settings",
      children: <>{SECTION_SETTINGS_SCHEMA.map((f) => renderField(f))}</>,
    },
  ];

  return (
    <Form form={form} layout="vertical">
      <Collapse accordion defaultActiveKey={[]} items={headerItems} />
    </Form>
  );
}

export default forwardRef(HeaderEditForm);
