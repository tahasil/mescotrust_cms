"use client";

import { useEffect, useRef } from "react";
import { ArrowRightOutlined, NotificationFilled } from "@ant-design/icons";
import { getColor } from "@/styles/Theme";
import { normalizeTarget } from "./editorUtils";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function color(value, fallbackKey) {
  const candidate = text(value);
  if (/^(#|rgb|hsl|linear-gradient|radial-gradient|transparent|var\()/i.test(candidate)) {
    return candidate;
  }
  return getColor(candidate || fallbackKey);
}

function legacyValues(items) {
  const list = Array.isArray(items) ? items : [];
  return {
    noticeText: text(list[0]?.text ?? list[0]?.label),
    actionText: text(list[1]?.text ?? list[1]?.label),
    actionUrl: text(list[1]?.url ?? list[1]?.href),
    actionTarget: normalizeTarget(list[1]?.target),
    actionEnabled: list[1]?.enabled !== false,
  };
}

export default function AppearanceHeaderRibbon({
  ribbonNoticeText,
  ribbonActionText,
  ribbonActionUrl,
  ribbonActionTarget,
  ribbonActionEnabled,
  ribbonItems,
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
  preview = false,
}) {
  const ribbonRef = useRef(null);
  const legacy = legacyValues(ribbonItems);
  const noticeText = text(ribbonNoticeText) || legacy.noticeText;
  const actionText = text(ribbonActionText) || legacy.actionText;
  const actionUrl = text(ribbonActionUrl) || legacy.actionUrl;
  const actionTarget = normalizeTarget(ribbonActionTarget || legacy.actionTarget);
  const actionEnabled =
    ribbonActionEnabled == null ? legacy.actionEnabled : ribbonActionEnabled !== false;

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
    };
  }, [actionEnabled, actionText, noticeText, preview]);

  if (!noticeText && (!actionEnabled || !actionText)) return null;

  const variables = {
    "--ribbon-bg": color(ribbonBackgroundColorKey, "black"),
    "--ribbon-text": color(ribbonTextColorKey, "cream"),
    "--ribbon-link": color(ribbonLinkColorKey, "white"),
    "--ribbon-hover": color(ribbonHoverColorKey, "primarySoft"),
    "--ribbon-icon": color(ribbonIconColorKey, "primarySoft"),
    "--ribbon-border": color(ribbonBorderColorKey, "border"),
    "--ribbon-link-border": color(ribbonLinkBorderColorKey, "border"),
    "--ribbon-focus": color(ribbonFocusColorKey, "primarySoft"),
  };

  const actionContent = (
    <>
      <span>{actionText}</span>
      {ribbonShowLinkArrow ? (
        <ArrowRightOutlined className="appearance-header-ribbon__arrow" aria-hidden="true" />
      ) : null}
    </>
  );

  return (
    <div
      ref={ribbonRef}
      className={`appearance-header-ribbon${preview ? " is-preview" : ""}`}
      style={variables}
      role="region"
      aria-label={text(ribbonAriaLabel) || undefined}
    >
      <div className="appearance-header-ribbon__inner">
        {noticeText ? (
          <p className="appearance-header-ribbon__notice">
            {ribbonShowNoticeIcon ? (
              <NotificationFilled
                className="appearance-header-ribbon__notice-icon"
                aria-hidden="true"
              />
            ) : null}
            <span>{noticeText}</span>
          </p>
        ) : null}
        {actionEnabled && actionText ? (
          actionUrl ? (
            <a
              className="appearance-header-ribbon__action"
              href={actionUrl}
              target={actionTarget === "_blank" ? "_blank" : undefined}
              rel={actionTarget === "_blank" ? "noopener noreferrer" : undefined}
            >
              {actionContent}
            </a>
          ) : (
            <span className="appearance-header-ribbon__action">{actionContent}</span>
          )
        ) : null}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .appearance-header-ribbon, .appearance-header-ribbon * { box-sizing: border-box; }
        .appearance-header-ribbon { position: relative; z-index: 110; width: 100%; padding: 9px 24px; color: var(--ribbon-text); background: var(--ribbon-bg); box-shadow: 0 1px 0 var(--ribbon-border); font-family: "Instrument Sans", system-ui, sans-serif; font-size: 13.5px; font-weight: 550; line-height: 1.6; }
        .appearance-header-ribbon__inner { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; }
        .appearance-header-ribbon__notice { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--ribbon-text); font: inherit; }
        .appearance-header-ribbon__action { display: inline-flex; align-items: center; gap: 6px; color: var(--ribbon-link); border-bottom: 1px solid var(--ribbon-link-border); font-weight: 700; text-decoration: none; }
        .appearance-header-ribbon a { transition: color .2s, border-color .2s; }
        .appearance-header-ribbon a:hover { color: var(--ribbon-hover); }
        .appearance-header-ribbon a:focus-visible { outline: 2px solid var(--ribbon-focus); outline-offset: 3px; }
        .appearance-header-ribbon__notice-icon, .appearance-header-ribbon__arrow { flex: 0 0 auto; color: var(--ribbon-icon); font-size: 16px; }
        .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .appearance-nav { top: calc(var(--appearance-ribbon-height, 40.6px) + 11.4px); }
        @media (max-width: 1023px) {
          .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .current-mobile .site-header-shell { top: calc(var(--appearance-ribbon-height, 40.6px) + 11.4px) !important; }
        }
        @media (max-width: 767px) {
          .appearance-header-ribbon { padding: 8px 16px; font-size: 12.5px; }
          .appearance-header-ribbon__inner { justify-content: space-between; flex-wrap: nowrap; gap: 12px; }
          .appearance-header-ribbon__notice { display: block; min-width: 0; overflow: hidden; white-space: nowrap; }
          .appearance-header-ribbon__notice > span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .appearance-header-ribbon__action { flex: 0 0 auto; white-space: nowrap; }
          .appearance-header-ribbon__notice-icon { display: none !important; }
          .public-site[data-has-header-ribbon="true"] .appearance-header:not(.is-scrolled) .current-mobile .site-header-shell { top: calc(var(--appearance-ribbon-height, 37px) + 9px) !important; }
          .public-site[data-has-header-ribbon="true"] .appearance-header.is-scrolled .current-mobile .site-header-shell { top: 8px !important; }
        }
      ` }} />
    </div>
  );
}
