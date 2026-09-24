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
  if (
    /^(#|rgb|hsl|linear-gradient|radial-gradient|transparent|var\()/i.test(
      candidate,
    )
  ) {
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

function normalizeRibbonItems(props) {
  if (Array.isArray(props?.ribbonItems) && props.ribbonItems.length > 0) {
    if (
      props.ribbonItems.length === 2 &&
      !props.ribbonItems[0]?.noticeText &&
      (props.ribbonItems[0]?.text || props.ribbonItems[0]?.label) &&
      (props.ribbonItems[1]?.url || props.ribbonItems[1]?.href)
    ) {
      const legacy = legacyValues(props.ribbonItems);
      return [
        {
          noticeText: legacy.noticeText,
          actionText: legacy.actionText,
          actionUrl: legacy.actionUrl,
          actionTarget: normalizeTarget(legacy.actionTarget),
        },
      ];
    }
    const mapped = props.ribbonItems
      .map((item, idx) => ({
        noticeText: text(item?.noticeText ?? item?.text ?? item?.label),
        actionText: text(
          item?.actionText ??
            item?.linkText ??
            (idx === 0 ? props?.ribbonActionText : "View Notice"),
        ),
        actionUrl: text(
          item?.actionUrl ??
            item?.url ??
            item?.href ??
            (idx === 0 ? props?.ribbonActionUrl : ""),
        ),
        actionTarget: normalizeTarget(
          item?.actionTarget ??
            item?.target ??
            (idx === 0 ? props?.ribbonActionTarget : "_self"),
        ),
      }))
      .filter((item) => item.noticeText || item.actionText);

    if (mapped.length > 0) return mapped;
  }

  const legacy = legacyValues(props?.ribbonItems);
  const noticeText = text(props?.ribbonNoticeText) || legacy.noticeText;
  const actionText = text(props?.ribbonActionText) || legacy.actionText;
  const actionUrl = text(props?.ribbonActionUrl) || legacy.actionUrl;
  const actionTarget = normalizeTarget(
    props?.ribbonActionTarget || legacy.actionTarget,
  );

  if (noticeText || actionText) {
    return [
      {
        noticeText,
        actionText,
        actionUrl,
        actionTarget,
      },
    ];
  }

  return [];
}

export default function AppearanceHeaderRibbon({
  ribbonNoticeText,
  ribbonActionText,
  ribbonActionUrl,
  ribbonActionTarget,
  ribbonActionEnabled,
  ribbonDirection = "rtl",
  ribbonSpeed = 45,
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
  const items = normalizeRibbonItems({
    ribbonNoticeText,
    ribbonActionText,
    ribbonActionUrl,
    ribbonActionTarget,
    ribbonItems,
  });

  const legacy = legacyValues(ribbonItems);
  const actionEnabled =
    ribbonActionEnabled == null
      ? legacy.actionEnabled
      : ribbonActionEnabled !== false;

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
  }, [actionEnabled, items, preview]);

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
  };

  const marqueeDirection =
    String(ribbonDirection || "").trim().toLowerCase() === "ltr"
      ? "right"
      : "left";

  const marqueeSpeed =
    ribbonSpeed != null && Number(ribbonSpeed) > 0 ? Number(ribbonSpeed) : 45;

  const isMultiItem = items.length > 1;

  return (
    <div
      ref={ribbonRef}
      className={`appearance-header-ribbon${preview ? " is-preview" : ""}${isMultiItem ? " is-marquee" : ""}`}
      style={variables}
      role="region"
      aria-label={text(ribbonAriaLabel) || undefined}
    >
      {isMultiItem ? (
        <div className="appearance-header-ribbon__marquee" aria-live="off">
          <div
            className={`appearance-header-ribbon__track appearance-header-ribbon__track--${marqueeDirection}`}
            style={{
              "--ribbon-duration": `${Math.max(16, items.length * 9 * (45 / marqueeSpeed))}s`,
            }}
          >
            {[0, 1, 2].map((setIdx) => (
              <div
                key={`ribbon-set-${setIdx}`}
                className="appearance-header-ribbon__set"
                aria-hidden={setIdx > 0 ? "true" : undefined}
              >
                {items.map((item, index) => {
                  const itemActionContent = (
                    <>
                      <span>{item.actionText}</span>
                      {ribbonShowLinkArrow ? (
                        <ArrowRightOutlined
                          className="appearance-header-ribbon__arrow"
                          aria-hidden="true"
                        />
                      ) : null}
                    </>
                  );

                  return (
                    <div
                      key={`ribbon-item-${setIdx}-${index}`}
                      className="appearance-header-ribbon__marquee-item"
                    >
                      {item.noticeText ? (
                        <span className="appearance-header-ribbon__notice">
                          {ribbonShowNoticeIcon ? (
                            <NotificationFilled
                              className="appearance-header-ribbon__notice-icon"
                              aria-hidden="true"
                            />
                          ) : null}
                          <span>{item.noticeText}</span>
                        </span>
                      ) : null}
                      {actionEnabled && item.actionText ? (
                        item.actionUrl ? (
                          <a
                            className="appearance-header-ribbon__action"
                            href={item.actionUrl}
                            target={
                              item.actionTarget === "_blank" ? "_blank" : undefined
                            }
                            rel={
                              item.actionTarget === "_blank"
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {itemActionContent}
                          </a>
                        ) : (
                          <span className="appearance-header-ribbon__action">
                            {itemActionContent}
                          </span>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="appearance-header-ribbon__inner">
          {items[0]?.noticeText ? (
            <p className="appearance-header-ribbon__notice">
              {ribbonShowNoticeIcon ? (
                <NotificationFilled
                  className="appearance-header-ribbon__notice-icon"
                  aria-hidden="true"
                />
              ) : null}
              <span>{items[0].noticeText}</span>
            </p>
          ) : null}
          {actionEnabled && items[0]?.actionText ? (
            items[0]?.actionUrl ? (
              <a
                className="appearance-header-ribbon__action"
                href={items[0].actionUrl}
                target={
                  items[0].actionTarget === "_blank" ? "_blank" : undefined
                }
                rel={
                  items[0].actionTarget === "_blank"
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                <span>{items[0].actionText}</span>
                {ribbonShowLinkArrow ? (
                  <ArrowRightOutlined
                    className="appearance-header-ribbon__arrow"
                    aria-hidden="true"
                  />
                ) : null}
              </a>
            ) : (
              <span className="appearance-header-ribbon__action">
                <span>{items[0].actionText}</span>
                {ribbonShowLinkArrow ? (
                  <ArrowRightOutlined
                    className="appearance-header-ribbon__arrow"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            )
          ) : null}
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .appearance-header-ribbon, .appearance-header-ribbon * { box-sizing: border-box; }
        .appearance-header-ribbon {
          position: relative;
          z-index: 90;
          width: 100%;
          height: 40px;
          min-height: 40px;
          max-height: 40px;
          padding: 0 24px;
          color: var(--ribbon-text);
          background: var(--ribbon-bg);
          box-shadow: 0 1px 0 var(--ribbon-border);
          font-family: "Instrument Sans", system-ui, sans-serif;
          font-size: 13.5px;
          font-weight: 550;
          line-height: 40px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .appearance-header-ribbon__inner {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex-wrap: nowrap;
        }
        .appearance-header-ribbon__notice {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: var(--ribbon-text);
          font: inherit;
          white-space: nowrap;
          line-height: 1;
        }
        .appearance-header-ribbon__action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ribbon-link);
          border-bottom: 1px solid var(--ribbon-link-border);
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          line-height: 1.2;
        }
        .appearance-header-ribbon a { transition: color .2s, border-color .2s; }
        .appearance-header-ribbon a:hover { color: var(--ribbon-hover); }
        .appearance-header-ribbon a:focus-visible { outline: 2px solid var(--ribbon-focus); outline-offset: 3px; }
        .appearance-header-ribbon__notice-icon, .appearance-header-ribbon__arrow { flex: 0 0 auto; color: var(--ribbon-icon); font-size: 16px; display: inline-flex; align-items: center; }
        .appearance-header-ribbon__marquee {
          position: relative;
          display: flex;
          align-items: center;
          overflow: hidden;
          width: 100%;
          height: 100%;
          user-select: none;
        }
        .appearance-header-ribbon__track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
        }
        .appearance-header-ribbon__track--left {
          animation: appearanceHeaderRibbonScrollLeft var(--ribbon-duration, 30s) linear infinite;
        }
        .appearance-header-ribbon__track--right {
          animation: appearanceHeaderRibbonScrollRight var(--ribbon-duration, 30s) linear infinite;
        }
        .appearance-header-ribbon:hover .appearance-header-ribbon__track {
          animation-play-state: paused;
        }
        .appearance-header-ribbon__set {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .appearance-header-ribbon__marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-right: 56px;
          flex-shrink: 0;
          white-space: nowrap;
          line-height: 1;
        }
        @keyframes appearanceHeaderRibbonScrollLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333333%, 0, 0); }
        }
        @keyframes appearanceHeaderRibbonScrollRight {
          0% { transform: translate3d(-33.333333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @media (max-width: 767px) {
          .appearance-header-ribbon {
            height: 36px;
            min-height: 36px;
            max-height: 36px;
            padding: 0 16px;
            font-size: 12.5px;
            line-height: 36px;
          }
          .appearance-header-ribbon__inner {
            justify-content: space-between;
            flex-wrap: nowrap;
            gap: 12px;
          }
          .appearance-header-ribbon__inner .appearance-header-ribbon__notice {
            display: block;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
          }
          .appearance-header-ribbon__inner .appearance-header-ribbon__notice > span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .appearance-header-ribbon__inner .appearance-header-ribbon__action {
            flex: 0 0 auto;
            white-space: nowrap;
          }
          .appearance-header-ribbon__inner .appearance-header-ribbon__notice-icon {
            display: none !important;
          }
          .appearance-header-ribbon__marquee-item {
            margin-right: 36px;
            gap: 10px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .appearance-header-ribbon__track { animation-play-state: paused !important; }
        }
      `,
        }}
      />
    </div>
  );
}
