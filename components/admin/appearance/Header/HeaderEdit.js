"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Form, Collapse, message } from "antd";
import { renderSchemaField, enrichSchema } from "@/components/admin/appearance/local/schemaFormUtils";
import TitleAndColorsSection from "@/components/admin/appearance/local/TitleAndColorsSection";
import { getTitleAndColorsConfigFromMap } from "@/components/admin/appearance/local/titleAndColorsConfig";
import {
  NAVBAR_SCHEMA,
  LOGO_LINK_SCHEMA,
  MENU_SCHEMA,
  CUSTOM_BUTTONS_SCHEMA,
  HEADER_FIELD_GROUPS,
  SECTION_SETTINGS_SCHEMA,
} from "./HeaderSchemas";
import {
  buildThemeColorOptionsSafe,
} from "@/lib/themeColors";

/** Pure helper: convert API menu items to header nav items (no server imports). */
function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems
    .filter((it) => it?.enabled !== false)
    .map((it) => {
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

function pickDefaultMenuName(list) {
  const menus = Array.isArray(list) ? list : [];
  if (menus.length === 0) return "";
  const normalize = (v) => String(v || "").trim().toLowerCase();
  const hasItems = (m) => Array.isArray(m?.items) && m.items.length > 0;
  const preferredNames = ["primary menu", "primary", "header", "main"];
  for (const name of preferredNames) {
    const hit = menus.find((m) => normalize(m?.name) === name && hasItems(m));
    if (hit?.name) return String(hit.name).trim();
  }
  const firstWithItems = menus.find((m) => hasItems(m));
  if (firstWithItems?.name) return String(firstWithItems.name).trim();
  const first = menus[0];
  return first?.name ? String(first.name).trim() : "";
}

function pickEditableValues(values, editableKeys) {
  const src = values && typeof values === "object" ? values : {};
  const out = {};
  for (const key of editableKeys) {
    if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
  }
  return out;
}

function normalizeHeaderTargetForForm(value) {
  if (value === "_blank" || value === true) return "_blank";
  return "_self";
}

function normalizeHeaderTargetForSave(value) {
  return value === "_blank" || value === true;
}

const LEGACY_EXCLUDED_KEYS = new Set(["headerSectionBgType"]);

/**
 * Header edit form - drawer lives in component; PageBuilder only calls this.
 * source="page" (or block in layout): save via onSaveToPage -> pages/components layout.
 * Otherwise: load/save via /api/theme/header -> sitesettings collection.
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
    titleAndColorsConfigMap = null,
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [themePaletteKeyOptions, setThemePaletteKeyOptions] = useState([]);
  const lastLoadedNavItemsRef = useRef(null);
  const lastLoadedValuesRef = useRef(null);
  const themeLoadedOnceRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  const THEME_COLOR_KEY_FIELDS = [
    "headerBgColorKey",
    "headerCtaBgColorKey",
    "headerCtaTextColorKey",
    "headerDonateBgColorKey",
    "headerDonateTextColorKey",
    "headerSectionBgColorKey",
    "headerPageContainerBgColorKey",
  ];
  const titleAndColorsConfig = useMemo(
    () => getTitleAndColorsConfigFromMap("Header", titleAndColorsConfigMap),
    [titleAndColorsConfigMap],
  );
  const TITLE_AND_COLOR_KEYS = useMemo(
    () => [
      ...(Array.isArray(titleAndColorsConfig?.titleListItems)
        ? titleAndColorsConfig.titleListItems
            .map((item) => item?.name)
            .filter(Boolean)
        : []),
      ...(Array.isArray(titleAndColorsConfig?.colorListItems)
        ? titleAndColorsConfig.colorListItems
            .map((item) => item?.name)
            .filter(Boolean)
        : []),
    ],
    [titleAndColorsConfig],
  );
  const HEADER_MANAGE_SECTION_KEYS = useMemo(
    () => ["_sectionBg", "_sectionPadding", "_sectionBorderSize", "_sectionBorderStyle", "_sectionBorderColor", "_sectionShadow"],
    [],
  );
  const EDITABLE_KEYS = useMemo(() => {
    const keys = new Set([
      ...HEADER_MANAGE_SECTION_KEYS,
      ...HEADER_FIELD_GROUPS.flatMap((grp) => grp.keys || []),
      ...TITLE_AND_COLOR_KEYS,
      "logoType",
      "menuName",
    ]);
    for (const k of Array.from(keys)) {
      if (LEGACY_EXCLUDED_KEYS.has(k)) keys.delete(k);
    }
    return keys;
  }, [HEADER_MANAGE_SECTION_KEYS, TITLE_AND_COLOR_KEYS]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock && initialData != null) {
      const scoped = pickEditableValues(initialData, EDITABLE_KEYS);
      form.setFieldsValue({
        ...scoped,
        headerVolunteerOpenInNewTab: normalizeHeaderTargetForForm(
          scoped?.headerVolunteerOpenInNewTab,
        ),
      });
      lastLoadedValuesRef.current = {
        ...(lastLoadedValuesRef.current || {}),
        ...(initialData && typeof initialData === "object" ? initialData : {}),
      };
      setLoading(false);
      return;
    }
    if (themeLoadedOnceRef.current) {
      const scoped = pickEditableValues(
        lastLoadedValuesRef.current || form.getFieldsValue(true),
        EDITABLE_KEYS,
      );
      form.setFieldsValue({
        ...scoped,
        headerVolunteerOpenInNewTab: normalizeHeaderTargetForForm(
          scoped?.headerVolunteerOpenInNewTab,
        ),
      });
      setLoading(false);
      return;
    }
    themeLoadedOnceRef.current = true;
    (async () => {
      try {
        const [headerRes, themeRes] = await Promise.all([
          fetch("/api/theme/header", { cache: "no-store" }),
          fetch("/api/theme", { cache: "no-store" }),
        ]);
        const header = await (headerRes.ok
          ? headerRes.json()
          : Promise.resolve({}));
        const theme = await (themeRes.ok ? themeRes.json() : Promise.resolve({}));

        const flat = { ...(header && typeof header === "object" ? header : {}) };
        flat.logoType = "image";
        if (theme?.logoLightUrl != null && !flat.logoLightUrl)
          flat.logoLightUrl = theme.logoLightUrl;
        if (theme?.logoImageUrl != null && !flat.logoLightUrl)
          flat.logoLightUrl = theme.logoImageUrl;
        if (theme?.logoMobileUrl != null && !flat.logoMobileUrl)
          flat.logoMobileUrl = theme.logoMobileUrl;
        flat.navItems = [];
        flat._sectionBg = flat?._sectionBg ?? "";
        flat._sectionPadding = flat?._sectionPadding ?? "";
        flat._sectionBorderSize = flat?._sectionBorderSize ?? "";
        flat._sectionBorderStyle = flat?._sectionBorderStyle ?? "";
        flat._sectionBorderColor = flat?._sectionBorderColor ?? "";
        flat._sectionShadow = flat?._sectionShadow ?? "";
        const scopedFlat = pickEditableValues(flat, EDITABLE_KEYS);
        form.setFieldsValue({
          ...scopedFlat,
          headerVolunteerOpenInNewTab: normalizeHeaderTargetForForm(
            scopedFlat?.headerVolunteerOpenInNewTab,
          ),
        });
        lastLoadedValuesRef.current = {
          ...(lastLoadedValuesRef.current || {}),
          ...flat,
        };

        const selectedMenuName =
          flat.menuName != null ? String(flat.menuName).trim() : "";
        lastLoadedNavItemsRef.current = null;

        let resolvedMenuName = selectedMenuName;
        let menusList = null;
        const loadMenusList = async () => {
          if (menusList) return menusList;
          try {
            const listRes = await fetch("/api/admin/menus", {
              cache: "no-store",
            });
            menusList = await (listRes.ok
              ? listRes.json()
              : Promise.resolve([]));
          } catch {
            menusList = [];
          }
          return menusList;
        };
        const loadMenuItemsByName = async (name) => {
          if (!name) return null;
          try {
            const menuRes = await fetch(
              `/api/admin/menus/${encodeURIComponent(name)}`,
              { cache: "no-store" },
            );
            if (!menuRes.ok) return null;
            const menu = await menuRes.json();
            return Array.isArray(menu?.items) ? menu.items : [];
          } catch {
            return null;
          }
        };

        if (!resolvedMenuName) {
          const list = await loadMenusList();
          resolvedMenuName = pickDefaultMenuName(list);
        }

        if (resolvedMenuName) {
          let items = await loadMenuItemsByName(resolvedMenuName);
          if (!items) {
            const list = await loadMenusList();
            const fallbackMenuName = pickDefaultMenuName(list);
            if (
              fallbackMenuName &&
              fallbackMenuName.toLowerCase() !== resolvedMenuName.toLowerCase()
            ) {
              const fallbackItems = await loadMenuItemsByName(fallbackMenuName);
              if (fallbackItems) {
                resolvedMenuName = fallbackMenuName;
                items = fallbackItems;
              }
            }
          }

          if (items) {
            const navItems = menuItemsToNavItems(items);
            form.setFieldsValue({ navItems, menuName: resolvedMenuName });
            lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
            lastLoadedValuesRef.current = {
              ...(lastLoadedValuesRef.current || {}),
              navItems,
              menuName: resolvedMenuName,
            };
          } else {
            form.setFieldsValue({ navItems: [] });
            lastLoadedNavItemsRef.current = [];
            lastLoadedValuesRef.current = {
              ...(lastLoadedValuesRef.current || {}),
              navItems: [],
            };
          }
        } else {
          form.setFieldsValue({ navItems: [] });
          lastLoadedNavItemsRef.current = [];
          lastLoadedValuesRef.current = {
            ...(lastLoadedValuesRef.current || {}),
            navItems: [],
          };
        }

        // Include the custom palette AND the default/legacy theme colors (and a
        // built-in fallback) so the color pickers are never empty / "No data".
        const paletteOptions = buildThemeColorOptionsSafe(theme);
        setThemeColorOptions(paletteOptions);
        setThemePaletteKeyOptions(paletteOptions);
      } catch {
        setThemeColorOptions(buildThemeColorOptionsSafe({}));
        setThemePaletteKeyOptions(buildThemeColorOptionsSafe({}));
        message.error("Failed to load header");
      } finally {
        setLoading(false);
      }
    })();
  }, [form, isPageBlock, initialData, EDITABLE_KEYS]);

  const handleUpdate = useCallback(() => {
    return form
      .validateFields()
      .then(() => {
        // Collect exactly the keys rendered by this drawer sections.
        let values = form.getFieldsValue(Array.from(EDITABLE_KEYS));
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
                    hasDropdown:
                      item?.hasDropdown ?? loaded[i]?.hasDropdown ?? false,
                    children: Array.isArray(loaded[i]?.children)
                      ? loaded[i].children
                      : Array.isArray(item?.children)
                        ? item.children
                        : [],
                  }))
                : formItems.map((item) => ({
                    ...item,
                    children: Array.isArray(item?.children)
                      ? item.children
                      : [],
                  })),
          };
        }
        const persistableValues = pickEditableValues(values, EDITABLE_KEYS);
        persistableValues.headerVolunteerOpenInNewTab =
          normalizeHeaderTargetForSave(
            persistableValues.headerVolunteerOpenInNewTab,
          );
        persistableValues.logoType = "image";
        delete persistableValues.navItems;
        delete persistableValues.headerSectionBgType;
        const payload = { ...persistableValues };
        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }
        setSaving(true);
        return fetch("/api/theme/header", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => {
            if (!r.ok) return r.json().then((d) => Promise.reject(d));
          })
          .then(() => {
            message.success("Header saved");
            onSuccess?.();
          })
          .catch((e) => message.error(e?.error || "Failed to save header"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  }, [form, isPageBlock, onSaveToPage, onSuccess, EDITABLE_KEYS]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Loading…</div>;
  }

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
      label: "Button Colors",
      children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...titleAndColorsConfig} />,
    },
    ...HEADER_FIELD_GROUPS.map((grp) => ({
      key: grp.label.replace(/\s+/g, "-").toLowerCase().replace(/&/g, "and"),
      label: grp.label,
      children: (
        <>
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



