"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  Collapse,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as SiteComponents from "@/components/site";

const HeaderPreview = dynamic(() => import("@/components/site/Header"), {
  ssr: false,
});
const FooterPreview = dynamic(() => import("@/components/site/Footer"), {
  ssr: false,
});

const POSITION_OPTIONS = [
  { value: "before", label: "Above content (e.g. header)" },
  { value: "after", label: "Below content (e.g. footer)" },
];

const LOGO_TYPE_OPTIONS = [
  { value: "text", label: "Text (site title)" },
  { value: "image", label: "Image" },
];

export default function AdminComponentEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [themePaletteData, setThemePaletteData] = useState({
    themePalette: {},
    colors: [],
  });
  const [themeHeaderSnapshot, setThemeHeaderSnapshot] = useState(null);
  const [themeFooterSnapshot, setThemeFooterSnapshot] = useState(null);
  const [themeHomeHeroSnapshot, setThemeHomeHeroSnapshot] = useState(null);
  const [form] = Form.useForm();
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [hoveringName, setHoveringName] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const footerBgType = Form.useWatch("footerBgType", form);
  const displayNameValue = Form.useWatch("displayName", form);
  const homeHeroSlidesWatch = Form.useWatch("homeHeroSlides", form);

  const isHeader = record?.componentId === "Header";
  const isFooter = record?.componentId === "Footer";
  const isHomeHero = record?.componentId === "HomeHero";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const found = list.find((c) => c.componentId === id);
        if (!found) {
          message.error("Component not found");
          router.push("/admin/components");
          return;
        }
        setRecord(found);
        form.setFieldsValue({
          displayName: found.displayName || found.componentId,
          global: found.global === true,
          position: found.position || "before",
        });
      })
      .catch(() => {
        message.error("Failed to load component");
        router.push("/admin/components");
      })
      .finally(() => setLoading(false));
  }, [id, form, router]);

  useEffect(() => {
    if (!isHeader) return;
    setThemeLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme.themePalette || {};
        const customColors = Array.isArray(theme.colors) ? theme.colors : [];
        setThemePaletteData({ themePalette: palette, colors: customColors });
        setThemeHeaderSnapshot({
          siteTitle: theme.siteTitle ?? "",
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          logoMobileUrl: theme.logoMobileUrl ?? "",
          headerVolunteerLabel: theme.headerVolunteerLabel ?? "",
          headerVolunteerHref: theme.headerVolunteerHref ?? "",
          headerVolunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
          headerVolunteerIconUrlMobile:
            theme.headerVolunteerIconUrlMobile ?? "",
          headerDonateLabel: theme.headerDonateLabel ?? "",
          headerDonateHref: theme.headerDonateHref ?? "",
          headerDonateIconUrl: theme.headerDonateIconUrl ?? "",
          headerDonateIconUrlMobile: theme.headerDonateIconUrlMobile ?? "",
          headerBgColorKey: theme.headerBgColorKey ?? "headerBg",
          headerCtaBgColorKey: theme.headerCtaBgColorKey ?? "headerCta",
          headerCtaTextColorKey: theme.headerCtaTextColorKey ?? "primary",
          headerDonateBgColorKey: theme.headerDonateBgColorKey ?? "gradient",
          headerDonateTextColorKey: theme.headerDonateTextColorKey ?? "white",
        });
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
        form.setFieldsValue({
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          logoMobileUrl: theme.logoMobileUrl ?? "",
          headerVolunteerLabel: theme.headerVolunteerLabel ?? "",
          headerVolunteerHref: theme.headerVolunteerHref ?? "",
          headerVolunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
          headerVolunteerIconUrlMobile:
            theme.headerVolunteerIconUrlMobile ?? "",
          headerDonateLabel: theme.headerDonateLabel ?? "",
          headerDonateHref: theme.headerDonateHref ?? "",
          headerDonateIconUrl: theme.headerDonateIconUrl ?? "",
          headerDonateIconUrlMobile: theme.headerDonateIconUrlMobile ?? "",
          headerBgColorKey: theme.headerBgColorKey ?? "headerBg",
          headerCtaBgColorKey: theme.headerCtaBgColorKey ?? "headerCta",
          headerCtaTextColorKey: theme.headerCtaTextColorKey ?? "primary",
          headerDonateBgColorKey: theme.headerDonateBgColorKey ?? "gradient",
          headerDonateTextColorKey: theme.headerDonateTextColorKey ?? "white",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isHeader, form]);

  useEffect(() => {
    if (!isFooter) return;
    setThemeLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme.themePalette || {};
        const customColors = Array.isArray(theme.colors) ? theme.colors : [];
        setThemePaletteData({ themePalette: palette, colors: customColors });
        setThemeFooterSnapshot({
          siteTitle: theme.siteTitle ?? "Mesco Trust",
          footerLogoUrl: theme.footerLogoUrl ?? "",
          footerAddress: theme.footerAddress ?? "",
          footerEmail: theme.footerEmail ?? "",
          footerPhone: theme.footerPhone ?? "",
          footerCol1Links: Array.isArray(theme.footerCol1Links)
            ? theme.footerCol1Links
            : [],
          footerCol2Links: Array.isArray(theme.footerCol2Links)
            ? theme.footerCol2Links
            : [],
          footerCopyrightText: theme.footerCopyrightText ?? "",
          footerBgColorKey: theme.footerBgColorKey ?? "",
          footerBackgroundImageUrl: theme.footerBackgroundImageUrl ?? "",
          footerTextColorKey: theme.footerTextColorKey ?? "",
          footerCopyrightBarColorKey: theme.footerCopyrightBarColorKey ?? "",
        });
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
        form.setFieldsValue({
          footerLogoUrl: theme.footerLogoUrl ?? "",
          footerAddress: theme.footerAddress ?? "",
          footerEmail: theme.footerEmail ?? "",
          footerPhone: theme.footerPhone ?? "",
          footerCol1Links: Array.isArray(theme.footerCol1Links)
            ? theme.footerCol1Links
            : [],
          footerCol2Links: Array.isArray(theme.footerCol2Links)
            ? theme.footerCol2Links
            : [],
          footerCopyrightText: theme.footerCopyrightText ?? "",
          footerBgColorKey: theme.footerBgColorKey ?? "",
          footerBackgroundImageUrl: theme.footerBackgroundImageUrl ?? "",
          footerBgType:
            theme.footerBackgroundImageUrl &&
            String(theme.footerBackgroundImageUrl).trim()
              ? "image"
              : theme.footerBgColorKey && String(theme.footerBgColorKey).trim()
                ? "color"
                : "image",
          footerTextColorKey: theme.footerTextColorKey ?? "",
          footerCopyrightBarColorKey: theme.footerCopyrightBarColorKey ?? "",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isFooter, form]);

  // HomeHero: same pattern as Header — fetch theme once, set snapshot then form from API response (no cache-bust; rely on cache: "no-store")
  useEffect(() => {
    if (!isHomeHero) return;
    setThemeLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme.themePalette || {};
        const customColors = Array.isArray(theme.colors) ? theme.colors : [];
        setThemePaletteData({ themePalette: palette, colors: customColors });
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        // All from DB — no default slide; empty array if no slides
        const slides = Array.isArray(theme?.homeHeroSlides)
          ? theme.homeHeroSlides.map((s) => ({
              bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
              title: s?.title != null ? String(s.title).trim() : "",
              description: s?.description != null ? String(s.description).trim() : "",
              buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              showButton: s?.showButton !== false,
            }))
          : [];
        setThemeHomeHeroSnapshot({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: theme.homeHeroSliderTitleColorKey != null ? String(theme.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: theme.homeHeroSliderDescColorKey != null ? String(theme.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: theme.homeHeroSliderButtonBgColorKey != null ? String(theme.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: theme.homeHeroSliderButtonTextColorKey != null ? String(theme.homeHeroSliderButtonTextColorKey).trim() : "",
        });
        form.setFieldsValue({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: theme.homeHeroSliderTitleColorKey != null ? String(theme.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: theme.homeHeroSliderDescColorKey != null ? String(theme.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: theme.homeHeroSliderButtonBgColorKey != null ? String(theme.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: theme.homeHeroSliderButtonTextColorKey != null ? String(theme.homeHeroSliderButtonTextColorKey).trim() : "",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isHomeHero, form]);

  const handleSubmit = async () => {
    if (!record?.componentId) return;
    setSaving(true);
    try {
      // Get current form state first so theme (HomeHero) always saves to DB even if validation fails later
      const rawFormValues = form.getFieldsValue(true);
      let values = rawFormValues;

      if (isHomeHero) {
        const rawSlides = rawFormValues.homeHeroSlides ?? [];
        const slides = Array.isArray(rawSlides)
          ? rawSlides.map((s) => ({
              bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
              title: s?.title != null ? String(s.title).trim() : "",
              description: s?.description != null ? String(s.description).trim() : "",
              buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              showButton: s?.showButton !== false,
            }))
          : [];
        const themeRes = await fetch("/api/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeHeroSlides: slides,
            homeHeroSliderTitleColorKey: rawFormValues.homeHeroSliderTitleColorKey != null ? String(rawFormValues.homeHeroSliderTitleColorKey).trim() : "",
            homeHeroSliderDescColorKey: rawFormValues.homeHeroSliderDescColorKey != null ? String(rawFormValues.homeHeroSliderDescColorKey).trim() : "",
            homeHeroSliderButtonBgColorKey: rawFormValues.homeHeroSliderButtonBgColorKey != null ? String(rawFormValues.homeHeroSliderButtonBgColorKey).trim() : "",
            homeHeroSliderButtonTextColorKey: rawFormValues.homeHeroSliderButtonTextColorKey != null ? String(rawFormValues.homeHeroSliderButtonTextColorKey).trim() : "",
          }),
        });
        if (!themeRes.ok) {
          const err = await themeRes.json().catch(() => ({}));
          message.error(err.error || "Failed to save Home Hero");
          setSaving(false);
          return;
        }
        message.success("Slides saved to database");
      }

      try {
        values = await form.validateFields();
      } catch (e) {
        if (e.errorFields && isHomeHero) {
          values = rawFormValues;
        } else {
          setSaving(false);
          throw e;
        }
      }

      if (isHeader) {
        const themeRes = await fetch("/api/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logoType: values.logoType || "text",
            logoLightUrl: values.logoLightUrl?.trim() || "",
            logoMobileUrl: values.logoMobileUrl?.trim() || "",
            logoImageUrl: values.logoLightUrl?.trim() || "",
            headerVolunteerLabel: values.headerVolunteerLabel?.trim() ?? "",
            headerVolunteerHref: values.headerVolunteerHref?.trim() ?? "",
            headerVolunteerIconUrl: values.headerVolunteerIconUrl?.trim() ?? "",
            headerVolunteerIconUrlMobile:
              values.headerVolunteerIconUrlMobile?.trim() ?? "",
            headerDonateLabel: values.headerDonateLabel?.trim() ?? "",
            headerDonateHref: values.headerDonateHref?.trim() ?? "",
            headerDonateIconUrl: values.headerDonateIconUrl?.trim() || "",
            headerDonateIconUrlMobile:
              values.headerDonateIconUrlMobile?.trim() || "",
            headerBgColorKey: values.headerBgColorKey ?? "headerBg",
            headerCtaBgColorKey: values.headerCtaBgColorKey ?? "headerCta",
            headerCtaTextColorKey: values.headerCtaTextColorKey ?? "primary",
            headerDonateBgColorKey: values.headerDonateBgColorKey ?? "gradient",
            headerDonateTextColorKey:
              values.headerDonateTextColorKey ?? "white",
          }),
        });
        if (!themeRes.ok) {
          const err = await themeRes.json().catch(() => ({}));
          message.error(err.error || "Failed to save header content");
          setSaving(false);
          return;
        }
      }

      if (isFooter) {
        const allValues = form.getFieldsValue(true);
        const col1 = Array.isArray(allValues.footerCol1Links)
          ? allValues.footerCol1Links
          : [];
        const col2 = Array.isArray(allValues.footerCol2Links)
          ? allValues.footerCol2Links
          : [];
        const footerLogoUrl =
          allValues.footerLogoUrl && String(allValues.footerLogoUrl).trim()
            ? String(allValues.footerLogoUrl).trim()
            : "";
        const themeRes = await fetch("/api/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            footerLogoUrl,
            footerAddress:
              allValues.footerAddress && String(allValues.footerAddress).trim()
                ? String(allValues.footerAddress).trim()
                : "",
            footerEmail:
              allValues.footerEmail && String(allValues.footerEmail).trim()
                ? String(allValues.footerEmail).trim()
                : "",
            footerPhone:
              allValues.footerPhone && String(allValues.footerPhone).trim()
                ? String(allValues.footerPhone).trim()
                : "",
            footerCol1Links: col1.map((it) => ({
              label: it?.label ?? "",
              url: it?.url ?? "",
            })),
            footerCol2Links: col2.map((it) => ({
              label: it?.label ?? "",
              url: it?.url ?? "",
            })),
            footerCopyrightText:
              allValues.footerCopyrightText &&
              String(allValues.footerCopyrightText).trim()
                ? String(allValues.footerCopyrightText).trim()
                : "",
            footerBgColorKey:
              allValues.footerBgType === "image"
                ? ""
                : (allValues.footerBgColorKey ?? ""),
            footerBackgroundImageUrl:
              allValues.footerBgType === "image"
                ? allValues.footerBackgroundImageUrl != null
                  ? String(allValues.footerBackgroundImageUrl).trim()
                  : ""
                : "",
            footerTextColorKey: allValues.footerTextColorKey ?? "",
            footerCopyrightBarColorKey:
              allValues.footerCopyrightBarColorKey ?? "",
          }),
        });
        if (!themeRes.ok) {
          const err = await themeRes.json().catch(() => ({}));
          message.error(err.error || "Failed to save footer content");
          setSaving(false);
          return;
        }
        const savedTheme = await themeRes.json().catch(() => ({}));
        const savedBgImage =
          savedTheme.footerBackgroundImageUrl != null
            ? String(savedTheme.footerBackgroundImageUrl).trim()
            : "";
        const savedBgColorKey =
          savedTheme.footerBgColorKey != null
            ? String(savedTheme.footerBgColorKey).trim()
            : "";
        const savedBgType = savedBgImage
          ? "image"
          : savedBgColorKey
            ? "color"
            : "image";
        form.setFieldsValue({
          footerLogoUrl: savedTheme.footerLogoUrl ?? footerLogoUrl ?? "",
          footerAddress: savedTheme.footerAddress ?? "",
          footerEmail: savedTheme.footerEmail ?? "",
          footerPhone: savedTheme.footerPhone ?? "",
          footerCol1Links: Array.isArray(savedTheme.footerCol1Links)
            ? savedTheme.footerCol1Links
            : [],
          footerCol2Links: Array.isArray(savedTheme.footerCol2Links)
            ? savedTheme.footerCol2Links
            : [],
          footerCopyrightText: savedTheme.footerCopyrightText ?? "",
          footerBgColorKey: savedTheme.footerBgColorKey ?? "",
          footerBackgroundImageUrl: savedTheme.footerBackgroundImageUrl ?? "",
          footerBgType: savedBgType,
          footerTextColorKey: savedTheme.footerTextColorKey ?? "",
          footerCopyrightBarColorKey:
            savedTheme.footerCopyrightBarColorKey ?? "",
        });
        setThemeFooterSnapshot((prev) =>
          prev
            ? {
                ...prev,
                footerLogoUrl: savedTheme.footerLogoUrl ?? footerLogoUrl ?? "",
                footerBackgroundImageUrl:
                  savedTheme.footerBackgroundImageUrl ?? "",
              }
            : prev,
        );
      }

      const res = await fetch(
        `/api/admin/site-components/${record.componentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: values.displayName?.trim() || record.componentId,
            global: values.global,
            position: values.position,
            order: record.order ?? 0,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Update failed");
        setSaving(false);
        return;
      }
      message.success("Component updated");
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!record?.componentId) return;
    if (record.componentId === "Header" || record.componentId === "Footer") {
      message.warning("Header and Footer cannot be deleted.");
      return;
    }
    Modal.confirm({
      title: "Delete this component?",
      content: `"${record.displayName || record.componentId}" will be removed from the component list and will no longer appear in Add Component. The file components/site/${record.componentId}.js will remain; you can delete it manually if needed.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setDeleting(true);
        try {
          const res = await fetch(
            `/api/admin/site-components/${encodeURIComponent(record.componentId)}`,
            { method: "DELETE" },
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            message.error(data.error || "Delete failed");
            return;
          }
          message.success("Component deleted");
          router.push("/admin/components");
        } catch (e) {
          message.error(e.message || "Delete failed");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!record) return null;

  return (
    <>
      <Form form={form} layout="vertical">
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/admin/components">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                aria-label="Back to components"
              />
            </Link>
            {editingDisplayName ? (
              <Input
                autoFocus
                size="small"
                value={
                  displayNameValue ??
                  record?.displayName ??
                  record?.componentId ??
                  ""
                }
                onChange={(e) =>
                  form.setFieldsValue({ displayName: e.target.value })
                }
                onBlur={() => setEditingDisplayName(false)}
                onPressEnter={() => setEditingDisplayName(false)}
                style={{ width: 220, fontSize: 18, fontWeight: 600 }}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setEditingDisplayName(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setEditingDisplayName(true);
                }}
                onMouseEnter={() => setHoveringName(true)}
                onMouseLeave={() => setHoveringName(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 600,
                }}
                title="Click to edit name"
              >
                <span>
                  Edit{" "}
                  {displayNameValue ||
                    record?.displayName ||
                    record?.componentId ||
                    ""}
                </span>
                {hoveringName && (
                  <EditOutlined style={{ fontSize: 14, opacity: 0.7 }} />
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: "#666" }}>
              Show on all pages
            </span>
            <Form.Item name="global" noStyle valuePropName="checked">
              <Switch />
            </Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={saving}
            >
              Save
            </Button>
            {record?.componentId &&
              record.componentId !== "Header" &&
              record.componentId !== "Footer" && (
                <Button
                  type="default"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={deleting}
                >
                  Delete
                </Button>
              )}
          </div>
        </div>

        {isHeader && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                <div className="mt-5">
                  <HeaderPreviewBlock
                    form={form}
                    themePaletteData={themePaletteData}
                    themeHeaderSnapshot={themeHeaderSnapshot}
                  />
                </div>

                <Collapse
                  className="mt-4"
                  defaultActiveKey={[]}
                  items={[
                    {
                      key: "logo",
                      label: "Logo",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item name="logoType" label="Logo type">
                              <Select options={LOGO_TYPE_OPTIONS} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="logoLightUrl"
                              label="Desktop logo image URL"
                            >
                              <Input placeholder="/images/logo.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="logoMobileUrl"
                              label="Mobile logo image URL (optional)"
                            >
                              <Input placeholder="/images/logo-mobile.svg" />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "volunteer",
                      label: "Volunteer button",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerVolunteerLabel"
                              label="Label (text)"
                            >
                              <Input placeholder="Volunteer" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item name="headerVolunteerHref" label="Link">
                              <Input placeholder="/volunteer" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerVolunteerIconUrl"
                              label="Desktop icon image URL"
                            >
                              <Input placeholder="/images/volunteer-icon.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerVolunteerIconUrlMobile"
                              label="Mobile icon image URL (optional)"
                            >
                              <Input placeholder="/images/volunteer-icon-mobile.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerCtaBgColorKey"
                              label="Button background color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerCtaTextColorKey"
                              label="Button text color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "donate",
                      label: "Donate button",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateLabel"
                              label="Label (text)"
                            >
                              <Input placeholder="Donate Now" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item name="headerDonateHref" label="Link">
                              <Input placeholder="/donate" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateIconUrl"
                              label="Desktop icon image URL"
                            >
                              <Input placeholder="/images/donate-now-icon.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateIconUrlMobile"
                              label="Mobile icon image URL (optional)"
                            >
                              <Input placeholder="/images/donate-now-icon-mobile.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateBgColorKey"
                              label="Button background color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateTextColorKey"
                              label="Button text color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "colors",
                      label: "Header colors (mobile menu)",
                      children: (
                        <>
                          <Row gutter={24}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="headerBgColorKey"
                                label="Responsive Nav Background"
                              >
                                <Select
                                  options={themeColorOptions}
                                  placeholder="Select from Theme"
                                  style={{ width: "100%" }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}

        {isFooter && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                <div className="mt-5">
                  <FooterPreviewBlock
                    form={form}
                    themePaletteData={themePaletteData}
                    themeFooterSnapshot={themeFooterSnapshot}
                  />
                </div>
                <Collapse
                  className="mt-4"
                  defaultActiveKey={[]}
                  destroyInactivePanelContent={false}
                  items={[
                    {
                      key: "logo",
                      label: "Logo",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="footerLogoUrl"
                              label="Footer logo image URL"
                            >
                              <Input placeholder="/images/footer-logo.svg" />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "address",
                      label: "Address & contact",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item name="footerAddress" label="Address">
                              <Input.TextArea
                                rows={3}
                                placeholder="Full address"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item name="footerEmail" label="Email">
                              <Input placeholder="email@example.org" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item name="footerPhone" label="Phone">
                              <Input placeholder="Phone numbers" />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "col1",
                      label: "Column 1 links",
                      children: (
                        <>
                          <p
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              fontSize: 12,
                            }}
                          >
                            Add: click &quot;+ Add link&quot;. Update: edit Link
                            text and URL in each row. Delete: click the delete
                            icon on a row.
                          </p>
                          <Form.List name="footerCol1Links">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...rest }) => (
                                  <Row
                                    key={key}
                                    gutter={8}
                                    align="middle"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Col xs={24} md={9}>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "label"]}
                                        label="Link text"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Required",
                                          },
                                        ]}
                                      >
                                        <Input placeholder="e.g. Educational Support Programmes" />
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} md={9}>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "url"]}
                                        label="URL"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Required",
                                          },
                                        ]}
                                      >
                                        <Input placeholder="e.g. /programmes" />
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                      <Button
                                        type="text"
                                        danger
                                        onClick={() => remove(name)}
                                        style={{ marginTop: 4 }}
                                        icon={<DeleteOutlined />}
                                        aria-label="Remove link"
                                      />
                                    </Col>
                                  </Row>
                                ))}
                                <Form.Item>
                                  <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                  >
                                    + Add link
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </>
                      ),
                    },
                    {
                      key: "col2",
                      label: "Column 2 links",
                      children: (
                        <>
                          <p
                            style={{
                              marginBottom: 12,
                              color: "#666",
                              fontSize: 12,
                            }}
                          >
                            Add: click &quot;+ Add link&quot;. Update: edit Link
                            text and URL in each row. Delete: click the delete
                            icon on a row.
                          </p>
                          <Form.List name="footerCol2Links">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...rest }) => (
                                  <Row
                                    key={key}
                                    gutter={8}
                                    align="middle"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Col xs={24} md={9}>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "label"]}
                                        label="Link text"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Required",
                                          },
                                        ]}
                                      >
                                        <Input placeholder="e.g. Relief of Poverty" />
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} md={9}>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "url"]}
                                        label="URL"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Required",
                                          },
                                        ]}
                                      >
                                        <Input placeholder="e.g. /relief" />
                                      </Form.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                      <Button
                                        type="text"
                                        danger
                                        onClick={() => remove(name)}
                                        style={{ marginTop: 4 }}
                                        icon={<DeleteOutlined />}
                                        aria-label="Remove link"
                                      />
                                    </Col>
                                  </Row>
                                ))}
                                <Form.Item>
                                  <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                  >
                                    + Add link
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </>
                      ),
                    },
                    {
                      key: "copyright",
                      label: "Copyright",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="footerCopyrightText"
                              label="Copyright text"
                            >
                              <Input placeholder="Copyright © 2023 All Rights Reserved." />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "colors",
                      label: "Footer colors",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="footerBgType"
                              label="Footer background"
                            >
                              <Select
                                options={[
                                  { value: "color", label: "Color" },
                                  { value: "image", label: "Image" },
                                ]}
                                placeholder="Select"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            {footerBgType === "image" ? (
                              <Form.Item
                                name="footerBackgroundImageUrl"
                                label="Background image URL"
                              >
                                <Input placeholder="/uploads/1772449953147_footer-bg.svg" />
                              </Form.Item>
                            ) : (
                              <Form.Item
                                name="footerBgColorKey"
                                label="Background color"
                              >
                                <Select
                                  options={themeColorOptions}
                                  placeholder="Select color from Theme"
                                  style={{ width: "100%" }}
                                  allowClear
                                />
                              </Form.Item>
                            )}
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="footerTextColorKey"
                              label="Text & links color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select color from Theme"
                                style={{ width: "100%" }}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="footerCopyrightBarColorKey"
                              label="Copyright bar color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select color from Theme"
                                style={{ width: "100%" }}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}

        {isHomeHero && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                <div className="mt-5">
                  <HomeHeroPreviewBlock
                    form={form}
                    slides={homeHeroSlidesWatch ?? themeHomeHeroSnapshot?.homeHeroSlides ?? []}
                    themeHomeHeroSnapshot={themeHomeHeroSnapshot}
                    themePaletteData={themePaletteData}
                  />
                </div>
                <Collapse
                  className="mt-4"
                  defaultActiveKey={["slider", "colors"]}
                  items={[
                    {
                      key: "slider",
                      label: "Slides (add multiple sliders; order = display order)",
                      children: (
                        <Form.List name="homeHeroSlides">
                          {(fields, { add, remove }) => (
                            <>
                              <Collapse
                                accordion
                                size="small"
                                style={{ marginBottom: 12 }}
                                items={fields.map(({ key, name, ...restField }) => ({
                                  key: String(name),
                                  label: (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 8 }}>
                                      <strong>Slide {name + 1}</strong>
                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            remove(name);
                                          }}
                                        >
                                          Remove
                                        </Button>
                                      )}
                                    </span>
                                  ),
                                  children: (
                                    <Row gutter={[16, 12]}>
                                      <Col xs={24} md={8}>
                                        <Form.Item
                                          {...restField}
                                          name={[name, "bgImageUrl"]}
                                          label="Background image URL"
                                        >
                                          <Input placeholder="e.g. /images/slider.png" size="small" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item {...restField} name={[name, "title"]} label="Title">
                                          <Input placeholder="Because Every Learner Deserves Support" size="small" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item {...restField} name={[name, "buttonText"]} label="Button name (label)">
                                          <Input placeholder="e.g. Contact Us" size="small" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item {...restField} name={[name, "showButton"]} label="Show button on this slide" valuePropName="checked">
                                          <Switch />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item {...restField} name={[name, "buttonLink"]} label="Button link (URL)">
                                          <Input placeholder="/contact" size="small" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item {...restField} name={[name, "description"]} label="Description">
                                          <Input.TextArea rows={2} placeholder="A community-powered initiative that brings donors, mentors..." />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  ),
                                }))}
                              />
                              <Button
                                type="dashed"
                                onClick={() =>
                                  add({
                                    bgImageUrl: "/images/slider-1.png",
                                    title: "",
                                    description: "",
                                    buttonText: "Contact Us",
                                    buttonLink: "/contact",
                                    showButton: true,
                                  })
                                }
                                block
                                icon={<PlusOutlined />}
                                size="small"
                              >
                                Add slide
                              </Button>
                            </>
                          )}
                        </Form.List>
                      ),
                    },
                    {
                      key: "colors",
                      label: "Theme colors",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={12}>
                            <Form.Item name="homeHeroSliderTitleColorKey" label="Slider title color">
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme (empty = white)"
                                style={{ width: "100%" }}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name="homeHeroSliderDescColorKey" label="Slider description color">
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme (empty = white)"
                                style={{ width: "100%" }}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name="homeHeroSliderButtonBgColorKey" label="Button background color">
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name="homeHeroSliderButtonTextColorKey" label="Button text color">
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}

        {!isHeader && !isFooter && !isHomeHero && record?.componentId && (
          <>
            <Divider />
            <div className="mt-5">
              {SiteComponents[record.componentId] ? (
                <div
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#fff",
                    padding: 24,
                  }}
                >
                  {(() => {
                    const Comp = SiteComponents[record.componentId];
                    return Comp ? <Comp /> : null;
                  })()}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#fff",
                    padding: 48,
                    color: "#999",
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  File <code>components/site/{record.componentId}.js</code> me
                  default export add karein; preview yahan dikhega.
                </div>
              )}
            </div>
          </>
        )}

        <Form.Item name="displayName" hidden>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name="position" hidden>
          <Input type="hidden" />
        </Form.Item>
      </Form>
    </>
  );
}

function resolveThemeColorFromPalette(paletteData, key) {
  if (!key) return "";
  const palette = paletteData?.themePalette || {};
  if (palette[key] != null && String(palette[key]).trim() !== "")
    return String(palette[key]).trim();
  const custom = paletteData?.colors || [];
  const found = custom.find(
    (c) => c && String(c.name).trim() === String(key).trim(),
  );
  return found && found.value != null ? String(found.value).trim() : "";
}

function HeaderPreviewBlock({ form, themePaletteData, themeHeaderSnapshot }) {
  const s = themeHeaderSnapshot;
  // All values from theme/DB (no static fallbacks). Site title comes from theme snapshot (Theme Settings).
  const siteTitle = s?.siteTitle ?? "";
  const logoType = Form.useWatch("logoType", form) || s?.logoType || "text";
  const logoLightUrl =
    Form.useWatch("logoLightUrl", form) || s?.logoLightUrl || "";
  const logoMobileUrl =
    Form.useWatch("logoMobileUrl", form) || s?.logoMobileUrl || "";
  const volunteerLabel =
    Form.useWatch("headerVolunteerLabel", form) ||
    s?.headerVolunteerLabel ||
    "";
  const volunteerHref =
    Form.useWatch("headerVolunteerHref", form) || s?.headerVolunteerHref || "";
  const volunteerIconUrl =
    Form.useWatch("headerVolunteerIconUrl", form) ||
    s?.headerVolunteerIconUrl ||
    "";
  const volunteerIconUrlMobile =
    Form.useWatch("headerVolunteerIconUrlMobile", form) ||
    s?.headerVolunteerIconUrlMobile ||
    "";
  const donateLabel =
    Form.useWatch("headerDonateLabel", form) || s?.headerDonateLabel || "";
  const donateHref =
    Form.useWatch("headerDonateHref", form) || s?.headerDonateHref || "";
  const donateIconUrl =
    Form.useWatch("headerDonateIconUrl", form) || s?.headerDonateIconUrl || "";
  const donateIconUrlMobile =
    Form.useWatch("headerDonateIconUrlMobile", form) ||
    s?.headerDonateIconUrlMobile ||
    "";
  const headerBgColorKey =
    Form.useWatch("headerBgColorKey", form) ||
    s?.headerBgColorKey ||
    "headerBg";
  const headerCtaBgColorKey =
    Form.useWatch("headerCtaBgColorKey", form) ||
    s?.headerCtaBgColorKey ||
    "headerCta";
  const headerCtaTextColorKey =
    Form.useWatch("headerCtaTextColorKey", form) ||
    s?.headerCtaTextColorKey ||
    "primary";
  const headerDonateBgColorKey =
    Form.useWatch("headerDonateBgColorKey", form) ||
    s?.headerDonateBgColorKey ||
    "gradient";
  const headerDonateTextColorKey =
    Form.useWatch("headerDonateTextColorKey", form) ||
    s?.headerDonateTextColorKey ||
    "white";

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        overflow: "visible",
        background: "#fafafa",
        minHeight: 96,
        width: "100%",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <HeaderPreview
        preview
        menuItems={[]}
        siteTitle={siteTitle}
        logoType={logoType}
        logoLightUrl={logoLightUrl}
        logoMobileUrl={logoMobileUrl || undefined}
        logoImageUrl={logoLightUrl}
        logoDarkUrl=""
        volunteerLabel={volunteerLabel}
        volunteerHref={volunteerHref}
        volunteerIconUrl={volunteerIconUrl || undefined}
        volunteerIconUrlMobile={volunteerIconUrlMobile || undefined}
        donateLabel={donateLabel}
        donateHref={donateHref}
        donateIconUrl={donateIconUrl || undefined}
        donateIconUrlMobile={donateIconUrlMobile || undefined}
        headerBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerBgColorKey,
        )}
        headerCtaBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerCtaBgColorKey,
        )}
        headerCtaTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerCtaTextColorKey,
        )}
        headerDonateBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateBgColorKey,
        )}
        headerDonateTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateTextColorKey,
        )}
      />
    </div>
  );
}

function FooterPreviewBlock({ form, themePaletteData, themeFooterSnapshot }) {
  const s = themeFooterSnapshot;
  const siteTitle = s?.siteTitle || "Mesco Trust";
  const footerLogoUrl =
    Form.useWatch("footerLogoUrl", form) || s?.footerLogoUrl || "";
  const footerAddress =
    Form.useWatch("footerAddress", form) || s?.footerAddress || "";
  const footerEmail =
    Form.useWatch("footerEmail", form) || s?.footerEmail || "";
  const footerPhone =
    Form.useWatch("footerPhone", form) || s?.footerPhone || "";
  const footerCol1Links =
    Form.useWatch("footerCol1Links", form) || s?.footerCol1Links || [];
  const footerCol2Links =
    Form.useWatch("footerCol2Links", form) || s?.footerCol2Links || [];
  const footerCopyrightText =
    Form.useWatch("footerCopyrightText", form) || s?.footerCopyrightText || "";
  const footerBgColorKey =
    Form.useWatch("footerBgColorKey", form) || s?.footerBgColorKey || "";
  const footerBackgroundImageUrl =
    Form.useWatch("footerBackgroundImageUrl", form) ||
    s?.footerBackgroundImageUrl ||
    "";
  const footerTextColorKey =
    Form.useWatch("footerTextColorKey", form) || s?.footerTextColorKey || "";
  const footerCopyrightBarColorKey =
    Form.useWatch("footerCopyrightBarColorKey", form) ||
    s?.footerCopyrightBarColorKey ||
    "";

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        overflow: "visible",
        background: "#fafafa",
        minHeight: 96,
        width: "100%",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <FooterPreview
        preview
        siteTitle={siteTitle}
        footerLogoUrl={footerLogoUrl}
        footerAddress={footerAddress}
        footerEmail={footerEmail}
        footerPhone={footerPhone}
        footerCol1Links={Array.isArray(footerCol1Links) ? footerCol1Links : []}
        footerCol2Links={Array.isArray(footerCol2Links) ? footerCol2Links : []}
        footerCopyrightText={footerCopyrightText}
        footerBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          footerBgColorKey,
        )}
        footerBackgroundImageUrl={footerBackgroundImageUrl}
        footerTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          footerTextColorKey,
        )}
        footerCopyrightBarValue={resolveThemeColorFromPalette(
          themePaletteData,
          footerCopyrightBarColorKey,
        )}
      />
    </div>
  );
}

function HomeHeroPreviewBlock({ form, slides: slidesProp, themeHomeHeroSnapshot, themePaletteData }) {
  const slides = Array.isArray(slidesProp) ? slidesProp : (themeHomeHeroSnapshot?.homeHeroSlides ?? []);
  const titleColorKey = Form.useWatch("homeHeroSliderTitleColorKey", form) ?? themeHomeHeroSnapshot?.homeHeroSliderTitleColorKey ?? "";
  const descColorKey = Form.useWatch("homeHeroSliderDescColorKey", form) ?? themeHomeHeroSnapshot?.homeHeroSliderDescColorKey ?? "";
  const buttonBgColorKey = Form.useWatch("homeHeroSliderButtonBgColorKey", form) ?? themeHomeHeroSnapshot?.homeHeroSliderButtonBgColorKey ?? "";
  const buttonTextColorKey = Form.useWatch("homeHeroSliderButtonTextColorKey", form) ?? themeHomeHeroSnapshot?.homeHeroSliderButtonTextColorKey ?? "";

  const titleColor = titleColorKey ? resolveThemeColorFromPalette(themePaletteData, titleColorKey) : undefined;
  const descColor = descColorKey ? resolveThemeColorFromPalette(themePaletteData, descColorKey) : undefined;
  const buttonBgColor = buttonBgColorKey ? resolveThemeColorFromPalette(themePaletteData, buttonBgColorKey) : undefined;
  const buttonTextColor = buttonTextColorKey ? resolveThemeColorFromPalette(themePaletteData, buttonTextColorKey) : undefined;

  const HomeHeroComp = SiteComponents.HomeHero;
  if (!HomeHeroComp) return <div style={{ padding: 24, color: "#999" }}>HomeHero component not found.</div>;

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fafafa",
        width: "100%",
      }}
    >
      <HomeHeroComp
        slides={Array.isArray(slides) ? slides : []}
        sliderTitleColor={titleColor}
        sliderDescColor={descColor}
        sliderButtonBgColor={buttonBgColor}
        sliderButtonTextColor={buttonTextColor}
      />
    </div>
  );
}
