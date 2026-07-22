"use client";

import { useEffect, useMemo, useRef } from "react";
import { NotificationFilled, ArrowRightOutlined } from "@ant-design/icons";
import { getColor } from "@/styles/Theme";
import { normalizeTarget } from "./editorUtils";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function number(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(min, Math.min(max, parsed))
    : fallback;
}

function color(value, fallbackKey) {
  const candidate = text(value);
  if (/^(#|rgb|hsl|linear-gradient|radial-gradient|transparent|var\()/i.test(candidate)) {
    return candidate;
  }
  return getColor(candidate || fallbackKey);
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      text: text(item?.text ?? item?.label),
      url: text(item?.url ?? item?.href),
      target: normalizeTarget(item?.target),
      enabled: item?.enabled !== false,
    }))
    .filter((item) => item.enabled && item.text);
}

export default function AppearanceHeaderRibbon({
  ribbonItems = [],
  ribbonAriaLabel = "",
  ribbonShowNoticeIcon = true,
  ribbonShowLinkArrow = true,
  ribbonBackgroundColorKey = "",
  ribbonTextColorKey = "",
  ribbonLinkColorKey = "",
  ribbonHoverColorKey = "",
  ribbonIconColorKey = "",
  ribbonBorderColorKey = "",
  ribbonLinkBorderColorKey = "",
  ribbonFocusColorKey = "",
  ribbonFontSize,
  ribbonFontWeight,
  ribbonLineHeight,
  ribbonLinkFontWeight,
  ribbonIconSize,
  ribbonPaddingY,
  ribbonPaddingX,
  ribbonItemGap,
  ribbonNoticeGap,
  ribbonActionGap,
  ribbonInnerGap,
  ribbonHeaderGapDesktop,
  ribbonHeaderGapMobile,
  ribbonMobileFontSize,
  ribbonMobilePaddingY,
  ribbonMobilePaddingX,
  ribbonMobileItemGap,
  ribbonHideNoticeIconMobile = true,
  preview = false,
}) {
  const ribbonRef = useRef(null);
  const items = useMemo(() => normalizeItems(ribbonItems), [ribbonItems]);

  useEffect(() => {
    if (preview || !ribbonRef.current) return undefined;
    const root = ribbonRef.current.closest(".public-site");
    if (!root) return undefined;

    const updateHeight = () => {
      const height = ribbonRef.current?.getBoundingClientRect().height || 0;
      if (height > 0) {
        root.style.setProperty(
          "--appearance-ribbon-height",
          `${Math.round(height * 1000) / 1000}px`,
        );
        root.style.setProperty(
          "--appearance-ribbon-header-gap-desktop",
          `${number(ribbonHeaderGapDesktop, 0, 40, 11.4)}px`,
        );
        root.style.setProperty(
          "--appearance-ribbon-header-gap-mobile",
          `${number(ribbonHeaderGapMobile, 0, 40, 9)}px`,
        );
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(ribbonRef.current);
    window.addEventListener("resize", updateHeight, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      root.style.removeProperty("--appearance-ribbon-height");
      root.style.removeProperty("--appearance-ribbon-header-gap-desktop");
      root.style.removeProperty("--appearance-ribbon-header-gap-mobile");
    };
  }, [items, preview, ribbonHeaderGapDesktop, ribbonHeaderGapMobile]);

  if (items.length === 0) return null;

  const variables = {
    "--ribbon-bg": color(ribbonBackgroundColorKey, "black"),
    "--ribbon-text": color(ribbonTextColorKey, "cream"),
    "--ribbon-link": color(ribbonLinkColorKey, "white"),
    "--ribbon-hover": color(ribbonHoverColorKey, "primarySoft"),
    "--ribbon-icon": color(ribbonIconColorKey, "primarySoft"),
    "--ribbon-border": color(ribbonBorderColorKey, "border"),
    "--ribbon-link-border": color(ribbonLinkBorderColorKey, "border"),
    "--ribbon-focus": color(ribbonFocusColorKey, "primarySoft"),
    "--ribbon-font-size": `${number(ribbonFontSize, 10, 24, 13.5)}px`,
    "--ribbon-font-weight": number(ribbonFontWeight, 300, 900, 550),
    "--ribbon-line-height": number(ribbonLineHeight, 1, 2.4, 1.6),
    "--ribbon-link-weight": number(ribbonLinkFontWeight, 300, 900, 700),
    "--ribbon-icon-size": `${number(ribbonIconSize, 10, 32, 16)}px`,
    "--ribbon-padding-y": `${number(ribbonPaddingY, 0, 30, 9)}px`,
    "--ribbon-padding-x": `${number(ribbonPaddingX, 0, 80, 24)}px`,
    "--ribbon-item-gap": `${number(ribbonItemGap, 0, 60, 18)}px`,
    "--ribbon-notice-gap": `${number(ribbonNoticeGap ?? ribbonInnerGap, 0, 30, 8)}px`,
    "--ribbon-action-gap": `${number(ribbonActionGap ?? ribbonInnerGap, 0, 30, 6)}px`,
    "--ribbon-header-gap-desktop": `${number(ribbonHeaderGapDesktop, 0, 40, 11.4)}px`,
    "--ribbon-header-gap-mobile": `${number(ribbonHeaderGapMobile, 0, 40, 9)}px`,
    "--ribbon-mobile-font-size": `${number(ribbonMobileFontSize, 10, 20, 12.5)}px`,
    "--ribbon-mobile-padding-y": `${number(ribbonMobilePaddingY, 0, 30, 8)}px`,
    "--ribbon-mobile-padding-x": `${number(ribbonMobilePaddingX, 0, 60, 16)}px`,
    "--ribbon-mobile-item-gap": `${number(ribbonMobileItemGap, 0, 40, 12)}px`,
  };

  return (
    <div
      ref={ribbonRef}
      className={`appearance-header-ribbon${preview ? " is-preview" : ""}`}
      style={variables}
      role="region"
      aria-label={text(ribbonAriaLabel) || undefined}
    >
      <div className="appearance-header-ribbon__inner">
        {items.map((item, index) => {
          const target = item.target === "_blank" ? "_blank" : undefined;
          const content = (
            <>
              {index === 0 && ribbonShowNoticeIcon ? (
                <NotificationFilled className={`appearance-header-ribbon__notice-icon${ribbonHideNoticeIconMobile ? " is-hidden-mobile" : ""}`} aria-hidden="true" />
              ) : null}
              <span>{item.text}</span>
              {index > 0 && ribbonShowLinkArrow ? (
                <ArrowRightOutlined className="appearance-header-ribbon__arrow" aria-hidden="true" />
              ) : null}
            </>
          );
          return item.url ? (
            <a
              key={`${item.text}-${index}`}
              className={index === 0 ? "is-message" : "is-action"}
              href={item.url}
              target={target}
              rel={target ? "noopener noreferrer" : undefined}
            >
              {content}
            </a>
          ) : (
            <span key={`${item.text}-${index}`} className={index === 0 ? "is-message" : "is-action"}>
              {content}
            </span>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .appearance-header-ribbon, .appearance-header-ribbon * { box-sizing: border-box; }
        .appearance-header-ribbon { position: relative; z-index: 110; width: 100%; padding: var(--ribbon-padding-y) var(--ribbon-padding-x); color: var(--ribbon-text); background: var(--ribbon-bg); box-shadow: 0 1px 0 var(--ribbon-border); font-family: "Instrument Sans", system-ui, sans-serif; font-size: var(--ribbon-font-size); font-weight: var(--ribbon-font-weight); line-height: var(--ribbon-line-height); }
        .appearance-header-ribbon__inner { display: flex; align-items: center; justify-content: center; gap: var(--ribbon-item-gap); flex-wrap: wrap; }
        .appearance-header-ribbon a, .appearance-header-ribbon span.is-message, .appearance-header-ribbon span.is-action { display: inline-flex; align-items: center; color: inherit; text-decoration: none; }
        .appearance-header-ribbon .is-message { gap: var(--ribbon-notice-gap); color: var(--ribbon-text); font-weight: var(--ribbon-font-weight); }
        .appearance-header-ribbon .is-action { gap: var(--ribbon-action-gap); color: var(--ribbon-link); font-weight: var(--ribbon-link-weight); border-bottom: 1px solid var(--ribbon-link-border); }
        .appearance-header-ribbon a { transition: color .2s, border-color .2s; }
        .appearance-header-ribbon a:hover { color: var(--ribbon-hover); }
        .appearance-header-ribbon a:focus-visible { outline: 2px solid var(--ribbon-focus); outline-offset: 3px; }
        .appearance-header-ribbon__notice-icon, .appearance-header-ribbon__arrow { flex: 0 0 auto; color: var(--ribbon-icon); font-size: var(--ribbon-icon-size); }
        .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .appearance-nav { top: calc(var(--appearance-ribbon-height, 40.6px) + var(--appearance-ribbon-header-gap-desktop, 11.4px)); }
        @media (max-width: 1023px) {
          .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .current-mobile .site-header-shell { top: calc(var(--appearance-ribbon-height, 40.6px) + var(--appearance-ribbon-header-gap-desktop, 11.4px)) !important; }
        }
        @media (max-width: 767px) {
          .appearance-header-ribbon { padding: var(--ribbon-mobile-padding-y) var(--ribbon-mobile-padding-x); font-size: var(--ribbon-mobile-font-size); }
          .appearance-header-ribbon__inner { justify-content: space-between; flex-wrap: nowrap; gap: var(--ribbon-mobile-item-gap); }
          .appearance-header-ribbon .is-message { min-width: 0; overflow: hidden; white-space: nowrap; }
          .appearance-header-ribbon .is-message > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .appearance-header-ribbon .is-action { flex: 0 0 auto; white-space: nowrap; }
          .appearance-header-ribbon__notice-icon.is-hidden-mobile { display: none; }
          .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .current-mobile .site-header-shell { top: calc(var(--appearance-ribbon-height, 37px) + var(--appearance-ribbon-header-gap-mobile, 9px)) !important; }
          .public-site[data-has-header-ribbon="true"] .appearance-header.is-scrolled .current-mobile .site-header-shell { top: 8px !important; }
        }
      ` }} />
    </div>
  );
}
