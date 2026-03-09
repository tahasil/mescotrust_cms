"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Select, Collapse, message } from "antd";
import { renderSchemaField, enrichSchema } from "@/components/admin/schemaFormUtils";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  NAVBAR_SCHEMA,
  LOGO_LINK_SCHEMA,
  MENU_SCHEMA,
  CUSTOM_BUTTONS_SCHEMA,
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
  const [themePaletteKeyOptions, setThemePaletteKeyOptions] = useState([]);
  const lastLoadedNavItemsRef = useRef(null);
  const themeLoadedOnceRef = useRef(false);
  const isPageBlock = source === "page";

  const THEME_COLOR_KEY_FIELDS = ["headerCtaBgColorKey", "headerCtaTextColorKey", "headerDonateBgColorKey", "headerDonateTextColorKey"];

  useEffect(() => {
    fetch("/api/admin/menus")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setMenusList(Array.isArray(list) ? list : []))
      .catch(() => setMenusList([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock && initialData != null) {
      form.setFieldsValue({ ...initialData, ...getManageSectionInitialValues("header", initialData) });
      setLoading(false);
      return;
    }
    if (themeLoadedOnceRef.current) {
      setLoading(false);
      return;
    }
    themeLoadedOnceRef.current = true;
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((theme) => {
        const flat = theme?.header ? { ...theme.header } : {};
        if (theme?.logoType != null) flat.logoType = theme.logoType;
        if (theme?.logoLightUrl != null) flat.logoLightUrl = theme.logoLightUrl;
        if (theme?.logoImageUrl != null && !flat.logoLightUrl) flat.logoLightUrl = theme.logoImageUrl;
        if (theme?.logoMobileUrl != null) flat.logoMobileUrl = theme.logoMobileUrl;
        if (theme?.logoDarkUrl != null) flat.logoDarkUrl = theme.logoDarkUrl;
        if (theme?.logoTitle != null) flat.logoTitle = theme.logoTitle;
        if (theme?.logoTagline != null) flat.logoTagline = theme.logoTagline;
        if (theme?.headerVolunteerLabel != null) flat.headerVolunteerLabel = theme.headerVolunteerLabel;
        if (theme?.headerVolunteerHref != null) flat.headerVolunteerHref = theme.headerVolunteerHref;
        if (theme?.headerVolunteerIconUrl != null) flat.headerVolunteerIconUrl = theme.headerVolunteerIconUrl;
        if (theme?.headerVolunteerIconUrlMobile != null) flat.headerVolunteerIconUrlMobile = theme.headerVolunteerIconUrlMobile;
        if (theme?.headerDonateLabel != null) flat.headerDonateLabel = theme.headerDonateLabel;
        if (theme?.headerDonateHref != null) flat.headerDonateHref = theme.headerDonateHref;
        if (theme?.headerDonateIconUrl != null) flat.headerDonateIconUrl = theme.headerDonateIconUrl;
        if (theme?.headerDonateIconUrlMobile != null) flat.headerDonateIconUrlMobile = theme.headerDonateIconUrlMobile;
        if (theme?.headerCtaBgColorKey != null) flat.headerCtaBgColorKey = theme.headerCtaBgColorKey;
        if (theme?.headerCtaTextColorKey != null) flat.headerCtaTextColorKey = theme.headerCtaTextColorKey;
        if (theme?.headerDonateBgColorKey != null) flat.headerDonateBgColorKey = theme.headerDonateBgColorKey;
        if (theme?.headerDonateTextColorKey != null) flat.headerDonateTextColorKey = theme.headerDonateTextColorKey;
        if (theme?.menuName != null) flat.menuName = theme.menuName;
        if (theme?.navItems != null) flat.navItems = theme.navItems;
        Object.assign(flat, getManageSectionInitialValues("header", theme));
        flat._sectionBg = theme?._sectionBg ?? "";
        flat._sectionPadding = theme?._sectionPadding ?? "";
        flat._sectionBorderSize = theme?._sectionBorderSize ?? "";
        flat._sectionBorderStyle = theme?._sectionBorderStyle ?? "";
        flat._sectionBorderColor = theme?._sectionBorderColor ?? "";
        flat._sectionShadow = theme?._sectionShadow ?? "";
        form.setFieldsValue(flat);
        const savedNavItems = Array.isArray(theme?.navItems) ? theme.navItems : [];
        lastLoadedNavItemsRef.current = savedNavItems.length ? JSON.parse(JSON.stringify(savedNavItems)) : null;
        if (flat.menuName && savedNavItems.length === 0) {
          fetch(`/api/admin/menus/${encodeURIComponent(flat.menuName)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Menu not found"))))
            .then((menu) => {
              const items = Array.isArray(menu?.items) ? menu.items : [];
              const navItems = menuItemsToNavItems(items);
              form.setFieldsValue({ navItems, menuName: flat.menuName });
              lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
            })
            .catch(() => {});
        }
        const palette = theme?.themePalette && typeof theme.themePalette === "object" ? theme.themePalette : {};
        const opts = Object.entries(palette)
          .filter(([, v]) => v != null && String(v).trim() !== "")
          .map(([k, v]) => ({ label: k, value: String(v).trim() }));
        if (Array.isArray(theme?.colors))
          theme.colors.forEach((c) => {
            if (c?.name && c.value != null) opts.push({ label: c.name, value: String(c.value) });
          });
        setThemeColorOptions(opts);
        // Only custom colors (admin/theme → Custom colors), not palette – dropdown stays in sync with Theme
        const keyOpts = (Array.isArray(theme?.colors) ? theme.colors : [])
          .filter((c) => c?.name && String(c.name).trim() !== "")
          .map((c) => String(c.name).trim())
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
          .map((k) => ({ label: k, value: k }));
        setThemePaletteKeyOptions(keyOpts);
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
      const payload = { ...values, ...getManageSectionPayload("header", values) };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  /** Header Manage Section: only these 6 fields (no Fluid/Box containers). */
  const HEADER_MANAGE_SECTION_KEYS = ["_sectionBg", "_sectionPadding", "_sectionBorderSize", "_sectionBorderStyle", "_sectionBorderColor", "_sectionShadow"];

  const compPropsSchema = Array.isArray(paletteComponent?.propsSchema) ? paletteComponent.propsSchema : [];
  const raw = [
    ...compPropsSchema,
    ...NAVBAR_SCHEMA,
    ...LOGO_LINK_SCHEMA,
    ...MENU_SCHEMA,
    ...CUSTOM_BUTTONS_SCHEMA,
    ...SECTION_SETTINGS_SCHEMA,
  ];
  const rawWithKeyOpts = raw.map((f) =>
    THEME_COLOR_KEY_FIELDS.includes(f.key) ? { ...f, options: themePaletteKeyOptions } : f,
  );
  const schema = enrichSchema("Header", rawWithKeyOpts);
  const byKey = Object.fromEntries((Array.isArray(schema) ? schema : rawWithKeyOpts).map((f) => [f.key, f]));

  const renderField = (field) => renderSchemaField(field, themeColorOptions);

  const headerItems = [
    {
      key: "manage-section",
      label: "Manage Section",
      children: (
        <>
          {HEADER_MANAGE_SECTION_KEYS.map((k) => (byKey[k] ? renderField(byKey[k]) : null)).filter(Boolean)}
        </>
      ),
    },
    {
      key: "title",
      label: "Title & Colors",
      children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Header")} />,
    },
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
  ];

  return (
    <Form form={form} layout="vertical">
      <Collapse accordion defaultActiveKey={[]} items={headerItems} />
    </Form>
  );
}

export default forwardRef(HeaderEditForm);
