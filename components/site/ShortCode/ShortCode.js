"use client";

import { useEffect, useMemo, useState } from "react";
import { Col, Row } from "antd";
import EventsSlider from "@/components/site/EventsSlider/EventsSlider";
import StoriesSlider from "@/components/site/StoriesSlider/StoriesSlider";
import ImageSlider from "@/components/site/ImageSlider/ImageSlider";
import EventRegistrationForm from "@/components/site/EventRegistrationForm/EventRegistrationForm";
import SocialMediaWall from "@/components/site/SocialMediaWall/SocialMediaWall";
import LatestEvents1 from "@/components/site/LatestEvents1/LatestEvents1";
import Notices from "@/components/site/Notices/Notices";
import Cards from "@/components/site/Cards/Cards";
import Cards1 from "@/components/site/Cards1/Cards1";
import FormEmbed from "@/components/site/FormEmbed/FormEmbed";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import {
  buildShortcodeFromSelection,
  normalizeShortcodeText,
  parseShortcodeInput,
} from "@/lib/shortcode";

const SUPPORTED_SHORTCODE_COMPONENTS = {
  EventsSlider,
  StoriesSlider,
  ImageSlider,
  EventRegistrationForm,
  SocialMediaWall,
  LatestEvents1,
  Notices,
  Cards,
  Cards1,
  FormEmbed,
};

const SUPPORTED_COMPONENT_IDS = Object.keys(SUPPORTED_SHORTCODE_COMPONENTS);

function findSupportedComponentId(rawValue) {
  const value = normalizeShortcodeText(rawValue);
  if (!value) return "";
  return (
    SUPPORTED_COMPONENT_IDS.find(
      (id) => id.toLowerCase() === value.toLowerCase(),
    ) || ""
  );
}

function normalizePopupLinkTarget(raw) {
  return String(raw || "").trim().toLowerCase() === "_blank"
    ? "_blank"
    : "_self";
}

function isValidPopupLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("#")) return true;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
  return false;
}

function getPopupModalWidthPx(props) {
  const preset = String(props?.modalWidthPreset || "").trim().toLowerCase();
  if (preset === "small") return 420;
  if (preset === "large") return 760;
  if (preset === "full") return 1200;
  if (preset === "custom") {
    const custom = Number(props?.customModalWidthPx);
    if (Number.isFinite(custom)) {
      return Math.max(280, Math.min(1600, Math.round(custom)));
    }
  }
  return 560;
}

function toOverrideProps(rawProps) {
  const out = {};
  for (const [key, value] of Object.entries(rawProps || {})) {
    const cleanKey = normalizeShortcodeText(key);
    const cleanValue = normalizeShortcodeText(value);
    if (!cleanKey || cleanValue === "") continue;
    if (/^(true|false)$/i.test(cleanValue)) {
      out[cleanKey] = cleanValue.toLowerCase() === "true";
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(cleanValue)) {
      out[cleanKey] = Number(cleanValue);
      continue;
    }
    out[cleanKey] = cleanValue;
  }
  return out;
}

function getShortcodeTextFromProps(props) {
  const direct = normalizeShortcodeText(
    props?.shortcode || props?.shortCode || props?.shortCodeRaw,
  );
  if (direct) return direct;

  const sourceType = normalizeShortcodeText(props?.shortCodeSourceType || "manual").toLowerCase();
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

  return buildShortcodeFromSelection(sourceType, selectedValue);
}

/**
 * Site component: ShortCode (Short Code).
 * Supports shortcode-driven module rendering for forms, sliders, popups, and selected modules.
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
  const sectionPaddingTop = props?.shortCodeSectionPaddingTop != null ? Number(props.shortCodeSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.shortCodeSectionPaddingBottom != null ? Number(props.shortCodeSectionPaddingBottom) : null;
  const sectionMarginTop = props?.shortCodeSectionMarginTop != null ? Number(props.shortCodeSectionMarginTop) : null;
  const sectionMarginBottom = props?.shortCodeSectionMarginBottom != null ? Number(props.shortCodeSectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
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
  const containerPaddingTop = props?.shortCodePageContainerPaddingTop != null ? Number(props.shortCodePageContainerPaddingTop) : null;
  const containerPaddingRight = props?.shortCodePageContainerPaddingRight != null ? Number(props.shortCodePageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.shortCodePageContainerPaddingBottom != null ? Number(props.shortCodePageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.shortCodePageContainerPaddingLeft != null ? Number(props.shortCodePageContainerPaddingLeft) : null;
  const containerMarginTop = props?.shortCodePageContainerMarginTop != null ? Number(props.shortCodePageContainerMarginTop) : null;
  const containerMarginBottom = props?.shortCodePageContainerMarginBottom != null ? Number(props.shortCodePageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  const shortcodeText = useMemo(() => getShortcodeTextFromProps(props), [props]);
  const parsedShortcode = useMemo(
    () => parseShortcodeInput(shortcodeText),
    [shortcodeText],
  );

  const resolvedComponentId = useMemo(() => {
    if (
      parsedShortcode.sourceType === "component" ||
      parsedShortcode.sourceType === "slider" ||
      parsedShortcode.sourceType === "form"
    ) {
      return findSupportedComponentId(parsedShortcode.targetKey || parsedShortcode.tag);
    }
    return "";
  }, [parsedShortcode]);

  const resolvedSourceType = useMemo(() => {
    if (parsedShortcode.sourceType === "form" && resolvedComponentId) {
      return "component";
    }
    if (
      (parsedShortcode.sourceType === "component" ||
        parsedShortcode.sourceType === "slider") &&
      resolvedComponentId
    ) {
      return "component";
    }
    return parsedShortcode.sourceType;
  }, [parsedShortcode, resolvedComponentId]);

  const moduleOverrides = useMemo(
    () => toOverrideProps(parsedShortcode.renderProps),
    [parsedShortcode.renderProps],
  );

  const [moduleProps, setModuleProps] = useState({});
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadModuleSettings() {
      if (resolvedSourceType !== "component" || !resolvedComponentId) {
        setModuleLoading(false);
        setModuleError("");
        setModuleProps({});
        return;
      }

      setModuleLoading(true);
      setModuleError("");

      try {
        const res = await fetch(`/api/theme/${encodeURIComponent(resolvedComponentId)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Failed to load ${resolvedComponentId} settings`);
        }
        if (!cancelled) {
          const next = data && typeof data === "object" ? { ...data } : {};
          delete next.themePalette;
          delete next.colors;
          setModuleProps(next);
        }
      } catch (err) {
        if (!cancelled) {
          setModuleError(err?.message || "Failed to load module settings");
          setModuleProps({});
        }
      } finally {
        if (!cancelled) setModuleLoading(false);
      }
    }

    loadModuleSettings();
    return () => {
      cancelled = true;
    };
  }, [resolvedSourceType, resolvedComponentId]);

  const popupId =
    resolvedSourceType === "popup"
      ? normalizeShortcodeText(parsedShortcode.targetKey)
      : "";
  const [popupRow, setPopupRow] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    setPopupOpen(false);
  }, [popupId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPopup() {
      if (!popupId) {
        setPopupRow(null);
        setPopupError("");
        setPopupLoading(false);
        return;
      }

      setPopupLoading(true);
      setPopupError("");
      try {
        const res = await fetch("/api/public/popups", { cache: "no-store" });
        const rows = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error("Failed to load popup");
        }
        const list = Array.isArray(rows) ? rows : [];
        const found =
          list.find(
            (item) =>
              String(item?.componentId || "").trim().toLowerCase() ===
              popupId.toLowerCase(),
          ) || null;
        if (!cancelled) setPopupRow(found);
      } catch (err) {
        if (!cancelled) {
          setPopupError(err?.message || "Failed to load popup");
          setPopupRow(null);
        }
      } finally {
        if (!cancelled) setPopupLoading(false);
      }
    }

    loadPopup();
    return () => {
      cancelled = true;
    };
  }, [popupId]);

  const renderShortcodeContent = () => {
    if (!shortcodeText) {
      return (
        <div style={{ color: "rgba(0,0,0,0.65)" }}>
          Select a source or enter a shortcode in the editor.
        </div>
      );
    }

    if (resolvedSourceType === "form") {
      const formShortcode = normalizeShortcodeText(parsedShortcode.targetKey).toLowerCase();
      if (!formShortcode) {
        return (
          <div style={{ color: "#b42318" }}>
            Invalid form shortcode.
          </div>
        );
      }
      return <FormEmbed mode="shortcode" shortcode={formShortcode} />;
    }

    if (resolvedSourceType === "popup") {
      if (!popupId) {
        return <div style={{ color: "#b42318" }}>Invalid popup shortcode.</div>;
      }
      if (popupLoading) {
        return <div style={{ color: "rgba(0,0,0,0.65)" }}>Loading popup...</div>;
      }
      if (popupError) {
        return <div style={{ color: "#b42318" }}>{popupError}</div>;
      }
      if (!popupRow) {
        return (
          <div style={{ color: "#b42318" }}>
            Popup not found or not published.
          </div>
        );
      }

      const popupProps =
        popupRow?.defaultProps && typeof popupRow.defaultProps === "object"
          ? popupRow.defaultProps
          : {};
      const popupTitle =
        normalizeShortcodeText(moduleOverrides?.label) ||
        normalizeShortcodeText(popupProps?.title) ||
        normalizeShortcodeText(popupRow?.displayName) ||
        "Open Popup";
      const imageUrl = normalizeShortcodeText(popupProps?.imageUrl);
      const linkObj = popupProps?.link && typeof popupProps.link === "object"
        ? popupProps.link
        : {};
      const linkEnabled =
        (linkObj.enabled === true || popupProps?.linkEnabled === true) &&
        isValidPopupLinkUrl(linkObj.url || popupProps?.linkUrl);
      const linkUrl = normalizeShortcodeText(linkObj.url || popupProps?.linkUrl);
      const linkTarget = normalizePopupLinkTarget(
        linkObj.target || popupProps?.linkTarget,
      );
      const modalWidth = getPopupModalWidthPx(popupProps);
      const dismissible = popupProps?.dismissible !== false;

      return (
        <>
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            style={{
              border: "1px solid rgba(0,0,0,0.2)",
              borderRadius: 8,
              background: "#fff",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {popupTitle}
          </button>

          {popupOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1200,
                background: "rgba(0,0,0,0.52)",
                display: "grid",
                placeItems: "center",
                padding: 12,
              }}
            >
              <div
                style={{
                  width: `min(${modalWidth}px, calc(100vw - 24px))`,
                  maxHeight: "calc(100vh - 24px)",
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 12,
                  position: "relative",
                }}
              >
                {dismissible ? (
                  <button
                    type="button"
                    onClick={() => setPopupOpen(false)}
                    aria-label="Close popup"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 10,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      border: "1px solid rgba(0,0,0,0.18)",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    x
                  </button>
                ) : null}

                {imageUrl ? (
                  linkEnabled ? (
                    <a
                      href={linkUrl}
                      target={linkTarget}
                      rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                    >
                      <img
                        src={imageUrl}
                        alt={popupTitle}
                        style={{ display: "block", width: "100%", height: "auto" }}
                      />
                    </a>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={popupTitle}
                      style={{ display: "block", width: "100%", height: "auto" }}
                    />
                  )
                ) : (
                  <div style={{ padding: 20, color: "rgba(0,0,0,0.65)" }}>
                    Popup image is not configured.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      );
    }

    if (resolvedSourceType === "component") {
      if (!resolvedComponentId) {
        return (
          <div style={{ color: "#b42318" }}>
            Unsupported module in shortcode.
          </div>
        );
      }
      const InlineModule = SUPPORTED_SHORTCODE_COMPONENTS[resolvedComponentId];
      if (!InlineModule) {
        return (
          <div style={{ color: "#b42318" }}>
            Module renderer is not available.
          </div>
        );
      }

      return (
        <>
          {moduleLoading ? (
            <div style={{ color: "rgba(0,0,0,0.65)", marginBottom: 10 }}>
              Loading module settings...
            </div>
          ) : null}
          {moduleError ? (
            <div style={{ color: "#b42318", marginBottom: 10 }}>{moduleError}</div>
          ) : null}
          <InlineModule {...moduleProps} {...moduleOverrides} />
        </>
      );
    }

    return (
      <div style={{ color: "#b42318" }}>
        Unsupported shortcode format.
      </div>
    );
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
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
