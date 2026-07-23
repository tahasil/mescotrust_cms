"use client";

import { useEffect, useMemo, useState } from "react";
import { Col, Row } from "antd";
import FormEmbed from "@/components/site/FormEmbed/FormEmbed";
import * as PublicSiteComponents from "@/components/site/publicComponents";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";
import { usePageReadyTask } from "@/lib/pageReadiness";
import {
  buildShortcodeFromSelection,
  normalizeShortcodeText,
  parseShortcodeInput,
} from "@/lib/shortcode";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

const API_PATH_BY_COMPONENT_ID = {
  HomeHero: "/api/theme/home-hero",
  Marquee: "/api/theme/marquee",
  Subscribe: "/api/theme/subscribe",
};
const PASSTHROUGH_COMPONENT_SHORTCODES = new Set([
  "Testimonials",
  "HomeSlider",
  "EventsSlider",
]);

function sanitizePayload(data) {
  if (!data || typeof data !== "object") return {};
  const payload = { ...data };
  delete payload.themePalette;
  delete payload.colors;
  return payload;
}

function getThemeApiPath(componentId) {
  return (
    API_PATH_BY_COMPONENT_ID[componentId] ||
    `/api/theme/${encodeURIComponent(componentId)}`
  );
}

function findComponentIdByShortcodeValue(rawValue) {
  const value = normalizeShortcodeText(rawValue);
  if (!value) return "";
  return (
    SITE_COMPONENT_IDS.find(
      (componentId) =>
        componentId.toLowerCase() === value.toLowerCase(),
    ) || ""
  );
}

async function fetchComponentProps(componentId) {
  const response = await fetch(getThemeApiPath(componentId), {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Failed to load ${componentId} settings`);
  }
  return sanitizePayload(data);
}

function getShortcodeTextFromProps(props) {
  const direct = normalizeShortcodeText(
    props?.shortcode || props?.shortCode || props?.shortCodeRaw,
  );
  if (direct) return direct;

  // Legacy fallback to avoid breaking already-configured page blocks.
  const sourceType = normalizeShortcodeText(props?.shortCodeSourceType).toLowerCase();
  const selectedValue =
    sourceType === "form"
      ? normalizeShortcodeText(props?.shortCodeSelectedForm).toLowerCase()
      : sourceType === "slider"
        ? normalizeShortcodeText(props?.shortCodeSelectedSlider)
        : sourceType === "popup"
          ? normalizeShortcodeText(props?.shortCodeSelectedPopup)
          : sourceType === "component"
            ? normalizeShortcodeText(props?.shortCodeSelectedComponent)
            : "";

  return buildShortcodeFromSelection("shortcode", selectedValue);
}

/**
 * Site component: ShortCode (Short Code).
 * Supports a single shortcode format: [shortcode="Target"].
 * Target dynamically resolves to a site component ID first, otherwise to form shortcode.
 */
export default function ShortCode(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();

  const titleEnabled = props?.shortCodeTitleEnabled !== false;
  const subTitleEnabled = props?.shortCodeSubTitleEnabled !== false;

  const mainTitleColorKey = (
    props?.shortCodeMainTitleColorKey ?? props?.titleColorKey ?? ""
  )
    .toString()
    .trim();
  const subTitleColorKey = (props?.shortCodeSubTitleColorKey ?? "")
    .toString()
    .trim();
  const cardBgColorKey = (props?.shortCodeCardBgColorKey ?? "")
    .toString()
    .trim();
  const cardTextColorKey = (props?.shortCodeCardTextColorKey ?? "")
    .toString()
    .trim();
  const cardBorderColorKey = (props?.shortCodeCardBorderColorKey ?? "")
    .toString()
    .trim();

  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : getColor("primary");
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "transparent";
  const cardTextColor = cardTextColorKey ? getColor(cardTextColorKey) : undefined;
  const cardBorderColor = cardBorderColorKey ? getColor(cardBorderColorKey) : "";

  const sectionBgType = (props?.shortCodeSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.shortCodeSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.shortCodeSectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
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
            backgroundColor: getColor(sectionBgColorKey),
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

  const pageContainerBgType = (props?.shortCodePageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.shortCodePageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.shortCodePageContainerBgColorKey ?? "").toString().trim();
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
            backgroundColor: getColor(pageContainerBgColorKey),
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

  const shortcodeText = useMemo(() => getShortcodeTextFromProps(props), [props]);
  const parsedShortcode = useMemo(
    () => parseShortcodeInput(shortcodeText),
    [shortcodeText],
  );
  const shortcodeValue = normalizeShortcodeText(parsedShortcode?.targetKey);
  const resolvedComponentId = useMemo(
    () => findComponentIdByShortcodeValue(shortcodeValue),
    [shortcodeValue],
  );
  const isSubscribeShortcode = resolvedComponentId === "Subscribe";
  const isPassthroughShortcode = PASSTHROUGH_COMPONENT_SHORTCODES.has(
    resolvedComponentId,
  );

  const [moduleProps, setModuleProps] = useState({});
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");
  const [loadedComponentId, setLoadedComponentId] = useState("");
  const moduleNeedsInitialData = Boolean(
    resolvedComponentId &&
      resolvedComponentId !== "ShortCode" &&
      loadedComponentId !== resolvedComponentId,
  );
  usePageReadyTask(moduleNeedsInitialData, `shortcode-${resolvedComponentId || "module"}`);

  useEffect(() => {
    let cancelled = false;

    async function loadComponentProps() {
      if (!resolvedComponentId || resolvedComponentId === "ShortCode") {
        setModuleLoading(false);
        setModuleError("");
        setModuleProps({});
        setLoadedComponentId("");
        return;
      }

      setModuleLoading(true);
      setModuleError("");
      try {
        const payload = await fetchComponentProps(resolvedComponentId);
        if (!cancelled) setModuleProps(payload);
      } catch (err) {
        if (!cancelled) {
          setModuleProps({});
          setModuleError(err?.message || "Failed to load shortcode target");
        }
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
          setLoadedComponentId(resolvedComponentId);
        }
      }
    }

    loadComponentProps();
    return () => {
      cancelled = true;
    };
  }, [resolvedComponentId]);

  const renderShortcodeContent = () => {
    if (!shortcodeText) {
      return (
        <div style={{ color: "rgba(0,0,0,0.65)" }}>
          Add a shortcode in the editor.
        </div>
      );
    }

    if (!shortcodeValue) {
      return (
        <div style={{ color: "#b42318" }}>
          Invalid shortcode format. Use: [shortcode="ComponentName"]
        </div>
      );
    }

    if (resolvedComponentId === "ShortCode") {
      return (
        <div style={{ color: "#b42318" }}>
          ShortCode cannot render itself.
        </div>
      );
    }

    if (resolvedComponentId) {
      if (moduleNeedsInitialData || moduleLoading) return null;

      const ComponentToRender = PublicSiteComponents[resolvedComponentId];
      if (typeof ComponentToRender !== "function") {
        return (
          <div style={{ color: "#b42318" }}>
            Module renderer is not available.
          </div>
        );
      }

      return (
        <>
          {moduleError ? (
            <div style={{ color: "#b42318", marginBottom: 10 }}>
              {moduleError}
            </div>
          ) : null}
          <ComponentToRender
            {...moduleProps}
            {...(resolvedComponentId === "Subscribe" && props?.shortCodeSectionBgType === "image"
              ? { subscribeRenderVariant: "cta-band" }
              : {})}
          />
        </>
      );
    }

    return <FormEmbed mode="shortcode" shortcode={shortcodeValue.toLowerCase()} />;
  };

  if (isSubscribeShortcode) {
    return renderShortcodeContent();
  }

  if (isPassthroughShortcode) {
    return renderShortcodeContent();
  }

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle ? (
                <SubTitle color={subTitleColor}>{subTitle}</SubTitle>
              ) : null}
              {titleEnabled && mainTitle ? (
                <MainTitle color={mainTitleColor}>{mainTitle}</MainTitle>
              ) : null}
            </Col>
          </Row>
        ) : null}

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div
              style={{
                background: cardBgColor,
                ...(cardTextColor ? { color: cardTextColor } : {}),
                ...(cardBorderColor ? { border: `1px solid ${cardBorderColor}` } : {}),
                borderRadius: 14,
                padding: 16,
              }}
            >
              {renderShortcodeContent()}
            </div>
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
