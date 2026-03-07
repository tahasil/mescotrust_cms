"use client";

import { useState, useEffect, useRef } from "react";
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
  Drawer,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as SiteComponents from "@/components/site";
import { EDITABLE_SITE_EDIT_FORMS } from "@/components/site";

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
  const [themeMarqueeSnapshot, setThemeMarqueeSnapshot] = useState(null);
  const [themeSubscribeSnapshot, setThemeSubscribeSnapshot] = useState(null);
  const [themeLatestEvents1Snapshot, setThemeLatestEvents1Snapshot] =
    useState(null);
  const [themeTestimonialsSnapshot, setThemeTestimonialsSnapshot] =
    useState(null);
  const [componentDrawerOpen, setComponentDrawerOpen] = useState(false);
  const [drawerUpdateLoading, setDrawerUpdateLoading] = useState(false);
  const [dynamicEditForm, setDynamicEditForm] = useState(null);
  const componentEditFormRef = useRef(null);
  const [form] = Form.useForm();
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [hoveringName, setHoveringName] = useState(false);
  const displayNameValue = Form.useWatch("displayName", form);
  const globalOn = Form.useWatch("global", form);
  const isHeader = record?.componentId === "Header";
  const isFooter = record?.componentId === "Footer";
  const isHomeHero = record?.componentId === "HomeHero";
  const isMarquee = record?.componentId === "Marquee";
  const isSubscribe = record?.componentId === "Subscribe";
  const isLatestEvents1 = record?.componentId === "LatestEvents1";
  const isTestimonials = record?.componentId === "Testimonials";
  const staticEditForm =
    record?.componentId && EDITABLE_SITE_EDIT_FORMS[record.componentId];
  const hasEditForm = !!(staticEditForm || dynamicEditForm);

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
        const initialValues = {
          displayName: found.displayName || found.componentId,
          global: found.global === true,
          position: found.position || "before",
        };
        if (found.componentId === "Marquee") {
          initialValues.marqueeTitle =
            "Our CSR Partners | Awards & Recognition";
          initialValues.marqueeItems = [];
        }
        form.setFieldsValue(initialValues);
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
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
        // All from DB — no default slide; empty array if no slides
        const slides = Array.isArray(theme?.homeHeroSlides)
          ? theme.homeHeroSlides.map((s) => ({
              bgImageUrl:
                s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
              title: s?.title != null ? String(s.title).trim() : "",
              description:
                s?.description != null ? String(s.description).trim() : "",
              buttonText:
                s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink:
                s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              showButton: s?.showButton !== false,
            }))
          : [];
        setThemeHomeHeroSnapshot({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey:
            theme.homeHeroSliderTitleColorKey != null
              ? String(theme.homeHeroSliderTitleColorKey).trim()
              : "",
          homeHeroSliderDescColorKey:
            theme.homeHeroSliderDescColorKey != null
              ? String(theme.homeHeroSliderDescColorKey).trim()
              : "",
          homeHeroSliderButtonBgColorKey:
            theme.homeHeroSliderButtonBgColorKey != null
              ? String(theme.homeHeroSliderButtonBgColorKey).trim()
              : "",
          homeHeroSliderButtonTextColorKey:
            theme.homeHeroSliderButtonTextColorKey != null
              ? String(theme.homeHeroSliderButtonTextColorKey).trim()
              : "",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isHomeHero, form]);

  // Marquee: fetch theme once, set form from API response
  useEffect(() => {
    if (!isMarquee) return;
    setThemeLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const title =
          theme.marqueeTitle != null
            ? String(theme.marqueeTitle).trim()
            : "Our CSR Partners | Awards & Recognition";
        const items = Array.isArray(theme.marqueeItems)
          ? theme.marqueeItems.map((it) => ({
              url: it?.url != null ? String(it.url).trim() : "",
              alt: it?.alt != null ? String(it.alt).trim() : "",
            }))
          : [];
        setThemeMarqueeSnapshot({ marqueeTitle: title, marqueeItems: items });
        form.setFieldsValue({ marqueeTitle: title, marqueeItems: items });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isMarquee, form]);

  // LatestEvents1: fetch component data for preview
  useEffect(() => {
    if (!isLatestEvents1) return;
    setThemeLoading(true);
    fetch("/api/theme/LatestEvents1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const items = Array.isArray(data?.latestEvents1Items)
          ? data.latestEvents1Items.map((it) => ({
              imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
              date: it?.date != null ? String(it.date).trim() : "",
              title: it?.title != null ? String(it.title).trim() : "",
              description:
                it?.description != null ? String(it.description).trim() : "",
              buttonText:
                it?.buttonText != null
                  ? String(it.buttonText).trim()
                  : "Read Post",
              buttonLink:
                it?.buttonLink != null ? String(it.buttonLink).trim() : "/",
            }))
          : [];
        setThemeLatestEvents1Snapshot({
          latestEvents1SubTitle:
            data?.latestEvents1SubTitle != null
              ? String(data.latestEvents1SubTitle).trim()
              : "Latest News",
          latestEvents1MainTitle:
            data?.latestEvents1MainTitle != null
              ? String(data.latestEvents1MainTitle).trim()
              : "Stay Informed. Stay Ahead.",
          latestEvents1Items: items,
          latestEvents1SubTitleColorKey:
            data?.latestEvents1SubTitleColorKey != null
              ? String(data.latestEvents1SubTitleColorKey).trim()
              : "",
          latestEvents1MainTitleColorKey:
            data?.latestEvents1MainTitleColorKey != null
              ? String(data.latestEvents1MainTitleColorKey).trim()
              : "",
          latestEvents1ButtonColorKey:
            data?.latestEvents1ButtonColorKey != null
              ? String(data.latestEvents1ButtonColorKey).trim()
              : "",
        });
      })
      .catch(() => message.error("Failed to load Latest Events"))
      .finally(() => setThemeLoading(false));
  }, [isLatestEvents1]);

  // Testimonials: fetch component data for preview
  useEffect(() => {
    if (!isTestimonials) return;
    setThemeLoading(true);
    fetch("/api/theme/Testimonials", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const items = Array.isArray(data?.testimonialsItems)
          ? data.testimonialsItems.map((it) => ({
              quote: it?.quote != null ? String(it.quote).trim() : "",
              imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
              name: it?.name != null ? String(it.name).trim() : "",
              title: it?.title != null ? String(it.title).trim() : "",
              rating: Math.min(5, Math.max(0, Number(it?.rating) || 0)),
            }))
          : [];
        setThemeTestimonialsSnapshot({
          testimonialsTitle:
            data?.testimonialsTitle != null
              ? String(data.testimonialsTitle).trim()
              : "Testimonials",
          testimonialsTitleColorKey:
            data?.testimonialsTitleColorKey != null
              ? String(data.testimonialsTitleColorKey).trim()
              : "",
          testimonialsNameColorKey:
            data?.testimonialsNameColorKey != null
              ? String(data.testimonialsNameColorKey).trim()
              : "",
          testimonialsRoleColorKey:
            data?.testimonialsRoleColorKey != null
              ? String(data.testimonialsRoleColorKey).trim()
              : "",
          testimonialsRatingColorKey:
            data?.testimonialsRatingColorKey != null
              ? String(data.testimonialsRatingColorKey).trim()
              : "",
          testimonialsTitleEnabled: data?.testimonialsTitleEnabled !== false,
          testimonialsNameColorEnabled: data?.testimonialsNameColorEnabled === true,
          testimonialsRoleColorEnabled: data?.testimonialsRoleColorEnabled === true,
          testimonialsRatingColorEnabled: data?.testimonialsRatingColorEnabled === true,
          testimonialsAutoplay: data?.testimonialsAutoplay ?? false,
          testimonialsAutoplaySpeed:
            data?.testimonialsAutoplaySpeed != null
              ? Number(data.testimonialsAutoplaySpeed)
              : 5000,
          testimonialsShowArrows: data?.testimonialsShowArrows !== false,
          testimonialsShowDots: data?.testimonialsShowDots !== false,
          testimonialsSpeed:
            data?.testimonialsSpeed != null
              ? Number(data.testimonialsSpeed)
              : 400,
          testimonialsDraggable: data?.testimonialsDraggable ?? false,
          testimonialsInfinite: data?.testimonialsInfinite !== false,
          testimonialsSlidesDesktop:
            data?.testimonialsSlidesDesktop != null
              ? Number(data.testimonialsSlidesDesktop)
              : 3,
          testimonialsSlidesTablet:
            data?.testimonialsSlidesTablet != null
              ? Number(data.testimonialsSlidesTablet)
              : 2,
          testimonialsSlidesMobile:
            data?.testimonialsSlidesMobile != null
              ? Number(data.testimonialsSlidesMobile)
              : 1,
          testimonialsItems: items,
        });
      })
      .catch(() => message.error("Failed to load Testimonials"))
      .finally(() => setThemeLoading(false));
  }, [isTestimonials]);

  // Newly created components: load EditForm dynamically from component folder
  useEffect(() => {
    if (!record?.componentId || EDITABLE_SITE_EDIT_FORMS[record.componentId]) {
      setDynamicEditForm(null);
      return;
    }
    import(`@/components/site/${record.componentId}`)
      .then((m) => {
        const EditForm =
          m[`${record.componentId}EditForm`] ||
          m.EditForm ||
          m.default?.EditForm;
        setDynamicEditForm(() => EditForm);
      })
      .catch(() => setDynamicEditForm(null));
  }, [record?.componentId]);

  const handleSubmit = async () => {
    if (!record?.componentId) return;
    setSaving(true);
    try {
      // Component content (Header, Footer, HomeHero, Marquee, Subscribe) is saved via drawer EditForm → components collection.
      // Main Save only updates metadata: displayName, global, position.
      const values = await form.validateFields();
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, color: "#666" }}>
              Show on all pages
            </span>
            <Form.Item name="global" noStyle valuePropName="checked">
              <Switch />
            </Form.Item>
            {globalOn &&
              record?.componentId !== "Header" &&
              record?.componentId !== "Footer" && (
                <Form.Item
                  name="position"
                  label={null}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    options={POSITION_OPTIONS}
                    style={{ minWidth: 200 }}
                    placeholder="Position (when global)"
                  />
                </Form.Item>
              )}
            {hasEditForm && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => setComponentDrawerOpen(true)}
              >
                Edit
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={saving}
            >
              Save
            </Button>
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
                <HeaderPreviewBlock
                  form={form}
                  themePaletteData={themePaletteData}
                  themeHeaderSnapshot={themeHeaderSnapshot}
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
                <FooterPreviewBlock
                  form={form}
                  themePaletteData={themePaletteData}
                  themeFooterSnapshot={themeFooterSnapshot}
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
                <HomeHeroPreviewBlock
                  form={form}
                  slides={themeHomeHeroSnapshot?.homeHeroSlides ?? []}
                  themeHomeHeroSnapshot={themeHomeHeroSnapshot}
                  themePaletteData={themePaletteData}
                />
              </>
            )}
          </>
        )}

        {isMarquee && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                {SiteComponents.Marquee ? (
                  <SiteComponents.Marquee
                    title={themeMarqueeSnapshot?.marqueeTitle ?? ""}
                    images={themeMarqueeSnapshot?.marqueeItems ?? []}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    Marquee component not found.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isSubscribe && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                {SiteComponents.Subscribe ? (
                  <SiteComponents.Subscribe
                    {...(themeSubscribeSnapshot || {})}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    Subscribe component not found.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isLatestEvents1 && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                {SiteComponents.LatestEvents1 ? (
                  <SiteComponents.LatestEvents1
                    {...(themeLatestEvents1Snapshot || {})}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    Latest Events component not found.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isTestimonials && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                {SiteComponents.Testimonials ? (
                  <SiteComponents.Testimonials
                    {...(themeTestimonialsSnapshot || {})}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    Testimonials component not found.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {hasEditForm && (
          <Drawer
            title={`Edit ${record?.displayName || record?.componentId || ""}`}
            placement="right"
            width={Math.min(
              520,
              typeof window !== "undefined" ? window.innerWidth * 0.9 : 520,
            )}
            open={componentDrawerOpen}
            onClose={() => setComponentDrawerOpen(false)}
            extra={
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={drawerUpdateLoading}
                disabled={drawerUpdateLoading}
                onClick={async () => {
                  try {
                    setDrawerUpdateLoading(true);
                    await componentEditFormRef.current?.update?.();
                  } catch {
                    setDrawerUpdateLoading(false);
                    // error already shown by EditForm
                  }
                }}
              >
                Update
              </Button>
            }
          >
            {(() => {
              const EditFormComp =
                (record?.componentId &&
                  EDITABLE_SITE_EDIT_FORMS[record.componentId]) ||
                dynamicEditForm;
              if (!EditFormComp) return null;
              const refetchAndClose = async () => {
                const cid = record?.componentId;
                const res = await fetch("/api/theme", { cache: "no-store" });
                if (!res.ok) return;
                const theme = await res.json();
                if (cid === "Header") {
                  setThemeHeaderSnapshot({
                    siteTitle: theme.siteTitle ?? "",
                    logoType: theme.logoType ?? "text",
                    logoLightUrl:
                      theme.logoLightUrl || theme.logoImageUrl || "",
                    logoMobileUrl: theme.logoMobileUrl ?? "",
                    headerVolunteerLabel: theme.headerVolunteerLabel ?? "",
                    headerVolunteerHref: theme.headerVolunteerHref ?? "",
                    headerVolunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
                    headerVolunteerIconUrlMobile:
                      theme.headerVolunteerIconUrlMobile ?? "",
                    headerDonateLabel: theme.headerDonateLabel ?? "",
                    headerDonateHref: theme.headerDonateHref ?? "",
                    headerDonateIconUrl: theme.headerDonateIconUrl ?? "",
                    headerDonateIconUrlMobile:
                      theme.headerDonateIconUrlMobile ?? "",
                    headerBgColorKey: theme.headerBgColorKey ?? "headerBg",
                    headerCtaBgColorKey:
                      theme.headerCtaBgColorKey ?? "headerCta",
                    headerCtaTextColorKey:
                      theme.headerCtaTextColorKey ?? "primary",
                    headerDonateBgColorKey:
                      theme.headerDonateBgColorKey ?? "gradient",
                    headerDonateTextColorKey:
                      theme.headerDonateTextColorKey ?? "white",
                  });
                } else if (cid === "Footer") {
                  setThemeFooterSnapshot({
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
                    footerBackgroundImageUrl:
                      theme.footerBackgroundImageUrl ?? "",
                    footerTextColorKey: theme.footerTextColorKey ?? "",
                    footerCopyrightBarColorKey:
                      theme.footerCopyrightBarColorKey ?? "",
                  });
                } else if (cid === "HomeHero") {
                  const slides = Array.isArray(theme?.homeHeroSlides)
                    ? theme.homeHeroSlides.map((s) => ({
                        bgImageUrl:
                          s?.bgImageUrl != null
                            ? String(s.bgImageUrl).trim()
                            : "",
                        title: s?.title != null ? String(s.title).trim() : "",
                        description:
                          s?.description != null
                            ? String(s.description).trim()
                            : "",
                        buttonText:
                          s?.buttonText != null
                            ? String(s.buttonText).trim()
                            : "",
                        buttonLink:
                          s?.buttonLink != null
                            ? String(s.buttonLink).trim()
                            : "",
                        showButton: s?.showButton !== false,
                      }))
                    : [];
                  setThemeHomeHeroSnapshot({
                    homeHeroSlides: slides,
                    homeHeroSliderTitleColorKey:
                      theme.homeHeroSliderTitleColorKey != null
                        ? String(theme.homeHeroSliderTitleColorKey).trim()
                        : "",
                    homeHeroSliderDescColorKey:
                      theme.homeHeroSliderDescColorKey != null
                        ? String(theme.homeHeroSliderDescColorKey).trim()
                        : "",
                    homeHeroSliderButtonBgColorKey:
                      theme.homeHeroSliderButtonBgColorKey != null
                        ? String(theme.homeHeroSliderButtonBgColorKey).trim()
                        : "",
                    homeHeroSliderButtonTextColorKey:
                      theme.homeHeroSliderButtonTextColorKey != null
                        ? String(theme.homeHeroSliderButtonTextColorKey).trim()
                        : "",
                  });
                } else if (cid === "Marquee") {
                  setThemeMarqueeSnapshot({
                    marqueeTitle:
                      theme.marqueeTitle != null
                        ? String(theme.marqueeTitle).trim()
                        : "",
                    marqueeItems: Array.isArray(theme.marqueeItems)
                      ? theme.marqueeItems.map((it) => ({
                          url: it?.url ?? "",
                          alt: it?.alt ?? "",
                        }))
                      : [],
                  });
                } else if (cid === "Subscribe") {
                  setThemeSubscribeSnapshot({
                    subscribeSubtitle: theme.subscribeSubtitle ?? "",
                    subscribeTitle: theme.subscribeTitle ?? "",
                    subscribePlaceholder: theme.subscribePlaceholder ?? "",
                    subscribeButtonText: theme.subscribeButtonText ?? "",
                    subscribeBgUrl: theme.subscribeBgUrl ?? "",
                    subscribeSubtitleColorKey:
                      theme.subscribeSubtitleColorKey ?? "",
                    subscribeTitleColorKey: theme.subscribeTitleColorKey ?? "",
                    subscribeButtonBgColorKey:
                      theme.subscribeButtonBgColorKey ?? "",
                    subscribeButtonTextColorKey:
                      theme.subscribeButtonTextColorKey ?? "",
                  });
                } else if (cid === "LatestEvents1") {
                  const items = Array.isArray(theme?.latestEvents1Items)
                    ? theme.latestEvents1Items.map((it) => ({
                        imageUrl:
                          it?.imageUrl != null
                            ? String(it.imageUrl).trim()
                            : "",
                        date: it?.date != null ? String(it.date).trim() : "",
                        title: it?.title != null ? String(it.title).trim() : "",
                        description:
                          it?.description != null
                            ? String(it.description).trim()
                            : "",
                        buttonText:
                          it?.buttonText != null
                            ? String(it.buttonText).trim()
                            : "Read Post",
                        buttonLink:
                          it?.buttonLink != null
                            ? String(it.buttonLink).trim()
                            : "/",
                      }))
                    : [];
                  setThemeLatestEvents1Snapshot({
                    latestEvents1SubTitle:
                      theme?.latestEvents1SubTitle != null
                        ? String(theme.latestEvents1SubTitle).trim()
                        : "Latest News",
                    latestEvents1MainTitle:
                      theme?.latestEvents1MainTitle != null
                        ? String(theme.latestEvents1MainTitle).trim()
                        : "Stay Informed. Stay Ahead.",
                    latestEvents1Items: items,
                    latestEvents1SubTitleColorKey:
                      theme?.latestEvents1SubTitleColorKey != null
                        ? String(theme.latestEvents1SubTitleColorKey).trim()
                        : "",
                    latestEvents1MainTitleColorKey:
                      theme?.latestEvents1MainTitleColorKey != null
                        ? String(theme.latestEvents1MainTitleColorKey).trim()
                        : "",
                    latestEvents1ButtonColorKey:
                      theme?.latestEvents1ButtonColorKey != null
                        ? String(theme.latestEvents1ButtonColorKey).trim()
                        : "",
                  });
                } else if (cid === "Testimonials") {
                  const items = Array.isArray(theme?.testimonialsItems)
                    ? theme.testimonialsItems.map((it) => ({
                        quote:
                          it?.quote != null ? String(it.quote).trim() : "",
                        imageUrl:
                          it?.imageUrl != null
                            ? String(it.imageUrl).trim()
                            : "",
                        name: it?.name != null ? String(it.name).trim() : "",
                        title: it?.title != null ? String(it.title).trim() : "",
                        rating: Math.min(
                          5,
                          Math.max(0, Number(it?.rating) || 0),
                        ),
                      }))
                    : [];
                  setThemeTestimonialsSnapshot({
                    testimonialsTitle:
                      theme?.testimonialsTitle != null
                        ? String(theme.testimonialsTitle).trim()
                        : "Testimonials",
                    testimonialsTitleColorKey:
                      theme?.testimonialsTitleColorKey != null
                        ? String(theme.testimonialsTitleColorKey).trim()
                        : "",
                    testimonialsNameColorKey:
                      theme?.testimonialsNameColorKey != null
                        ? String(theme.testimonialsNameColorKey).trim()
                        : "",
                    testimonialsRoleColorKey:
                      theme?.testimonialsRoleColorKey != null
                        ? String(theme.testimonialsRoleColorKey).trim()
                        : "",
                    testimonialsRatingColorKey:
                      theme?.testimonialsRatingColorKey != null
                        ? String(theme.testimonialsRatingColorKey).trim()
                        : "",
                    testimonialsTitleEnabled: theme?.testimonialsTitleEnabled !== false,
                    testimonialsNameColorEnabled: theme?.testimonialsNameColorEnabled === true,
                    testimonialsRoleColorEnabled: theme?.testimonialsRoleColorEnabled === true,
                    testimonialsRatingColorEnabled: theme?.testimonialsRatingColorEnabled === true,
                    testimonialsAutoplay: theme?.testimonialsAutoplay ?? false,
                    testimonialsAutoplaySpeed:
                      theme?.testimonialsAutoplaySpeed != null
                        ? Number(theme.testimonialsAutoplaySpeed)
                        : 5000,
                    testimonialsShowArrows:
                      theme?.testimonialsShowArrows !== false,
                    testimonialsShowDots: theme?.testimonialsShowDots !== false,
                    testimonialsSpeed:
                      theme?.testimonialsSpeed != null
                        ? Number(theme.testimonialsSpeed)
                        : 400,
                    testimonialsDraggable: theme?.testimonialsDraggable ?? false,
                    testimonialsInfinite: theme?.testimonialsInfinite !== false,
                    testimonialsSlidesDesktop:
                      theme?.testimonialsSlidesDesktop != null
                        ? Number(theme.testimonialsSlidesDesktop)
                        : 3,
                    testimonialsSlidesTablet:
                      theme?.testimonialsSlidesTablet != null
                        ? Number(theme.testimonialsSlidesTablet)
                        : 2,
                    testimonialsSlidesMobile:
                      theme?.testimonialsSlidesMobile != null
                        ? Number(theme.testimonialsSlidesMobile)
                        : 1,
                    testimonialsItems: items,
                  });
                }
                setComponentDrawerOpen(false);
                setDrawerUpdateLoading(false);
                message.success(`${record?.displayName || cid} saved`);
              };
              return (
                <EditFormComp
                  ref={componentEditFormRef}
                  onSuccess={refetchAndClose}
                  onCancel={() => setComponentDrawerOpen(false)}
                />
              );
            })()}
          </Drawer>
        )}

        {!isHeader &&
          !isFooter &&
          !isHomeHero &&
          !isMarquee &&
          !isSubscribe &&
          !isLatestEvents1 &&
          !isTestimonials &&
          record?.componentId && (
            <>
              <Divider />
              <>
                {SiteComponents[record.componentId] ? (
                  <>
                    {(() => {
                      const Comp = SiteComponents[record.componentId];
                      return Comp ? <Comp /> : null;
                    })()}
                  </>
                ) : (
                  <div className="mt-5">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )}
              </>
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

function HomeHeroPreviewBlock({
  form,
  slides: slidesProp,
  themeHomeHeroSnapshot,
  themePaletteData,
}) {
  const slides = Array.isArray(slidesProp)
    ? slidesProp
    : (themeHomeHeroSnapshot?.homeHeroSlides ?? []);
  const titleColorKey =
    Form.useWatch("homeHeroSliderTitleColorKey", form) ??
    themeHomeHeroSnapshot?.homeHeroSliderTitleColorKey ??
    "";
  const descColorKey =
    Form.useWatch("homeHeroSliderDescColorKey", form) ??
    themeHomeHeroSnapshot?.homeHeroSliderDescColorKey ??
    "";
  const buttonBgColorKey =
    Form.useWatch("homeHeroSliderButtonBgColorKey", form) ??
    themeHomeHeroSnapshot?.homeHeroSliderButtonBgColorKey ??
    "";
  const buttonTextColorKey =
    Form.useWatch("homeHeroSliderButtonTextColorKey", form) ??
    themeHomeHeroSnapshot?.homeHeroSliderButtonTextColorKey ??
    "";

  const titleColor = titleColorKey
    ? resolveThemeColorFromPalette(themePaletteData, titleColorKey)
    : undefined;
  const descColor = descColorKey
    ? resolveThemeColorFromPalette(themePaletteData, descColorKey)
    : undefined;
  const buttonBgColor = buttonBgColorKey
    ? resolveThemeColorFromPalette(themePaletteData, buttonBgColorKey)
    : undefined;
  const buttonTextColor = buttonTextColorKey
    ? resolveThemeColorFromPalette(themePaletteData, buttonTextColorKey)
    : undefined;

  const HomeHeroComp = SiteComponents.HomeHero;
  if (!HomeHeroComp)
    return (
      <div style={{ padding: 24, color: "#999" }}>
        HomeHero component not found.
      </div>
    );

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
