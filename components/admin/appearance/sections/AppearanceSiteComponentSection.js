"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Grid,
  Spin,
  Typography,
  message,
} from "antd";
import { CheckOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import HeaderPreview from "@/components/admin/appearance/Header/HeaderPreview";
import FooterPreview from "@/components/admin/appearance/Footer/FooterPreview";
import SubscribePreview from "@/components/admin/appearance/Subscribe/SubscribePreview";
import HeaderEdit from "@/components/admin/appearance/Header/HeaderEdit";
import FooterEdit from "@/components/admin/appearance/Footer/FooterEdit";
import SubscribeEdit from "@/components/admin/appearance/Subscribe/SubscribeEdit";
import {
  getManageSectionSnapshot,
  MANAGE_SECTION_PREFIX_BY_COMPONENT_ID,
} from "@/components/admin/appearance/local/manageSectionData";
import { fetchAppearanceTitleAndColorsConfigMap } from "@/components/admin/appearance/local/titleAndColorsConfig";
import {
  buildThemeColorOptions,
  buildThemePaletteData,
} from "@/lib/themeColors";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

const SECTION_CONFIG = {
  Header: {
    label: "Header",
    EditFormComponent: HeaderEdit,
  },
  Footer: {
    label: "Footer",
    EditFormComponent: FooterEdit,
  },
  Subscribe: {
    label: "Subscribe",
    EditFormComponent: SubscribeEdit,
  },
};

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
    const target = normalizeTargetFromItem(item, {
      targetKeys: ["target"],
      boolKeys: ["openInNewTab"],
      fallback: "_self",
    });
    const result = {
      label: String(item.label ?? ""),
      url: ensureMailto(url) || "#",
      hasDropdown: children.length > 0,
      target,
      openInNewTab: target === "_blank",
    };
    if (children.length > 0) result.children = children;
    return result;
    });
}

function resolveThemeColorFromPalette(paletteData, key) {
  if (!key) return "";
  const k = String(key).trim();
  const palette = paletteData?.themePalette || {};
  if (palette[k] != null && String(palette[k]).trim() !== "") {
    return String(palette[k]).trim();
  }
  const lower = k.toLowerCase();
  const paletteKey = Object.keys(palette).find(
    (name) => String(name || "").trim().toLowerCase() === lower,
  );
  if (
    paletteKey &&
    palette[paletteKey] != null &&
    String(palette[paletteKey]).trim() !== ""
  ) {
    return String(palette[paletteKey]).trim();
  }
  const custom = paletteData?.colors || [];
  const found = custom.find((c) => c && String(c.name).trim() === k);
  if (found && found.value != null) return String(found.value).trim();
  const byValue = custom.find((c) => c && String(c.value).trim() === k);
  if (byValue && byValue.value != null) return String(byValue.value).trim();
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(k)) {
    return k;
  }
  return "";
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

function buildHeaderSnapshot(theme) {
  return {
    siteTitle: theme?.siteTitle ?? "",
    logoLightUrl: theme?.logoLightUrl || theme?.logoImageUrl || "",
    logoMobileUrl: theme?.logoMobileUrl ?? "",
    menuPosition: theme?.menuPosition ?? "center",
    navColor: theme?.navColor ?? "",
    navFontSize: theme?.navFontSize ?? "",
    navFontWeight: theme?.navFontWeight ?? "",
    navHoverColor: theme?.navHoverColor ?? "",
    navItemBackground: theme?.navItemBackground ?? "",
    navItemHoverBackground: theme?.navItemHoverBackground ?? "",
    navItems: Array.isArray(theme?.navItems) ? theme.navItems : [],
    headerVolunteerLabel: theme?.headerVolunteerLabel ?? "",
    headerVolunteerHref: theme?.headerVolunteerHref ?? "",
    headerBgColorKey: theme?.headerBgColorKey ?? "",
    headerMobileMenuHeaderBgColorKey:
      theme?.headerMobileMenuHeaderBgColorKey ?? "",
    headerCtaBgColorKey: theme?.headerCtaBgColorKey ?? "",
    headerCtaTextColorKey: theme?.headerCtaTextColorKey ?? "",
    _sectionBg: theme?._sectionBg ?? "",
    _sectionPadding: theme?._sectionPadding ?? "",
    _sectionBorderSize: theme?._sectionBorderSize ?? "",
    _sectionBorderStyle: theme?._sectionBorderStyle ?? "",
    _sectionBorderColor: theme?._sectionBorderColor ?? "",
    _sectionShadow: theme?._sectionShadow ?? "",
    ...getManageSectionSnapshot(
      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Header,
      theme,
    ),
  };
}

function buildFooterSnapshot(theme) {
  return {
    siteTitle: theme?.siteTitle ?? "",
    footerLogoUrl: theme?.footerLogoUrl ?? "",
    footerAddress: theme?.footerAddress ?? "",
    footerEmail: theme?.footerEmail ?? "",
    footerPhone: theme?.footerPhone ?? "",
    footerCol1Links: Array.isArray(theme?.footerCol1Links)
      ? theme.footerCol1Links
      : [],
    footerCol2Links: Array.isArray(theme?.footerCol2Links)
      ? theme.footerCol2Links
      : [],
    footerCol1Title: theme?.footerCol1Title ?? "",
    footerCol2Title: theme?.footerCol2Title ?? "",
    footerSocialLinks: Array.isArray(theme?.footerSocialLinks)
      ? theme.footerSocialLinks
      : [],
    footerLatestTitle: theme?.footerLatestTitle ?? "",
    footerLatestPlaceholder: theme?.footerLatestPlaceholder ?? "",
    footerCopyrightText: theme?.footerCopyrightText ?? "",
    footerBgColorKey: theme?.footerBgColorKey ?? "",
    footerBackgroundImageUrl: theme?.footerBackgroundImageUrl ?? "",
    footerTextColorKey: theme?.footerTextColorKey ?? "",
    footerSocialColorKey: theme?.footerSocialColorKey ?? "",
    footerCopyrightBarColorKey: theme?.footerCopyrightBarColorKey ?? "",
    ...getManageSectionSnapshot(
      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Footer,
      theme,
    ),
  };
}

function buildSubscribeSnapshot(theme) {
  return {
    subscribeSubtitle: theme?.subscribeSubtitle ?? "",
    subscribeTitle: theme?.subscribeTitle ?? "",
    subscribePlaceholder: theme?.subscribePlaceholder ?? "",
    subscribeButtonText: theme?.subscribeButtonText ?? "",
    subscribeBgDesktop: theme?.subscribeBgDesktop ?? theme?.subscribeBgUrl ?? "",
    subscribeBgMobile: theme?.subscribeBgMobile ?? "",
    subscribeBgUrl: theme?.subscribeBgUrl ?? "",
    subscribeSubtitleColorKey: theme?.subscribeSubtitleColorKey ?? "",
    subscribeTitleColorKey: theme?.subscribeTitleColorKey ?? "",
    subscribeButtonBgColorKey: theme?.subscribeButtonBgColorKey ?? "",
    subscribeButtonTextColorKey: theme?.subscribeButtonTextColorKey ?? "",
    ...getManageSectionSnapshot(
      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Subscribe,
      theme,
    ),
  };
}

function HeaderPreviewCard({ snapshot, paletteData }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        background: "#fafafa",
        minHeight: 96,
        width: "100%",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <HeaderPreview
        snapshot={snapshot}
        paletteData={{
          ...(paletteData || {}),
          _resolved: {
            headerBgValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.headerBgColorKey,
            ),
            headerCtaBgValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.headerCtaBgColorKey,
            ),
            headerCtaTextValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.headerCtaTextColorKey,
            ),
          },
        }}
      />
    </div>
  );
}

function FooterPreviewCard({ snapshot, paletteData }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        background: "#fafafa",
        minHeight: 96,
        width: "100%",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <FooterPreview
        snapshot={snapshot}
        paletteData={{
          ...(paletteData || {}),
          _resolved: {
            footerBgValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.footerBgColorKey,
            ),
            footerTextValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.footerTextColorKey,
            ),
            footerCopyrightBarValue: resolveThemeColorFromPalette(
              paletteData,
              snapshot?.footerCopyrightBarColorKey,
            ),
          },
        }}
      />
    </div>
  );
}

function SubscribePreviewCard({ snapshot, paletteData }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        background: "#fafafa",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <SubscribePreview
        snapshot={snapshot || {}}
        paletteData={paletteData || { themePalette: {}, colors: [] }}
      />
    </div>
  );
}

export default function AppearanceSiteComponentSection({
  componentId = "Header",
}) {
  const screens = Grid.useBreakpoint();
  const config = useMemo(
    () => SECTION_CONFIG[componentId] || SECTION_CONFIG.Header,
    [componentId],
  );
  const EditFormComponent = config.EditFormComponent;

  const [form] = Form.useForm();
  const editorRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [themeLoading, setThemeLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUpdating, setDrawerUpdating] = useState(false);

  const [record, setRecord] = useState(null);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [themePaletteData, setThemePaletteData] = useState({
    themePalette: {},
    colors: [],
  });
  const [titleAndColorsConfigMap, setTitleAndColorsConfigMap] = useState(null);
  const [themeSnapshot, setThemeSnapshot] = useState({});

  const loadComponentMeta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/site-components/${encodeURIComponent(componentId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to load component settings");
      }
      const data = await res.json();
      setRecord(data);
      form.setFieldsValue({
        displayName: data?.displayName || componentId,
        position: data?.position === "after" ? "after" : "before",
      });
    } catch (error) {
      message.error(error?.message || "Failed to load component settings");
    } finally {
      setLoading(false);
    }
  }, [componentId, form]);

  const loadThemeSnapshot = useCallback(async () => {
    setThemeLoading(true);
    try {
      const [themeRes, headerRes] = await Promise.all([
        fetch("/api/theme", { cache: "no-store" }),
        componentId === "Header"
          ? fetch("/api/theme/header", { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const theme = await (themeRes.ok ? themeRes.json() : Promise.resolve({}));
      const headerThemeData =
        componentId === "Header" && headerRes && headerRes.ok
          ? await headerRes.json()
          : {};
      const paletteData = buildThemePaletteData(theme);
      setThemePaletteData(paletteData);
      setThemeColorOptions(buildThemeColorOptions(theme));

      if (componentId === "Header") {
        let headerTheme = { ...theme, ...headerThemeData, navItems: [] };
        let menuName =
          headerTheme?.menuName != null
            ? String(headerTheme.menuName).trim()
            : "";
        let menusList = null;
        const loadMenusList = async () => {
          if (menusList) return menusList;
          try {
            const menusRes = await fetch("/api/admin/menus", {
              cache: "no-store",
            });
            menusList = await (menusRes.ok
              ? menusRes.json()
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

        if (!menuName) {
          const menus = await loadMenusList();
          menuName = pickDefaultMenuName(menus);
        }

        let menuItems = await loadMenuItemsByName(menuName);
        if (!menuItems) {
          const menus = await loadMenusList();
          const fallbackMenuName = pickDefaultMenuName(menus);
          if (
            fallbackMenuName &&
            fallbackMenuName.toLowerCase() !== menuName.toLowerCase()
          ) {
            const fallbackItems = await loadMenuItemsByName(fallbackMenuName);
            if (fallbackItems) {
              menuName = fallbackMenuName;
              menuItems = fallbackItems;
            }
          }
        }

        if (Array.isArray(menuItems)) {
          headerTheme = {
            ...headerTheme,
            menuName,
            navItems: menuItemsToNavItems(menuItems),
          };
        }
        setThemeSnapshot(buildHeaderSnapshot(headerTheme));
      } else if (componentId === "Footer") {
        setThemeSnapshot(buildFooterSnapshot(theme));
      } else {
        setThemeSnapshot(buildSubscribeSnapshot(theme));
      }
    } catch {
      message.error("Failed to load appearance content");
    } finally {
      setThemeLoading(false);
    }
  }, [componentId]);

  const loadTitleAndColorsConfig = useCallback(async () => {
    try {
      const configMap = await fetchAppearanceTitleAndColorsConfigMap();
      if (configMap && typeof configMap === "object") {
        setTitleAndColorsConfigMap(configMap);
      }
    } catch {
      // Keep static fallback in local config helper.
    }
  }, []);

  useEffect(() => {
    loadComponentMeta();
    loadThemeSnapshot();
    loadTitleAndColorsConfig();
  }, [loadComponentMeta, loadThemeSnapshot, loadTitleAndColorsConfig]);

  const handleSaveMeta = async () => {
    if (!record?.componentId) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = {
        displayName: values?.displayName?.trim() || record.componentId,
        global: false,
        position:
          values?.position === "after" || values?.position === "before"
            ? values.position
            : record.position === "after"
              ? "after"
              : "before",
        order: Number.isFinite(record?.order) ? record.order : 0,
      };

      const res = await fetch(
        `/api/admin/site-components/${encodeURIComponent(record.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Save failed");
        return;
      }
      message.success("Settings saved");
      setRecord((prev) =>
        prev
          ? {
              ...prev,
              displayName: payload.displayName,
              global: payload.global,
              position: payload.position,
            }
          : prev,
      );
    } catch (error) {
      if (error?.errorFields) return;
      message.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDrawerUpdate = async () => {
    const updateFn = editorRef.current?.update;
    if (typeof updateFn !== "function") {
      message.error("Editor is not ready yet");
      return;
    }
    setDrawerUpdating(true);
    try {
      await Promise.resolve(updateFn());
    } finally {
      setDrawerUpdating(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <ThemeAdminCard
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{config.label}</span>}
        extra={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>
              Edit
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveMeta}
            >
              Save
            </Button>
          </div>
        }
      >
        {loading || themeLoading ? (
          <div
            style={{
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin />
          </div>
        ) : (
          <>
            {componentId === "Header" ? (
              <HeaderPreviewCard
                snapshot={themeSnapshot}
                paletteData={themePaletteData}
              />
            ) : null}
            {componentId === "Footer" ? (
              <FooterPreviewCard
                snapshot={themeSnapshot}
                paletteData={themePaletteData}
              />
            ) : null}
            {componentId === "Subscribe" ? (
              <SubscribePreviewCard
                snapshot={themeSnapshot}
                paletteData={themePaletteData}
              />
            ) : null}
          </>
        )}

        <Form.Item name="displayName" hidden>
          <input type="hidden" />
        </Form.Item>
        <Form.Item name="position" hidden>
          <input type="hidden" />
        </Form.Item>
      </ThemeAdminCard>

      <Drawer
        title={`Edit ${config.label}`}
        placement="right"
        width={screens.md ? 560 : "100%"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerUpdating(false);
        }}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={drawerUpdating}
            onClick={handleDrawerUpdate}
          >
            Update
          </Button>
        }
      >
        {EditFormComponent ? (
          <EditFormComponent
            ref={editorRef}
            themeColorOptions={themeColorOptions}
            titleAndColorsConfigMap={titleAndColorsConfigMap}
            onSuccess={async () => {
              await loadThemeSnapshot();
              setDrawerUpdating(false);
              setDrawerOpen(false);
            }}
            onCancel={() => {
              setDrawerOpen(false);
              setDrawerUpdating(false);
            }}
          />
        ) : (
          <Typography.Text type="secondary">
            Editor component not available.
          </Typography.Text>
        )}
      </Drawer>
    </Form>
  );
}

