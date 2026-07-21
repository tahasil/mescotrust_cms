"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isPopupRouteMatch, normalizePopupRoute } from "@/lib/popupRouteUtils";
import { resolvePopupFormShortcode } from "@/lib/popupShortcode";
import FormEmbed from "@/components/site/FormEmbed/FormEmbed";

const CLOSE_ANIMATION_FALLBACK_MS = 280;
const POPUP_REFRESH_INTERVAL_MS = 5000;

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const needle = `${name}=`;
  const chunks = String(document.cookie || "").split(";");
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.startsWith(needle)) return trimmed.slice(needle.length);
  }
  return "";
}

function setSessionCookie(name, value) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax`;
}

function getDismissCookieKey(componentId) {
  return `popup_dismissed_${String(componentId || "").trim()}`;
}

function getPopupDurationMs(popup) {
  const raw = Number(popup?.defaultProps?.animation?.durationMs);
  if (Number.isFinite(raw) && raw >= 120 && raw <= 1500) return raw;
  return CLOSE_ANIMATION_FALLBACK_MS;
}

function normalizeModalWidthPreset(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "full" ||
    value === "custom"
  ) {
    return value;
  }
  return "medium";
}

function normalizeCustomModalWidthPx(raw, fallback = 560) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(280, Math.min(1600, Math.round(value)));
}

function getPopupModalWidthPx(props) {
  const preset = normalizeModalWidthPreset(props?.modalWidthPreset);
  if (preset === "small") return 420;
  if (preset === "large") return 760;
  if (preset === "full") return 1200;
  if (preset === "custom") {
    return normalizeCustomModalWidthPx(props?.customModalWidthPx, 560);
  }
  return 560;
}

function normalizePopupLinkTarget(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase() === "_blank"
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

function getPopupLinkSettings(props) {
  const link = props?.link && typeof props.link === "object" ? props.link : {};
  const enabled = link.enabled === true || props?.linkEnabled === true;
  const url = String(
    link.url != null && String(link.url).trim()
      ? link.url
      : props?.linkUrl || "",
  ).trim();
  const target = normalizePopupLinkTarget(link.target || props?.linkTarget);
  if (!enabled || !isValidPopupLinkUrl(url)) {
    return {
      enabled: false,
      url: "",
      target: "_self",
    };
  }
  return {
    enabled: true,
    url,
    target,
  };
}

function normalizePopupImageUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  const directMediaMatch = value.match(
    /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
  );
  if (directMediaMatch?.[1]) {
    return `/api/media/${directMediaMatch[1]}?size=original&format=jpg`;
  }

  try {
    const parsed = new URL(value, "http://popup.local");
    const mediaPathMatch = parsed.pathname.match(
      /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
    );
    if (mediaPathMatch?.[1]) {
      return `/api/media/${mediaPathMatch[1]}?size=original&format=jpg`;
    }
  } catch {}

  return value;
}

function getLocalDismissKey(route, componentId) {
  return `${route}::${componentId}`;
}

export default function RoutePopupHost() {
  const pathname = usePathname();
  const [popups, setPopups] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);
  const closeTimerRef = useRef(null);
  const activePopupIdRef = useRef("");
  const fetchSeqRef = useRef(0);
  const localDismissedRef = useRef(new Set());

  const normalizedCurrentRoute = useMemo(
    () => normalizePopupRoute(pathname || "/"),
    [pathname],
  );

  const loadPopups = useCallback(async () => {
    const seq = fetchSeqRef.current + 1;
    fetchSeqRef.current = seq;
    try {
      const res = await fetch("/api/public/popups", { cache: "no-store" });
      const rows = res.ok ? await res.json() : [];
      if (fetchSeqRef.current !== seq) return;
      setPopups(Array.isArray(rows) ? rows : []);
    } catch {
      if (fetchSeqRef.current !== seq) return;
      setPopups([]);
    }
  }, []);

  useEffect(() => {
    activePopupIdRef.current = String(activePopup?.componentId || "").trim();
  }, [activePopup]);

  useEffect(() => {
    localDismissedRef.current.clear();
  }, [normalizedCurrentRoute]);

  useEffect(() => {
    loadPopups();
  }, [loadPopups, normalizedCurrentRoute]);

  useEffect(() => {
    const pollTimer = window.setInterval(loadPopups, POPUP_REFRESH_INTERVAL_MS);
    const onFocus = () => loadPopups();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") loadPopups();
    };
    const onStorage = (event) => {
      if (event.key === "popup_config_updated_at") loadPopups();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadPopups]);

  useEffect(() => {
    const sorted = [...(Array.isArray(popups) ? popups : [])].sort((a, b) => {
      const pa = Number(a?.defaultProps?.priority) || 100;
      const pb = Number(b?.defaultProps?.priority) || 100;
      if (pa !== pb) return pa - pb;
      const ta = new Date(a?.updatedAt || 0).getTime();
      const tb = new Date(b?.updatedAt || 0).getTime();
      if (tb !== ta) return tb - ta;
      return String(a?.componentId || "").localeCompare(
        String(b?.componentId || ""),
      );
    });

    const nextPopup =
      sorted.find((popup) => {
        const componentId = String(popup?.componentId || "").trim();
        if (!componentId) return false;

        const props =
          popup?.defaultProps && typeof popup.defaultProps === "object"
            ? popup.defaultProps
            : {};
        const targetRoutes = Array.isArray(props.targetRoutes)
          ? props.targetRoutes
          : [];
        if (!isPopupRouteMatch(normalizedCurrentRoute, targetRoutes))
          return false;
        if (props.openOnPageLoad === false) return false;

        const reShowMode =
          props.reShowBehavior === "session_until_browser_close"
            ? "session_until_browser_close"
            : "always";
        if (reShowMode === "session_until_browser_close") {
          return readCookie(getDismissCookieKey(componentId)) !== "1";
        }

        const localDismissKey = getLocalDismissKey(
          normalizedCurrentRoute,
          componentId,
        );
        return !localDismissedRef.current.has(localDismissKey);
      }) || null;

    if (!nextPopup) {
      setOpen(false);
      setActivePopup(null);
      return;
    }

    const nextPopupId = String(nextPopup.componentId || "").trim();
    const activePopupId = activePopupIdRef.current;
    setActivePopup(nextPopup);

    if (activePopupId !== nextPopupId) {
      setOpen(false);
      requestAnimationFrame(() => setOpen(true));
      return;
    }
    if (!open) {
      requestAnimationFrame(() => setOpen(true));
    }
  }, [popups, normalizedCurrentRoute, open]);

  useEffect(() => {
    if (!activePopup) return undefined;
    const activePopupId = String(activePopup.componentId || "")
      .trim()
      .toLowerCase();
    const shouldAutofocusClose = activePopupId !== "modalform";
    if (open && closeBtnRef.current && shouldAutofocusClose) {
      closeBtnRef.current.focus();
    }
    return undefined;
  }, [activePopup, open]);

  useEffect(() => {
    if (!activePopup || !open) return undefined;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [activePopup, open]);

  const handleClose = useCallback(() => {
    if (!activePopup) return;
    const componentId = String(activePopup.componentId || "").trim();
    if (!componentId) return;

    const reShowMode =
      activePopup?.defaultProps?.reShowBehavior ===
      "session_until_browser_close"
        ? "session_until_browser_close"
        : "always";
    if (reShowMode === "session_until_browser_close") {
      setSessionCookie(getDismissCookieKey(componentId), "1");
    } else {
      localDismissedRef.current.add(
        getLocalDismissKey(normalizedCurrentRoute, componentId),
      );
    }

    setOpen(false);
    const duration = getPopupDurationMs(activePopup);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setActivePopup(null);
    }, duration);
  }, [activePopup, normalizedCurrentRoute]);

  useEffect(() => {
    if (!activePopup || !open) return undefined;
    const dismissible = activePopup?.defaultProps?.dismissible !== false;
    if (!dismissible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePopup, open, handleClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!activePopup) return null;

  const props =
    activePopup.defaultProps && typeof activePopup.defaultProps === "object"
      ? activePopup.defaultProps
      : {};
  const dismissible = props.dismissible !== false;
  const animationMs = getPopupDurationMs(activePopup);
  const popupModalWidth = getPopupModalWidthPx(props);
  const link = getPopupLinkSettings(props);
  const imageSrc = normalizePopupImageUrl(props.imageUrl);
  const popupComponentId = String(activePopup.componentId || "")
    .trim()
    .toLowerCase();
  const isModalFormPopup = popupComponentId === "modalform";
  const popupTitle = String(props.title || "").trim();
  const popupDescription = String(props.description || "").trim();
  const showPopupHeader = isModalFormPopup && Boolean(popupTitle || popupDescription);
  const popupFormShortcodeState = resolvePopupFormShortcode(props.formShortcode);
  const hasPopupFormShortcode = popupFormShortcodeState.isValid;
  const imageNode = imageSrc ? (
    <img
      src={imageSrc}
      className="route-popup-image"
      alt={String(props.title || activePopup.displayName || "Popup image")}
    />
  ) : null;
  const hasPopupImage = Boolean(imageNode);

  return (
    <>
      <div
        className={`route-popup-overlay ${open ? "open" : ""} ${
          isModalFormPopup ? "is-modal-form" : ""
        }`}
        style={{
          "--popup-duration": `${animationMs}ms`,
          "--popup-max-width": `${popupModalWidth}px`,
          "--popup-image-max-height": "calc(100svh - 96px)",
        }}
        aria-hidden={!open}
      >
        <div
          className="route-popup-backdrop"
          onClick={dismissible ? handleClose : undefined}
        />
        <div
          className="route-popup-modal"
          role="dialog"
          aria-modal="true"
          aria-label={String(props.title || activePopup.displayName || "Popup")}
        >
          {dismissible && (
            <button
              ref={closeBtnRef}
              type="button"
              className="route-popup-close"
              aria-label="Close popup"
              onClick={handleClose}
            >
              <span className="route-popup-close-icon" aria-hidden="true" />
            </button>
          )}
          <div className="route-popup-content">
            {imageNode ? (
              <div className="route-popup-media">
                {link.enabled ? (
                  <a
                    href={link.url}
                    target={link.target}
                    rel={
                      link.target === "_blank" ? "noopener noreferrer" : undefined
                    }
                    className="route-popup-image-link"
                  >
                    {imageNode}
                  </a>
                ) : (
                  imageNode
                )}
              </div>
            ) : null}
            {hasPopupFormShortcode ? (
              <div
                className={`route-popup-form ${hasPopupImage ? "has-media" : "no-media"}`}
              >
                {showPopupHeader ? (
                  <div className="route-popup-form-header">
                    {popupTitle ? (
                      <h3 className="route-popup-form-title">{popupTitle}</h3>
                    ) : null}
                    {popupDescription ? (
                      <p className="route-popup-form-description">{popupDescription}</p>
                    ) : null}
                  </div>
                ) : null}
                <FormEmbed
                  mode="shortcode"
                  shortcode={popupFormShortcodeState.shortcode}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .route-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: grid;
          place-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--popup-duration) ease;
        }
        .route-popup-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .route-popup-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        .route-popup-modal {
          position: relative;
          width: min(var(--popup-max-width), calc(100vw - 24px));
          max-width: calc(100vw - 24px);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.35);
          border: 1px solid rgba(15, 23, 42, 0.12);
          transform: translateY(12px) scale(0.98);
          transition: transform var(--popup-duration) ease;
          padding: 8px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .route-popup-overlay.open .route-popup-modal {
          transform: translateY(0) scale(1);
        }
        .route-popup-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          padding: 0;
          border: none;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.76);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .route-popup-close-icon {
          position: relative;
          display: block;
          width: 14px;
          height: 14px;
        }
        .route-popup-close-icon::before,
        .route-popup-close-icon::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 14px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: center;
        }
        .route-popup-close-icon::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .route-popup-close-icon::after {
          transform: translate(-50%, -50%) rotate(-45deg);
        }
        .route-popup-close:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 2px;
        }
        .route-popup-image-link {
          display: block;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          text-decoration: none;
          cursor: pointer;
        }
        .route-popup-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          overflow-x: hidden;
          overflow-y: auto;
          max-height: calc(100svh - 96px);
          padding: 0;
        }
        .route-popup-media {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .route-popup-form {
          width: 100%;
          padding: 14px 14px 8px;
          background: #ffffff;
        }
        .route-popup-form.has-media {
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }
        .route-popup-form.no-media {
          border-top: none;
        }
        .route-popup-form-header {
          margin: 0 0 10px;
        }
        .route-popup-form-title {
          margin: 0 0px 16px 0px;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 600;
          color: #0f172a;
        }
        .route-popup-form-description {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.45;
          color: #475569;
        }
        .route-popup-overlay.is-modal-form .route-popup-close {
          background: transparent;
          color: #0f172a;
          box-shadow: none;
          border: none;
        }
        .route-popup-overlay.is-modal-form .route-popup-close:focus-visible {
          outline: none;
          box-shadow: none;
        }
        .route-popup-overlay.is-modal-form .route-popup-form.no-media {
          padding-top: 8px;
        }
        .route-popup-form :global(.ant-alert) {
          margin-bottom: 0;
        }
        .route-popup-form :global(.ant-form-item:last-child) {
          margin-bottom: 0;
        }
        .route-popup-image {
          width: 100%;
          min-width: 0;
          height: auto;
          max-width: 100%;
          max-height: min(var(--popup-image-max-height), calc(100vh - 96px));
          display: block;
          object-fit: contain;
          object-position: center center;
          background: #fff;
          border-radius: 10px;
        }
        @media (max-width: 768px) {
          .route-popup-modal {
            width: min(var(--popup-max-width), calc(100vw - 16px));
            max-width: calc(100vw - 16px);
            border-radius: 12px;
          }
          .route-popup-close {
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
          }
          .route-popup-close-icon {
            width: 12px;
            height: 12px;
          }
          .route-popup-close-icon::before,
          .route-popup-close-icon::after {
            width: 12px;
          }
          .route-popup-image {
            max-height: min(var(--popup-image-max-height), calc(100vh - 72px));
          }
          .route-popup-overlay {
            --popup-image-max-height: calc(100svh - 72px);
          }
          .route-popup-content {
            max-height: calc(100svh - 72px);
          }
          .route-popup-form {
            padding: 12px 12px 6px;
          }
          .route-popup-form-title {
            font-size: 22px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .route-popup-overlay,
          .route-popup-modal {
            transition-duration: 1ms !important;
          }
        }
      ` }} />
    </>
  );
}
