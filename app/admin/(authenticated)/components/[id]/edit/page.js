"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  Input,
  Button,
  Card,
  Collapse,
  message,
  Spin,
  Row,
  Col,
  Drawer,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
  PlusOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";
import dynamic from "next/dynamic";
import * as SiteComponents from "@/components/site";
import { EDITABLE_SITE_EDIT_FORMS } from "@/components/site";
import {
  getManageSectionSnapshot,
  MANAGE_SECTION_PREFIX_BY_COMPONENT_ID,
} from "@/lib/manageSectionFields";

const HeaderPreview = dynamic(() => import("@/components/appearance/AppearanceHeader"), {
  ssr: false,
});
const FooterPreview = dynamic(() => import("@/components/appearance/AppearanceFooter"), {
  ssr: false,
});

const LOGO_TYPE_OPTIONS = [
  { value: "text", label: "Text (site title)" },
  { value: "image", label: "Image" },
];

function normalizeHeaderAnnouncementItems(theme = {}) {
  const items = Array.isArray(theme?.headerAnnouncementItems)
    ? theme.headerAnnouncementItems
    : [];
  const normalized = items
    .map((item) => ({
      text: item?.text != null ? String(item.text).trim() : "",
      url: item?.url != null ? String(item.url).trim() : "",
      target:
        String(item?.target || "").trim() === "_blank" ? "_blank" : "_self",
    }))
    .filter((item) => item.text);
  if (normalized.length > 0) return normalized;
  const fallbackText = String(theme?.headerAnnouncementText || "").trim();
  if (!fallbackText) return [];
  return [
    {
      text: fallbackText,
      url: String(theme?.headerAnnouncementLinkUrl || "").trim(),
      target:
        String(theme?.headerAnnouncementLinkTarget || "").trim() === "_blank"
          ? "_blank"
          : "_self",
    },
  ];
}

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
  const [themeLatestNewsSnapshot, setThemeLatestNewsSnapshot] =
    useState(null);
  const [themeTestimonialsSnapshot, setThemeTestimonialsSnapshot] =
    useState(null);
  const [themeSnapshotForDynamic, setThemeSnapshotForDynamic] = useState({});
  const [componentDrawerOpen, setComponentDrawerOpen] = useState(false);
  const [drawerUpdateLoading, setDrawerUpdateLoading] = useState(false);
  const [dynamicEditForm, setDynamicEditForm] = useState(null);
  const componentEditFormRef = useRef(null);
  const [form] = Form.useForm();
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [hoveringName, setHoveringName] = useState(false);
  const displayNameValue = Form.useWatch("displayName", form);
  const isHeader = record?.componentId === "Header";
  const isFooter = record?.componentId === "Footer";
  const isHomeHero = record?.componentId === "HomeHero";
  const isMarquee = record?.componentId === "Marquee";
  const isSubscribe = record?.componentId === "Subscribe";
  const isLatestNews = record?.componentId === "LatestNews";
  const isTestimonials = record?.componentId === "Testimonials";
  const staticEditForm =
    record?.componentId && EDITABLE_SITE_EDIT_FORMS[record.componentId];
  const hasEditForm = !!(staticEditForm || dynamicEditForm);

  useEffect(() => {
    if (!id) return;
    if (id === "Header" || id === "Footer") {
      router.replace(`/admin/appearance/${id.toLowerCase()}`);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/site-components/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.status === 404) {
          message.error("Component not found");
          router.push("/admin/components");
          return null;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load component");
        }
        return res.json();
      })
      .then((found) => {
        if (!found) return;
        setRecord(found);
        const initialValues = {
          displayName: found.displayName || found.componentId,
          global: found.global === true,
          position: found.position || "before",
        };
        if (found.componentId === "Marquee") {
          initialValues.marqueeTitle =
            "Our CSR Partners | Awards & Recognition";
          initialValues.marqueePartnersTitle = "Our CSR Partners";
          initialValues.marqueeAwardsTitle = "Awards & Recognition";
          initialValues.marqueeItems = [];
        }
        form.setFieldsValue(initialValues);
      })
      .catch((err) => {
        message.error(err?.message || "Failed to load component");
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
          headerSearchEnabled: theme.headerSearchEnabled === true,
          headerSearchLabel: theme.headerSearchLabel ?? "",
          headerSearchOpenAriaLabel: theme.headerSearchOpenAriaLabel ?? "",
          headerSearchPlaceholder: theme.headerSearchPlaceholder ?? "",
          headerSearchDialogLabel: theme.headerSearchDialogLabel ?? "",
          headerSearchInputAriaLabel: theme.headerSearchInputAriaLabel ?? "",
          headerSearchCloseAriaLabel: theme.headerSearchCloseAriaLabel ?? "",
          headerSearchMinCharsMessage: theme.headerSearchMinCharsMessage ?? "",
          headerSearchLoadingMessage: theme.headerSearchLoadingMessage ?? "",
          headerSearchNoResultsMessage: theme.headerSearchNoResultsMessage ?? "",
          headerSearchErrorMessage: theme.headerSearchErrorMessage ?? "",
          headerSearchResultTypePageLabel:
            theme.headerSearchResultTypePageLabel ?? "",
          headerSearchResultTypeBlogLabel:
            theme.headerSearchResultTypeBlogLabel ?? "",
          headerSearchResultTypeEventLabel:
            theme.headerSearchResultTypeEventLabel ?? "",
          headerSearchFallbackTitle: theme.headerSearchFallbackTitle ?? "",
          headerSearchFallbackMeta: theme.headerSearchFallbackMeta ?? "",
          headerAnnouncementEnabled: theme.headerAnnouncementEnabled === true,
          headerAnnouncementItems: normalizeHeaderAnnouncementItems(theme),
          headerAnnouncementText: theme.headerAnnouncementText ?? "",
          headerAnnouncementLinkUrl: theme.headerAnnouncementLinkUrl ?? "",
          headerAnnouncementLinkTarget:
            theme.headerAnnouncementLinkTarget ?? "_self",
          headerAnnouncementFontSize: theme.headerAnnouncementFontSize,
          headerAnnouncementFontWeight:
            theme.headerAnnouncementFontWeight ?? "600",
          headerAnnouncementTextColor: theme.headerAnnouncementTextColor ?? "",
          headerAnnouncementBackgroundColor:
            theme.headerAnnouncementBackgroundColor ?? "",
          headerAnnouncementMarqueeSpeed:
            theme.headerAnnouncementMarqueeSpeed,
          headerAnnouncementDirection:
            String(theme.headerAnnouncementDirection || "")
              .trim()
              .toLowerCase() === "ltr"
              ? "ltr"
              : "rtl",
          headerAnnouncementPaddingX: theme.headerAnnouncementPaddingX,
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          logoMobileUrl: theme.logoMobileUrl ?? "",
          logoUrl: theme.logoUrl ?? "",
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
          volunteerModalTitle: theme.volunteerModalTitle ?? "",
          volunteerModalSuccessTitle: theme.volunteerModalSuccessTitle ?? "",
          volunteerModalSuccessDescription:
            theme.volunteerModalSuccessDescription ?? "",
          volunteerModalErrorTitle: theme.volunteerModalErrorTitle ?? "",
          volunteerModalNameLabel: theme.volunteerModalNameLabel ?? "",
          volunteerModalEmailLabel: theme.volunteerModalEmailLabel ?? "",
          volunteerModalSubjectLabel: theme.volunteerModalSubjectLabel ?? "",
          volunteerModalMessageLabel: theme.volunteerModalMessageLabel ?? "",
          volunteerModalNamePlaceholder:
            theme.volunteerModalNamePlaceholder ?? "",
          volunteerModalEmailPlaceholder:
            theme.volunteerModalEmailPlaceholder ?? "",
          volunteerModalSubjectPlaceholder:
            theme.volunteerModalSubjectPlaceholder ?? "",
          volunteerModalMessagePlaceholder:
            theme.volunteerModalMessagePlaceholder ?? "",
          volunteerModalCancelLabel: theme.volunteerModalCancelLabel ?? "",
          volunteerModalSendLabel: theme.volunteerModalSendLabel ?? "",
          volunteerModalSendingLabel: theme.volunteerModalSendingLabel ?? "",
          volunteerModalNameRequiredMessage:
            theme.volunteerModalNameRequiredMessage ?? "",
          volunteerModalEmailRequiredMessage:
            theme.volunteerModalEmailRequiredMessage ?? "",
          volunteerModalEmailInvalidMessage:
            theme.volunteerModalEmailInvalidMessage ?? "",
          volunteerModalSubjectRequiredMessage:
            theme.volunteerModalSubjectRequiredMessage ?? "",
          volunteerModalSubjectMinMessage:
            theme.volunteerModalSubjectMinMessage ?? "",
          volunteerModalMessageRequiredMessage:
            theme.volunteerModalMessageRequiredMessage ?? "",
          volunteerModalMessageMinMessage:
            theme.volunteerModalMessageMinMessage ?? "",
          _sectionBg: theme._sectionBg ?? "",
          _sectionPadding: theme._sectionPadding ?? "",
          _sectionBorderSize: theme._sectionBorderSize ?? "",
          _sectionBorderStyle: theme._sectionBorderStyle ?? "",
          _sectionBorderColor: theme._sectionBorderColor ?? "",
          _sectionShadow: theme._sectionShadow ?? "",
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Header,
            theme,
          ),
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
          headerSearchEnabled: theme.headerSearchEnabled === true,
          headerSearchLabel: theme.headerSearchLabel ?? "",
          headerSearchOpenAriaLabel: theme.headerSearchOpenAriaLabel ?? "",
          headerSearchPlaceholder: theme.headerSearchPlaceholder ?? "",
          headerSearchDialogLabel: theme.headerSearchDialogLabel ?? "",
          headerSearchInputAriaLabel: theme.headerSearchInputAriaLabel ?? "",
          headerSearchCloseAriaLabel: theme.headerSearchCloseAriaLabel ?? "",
          headerSearchMinCharsMessage: theme.headerSearchMinCharsMessage ?? "",
          headerSearchLoadingMessage: theme.headerSearchLoadingMessage ?? "",
          headerSearchNoResultsMessage: theme.headerSearchNoResultsMessage ?? "",
          headerSearchErrorMessage: theme.headerSearchErrorMessage ?? "",
          headerSearchResultTypePageLabel:
            theme.headerSearchResultTypePageLabel ?? "",
          headerSearchResultTypeBlogLabel:
            theme.headerSearchResultTypeBlogLabel ?? "",
          headerSearchResultTypeEventLabel:
            theme.headerSearchResultTypeEventLabel ?? "",
          headerSearchFallbackTitle: theme.headerSearchFallbackTitle ?? "",
          headerSearchFallbackMeta: theme.headerSearchFallbackMeta ?? "",
          headerAnnouncementEnabled: theme.headerAnnouncementEnabled === true,
          headerAnnouncementItems: normalizeHeaderAnnouncementItems(theme),
          headerAnnouncementText: theme.headerAnnouncementText ?? "",
          headerAnnouncementLinkUrl: theme.headerAnnouncementLinkUrl ?? "",
          headerAnnouncementLinkTarget:
            theme.headerAnnouncementLinkTarget ?? "_self",
          headerAnnouncementFontSize: theme.headerAnnouncementFontSize,
          headerAnnouncementFontWeight:
            theme.headerAnnouncementFontWeight ?? "600",
          headerAnnouncementTextColor: theme.headerAnnouncementTextColor ?? "",
          headerAnnouncementBackgroundColor:
            theme.headerAnnouncementBackgroundColor ?? "",
          headerAnnouncementMarqueeSpeed:
            theme.headerAnnouncementMarqueeSpeed,
          headerAnnouncementDirection:
            String(theme.headerAnnouncementDirection || "")
              .trim()
              .toLowerCase() === "ltr"
              ? "ltr"
              : "rtl",
          headerAnnouncementPaddingX: theme.headerAnnouncementPaddingX,
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          logoMobileUrl: theme.logoMobileUrl ?? "",
          logoUrl: theme.logoUrl ?? "",
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
          volunteerModalTitle: theme.volunteerModalTitle ?? "",
          volunteerModalSuccessTitle: theme.volunteerModalSuccessTitle ?? "",
          volunteerModalSuccessDescription:
            theme.volunteerModalSuccessDescription ?? "",
          volunteerModalErrorTitle: theme.volunteerModalErrorTitle ?? "",
          volunteerModalNameLabel: theme.volunteerModalNameLabel ?? "",
          volunteerModalEmailLabel: theme.volunteerModalEmailLabel ?? "",
          volunteerModalSubjectLabel: theme.volunteerModalSubjectLabel ?? "",
          volunteerModalMessageLabel: theme.volunteerModalMessageLabel ?? "",
          volunteerModalNamePlaceholder:
            theme.volunteerModalNamePlaceholder ?? "",
          volunteerModalEmailPlaceholder:
            theme.volunteerModalEmailPlaceholder ?? "",
          volunteerModalSubjectPlaceholder:
            theme.volunteerModalSubjectPlaceholder ?? "",
          volunteerModalMessagePlaceholder:
            theme.volunteerModalMessagePlaceholder ?? "",
          volunteerModalCancelLabel: theme.volunteerModalCancelLabel ?? "",
          volunteerModalSendLabel: theme.volunteerModalSendLabel ?? "",
          volunteerModalSendingLabel: theme.volunteerModalSendingLabel ?? "",
          volunteerModalNameRequiredMessage:
            theme.volunteerModalNameRequiredMessage ?? "",
          volunteerModalEmailRequiredMessage:
            theme.volunteerModalEmailRequiredMessage ?? "",
          volunteerModalEmailInvalidMessage:
            theme.volunteerModalEmailInvalidMessage ?? "",
          volunteerModalSubjectRequiredMessage:
            theme.volunteerModalSubjectRequiredMessage ?? "",
          volunteerModalSubjectMinMessage:
            theme.volunteerModalSubjectMinMessage ?? "",
          volunteerModalMessageRequiredMessage:
            theme.volunteerModalMessageRequiredMessage ?? "",
          volunteerModalMessageMinMessage:
            theme.volunteerModalMessageMinMessage ?? "",
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
          siteTitle: theme.siteTitle ?? "",
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
          footerSocialLinks: Array.isArray(theme.footerSocialLinks)
            ? theme.footerSocialLinks
            : [],
          footerCopyrightText: theme.footerCopyrightText ?? "",
          footerBgColorKey: theme.footerBgColorKey ?? "",
          footerBackgroundImageUrl: theme.footerBackgroundImageUrl ?? "",
          footerTextColorKey: theme.footerTextColorKey ?? "",
          footerCopyrightBarColorKey: theme.footerCopyrightBarColorKey ?? "",
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Footer,
            theme,
          ),
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
          footerSocialLinks: Array.isArray(theme.footerSocialLinks)
            ? theme.footerSocialLinks
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
          homeHeroAutoplay: theme?.homeHeroAutoplay ?? true,
          homeHeroShowArrows: theme?.homeHeroShowArrows ?? true,
          homeHeroShowDots: theme?.homeHeroShowDots ?? true,
          homeHeroAutoplaySpeed:
            theme?.homeHeroAutoplaySpeed != null
              ? Number(theme.homeHeroAutoplaySpeed)
              : 5000,
          homeHeroSpeed:
            theme?.homeHeroSpeed != null ? Number(theme.homeHeroSpeed) : 500,
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.HomeHero,
            theme,
          ),
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isHomeHero, form]);

  // Marquee: fetch theme once, set form from API response
  useEffect(() => {
    if (!isMarquee) return;
    setThemeLoading(true);
    fetch("/api/theme/marquee", { cache: "no-store" })
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
        setThemeMarqueeSnapshot({
          marqueeTitle: title,
          marqueePartnersTitle:
            theme?.marqueePartnersTitle != null
              ? String(theme.marqueePartnersTitle).trim()
              : title.split("|")[0]?.trim() || "Our CSR Partners",
          marqueeAwardsTitle:
            theme?.marqueeAwardsTitle != null
              ? String(theme.marqueeAwardsTitle).trim()
              : title.split("|").slice(1).join(" | ").trim() ||
                "Awards & Recognition",
          marqueeItems: items,
          marqueeTitleColorKey:
            theme?.marqueeTitleColorKey != null
              ? String(theme.marqueeTitleColorKey).trim()
              : "",
          marqueePartnersTitleColorKey:
            theme?.marqueePartnersTitleColorKey != null
              ? String(theme.marqueePartnersTitleColorKey).trim()
              : theme?.marqueeTitleColorKey != null
                ? String(theme.marqueeTitleColorKey).trim()
                : "",
          marqueeAwardsTitleColorKey:
            theme?.marqueeAwardsTitleColorKey != null
              ? String(theme.marqueeAwardsTitleColorKey).trim()
              : "",
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Marquee,
            theme,
          ),
        });
        form.setFieldsValue({ marqueeTitle: title, marqueeItems: items });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isMarquee, form]);

  // Latest News: fetch component data for preview
  useEffect(() => {
    if (!isLatestNews) return;
    setThemeLoading(true);
    fetch("/api/theme/LatestNews", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const items = Array.isArray(data?.latestEvents1Items)
          ? data.latestEvents1Items.map((it) => ({
              ...it,
              imageUrlDesktop:
                it?.imageUrlDesktop != null
                  ? String(it.imageUrlDesktop).trim()
                  : it?.imageUrl != null
                    ? String(it.imageUrl).trim()
                    : "",
              imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
              tag: it?.tag != null ? String(it.tag).trim() : "",
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
        setThemeLatestNewsSnapshot({
          ...data,
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
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.LatestNews,
            data,
          ),
        });
      })
      .catch(() => message.error("Failed to load Latest News"))
      .finally(() => setThemeLoading(false));
  }, [isLatestNews]);

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
              name: it?.name != null ? String(it.name).trim() : "",
              title: it?.title != null ? String(it.title).trim() : "",
              rating: Math.min(5, Math.max(0, Number(it?.rating) || 0)),
            }))
          : [];
        setThemeTestimonialsSnapshot({
          ...getManageSectionSnapshot(
            MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Testimonials,
            data,
          ),
          testimonialsTitle:
            data?.testimonialsTitle != null
              ? String(data.testimonialsTitle).trim()
              : "Testimonials",
          testimonialsTitleAlign:
            data?.testimonialsTitleAlign != null
              ? String(data.testimonialsTitleAlign).trim()
              : "center",
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
          testimonialsAvatarBgColorKey:
            data?.testimonialsAvatarBgColorKey != null
              ? String(data.testimonialsAvatarBgColorKey).trim()
              : "",
          testimonialsAvatarTextColorKey:
            data?.testimonialsAvatarTextColorKey != null
              ? String(data.testimonialsAvatarTextColorKey).trim()
              : "",
          testimonialsTitleEnabled: data?.testimonialsTitleEnabled !== false,
          testimonialsNameColorEnabled:
            data?.testimonialsNameColorEnabled === true,
          testimonialsRoleColorEnabled:
            data?.testimonialsRoleColorEnabled === true,
          testimonialsRatingColorEnabled:
            data?.testimonialsRatingColorEnabled === true,
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

  const isDynamicComponent =
    record?.componentId &&
    ![
      "Header",
      "Footer",
      "HomeHero",
      "Marquee",
      "Subscribe",
      "LatestNews",
      "Testimonials",
    ].includes(record.componentId);

  // Load component data for dynamic components so preview gets props — call only /api/theme/[componentId], not /api/theme
  const themeFetchedForDynamicRef = useRef(null);
  useEffect(() => {
    if (!isDynamicComponent || !record?.componentId) return;
    if (themeFetchedForDynamicRef.current === record.componentId) return;
    themeFetchedForDynamicRef.current = record.componentId;
    setThemeLoading(true);
    fetch(`/api/theme/${encodeURIComponent(record.componentId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const { themePalette: _p, colors: _c, ...props } = data || {};
        setThemeSnapshotForDynamic(props || {});
        const palette = _p && typeof _p === "object" ? _p : {};
        const customColors = Array.isArray(_c) ? _c : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
      })
      .catch(() => setThemeSnapshotForDynamic({}))
      .finally(() => setThemeLoading(false));
  }, [isDynamicComponent, record?.componentId]);

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
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!record) return null;

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/components" style={{ marginRight: 8 }}>
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
        </>
      }
      extra={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
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
      }
    >
      <Form form={form} layout="vertical" size="large">
        {isHeader && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
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
                {SiteComponents.Marquee ? (
                  <SiteComponents.Marquee
                    {...themeMarqueeSnapshot}
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

        {isLatestNews && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                {SiteComponents.LatestNews ? (
                  <SiteComponents.LatestNews
                    {...(themeLatestNewsSnapshot || {})}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    Latest News component not found.
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
                    // error already shown by EditForm
                  } finally {
                    setDrawerUpdateLoading(false);
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
                const isDynamicComp =
                  cid &&
                  ![
                    "Header",
                    "Footer",
                    "HomeHero",
                    "Marquee",
                    "Subscribe",
                    "LatestNews",
                    "Testimonials",
                  ].includes(cid);
                if (isDynamicComp) {
                  const res = await fetch(`/api/theme/${encodeURIComponent(cid)}`, { cache: "no-store" });
                  if (!res.ok) return;
                  const data = await res.json();
                  const { themePalette: _p, colors: _c, ...props } = data || {};
                  setThemeSnapshotForDynamic(props || {});
                  setComponentDrawerOpen(false);
                  setDrawerUpdateLoading(false);
                  message.success(`${record?.displayName || cid} saved`);
                  return;
                }
                const res = await fetch(
                  cid === "Marquee" ? "/api/theme/marquee" : "/api/theme",
                  { cache: "no-store" },
                );
                if (!res.ok) return;
                const theme = await res.json();
                if (cid === "Header") {
                  setThemeHeaderSnapshot({
                    siteTitle: theme.siteTitle ?? "",
                    headerSearchEnabled: theme.headerSearchEnabled === true,
                    headerSearchLabel: theme.headerSearchLabel ?? "",
                    headerSearchOpenAriaLabel:
                      theme.headerSearchOpenAriaLabel ?? "",
                    headerSearchPlaceholder:
                      theme.headerSearchPlaceholder ?? "",
                    headerSearchDialogLabel:
                      theme.headerSearchDialogLabel ?? "",
                    headerSearchInputAriaLabel:
                      theme.headerSearchInputAriaLabel ?? "",
                    headerSearchCloseAriaLabel:
                      theme.headerSearchCloseAriaLabel ?? "",
                    headerSearchMinCharsMessage:
                      theme.headerSearchMinCharsMessage ?? "",
                    headerSearchLoadingMessage:
                      theme.headerSearchLoadingMessage ?? "",
                    headerSearchNoResultsMessage:
                      theme.headerSearchNoResultsMessage ?? "",
                    headerSearchErrorMessage:
                      theme.headerSearchErrorMessage ?? "",
                    headerSearchResultTypePageLabel:
                      theme.headerSearchResultTypePageLabel ?? "",
                    headerSearchResultTypeBlogLabel:
                      theme.headerSearchResultTypeBlogLabel ?? "",
                    headerSearchResultTypeEventLabel:
                      theme.headerSearchResultTypeEventLabel ?? "",
                    headerSearchFallbackTitle:
                      theme.headerSearchFallbackTitle ?? "",
                    headerSearchFallbackMeta:
                      theme.headerSearchFallbackMeta ?? "",
                    headerAnnouncementEnabled:
                      theme.headerAnnouncementEnabled === true,
                    headerAnnouncementItems:
                      normalizeHeaderAnnouncementItems(theme),
                    headerAnnouncementText:
                      theme.headerAnnouncementText ?? "",
                    headerAnnouncementLinkUrl:
                      theme.headerAnnouncementLinkUrl ?? "",
                    headerAnnouncementLinkTarget:
                      theme.headerAnnouncementLinkTarget ?? "_self",
                    headerAnnouncementFontSize:
                      theme.headerAnnouncementFontSize,
                    headerAnnouncementFontWeight:
                      theme.headerAnnouncementFontWeight ?? "600",
                    headerAnnouncementTextColor:
                      theme.headerAnnouncementTextColor ?? "",
                    headerAnnouncementBackgroundColor:
                      theme.headerAnnouncementBackgroundColor ?? "",
                    headerAnnouncementMarqueeSpeed:
                      theme.headerAnnouncementMarqueeSpeed,
                    headerAnnouncementDirection:
                      String(theme.headerAnnouncementDirection || "")
                        .trim()
                        .toLowerCase() === "ltr"
                        ? "ltr"
                        : "rtl",
                    headerAnnouncementPaddingX:
                      theme.headerAnnouncementPaddingX,
                    logoType: theme.logoType ?? "text",
                    logoLightUrl:
                      theme.logoLightUrl || theme.logoImageUrl || "",
                    logoMobileUrl: theme.logoMobileUrl ?? "",
                    logoUrl: theme.logoUrl ?? "",
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
                    volunteerModalTitle: theme.volunteerModalTitle ?? "",
                    volunteerModalSuccessTitle:
                      theme.volunteerModalSuccessTitle ?? "",
                    volunteerModalSuccessDescription:
                      theme.volunteerModalSuccessDescription ?? "",
                    volunteerModalErrorTitle:
                      theme.volunteerModalErrorTitle ?? "",
                    volunteerModalNameLabel:
                      theme.volunteerModalNameLabel ?? "",
                    volunteerModalEmailLabel:
                      theme.volunteerModalEmailLabel ?? "",
                    volunteerModalSubjectLabel:
                      theme.volunteerModalSubjectLabel ?? "",
                    volunteerModalMessageLabel:
                      theme.volunteerModalMessageLabel ?? "",
                    volunteerModalNamePlaceholder:
                      theme.volunteerModalNamePlaceholder ?? "",
                    volunteerModalEmailPlaceholder:
                      theme.volunteerModalEmailPlaceholder ?? "",
                    volunteerModalSubjectPlaceholder:
                      theme.volunteerModalSubjectPlaceholder ?? "",
                    volunteerModalMessagePlaceholder:
                      theme.volunteerModalMessagePlaceholder ?? "",
                    volunteerModalCancelLabel:
                      theme.volunteerModalCancelLabel ?? "",
                    volunteerModalSendLabel:
                      theme.volunteerModalSendLabel ?? "",
                    volunteerModalSendingLabel:
                      theme.volunteerModalSendingLabel ?? "",
                    volunteerModalNameRequiredMessage:
                      theme.volunteerModalNameRequiredMessage ?? "",
                    volunteerModalEmailRequiredMessage:
                      theme.volunteerModalEmailRequiredMessage ?? "",
                    volunteerModalEmailInvalidMessage:
                      theme.volunteerModalEmailInvalidMessage ?? "",
                    volunteerModalSubjectRequiredMessage:
                      theme.volunteerModalSubjectRequiredMessage ?? "",
                    volunteerModalSubjectMinMessage:
                      theme.volunteerModalSubjectMinMessage ?? "",
                    volunteerModalMessageRequiredMessage:
                      theme.volunteerModalMessageRequiredMessage ?? "",
                    volunteerModalMessageMinMessage:
                      theme.volunteerModalMessageMinMessage ?? "",
                    _sectionBg: theme._sectionBg ?? "",
                    _sectionPadding: theme._sectionPadding ?? "",
                    _sectionBorderSize: theme._sectionBorderSize ?? "",
                    _sectionBorderStyle: theme._sectionBorderStyle ?? "",
                    _sectionBorderColor: theme._sectionBorderColor ?? "",
                    _sectionShadow: theme._sectionShadow ?? "",
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Header,
                      theme,
                    ),
                  });
                  form.setFieldsValue({
                    headerSearchEnabled: theme.headerSearchEnabled === true,
                    headerSearchLabel: theme.headerSearchLabel ?? "",
                    headerSearchOpenAriaLabel:
                      theme.headerSearchOpenAriaLabel ?? "",
                    headerSearchPlaceholder:
                      theme.headerSearchPlaceholder ?? "",
                    headerSearchDialogLabel:
                      theme.headerSearchDialogLabel ?? "",
                    headerSearchInputAriaLabel:
                      theme.headerSearchInputAriaLabel ?? "",
                    headerSearchCloseAriaLabel:
                      theme.headerSearchCloseAriaLabel ?? "",
                    headerSearchMinCharsMessage:
                      theme.headerSearchMinCharsMessage ?? "",
                    headerSearchLoadingMessage:
                      theme.headerSearchLoadingMessage ?? "",
                    headerSearchNoResultsMessage:
                      theme.headerSearchNoResultsMessage ?? "",
                    headerSearchErrorMessage:
                      theme.headerSearchErrorMessage ?? "",
                    headerSearchResultTypePageLabel:
                      theme.headerSearchResultTypePageLabel ?? "",
                    headerSearchResultTypeBlogLabel:
                      theme.headerSearchResultTypeBlogLabel ?? "",
                    headerSearchResultTypeEventLabel:
                      theme.headerSearchResultTypeEventLabel ?? "",
                    headerSearchFallbackTitle:
                      theme.headerSearchFallbackTitle ?? "",
                    headerSearchFallbackMeta:
                      theme.headerSearchFallbackMeta ?? "",
                    headerAnnouncementEnabled:
                      theme.headerAnnouncementEnabled === true,
                    headerAnnouncementItems:
                      normalizeHeaderAnnouncementItems(theme),
                    headerAnnouncementText:
                      theme.headerAnnouncementText ?? "",
                    headerAnnouncementLinkUrl:
                      theme.headerAnnouncementLinkUrl ?? "",
                    headerAnnouncementLinkTarget:
                      theme.headerAnnouncementLinkTarget ?? "_self",
                    headerAnnouncementFontSize:
                      theme.headerAnnouncementFontSize,
                    headerAnnouncementFontWeight:
                      theme.headerAnnouncementFontWeight ?? "600",
                    headerAnnouncementTextColor:
                      theme.headerAnnouncementTextColor ?? "",
                    headerAnnouncementBackgroundColor:
                      theme.headerAnnouncementBackgroundColor ?? "",
                    headerAnnouncementMarqueeSpeed:
                      theme.headerAnnouncementMarqueeSpeed,
                    headerAnnouncementDirection:
                      String(theme.headerAnnouncementDirection || "")
                        .trim()
                        .toLowerCase() === "ltr"
                        ? "ltr"
                        : "rtl",
                    headerAnnouncementPaddingX:
                      theme.headerAnnouncementPaddingX,
                    logoType: theme.logoType ?? "text",
                    logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
                    logoMobileUrl: theme.logoMobileUrl ?? "",
                    logoUrl: theme.logoUrl ?? "",
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
                    headerCtaBgColorKey: theme.headerCtaBgColorKey ?? "headerCta",
                    headerCtaTextColorKey:
                      theme.headerCtaTextColorKey ?? "primary",
                    headerDonateBgColorKey:
                      theme.headerDonateBgColorKey ?? "gradient",
                    headerDonateTextColorKey:
                      theme.headerDonateTextColorKey ?? "white",
                    volunteerModalTitle: theme.volunteerModalTitle ?? "",
                    volunteerModalSuccessTitle:
                      theme.volunteerModalSuccessTitle ?? "",
                    volunteerModalSuccessDescription:
                      theme.volunteerModalSuccessDescription ?? "",
                    volunteerModalErrorTitle:
                      theme.volunteerModalErrorTitle ?? "",
                    volunteerModalNameLabel:
                      theme.volunteerModalNameLabel ?? "",
                    volunteerModalEmailLabel:
                      theme.volunteerModalEmailLabel ?? "",
                    volunteerModalSubjectLabel:
                      theme.volunteerModalSubjectLabel ?? "",
                    volunteerModalMessageLabel:
                      theme.volunteerModalMessageLabel ?? "",
                    volunteerModalNamePlaceholder:
                      theme.volunteerModalNamePlaceholder ?? "",
                    volunteerModalEmailPlaceholder:
                      theme.volunteerModalEmailPlaceholder ?? "",
                    volunteerModalSubjectPlaceholder:
                      theme.volunteerModalSubjectPlaceholder ?? "",
                    volunteerModalMessagePlaceholder:
                      theme.volunteerModalMessagePlaceholder ?? "",
                    volunteerModalCancelLabel:
                      theme.volunteerModalCancelLabel ?? "",
                    volunteerModalSendLabel:
                      theme.volunteerModalSendLabel ?? "",
                    volunteerModalSendingLabel:
                      theme.volunteerModalSendingLabel ?? "",
                    volunteerModalNameRequiredMessage:
                      theme.volunteerModalNameRequiredMessage ?? "",
                    volunteerModalEmailRequiredMessage:
                      theme.volunteerModalEmailRequiredMessage ?? "",
                    volunteerModalEmailInvalidMessage:
                      theme.volunteerModalEmailInvalidMessage ?? "",
                    volunteerModalSubjectRequiredMessage:
                      theme.volunteerModalSubjectRequiredMessage ?? "",
                    volunteerModalSubjectMinMessage:
                      theme.volunteerModalSubjectMinMessage ?? "",
                    volunteerModalMessageRequiredMessage:
                      theme.volunteerModalMessageRequiredMessage ?? "",
                    volunteerModalMessageMinMessage:
                      theme.volunteerModalMessageMinMessage ?? "",
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
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Footer,
                      theme,
                    ),
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
                    homeHeroAutoplay: theme?.homeHeroAutoplay ?? true,
                    homeHeroShowArrows: theme?.homeHeroShowArrows ?? true,
                    homeHeroShowDots: theme?.homeHeroShowDots ?? true,
                    homeHeroAutoplaySpeed:
                      theme?.homeHeroAutoplaySpeed != null
                        ? Number(theme.homeHeroAutoplaySpeed)
                        : 5000,
                    homeHeroSpeed:
                      theme?.homeHeroSpeed != null
                        ? Number(theme.homeHeroSpeed)
                        : 500,
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.HomeHero,
                      theme,
                    ),
                  });
                } else if (cid === "Marquee") {
                  setThemeMarqueeSnapshot({
                    marqueeTitle:
                      theme.marqueeTitle != null
                        ? String(theme.marqueeTitle).trim()
                        : "",
                    marqueePartnersTitle:
                      theme?.marqueePartnersTitle != null
                        ? String(theme.marqueePartnersTitle).trim()
                        : "",
                    marqueeAwardsTitle:
                      theme?.marqueeAwardsTitle != null
                        ? String(theme.marqueeAwardsTitle).trim()
                        : "",
                    marqueeItems: Array.isArray(theme.marqueeItems)
                      ? theme.marqueeItems.map((it) => ({
                          url: it?.url ?? "",
                          alt: it?.alt ?? "",
                        }))
                      : [],
                    marqueeTitleColorKey:
                      theme?.marqueeTitleColorKey != null
                        ? String(theme.marqueeTitleColorKey).trim()
                        : "",
                    marqueePartnersTitleColorKey:
                      theme?.marqueePartnersTitleColorKey != null
                        ? String(theme.marqueePartnersTitleColorKey).trim()
                        : theme?.marqueeTitleColorKey != null
                          ? String(theme.marqueeTitleColorKey).trim()
                          : "",
                    marqueeAwardsTitleColorKey:
                      theme?.marqueeAwardsTitleColorKey != null
                        ? String(theme.marqueeAwardsTitleColorKey).trim()
                        : "",
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Marquee,
                      theme,
                    ),
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
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Subscribe,
                      theme,
                    ),
                  });
                } else if (cid === "LatestNews") {
                  const items = Array.isArray(theme?.latestEvents1Items)
                    ? theme.latestEvents1Items.map((it) => ({
                        ...it,
                        imageUrlDesktop:
                          it?.imageUrlDesktop != null
                            ? String(it.imageUrlDesktop).trim()
                            : it?.imageUrl != null
                              ? String(it.imageUrl).trim()
                              : "",
                        imageUrl:
                          it?.imageUrl != null
                            ? String(it.imageUrl).trim()
                            : "",
                        tag: it?.tag != null ? String(it.tag).trim() : "",
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
                  setThemeLatestNewsSnapshot({
                    ...theme,
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
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.LatestNews,
                      theme,
                    ),
                  });
                } else if (cid === "Testimonials") {
                  const items = Array.isArray(theme?.testimonialsItems)
                    ? theme.testimonialsItems.map((it) => ({
                        quote: it?.quote != null ? String(it.quote).trim() : "",
                        name: it?.name != null ? String(it.name).trim() : "",
                        title: it?.title != null ? String(it.title).trim() : "",
                        rating: Math.min(
                          5,
                          Math.max(0, Number(it?.rating) || 0),
                        ),
                      }))
                    : [];
                  setThemeTestimonialsSnapshot({
                    ...getManageSectionSnapshot(
                      MANAGE_SECTION_PREFIX_BY_COMPONENT_ID.Testimonials,
                      theme,
                    ),
                    testimonialsTitle:
                      theme?.testimonialsTitle != null
                        ? String(theme.testimonialsTitle).trim()
                        : "Testimonials",
                    testimonialsTitleAlign:
                      theme?.testimonialsTitleAlign != null
                        ? String(theme.testimonialsTitleAlign).trim()
                        : "center",
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
                    testimonialsAvatarBgColorKey:
                      theme?.testimonialsAvatarBgColorKey != null
                        ? String(theme.testimonialsAvatarBgColorKey).trim()
                        : "",
                    testimonialsAvatarTextColorKey:
                      theme?.testimonialsAvatarTextColorKey != null
                        ? String(theme.testimonialsAvatarTextColorKey).trim()
                        : "",
                    testimonialsTitleEnabled:
                      theme?.testimonialsTitleEnabled !== false,
                    testimonialsNameColorEnabled:
                      theme?.testimonialsNameColorEnabled === true,
                    testimonialsRoleColorEnabled:
                      theme?.testimonialsRoleColorEnabled === true,
                    testimonialsRatingColorEnabled:
                      theme?.testimonialsRatingColorEnabled === true,
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
                    testimonialsDraggable:
                      theme?.testimonialsDraggable ?? false,
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
                } else {
                  setThemeSnapshotForDynamic(theme || {});
                }
                setComponentDrawerOpen(false);
                setDrawerUpdateLoading(false);
                message.success(`${record?.displayName || cid} saved`);
              };
              return (
                <EditFormComp
                  ref={componentEditFormRef}
                  themeColorOptions={themeColorOptions}
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
          !isLatestNews &&
          !isTestimonials &&
          record?.componentId && (
            <>
              <>
                {SiteComponents[record.componentId] ? (
                  <>
                    {(() => {
                      const Comp = SiteComponents[record.componentId];
                      return Comp ? (
                        <Comp {...themeSnapshotForDynamic} />
                      ) : null;
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
    </ThemeAdminCard>
  );
}

function resolveThemeColorFromPalette(paletteData, key) {
  if (!key) return "";
  const k = String(key).trim();
  const palette = paletteData?.themePalette || {};
  if (palette[k] != null && String(palette[k]).trim() !== "")
    return String(palette[k]).trim();
  const custom = paletteData?.colors || [];
  const found = custom.find((c) => c && String(c.name).trim() === k);
  if (found && found.value != null) return String(found.value).trim();
  const byValue = custom.find((c) => c && String(c.value).trim() === k);
  if (byValue && byValue.value != null) return String(byValue.value).trim();
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(k)) return k;
  return "";
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
  const logoUrl = Form.useWatch("logoUrl", form) || s?.logoUrl || "";
  const volunteerLabel =
    Form.useWatch("headerVolunteerLabel", form) ||
    s?.headerVolunteerLabel ||
    "";
  const volunteerHref =
    Form.useWatch("headerVolunteerHref", form) || s?.headerVolunteerHref || "";
  const volunteerHrefTarget =
    Form.useWatch("headerVolunteerHrefTarget", form) ||
    s?.headerVolunteerHrefTarget ||
    "_self";
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
  const headerSearchEnabled =
    Form.useWatch("headerSearchEnabled", form) ??
    s?.headerSearchEnabled ??
    false;
  const headerSearchLabel =
    Form.useWatch("headerSearchLabel", form) || s?.headerSearchLabel || "";
  const headerSearchOpenAriaLabel =
    Form.useWatch("headerSearchOpenAriaLabel", form) ||
    s?.headerSearchOpenAriaLabel ||
    "";
  const headerSearchPlaceholder =
    Form.useWatch("headerSearchPlaceholder", form) ||
    s?.headerSearchPlaceholder ||
    "";
  const headerSearchDialogLabel =
    Form.useWatch("headerSearchDialogLabel", form) ||
    s?.headerSearchDialogLabel ||
    "";
  const headerSearchInputAriaLabel =
    Form.useWatch("headerSearchInputAriaLabel", form) ||
    s?.headerSearchInputAriaLabel ||
    "";
  const headerSearchCloseAriaLabel =
    Form.useWatch("headerSearchCloseAriaLabel", form) ||
    s?.headerSearchCloseAriaLabel ||
    "";
  const headerSearchMinCharsMessage =
    Form.useWatch("headerSearchMinCharsMessage", form) ||
    s?.headerSearchMinCharsMessage ||
    "";
  const headerSearchLoadingMessage =
    Form.useWatch("headerSearchLoadingMessage", form) ||
    s?.headerSearchLoadingMessage ||
    "";
  const headerSearchNoResultsMessage =
    Form.useWatch("headerSearchNoResultsMessage", form) ||
    s?.headerSearchNoResultsMessage ||
    "";
  const headerSearchErrorMessage =
    Form.useWatch("headerSearchErrorMessage", form) ||
    s?.headerSearchErrorMessage ||
    "";
  const headerSearchResultTypePageLabel =
    Form.useWatch("headerSearchResultTypePageLabel", form) ||
    s?.headerSearchResultTypePageLabel ||
    "";
  const headerSearchResultTypeBlogLabel =
    Form.useWatch("headerSearchResultTypeBlogLabel", form) ||
    s?.headerSearchResultTypeBlogLabel ||
    "";
  const headerSearchResultTypeEventLabel =
    Form.useWatch("headerSearchResultTypeEventLabel", form) ||
    s?.headerSearchResultTypeEventLabel ||
    "";
  const headerSearchFallbackTitle =
    Form.useWatch("headerSearchFallbackTitle", form) ||
    s?.headerSearchFallbackTitle ||
    "";
  const headerSearchFallbackMeta =
    Form.useWatch("headerSearchFallbackMeta", form) ||
    s?.headerSearchFallbackMeta ||
    "";
  const headerAnnouncementEnabled =
    Form.useWatch("headerAnnouncementEnabled", form) ??
    s?.headerAnnouncementEnabled ??
    false;
  const headerAnnouncementItems =
    Form.useWatch("headerAnnouncementItems", form) ||
    s?.headerAnnouncementItems ||
    [];
  const headerAnnouncementText =
    Form.useWatch("headerAnnouncementText", form) ||
    s?.headerAnnouncementText ||
    "";
  const headerAnnouncementLinkUrl =
    Form.useWatch("headerAnnouncementLinkUrl", form) ||
    s?.headerAnnouncementLinkUrl ||
    "";
  const headerAnnouncementLinkTarget =
    Form.useWatch("headerAnnouncementLinkTarget", form) ||
    s?.headerAnnouncementLinkTarget ||
    "_self";
  const headerAnnouncementFontSize =
    Form.useWatch("headerAnnouncementFontSize", form) ??
    s?.headerAnnouncementFontSize ??
    14;
  const headerAnnouncementFontWeight =
    Form.useWatch("headerAnnouncementFontWeight", form) ||
    s?.headerAnnouncementFontWeight ||
    "600";
  const headerAnnouncementTextColor =
    Form.useWatch("headerAnnouncementTextColor", form) ||
    s?.headerAnnouncementTextColor ||
    "#ffffff";
  const headerAnnouncementBackgroundColor =
    Form.useWatch("headerAnnouncementBackgroundColor", form) ||
    s?.headerAnnouncementBackgroundColor ||
    "#d92d20";
  const headerAnnouncementMarqueeSpeed =
    Form.useWatch("headerAnnouncementMarqueeSpeed", form) ??
    s?.headerAnnouncementMarqueeSpeed ??
    20;
  const headerAnnouncementDirection =
    String(
      Form.useWatch("headerAnnouncementDirection", form) ??
        s?.headerAnnouncementDirection ??
        "rtl",
    )
      .trim()
      .toLowerCase() === "ltr"
      ? "ltr"
      : "rtl";
  const headerAnnouncementPaddingX =
    Form.useWatch("headerAnnouncementPaddingX", form) ??
    s?.headerAnnouncementPaddingX ??
    24;
  const volunteerModalTitle =
    Form.useWatch("volunteerModalTitle", form) || s?.volunteerModalTitle || "";
  const volunteerModalSuccessTitle =
    Form.useWatch("volunteerModalSuccessTitle", form) ||
    s?.volunteerModalSuccessTitle ||
    "";
  const volunteerModalSuccessDescription =
    Form.useWatch("volunteerModalSuccessDescription", form) ||
    s?.volunteerModalSuccessDescription ||
    "";
  const volunteerModalErrorTitle =
    Form.useWatch("volunteerModalErrorTitle", form) ||
    s?.volunteerModalErrorTitle ||
    "";
  const volunteerModalNameLabel =
    Form.useWatch("volunteerModalNameLabel", form) ||
    s?.volunteerModalNameLabel ||
    "";
  const volunteerModalEmailLabel =
    Form.useWatch("volunteerModalEmailLabel", form) ||
    s?.volunteerModalEmailLabel ||
    "";
  const volunteerModalSubjectLabel =
    Form.useWatch("volunteerModalSubjectLabel", form) ||
    s?.volunteerModalSubjectLabel ||
    "";
  const volunteerModalMessageLabel =
    Form.useWatch("volunteerModalMessageLabel", form) ||
    s?.volunteerModalMessageLabel ||
    "";
  const volunteerModalNamePlaceholder =
    Form.useWatch("volunteerModalNamePlaceholder", form) ||
    s?.volunteerModalNamePlaceholder ||
    "";
  const volunteerModalEmailPlaceholder =
    Form.useWatch("volunteerModalEmailPlaceholder", form) ||
    s?.volunteerModalEmailPlaceholder ||
    "";
  const volunteerModalSubjectPlaceholder =
    Form.useWatch("volunteerModalSubjectPlaceholder", form) ||
    s?.volunteerModalSubjectPlaceholder ||
    "";
  const volunteerModalMessagePlaceholder =
    Form.useWatch("volunteerModalMessagePlaceholder", form) ||
    s?.volunteerModalMessagePlaceholder ||
    "";
  const volunteerModalCancelLabel =
    Form.useWatch("volunteerModalCancelLabel", form) ||
    s?.volunteerModalCancelLabel ||
    "";
  const volunteerModalSendLabel =
    Form.useWatch("volunteerModalSendLabel", form) ||
    s?.volunteerModalSendLabel ||
    "";
  const volunteerModalSendingLabel =
    Form.useWatch("volunteerModalSendingLabel", form) ||
    s?.volunteerModalSendingLabel ||
    "";
  const volunteerModalNameRequiredMessage =
    Form.useWatch("volunteerModalNameRequiredMessage", form) ||
    s?.volunteerModalNameRequiredMessage ||
    "";
  const volunteerModalEmailRequiredMessage =
    Form.useWatch("volunteerModalEmailRequiredMessage", form) ||
    s?.volunteerModalEmailRequiredMessage ||
    "";
  const volunteerModalEmailInvalidMessage =
    Form.useWatch("volunteerModalEmailInvalidMessage", form) ||
    s?.volunteerModalEmailInvalidMessage ||
    "";
  const volunteerModalSubjectRequiredMessage =
    Form.useWatch("volunteerModalSubjectRequiredMessage", form) ||
    s?.volunteerModalSubjectRequiredMessage ||
    "";
  const volunteerModalSubjectMinMessage =
    Form.useWatch("volunteerModalSubjectMinMessage", form) ||
    s?.volunteerModalSubjectMinMessage ||
    "";
  const volunteerModalMessageRequiredMessage =
    Form.useWatch("volunteerModalMessageRequiredMessage", form) ||
    s?.volunteerModalMessageRequiredMessage ||
    "";
  const volunteerModalMessageMinMessage =
    Form.useWatch("volunteerModalMessageMinMessage", form) ||
    s?.volunteerModalMessageMinMessage ||
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
  const sectionBg = s?._sectionBg ?? "";
  const sectionPadding = s?._sectionPadding ?? "";
  const sectionBorderSize = s?._sectionBorderSize ?? "";
  const sectionBorderStyle = s?._sectionBorderStyle ?? "";
  const sectionBorderColor = s?._sectionBorderColor ?? "";
  const sectionShadow = s?._sectionShadow ?? "";

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
        headerSearchEnabled={headerSearchEnabled === true}
        headerSearchLabel={headerSearchLabel}
        headerSearchOpenAriaLabel={headerSearchOpenAriaLabel}
        headerSearchPlaceholder={headerSearchPlaceholder}
        headerSearchDialogLabel={headerSearchDialogLabel}
        headerSearchInputAriaLabel={headerSearchInputAriaLabel}
        headerSearchCloseAriaLabel={headerSearchCloseAriaLabel}
        headerSearchMinCharsMessage={headerSearchMinCharsMessage}
        headerSearchLoadingMessage={headerSearchLoadingMessage}
        headerSearchNoResultsMessage={headerSearchNoResultsMessage}
        headerSearchErrorMessage={headerSearchErrorMessage}
        headerSearchResultTypePageLabel={headerSearchResultTypePageLabel}
        headerSearchResultTypeBlogLabel={headerSearchResultTypeBlogLabel}
        headerSearchResultTypeEventLabel={headerSearchResultTypeEventLabel}
        headerSearchFallbackTitle={headerSearchFallbackTitle}
        headerSearchFallbackMeta={headerSearchFallbackMeta}
        headerAnnouncementEnabled={headerAnnouncementEnabled === true}
        headerAnnouncementItems={
          Array.isArray(headerAnnouncementItems) ? headerAnnouncementItems : []
        }
        headerAnnouncementText={headerAnnouncementText}
        headerAnnouncementLinkUrl={headerAnnouncementLinkUrl}
        headerAnnouncementLinkTarget={headerAnnouncementLinkTarget}
        headerAnnouncementFontSize={headerAnnouncementFontSize}
        headerAnnouncementFontWeight={headerAnnouncementFontWeight}
        headerAnnouncementTextColor={resolveThemeColorFromPalette(
          themePaletteData,
          headerAnnouncementTextColor,
        )}
        headerAnnouncementBackgroundColor={resolveThemeColorFromPalette(
          themePaletteData,
          headerAnnouncementBackgroundColor,
        )}
        headerAnnouncementMarqueeSpeed={headerAnnouncementMarqueeSpeed}
        headerAnnouncementDirection={headerAnnouncementDirection}
        headerAnnouncementPaddingX={headerAnnouncementPaddingX}
        logoType={logoType}
        logoUrl={logoUrl}
        logoLightUrl={logoLightUrl}
        logoMobileUrl={logoMobileUrl || undefined}
        logoImageUrl={logoLightUrl}
        logoDarkUrl=""
        volunteerLabel={volunteerLabel}
        volunteerHref={volunteerHref}
        volunteerHrefTarget={volunteerHrefTarget}
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
        sectionBg={sectionBg}
        sectionPadding={sectionPadding}
        sectionBorderSize={sectionBorderSize}
        sectionBorderStyle={sectionBorderStyle}
        sectionBorderColor={sectionBorderColor}
        sectionShadow={sectionShadow}
        headerDonateBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateBgColorKey,
        )}
        headerDonateTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateTextColorKey,
        )}
        volunteerModalTitle={volunteerModalTitle}
        volunteerModalSuccessTitle={volunteerModalSuccessTitle}
        volunteerModalSuccessDescription={volunteerModalSuccessDescription}
        volunteerModalErrorTitle={volunteerModalErrorTitle}
        volunteerModalNameLabel={volunteerModalNameLabel}
        volunteerModalEmailLabel={volunteerModalEmailLabel}
        volunteerModalSubjectLabel={volunteerModalSubjectLabel}
        volunteerModalMessageLabel={volunteerModalMessageLabel}
        volunteerModalNamePlaceholder={volunteerModalNamePlaceholder}
        volunteerModalEmailPlaceholder={volunteerModalEmailPlaceholder}
        volunteerModalSubjectPlaceholder={volunteerModalSubjectPlaceholder}
        volunteerModalMessagePlaceholder={volunteerModalMessagePlaceholder}
        volunteerModalCancelLabel={volunteerModalCancelLabel}
        volunteerModalSendLabel={volunteerModalSendLabel}
        volunteerModalSendingLabel={volunteerModalSendingLabel}
        volunteerModalNameRequiredMessage={volunteerModalNameRequiredMessage}
        volunteerModalEmailRequiredMessage={volunteerModalEmailRequiredMessage}
        volunteerModalEmailInvalidMessage={volunteerModalEmailInvalidMessage}
        volunteerModalSubjectRequiredMessage={volunteerModalSubjectRequiredMessage}
        volunteerModalSubjectMinMessage={volunteerModalSubjectMinMessage}
        volunteerModalMessageRequiredMessage={volunteerModalMessageRequiredMessage}
        volunteerModalMessageMinMessage={volunteerModalMessageMinMessage}
      />
    </div>
  );
}

function FooterPreviewBlock({ form, themePaletteData, themeFooterSnapshot }) {
  const s = themeFooterSnapshot;
  const siteTitle = s?.siteTitle || "";
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
  const footerSocialLinks =
    Form.useWatch("footerSocialLinks", form) || s?.footerSocialLinks || [];
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
        footerSocialLinks={Array.isArray(footerSocialLinks) ? footerSocialLinks : []}
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
