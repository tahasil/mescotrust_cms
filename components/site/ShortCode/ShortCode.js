"use client";

import { useEffect, useMemo, useState } from "react";
import { parseComponentShortcodes } from "@/lib/shortcode";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";
import FormShortcodeRenderer from "./FormShortcodeRenderer";
import {
  FullWidthBackground,
  MainTitle,
  PageContainer,
  SubTitle,
  getColor,
} from "@/styles/Theme";

const API_PATH_BY_COMPONENT_ID = {
  Header: "/api/theme",
  Footer: "/api/theme",
  HomeHero: "/api/theme/home-hero",
  Subscribe: "/api/theme/subscribe",
};

function mapThemeToHeaderProps(theme) {
  return {
    siteTitle: theme?.siteTitle ?? "",
    logoType: theme?.logoType ?? "text",
    logoImageUrl: theme?.logoLightUrl || theme?.logoImageUrl || "",
    logoLightUrl: theme?.logoLightUrl || theme?.logoImageUrl || "",
    logoMobileUrl: theme?.logoMobileUrl ?? "",
    logoDarkUrl: theme?.logoDarkUrl ?? "",
    volunteerLabel: theme?.headerVolunteerLabel ?? "",
    volunteerHref: theme?.headerVolunteerHref ?? "",
    volunteerIconUrl: theme?.headerVolunteerIconUrl ?? "",
    volunteerIconUrlMobile: theme?.headerVolunteerIconUrlMobile ?? "",
    donateLabel: theme?.headerDonateLabel ?? "",
    donateHref: theme?.headerDonateHref ?? "",
    donateIconUrl: theme?.headerDonateIconUrl ?? "",
    donateIconUrlMobile: theme?.headerDonateIconUrlMobile ?? "",
    menuItems: Array.isArray(theme?.menuItems) ? theme.menuItems : [],
  };
}

function mapThemeToFooterProps(theme) {
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
    footerCopyrightText: theme?.footerCopyrightText ?? "",
    footerBackgroundImageUrl: theme?.footerBackgroundImageUrl ?? "",
  };
}

function sanitizePayload(componentId, data) {
  if (!data || typeof data !== "object") return {};
  if (componentId === "Header") return mapThemeToHeaderProps(data);
  if (componentId === "Footer") return mapThemeToFooterProps(data);

  const { themePalette: _palette, colors: _colors, ...props } = data;
  return props;
}

async function fetchComponentProps(componentId) {
  const path =
    API_PATH_BY_COMPONENT_ID[componentId] ||
    `/api/theme/${encodeURIComponent(componentId)}`;
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) return {};
  const data = await response.json();
  return sanitizePayload(componentId, data);
}

function resolveThemeColorValue(rawKey) {
  const key = String(rawKey || "").trim();
  if (!key) return "";
  const lowered = key.toLowerCase();
  const isDirectCssValue =
    key.startsWith("#") ||
    lowered.startsWith("rgb(") ||
    lowered.startsWith("rgba(") ||
    lowered.startsWith("hsl(") ||
    lowered.startsWith("hsla(") ||
    lowered.startsWith("linear-gradient(") ||
    lowered.startsWith("radial-gradient(") ||
    lowered.startsWith("conic-gradient(") ||
    lowered.startsWith("var(");
  if (isDirectCssValue) return key;
  return getColor(key) || "";
}

function isGradientColor(value) {
  return /\bgradient/i.test(String(value || ""));
}

function getTextPaintStyle(colorValue) {
  const value = String(colorValue || "").trim();
  if (!value) return undefined;
  if (!isGradientColor(value)) return { color: value };
  return {
    color: "transparent",
    background: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
}

function sanitizeSectionId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-_:.]/g, "");
}

export default function ShortCode(props) {
  const rawContent = String(props?.shortCodeContent || "").trim();

  const parsedItems = useMemo(
    () => parseComponentShortcodes(rawContent),
    [rawContent],
  );

  const renderItems = useMemo(
    () =>
      parsedItems.filter(
        (item) =>
          item.type === "component" &&
          item.known &&
          SITE_COMPONENT_IDS.includes(item.componentId) &&
          item.componentId !== "ShortCode",
      ),
    [parsedItems],
  );
  const formRenderItems = useMemo(
    () =>
      parsedItems.filter(
        (item) =>
          item.type === "form" &&
          item.known &&
          String(item.formKey || "").trim(),
      ),
    [parsedItems],
  );

  const [payloadById, setPayloadById] = useState({});
  const [siteComponentsMap, setSiteComponentsMap] = useState({});
  const [formConfigByKey, setFormConfigByKey] = useState({});

  useEffect(() => {
    let cancelled = false;
    import("@/components/site")
      .then((mod) => {
        if (cancelled) return;
        setSiteComponentsMap(mod || {});
      })
      .catch(() => {
        if (cancelled) return;
        setSiteComponentsMap({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requiredIds = useMemo(
    () => [...new Set(renderItems.map((item) => item.componentId))],
    [renderItems],
  );
  const requiredFormKeys = useMemo(
    () => [
      ...new Set(
        formRenderItems
          .map((item) => String(item.formKey || "").trim())
          .filter(Boolean),
      ),
    ],
    [formRenderItems],
  );

  useEffect(() => {
    if (requiredIds.length === 0) return;
    let cancelled = false;

    requiredIds.forEach((componentId) => {
      if (payloadById[componentId] !== undefined) return;

      fetchComponentProps(componentId)
        .then((payload) => {
          if (cancelled) return;
          setPayloadById((prev) => ({ ...prev, [componentId]: payload }));
        })
        .catch(() => {
          if (cancelled) return;
          setPayloadById((prev) => ({ ...prev, [componentId]: {} }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [requiredIds, payloadById]);

  useEffect(() => {
    if (requiredFormKeys.length === 0) return;
    let cancelled = false;

    requiredFormKeys.forEach((formKey) => {
      if (Object.prototype.hasOwnProperty.call(formConfigByKey, formKey))
        return;

      fetch(`/api/public/forms/${encodeURIComponent(formKey)}`, {
        cache: "no-store",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          const form =
            data?.form && typeof data.form === "object" ? data.form : null;
          setFormConfigByKey((prev) => ({ ...prev, [formKey]: form }));
        })
        .catch(() => {
          if (cancelled) return;
          setFormConfigByKey((prev) => ({ ...prev, [formKey]: null }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [requiredFormKeys, formConfigByKey]);

  if (!renderItems.length && !formRenderItems.length) return null;

  const sectionBgType = (props?.shortCodeSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.shortCodeSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.shortCodeSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: resolveThemeColorValue(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.shortCodeSectionPaddingTop != null
      ? Number(props.shortCodeSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.shortCodeSectionPaddingBottom != null
      ? Number(props.shortCodeSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.shortCodeSectionMarginTop != null
      ? Number(props.shortCodeSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.shortCodeSectionMarginBottom != null
      ? Number(props.shortCodeSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = (
    props?.shortCodePageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.shortCodePageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.shortCodePageContainerBgColorKey ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: resolveThemeColorValue(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.shortCodePageContainerPaddingTop != null
      ? Number(props.shortCodePageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.shortCodePageContainerPaddingRight != null
      ? Number(props.shortCodePageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.shortCodePageContainerPaddingBottom != null
      ? Number(props.shortCodePageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.shortCodePageContainerPaddingLeft != null
      ? Number(props.shortCodePageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.shortCodePageContainerMarginTop != null
      ? Number(props.shortCodePageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.shortCodePageContainerMarginBottom != null
      ? Number(props.shortCodePageContainerMarginBottom)
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  const shortCodeTitleColorKey = (props?.shortCodeTitleColorKey ?? "")
    .toString()
    .trim();
  const shortCodeSubTitleColorKey = (props?.shortCodeSubTitleColorKey ?? "")
    .toString()
    .trim();
  const shortCodeTitle = (props?.shortCodeTitle ?? "Section Title")
    .toString()
    .trim();
  const shortCodeSubTitle = (props?.shortCodeSubTitle ?? "").toString().trim();
  const shortCodeTitleAlignRaw = (props?.shortCodeTitleAlign ?? "left")
    .toString()
    .trim()
    .toLowerCase();
  const shortCodeTitleAlign =
    shortCodeTitleAlignRaw === "left" ||
    shortCodeTitleAlignRaw === "center" ||
    shortCodeTitleAlignRaw === "right"
      ? shortCodeTitleAlignRaw
      : "left";

  const shortCodeTitleColor =
    resolveThemeColorValue(shortCodeTitleColorKey) || getColor("secondary");
  const shortCodeSubTitleColor =
    resolveThemeColorValue(shortCodeSubTitleColorKey) ||
    getColor("primaryDark");
  const shortCodeSectionId = sanitizeSectionId(props?.shortCodeSectionId);

  return (
    <FullWidthBackground
      id={shortCodeSectionId || undefined}
      className={sectionBgClassName}
      style={sectionBgStyle}
    >
      <PageContainer style={pageContainerBgStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{ textAlign: shortCodeTitleAlign }}
            className={
              shortCodeTitle?.length > 0 || shortCodeSubTitle?.length > 0
                ? "mb-4"
                : ""
            }
          >
            {shortCodeTitle ? (
              <MainTitle
                className="mb-0"
                style={{
                  textAlign: shortCodeTitleAlign,
                }}
              >
                <span style={getTextPaintStyle(shortCodeTitleColor)}>
                  {shortCodeTitle}
                </span>
              </MainTitle>
            ) : null}
            {shortCodeSubTitle ? (
              <SubTitle
                className={shortCodeSubTitle?.length > 0 ? "mt-1" : "mt-0"}
                style={{
                  textAlign: shortCodeTitleAlign,
                  fontWeight: 400,
                }}
              >
                <span style={getTextPaintStyle(shortCodeSubTitleColor)}>
                  {shortCodeSubTitle}
                </span>
              </SubTitle>
            ) : null}
          </div>

          {renderItems.map((item) => {
            const componentId = item.componentId;
            const ComponentToRender = siteComponentsMap[componentId];
            if (typeof ComponentToRender !== "function") return null;

            return (
              <div key={`${componentId}-${item.index}`}>
                <ComponentToRender {...(payloadById[componentId] || {})} />
              </div>
            );
          })}
          {formRenderItems.map((item) => {
            const formKey = String(item.formKey || "").trim();
            if (!formKey) return null;
            const formConfig = formConfigByKey[formKey];
            if (formConfig === null) return null;

            return (
              <div key={`form-${formKey}-${item.index}`}>
                <FormShortcodeRenderer
                  formKey={formKey}
                  formName={formConfig?.name || ""}
                  formFolderName={formConfig?.scaffold?.folderName || ""}
                  ui={formConfig?.ui || {}}
                  successMessage={formConfig?.successMessage || ""}
                />
              </div>
            );
          })}
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
