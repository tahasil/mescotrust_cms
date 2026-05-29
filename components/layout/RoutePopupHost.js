"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isPopupRouteMatch, normalizePopupRoute } from "@/lib/popupRouteUtils";

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
    return `/api/media/${directMediaMatch[1]}?format=original`;
  }

  try {
    const parsed = new URL(value, "http://popup.local");
    const mediaPathMatch = parsed.pathname.match(
      /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
    );
    if (mediaPathMatch?.[1]) {
      return `/api/media/${mediaPathMatch[1]}?format=original`;
    }

    const keysToStrip = ["variant", "w", "h", "width", "height", "fit", "crop"];
    keysToStrip.forEach((key) => parsed.searchParams.delete(key));

    if (/^https?:\/\//i.test(value)) {
      const absolute = new URL(value);
      keysToStrip.forEach((key) => absolute.searchParams.delete(key));
      return absolute.toString();
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
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
    if (open && closeBtnRef.current) closeBtnRef.current.focus();
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
  const imageNode = (
    <img
      src={imageSrc}
      alt={String(props.title || activePopup.displayName || "Popup image")}
      className="route-popup-image"
    />
  );

  return (
    <>
      <div
        className={`route-popup-overlay ${open ? "open" : ""}`}
        style={{
          "--popup-duration": `${animationMs}ms`,
          "--popup-max-width": `${popupModalWidth}px`,
          "--popup-image-max-height": "86vh",
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
              &times;
            </button>
          )}
          <div className="route-popup-content">
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
          </div>
        </div>
      </div>
      <style jsx>{`
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
          background: rgba(2, 6, 23, 0.6);
        }
        .route-popup-modal {
          position: relative;
          max-width: min(var(--popup-max-width), 100vw);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.35);
          border: 1px solid rgba(15, 23, 42, 0.12);
          transform: translateY(12px) scale(0.98);
          transition: transform var(--popup-duration) ease;
          padding: 8px;
        }
        .route-popup-content {
          img {
            width: 100%;
            max-height: 600px;
            border-radius: 10px;
          }
        }
        .route-popup-media {
          display: block;
          img {
            width: 100wh;
            max-height: 600px;
            border-radius: 10px;
          }
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
          border: none;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.76);
          color: #fff;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          z-index: 2;
        }
        .route-popup-close:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 2px;
        }
        .route-popup-image-link {
          display: flex;
          justify-content: center;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          text-decoration: none;
          cursor: pointer;
        }
        .route-popup-image {
          width: auto;
          height: auto;
          max-width: min(
            calc(var(--popup-max-width) - 16px),
            calc(96vw - 16px)
          );
          max-height: min(var(--popup-image-max-height), calc(100vh - 92px));
          display: block;
          object-fit: contain;
          object-position: center center;
          background: #fff;
          border-radius: 10px;
        }
        @media (max-width: 768px) {
          .route-popup-modal {
            width: fit-content;
            max-width: 96vw;
            border-radius: 12px;
            max-height: 92vh;
          }
          .route-popup-close {
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
          }
          .route-popup-content {
            padding: 0;
          }
          .route-popup-image {
            max-width: calc(96vw - 16px);
            max-height: min(84vh, calc(100vh - 72px));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .route-popup-overlay,
          .route-popup-modal {
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </>
  );
}
