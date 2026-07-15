"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Select, Collapse, Switch, InputNumber, message } from "antd";
import {
  renderSchemaField,
  enrichSchema,
  ThemeColorInput,
} from "@/components/admin/schemaFormUtils";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  NAVBAR_SCHEMA,
  LOGO_LINK_SCHEMA,
  MENU_SCHEMA,
  CUSTOM_BUTTONS_SCHEMA,
  ANNOUNCEMENT_BAR_SCHEMA,
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

function normalizeAnnouncementItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      text: it?.text != null ? String(it.text).trim() : "",
      url: it?.url != null ? String(it.url).trim() : "",
      target:
        String(it?.target || "").trim() === "_blank" ? "_blank" : "_self",
    }))
    .filter((it) => it.text);
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
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menusList, setMenusList] = useState([]);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [themePaletteKeyOptions, setThemePaletteKeyOptions] = useState([]);
  const lastLoadedNavItemsRef = useRef(null);
  const themeLoadedOnceRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

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
    fetch("/api/theme", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((theme) => {
        const flat = theme?.header ? { ...theme.header } : {};
        if (theme?.logoType != null) flat.logoType = theme.logoType;
        if (theme?.logoLightUrl != null) flat.logoLightUrl = theme.logoLightUrl;
        if (theme?.logoImageUrl != null && !flat.logoLightUrl) flat.logoLightUrl = theme.logoImageUrl;
        if (theme?.logoMobileUrl != null) flat.logoMobileUrl = theme.logoMobileUrl;
        if (theme?.logoDarkUrl != null) flat.logoDarkUrl = theme.logoDarkUrl;
        if (theme?.logoUrl != null) flat.logoUrl = theme.logoUrl;
        if (theme?.logoTitle != null) flat.logoTitle = theme.logoTitle;
        if (theme?.logoTagline != null) flat.logoTagline = theme.logoTagline;
        if (theme?.headerSearchEnabled != null) flat.headerSearchEnabled = theme.headerSearchEnabled === true;
        if (theme?.headerSearchLabel != null) flat.headerSearchLabel = theme.headerSearchLabel;
        if (theme?.headerSearchOpenAriaLabel != null) flat.headerSearchOpenAriaLabel = theme.headerSearchOpenAriaLabel;
        if (theme?.headerSearchPlaceholder != null) flat.headerSearchPlaceholder = theme.headerSearchPlaceholder;
        if (theme?.headerSearchDialogLabel != null) flat.headerSearchDialogLabel = theme.headerSearchDialogLabel;
        if (theme?.headerSearchInputAriaLabel != null) flat.headerSearchInputAriaLabel = theme.headerSearchInputAriaLabel;
        if (theme?.headerSearchCloseAriaLabel != null) flat.headerSearchCloseAriaLabel = theme.headerSearchCloseAriaLabel;
        if (theme?.headerSearchMinCharsMessage != null) flat.headerSearchMinCharsMessage = theme.headerSearchMinCharsMessage;
        if (theme?.headerSearchLoadingMessage != null) flat.headerSearchLoadingMessage = theme.headerSearchLoadingMessage;
        if (theme?.headerSearchNoResultsMessage != null) flat.headerSearchNoResultsMessage = theme.headerSearchNoResultsMessage;
        if (theme?.headerSearchErrorMessage != null) flat.headerSearchErrorMessage = theme.headerSearchErrorMessage;
        if (theme?.headerSearchResultTypePageLabel != null) flat.headerSearchResultTypePageLabel = theme.headerSearchResultTypePageLabel;
        if (theme?.headerSearchResultTypeBlogLabel != null) flat.headerSearchResultTypeBlogLabel = theme.headerSearchResultTypeBlogLabel;
        if (theme?.headerSearchResultTypeEventLabel != null) flat.headerSearchResultTypeEventLabel = theme.headerSearchResultTypeEventLabel;
        if (theme?.headerSearchFallbackTitle != null) flat.headerSearchFallbackTitle = theme.headerSearchFallbackTitle;
        if (theme?.headerSearchFallbackMeta != null) flat.headerSearchFallbackMeta = theme.headerSearchFallbackMeta;
        if (theme?.headerVolunteerLabel != null) flat.headerVolunteerLabel = theme.headerVolunteerLabel;
        if (theme?.headerVolunteerHref != null) flat.headerVolunteerHref = theme.headerVolunteerHref;
        if (theme?.headerVolunteerHrefTarget != null) flat.headerVolunteerHrefTarget = theme.headerVolunteerHrefTarget;
        if (theme?.headerVolunteerIconUrl != null) flat.headerVolunteerIconUrl = theme.headerVolunteerIconUrl;
        if (theme?.headerVolunteerIconUrlMobile != null) flat.headerVolunteerIconUrlMobile = theme.headerVolunteerIconUrlMobile;
        if (theme?.headerDonateLabel != null) flat.headerDonateLabel = theme.headerDonateLabel;
        if (theme?.headerDonateHref != null) flat.headerDonateHref = theme.headerDonateHref;
        if (theme?.headerDonateIconUrl != null) {
          flat.headerDonateIconUrl = theme.headerDonateIconUrl;
        } else if (theme?.headerDonateIconUrlMobile != null) {
          flat.headerDonateIconUrl = theme.headerDonateIconUrlMobile;
        }
        if (theme?.headerAnnouncementEnabled != null) {
          flat.headerAnnouncementEnabled = theme.headerAnnouncementEnabled === true;
        }
        if (Array.isArray(theme?.headerAnnouncementItems)) {
          flat.headerAnnouncementItems = normalizeAnnouncementItems(theme.headerAnnouncementItems);
        } else if (theme?.headerAnnouncementText != null) {
          const text = String(theme.headerAnnouncementText || "").trim();
          flat.headerAnnouncementItems = text
            ? [
                {
                  text,
                  url: String(theme?.headerAnnouncementLinkUrl || "").trim(),
                  target:
                    String(theme?.headerAnnouncementLinkTarget || "").trim() === "_blank"
                      ? "_blank"
                      : "_self",
                },
              ]
            : [];
        }
        if (theme?.headerAnnouncementFontSize != null) {
          flat.headerAnnouncementFontSize = theme.headerAnnouncementFontSize;
        }
        if (theme?.headerAnnouncementFontWeight != null) {
          flat.headerAnnouncementFontWeight = theme.headerAnnouncementFontWeight;
        }
        if (theme?.headerAnnouncementTextColor != null) {
          flat.headerAnnouncementTextColor = theme.headerAnnouncementTextColor;
        }
        if (theme?.headerAnnouncementBackgroundColor != null) {
          flat.headerAnnouncementBackgroundColor = theme.headerAnnouncementBackgroundColor;
        }
        if (theme?.headerAnnouncementMarqueeSpeed != null) {
          flat.headerAnnouncementMarqueeSpeed = theme.headerAnnouncementMarqueeSpeed;
        }
        flat.headerAnnouncementDirection =
          String(theme?.headerAnnouncementDirection || "").trim().toLowerCase() ===
          "ltr"
            ? "ltr"
            : "rtl";
        if (theme?.headerAnnouncementPaddingX != null) {
          flat.headerAnnouncementPaddingX = theme.headerAnnouncementPaddingX;
        }
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
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
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

  const handleUpdate = async () => {
    try {
      await form.validateFields();
    } catch (err) {
      throw err;
    }

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
    try {
      const res = await fetch("/api/theme/header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save header");
      }
      message.success("Header saved");
      await onSuccess?.();
    } catch (e) {
      message.error(e?.message || "Failed to save header");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

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
    ...ANNOUNCEMENT_BAR_SCHEMA,
    ...CUSTOM_BUTTONS_SCHEMA,
    ...SECTION_SETTINGS_SCHEMA,
  ];
  const rawWithKeyOpts = raw.map((f) =>
    THEME_COLOR_KEY_FIELDS.includes(f.key) ? { ...f, options: themePaletteKeyOptions } : f,
  );
  const schema = enrichSchema("Header", rawWithKeyOpts);
  const byKey = Object.fromEntries((Array.isArray(schema) ? schema : rawWithKeyOpts).map((f) => [f.key, f]));

  const renderField = (field) => renderSchemaField(field, themeColorOptions);
  const renderSearchToggleRow = () => {
    const searchField = byKey.headerSearchEnabled;
    if (!searchField) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 0 12px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "rgba(0,0,0,0.88)" }}>{searchField.label}</span>
        <Form.Item name="headerSearchEnabled" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
      </div>
    );
  };
  const renderAnnouncementToggleCard = () => {
    const announcementControlKeys = [
      "headerAnnouncementEnabled",
      "headerAnnouncementDirection",
      "headerAnnouncementFontSize",
      "headerAnnouncementTextColor",
      "headerAnnouncementFontWeight",
      "headerAnnouncementBackgroundColor",
      "headerAnnouncementMarqueeSpeed",
      "headerAnnouncementPaddingX",
    ];
    const visibleKeys = announcementControlKeys.filter((k) => !!byKey[k]);
    if (visibleKeys.length === 0) return null;
    const controlWidth = 220;
    const renderAnnouncementControl = (field) => {
      if (!field) return null;
      if (field.type === "boolean") {
        return (
          <Form.Item name={field.key} valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        );
      }
      if (field.type === "number") {
        return (
          <Form.Item name={field.key} noStyle>
            <InputNumber style={{ width: controlWidth }} />
          </Form.Item>
        );
      }
      if (field.type === "select") {
        return (
          <Form.Item name={field.key} noStyle>
            <Select
              options={(field.options || []).map((o) =>
                typeof o === "object" && o && "value" in o
                  ? { value: o.value, label: o.label }
                  : { value: o, label: o },
              )}
              allowClear
              style={{ width: controlWidth }}
            />
          </Form.Item>
        );
      }
      if (field.type === "color") {
        return (
          <div style={{ width: controlWidth }}>
            <Form.Item name={field.key} noStyle>
              <ThemeColorInput themeColorOptions={themeColorOptions} />
            </Form.Item>
          </div>
        );
      }
      return byKey[field.key] ? renderField(byKey[field.key]) : null;
    };
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 8,
          marginBottom: 16,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            color: "rgba(0,0,0,0.75)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Announcement controls
        </div>
        <div>
          {visibleKeys.map((key, index) => {
            const field = byKey[key];
            if (!field) return null;
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "10px 12px",
                  borderTop:
                    index > 0 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}
              >
                <span style={{ color: "rgba(0,0,0,0.65)", fontSize: 14 }}>
                  {field.label}
                </span>
                {renderAnnouncementControl(field)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          {grp.label === "Custom buttons" && renderSearchToggleRow()}
          {grp.label === "Announcement bar" && renderAnnouncementToggleCard()}
          {grp.keys
            .map((k) => {
              if (grp.label === "Custom buttons" && k === "headerSearchEnabled") return null;
              if (
                grp.label === "Announcement bar" &&
                (k === "headerAnnouncementEnabled" ||
                  k === "headerAnnouncementDirection" ||
                  k === "headerAnnouncementFontSize" ||
                  k === "headerAnnouncementTextColor" ||
                  k === "headerAnnouncementFontWeight" ||
                  k === "headerAnnouncementBackgroundColor" ||
                  k === "headerAnnouncementMarqueeSpeed" ||
                  k === "headerAnnouncementPaddingX")
              ) {
                return null;
              }
              return byKey[k] ? renderField(byKey[k]) : null;
            })
            .filter(Boolean)}
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
