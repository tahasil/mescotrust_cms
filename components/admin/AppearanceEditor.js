"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Drawer, Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import AppearanceHeader from "@/components/appearance/AppearanceHeader";
import AppearanceFooter from "@/components/appearance/AppearanceFooter";
import AppearanceHeaderEditForm from "@/components/appearance/AppearanceHeaderEditForm";
import AppearanceFooterEditForm from "@/components/appearance/AppearanceFooterEditForm";

function resolveThemeColor(theme, key) {
  const value = String(key || "").trim();
  if (!value) return "";
  if (/^(#|rgb|hsl|linear-gradient|radial-gradient|transparent)/i.test(value)) {
    return value;
  }
  const normalize = (input) =>
    String(input || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  const target = normalize(value);
  const paletteEntry = Object.entries(theme?.themePalette || {}).find(
    ([name]) => normalize(name) === target,
  );
  if (paletteEntry?.[1]) return String(paletteEntry[1]);
  const custom = Array.isArray(theme?.colors) ? theme.colors : [];
  const customEntry = custom.find((item) => normalize(item?.name) === target);
  return customEntry?.value ? String(customEntry.value) : "";
}

function headerPreviewProps(props, theme) {
  return {
    ...props,
    siteTitle: theme?.siteTitle || "MESCO Trust",
    menuItems: Array.isArray(props?.navItems) ? props.navItems : [],
    logoImageUrl: props?.logoLightUrl || "",
    volunteerLabel: props?.headerVolunteerLabel || "",
    volunteerHref: props?.headerVolunteerHref || "",
    volunteerHrefTarget: props?.headerVolunteerHrefTarget || "_self",
    volunteerIconUrl: props?.headerVolunteerIconUrl || "",
    volunteerIconUrlMobile: props?.headerVolunteerIconUrlMobile || "",
    donateLabel: props?.headerDonateLabel || "",
    donateHref: props?.headerDonateHref || "",
    donateHrefTarget: props?.headerDonateHrefTarget || "_self",
    donateIconUrl: props?.headerDonateIconUrl || "",
    headerAnnouncementTextColor: resolveThemeColor(
      theme,
      props?.headerAnnouncementTextColor,
    ),
    headerAnnouncementBackgroundColor: resolveThemeColor(
      theme,
      props?.headerAnnouncementBackgroundColor,
    ),
    headerBgValue: resolveThemeColor(theme, props?.headerBgColorKey),
    headerCtaBgValue: resolveThemeColor(theme, props?.headerCtaBgColorKey),
    headerCtaTextValue: resolveThemeColor(theme, props?.headerCtaTextColorKey),
    headerDonateBgValue: resolveThemeColor(
      theme,
      props?.headerDonateBgColorKey,
    ),
    headerDonateTextValue: resolveThemeColor(
      theme,
      props?.headerDonateTextColorKey,
    ),
    sectionBg: props?._sectionBg || "",
    sectionPadding: props?._sectionPadding || "",
    sectionBorderSize: props?._sectionBorderSize || "",
    sectionBorderStyle: props?._sectionBorderStyle || "",
    sectionBorderColor: props?._sectionBorderColor || "",
    sectionShadow: props?._sectionShadow || "",
    preview: true,
  };
}

function footerPreviewProps(props, theme) {
  return {
    ...props,
    siteTitle: theme?.siteTitle || "MESCO Trust",
    footerBgValue: resolveThemeColor(theme, props?.footerBgColorKey),
    footerTextValue: resolveThemeColor(theme, props?.footerTextColorKey),
    footerCopyrightBarValue: resolveThemeColor(
      theme,
      props?.footerCopyrightBarColorKey,
    ),
  };
}

export default function AppearanceEditor({ moduleKey }) {
  const normalizedModule = moduleKey === "footer" ? "footer" : "header";
  const endpoint = `/api/admin/appearance/${normalizedModule}`;
  const editFormRef = useRef(null);
  const [record, setRecord] = useState(null);
  const [theme, setTheme] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [recordResponse, themeResponse] = await Promise.all([
      fetch(endpoint, { cache: "no-store" }),
      fetch("/api/theme", { cache: "no-store" }),
    ]);
    if (!recordResponse.ok) {
      const body = await recordResponse.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to load Appearance module");
    }
    const [nextRecord, nextTheme] = await Promise.all([
      recordResponse.json(),
      themeResponse.ok ? themeResponse.json() : {},
    ]);
    setRecord(nextRecord);
    setTheme(nextTheme || {});
  }, [endpoint]);

  useEffect(() => {
    setLoading(true);
    loadData()
      .catch((error) => message.error(error?.message || "Failed to load Appearance module"))
      .finally(() => setLoading(false));
  }, [loadData]);

  const themeColorOptions = useMemo(() => {
    const names = new Set(Object.keys(theme?.themePalette || {}));
    for (const item of Array.isArray(theme?.colors) ? theme.colors : []) {
      if (item?.name) names.add(item.name);
    }
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }));
  }, [theme]);

  const props = record?.defaultProps || {};
  const title = record?.displayName || (normalizedModule === "header" ? "Header" : "Footer");

  const saveMetadata = async () => {
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: title }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Save failed");
      }
      await loadData();
      message.success(`${title} published`);
    } catch (error) {
      message.error(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 64, textAlign: "center" }}><Spin size="large" /></div>;
  }

  return (
    <ThemeAdminCard
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Link href="/admin"><Button type="text" icon={<ArrowLeftOutlined />} aria-label="Back to dashboard" /></Link>
          {title}
        </span>
      }
      extra={
        <div style={{ display: "flex", gap: 12 }}>
          <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>Edit</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveMetadata}>Save</Button>
        </div>
      }
    >
      <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden", background: "#fafafa" }}>
        {normalizedModule === "header" ? (
          <AppearanceHeader {...headerPreviewProps(props, theme)} />
        ) : (
          <AppearanceFooter {...footerPreviewProps(props, theme)} />
        )}
      </div>

      <Drawer
        title={`Edit ${title}`}
        placement="right"
        width={Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.9 : 520)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await editFormRef.current?.update?.();
              } finally {
                setSaving(false);
              }
            }}
          >
            Update
          </Button>
        }
      >
        {normalizedModule === "header" ? (
          <AppearanceHeaderEditForm
            ref={editFormRef}
            dataEndpoint={endpoint}
            themeColorOptions={themeColorOptions}
            onSuccess={async () => {
              await loadData();
              setDrawerOpen(false);
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        ) : (
          <AppearanceFooterEditForm
            ref={editFormRef}
            dataEndpoint={endpoint}
            themeColorOptions={themeColorOptions}
            onSuccess={async () => {
              await loadData();
              setDrawerOpen(false);
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
      </Drawer>
    </ThemeAdminCard>
  );
}
