"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Col, Form, Row, Spin, message } from "antd";
import { ThemeAdminCard } from "@/styles/Theme";
import { appearanceInitialValues } from "@/components/admin/appearance/initialValues";
import {
  APPEARANCE_SECTIONS,
  normalizeAppearanceSection,
} from "@/components/admin/appearance/config";
import HeaderSection from "@/components/admin/appearance/sections/HeaderSection";
import FooterSection from "@/components/admin/appearance/sections/FooterSection";
import SubscribeSection from "@/components/admin/appearance/sections/SubscribeSection";
import MenuSection from "@/components/admin/appearance/sections/MenuSection";
import BackgroundSection from "@/components/admin/appearance/sections/BackgroundSection";
import ColorsSection from "@/components/admin/appearance/sections/ColorsSection";
import LayoutsSection from "@/components/admin/appearance/sections/LayoutsSection";
import EffectsSection from "@/components/admin/appearance/sections/EffectsSection";
import LoaderSection from "@/components/admin/appearance/Loader";
import AdvancedSection from "@/components/admin/appearance/sections/AdvancedSection";
import BrandingSection from "@/components/admin/appearance/sections/BrandingSection";
import {
  buildThemeColorOptions,
  normalizeThemePalette,
} from "@/lib/themeColors";

const SECTION_COMPONENTS = {
  header: HeaderSection,
  footer: FooterSection,
  subscribe: SubscribeSection,
  menu: MenuSection,
  background: BackgroundSection,
  colors: ColorsSection,
  layouts: LayoutsSection,
  effects: EffectsSection,
  loader: LoaderSection,
  advanced: AdvancedSection,
  branding: BrandingSection,
};

function extractGoogleFontFamily(data) {
  const list = Array.isArray(data?.googleFonts) ? data.googleFonts : [];
  const family = list[0]?.family;
  return family ? String(family).trim() : "";
}

export default function AppearanceModule({ section = "header" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminLogoUploading, setAdminLogoUploading] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);

  const activeSection = normalizeAppearanceSection(section);
  const activeSectionLabel =
    APPEARANCE_SECTIONS.find((s) => s.key === activeSection)?.label ||
    "Header";
  const isDrawerManagedSection = ["header", "footer", "subscribe"].includes(
    activeSection,
  );
  const isExternallyManagedSection = activeSection === "menu";
  const hideTopSectionTabs = [
    "background",
    "colors",
    "branding",
    "layouts",
    "loader",
    "advanced",
  ].includes(activeSection);
  const showGlobalSave = !isDrawerManagedSection && !isExternallyManagedSection;

  const ActiveSection = useMemo(
    () => SECTION_COMPONENTS[activeSection] || HeaderSection,
    [activeSection],
  );

  const applyThemeData = useCallback(
    (data) => {
      const palette = normalizeThemePalette(data);
      form.setFieldsValue({
        ...appearanceInitialValues,
        ...data,
        googleFontFamily: extractGoogleFontFamily(data),
        themePalette: palette,
        paletteColors: Object.entries(palette).map(([key, value]) => ({
          key,
          value,
        })),
        colors: [],
      });
      setThemeColorOptions(buildThemeColorOptions(data));
    },
    [form],
  );

  const refreshThemeData = useCallback(async () => {
    const res = await fetch("/api/theme", { cache: "no-store" });
    const data = await (res.ok ? res.json() : Promise.resolve({}));
    applyThemeData(data);
  }, [applyThemeData]);

  useEffect(() => {
    if (isDrawerManagedSection || isExternallyManagedSection) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (cancelled) return;
        applyThemeData(data);
      })
      .catch(() => message.error("Failed to load appearance settings"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyThemeData, isDrawerManagedSection, isExternallyManagedSection]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const chosenGoogleFont = String(values?.googleFontFamily || "").trim();
      const payload = {
        ...values,
        paletteColors: Array.isArray(values.paletteColors)
          ? values.paletteColors
          : [],
      };
      delete payload.colors;
      if (activeSection === "colors") {
        payload.colors = [];
      }
      if (activeSection === "branding") {
        payload.logoType = "image";
        if (
          (!payload.logoImageUrl || String(payload.logoImageUrl).trim() === "") &&
          payload.logoLightUrl
        ) {
          payload.logoImageUrl = payload.logoLightUrl;
        }
        if (chosenGoogleFont) {
          payload.googleFonts = [
            { family: chosenGoogleFont, weights: [300, 400, 500, 600, 700] },
          ];
          payload.bodyFont = chosenGoogleFont;
          payload.headingFont = chosenGoogleFont;
          payload.buttonFont = chosenGoogleFont;
          payload.fontFamily = chosenGoogleFont;
          payload.headingFontFamily = chosenGoogleFont;
        } else {
          payload.googleFonts = [];
          payload.bodyFont = "system-ui, sans-serif";
          payload.headingFont = "system-ui, sans-serif";
          payload.buttonFont = "system-ui, sans-serif";
          payload.fontFamily = "system-ui, sans-serif";
          payload.headingFontFamily = "system-ui, sans-serif";
        }
      }
      delete payload.googleFontFamily;
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Save failed");
        return;
      }

      const palette = normalizeThemePalette(data);
      form.setFieldsValue({
        ...data,
        googleFontFamily: extractGoogleFontFamily(data),
        paletteColors: Object.entries(palette).map(([key, value]) => ({
          key,
          value,
        })),
        colors: [],
      });
      setThemeColorOptions(buildThemeColorOptions(data));

      message.success(`${activeSectionLabel} settings saved`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("theme-updated", {
            detail: data,
          }),
        );
      }
    } catch {
      message.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAdminLogoUpload = async (options) => {
    const file = options?.file;
    if (!file) {
      options?.onError?.(new Error("No file selected"));
      return;
    }
    setAdminLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data?.error || "Upload failed");
        message.error(error.message);
        options?.onError?.(error);
        return;
      }
      const url = data?.url || data?.path || "";
      form.setFieldsValue({ adminLogoUrl: url });
      message.success("Admin logo uploaded");
      options?.onSuccess?.(data, file);
    } catch (error) {
      message.error("Upload failed");
      options?.onError?.(error);
    } finally {
      setAdminLogoUploading(false);
    }
  };

  if (isDrawerManagedSection || isExternallyManagedSection) {
    return <ActiveSection />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={appearanceInitialValues}
      onFinish={onFinish}
    >
      <ThemeAdminCard
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{activeSectionLabel}</span>}
        extra={
          showGlobalSave ? (
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={<SaveOutlined />}
            >
              Save
            </Button>
          ) : null
        }
      >
        {hideTopSectionTabs ? null : (
          <Row gutter={[8, 8]}>
            {APPEARANCE_SECTIONS.map((item) => (
              <Col xs={12} sm={8} md={6} lg={4} key={item.key}>
                <Link
                  href={`/admin/appearance/${item.key}`}
                  style={{ display: "block" }}
                >
                  <Button
                    block
                    type={activeSection === item.key ? "primary" : "default"}
                  >
                    {item.label}
                  </Button>
                </Link>
              </Col>
            ))}
          </Row>
        )}

        <div style={{ marginTop: hideTopSectionTabs ? 0 : 20 }}>
          {loading ? (
            <div
              style={{
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin indicator={<LoadingOutlined spin />} />
            </div>
          ) : (
            <ActiveSection
              form={form}
              adminLogoUploading={adminLogoUploading}
              onAdminLogoUpload={handleAdminLogoUpload}
              themeColorOptions={themeColorOptions}
              onSaved={refreshThemeData}
            />
          )}
        </div>
      </ThemeAdminCard>
    </Form>
  );
}
