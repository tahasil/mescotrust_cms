"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "mesco_cookie_consent";
const CONSENT_EVENT = "mesco:cookie-consent-changed";

/**
 * Cookie consent banner with Google Consent Mode v2 integration.
 *
 * Reads/writes consent state from localStorage. When the user accepts,
 * calls window.gtag("consent", "update", { analytics_storage: "granted" })
 * so Google Analytics (already injected in app/layout.js) starts tracking.
 *
 * Default state (set in app/layout.js as a beforeInteractive script) is "denied".
 *
 * Visibility:
 *  - Hidden until client-side mount (avoids SSR flash)
 *  - Hidden if user has already chosen
 *  - A footer "Cookie Settings" link can dispatch the global event
 *    `mesco:open-cookie-settings` to re-open the banner.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage blocked — show banner anyway
      setVisible(true);
    }

    const reopen = () => setVisible(true);
    window.addEventListener("mesco:open-cookie-settings", reopen);
    return () => window.removeEventListener("mesco:open-cookie-settings", reopen);
  }, []);

  const persist = useCallback((value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    try {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: value === "accepted" ? "granted" : "denied",
          ad_storage: value === "accepted" ? "granted" : "denied",
        });
      }
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { value } }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  if (!mounted || !visible) return null;

  return (
    <>
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Cookie consent"
        className="mesco-cookie-banner"
      >
        <div className="mesco-cookie-inner">
          <div className="mesco-cookie-text">
            <strong>We value your privacy.</strong> We use cookies to improve
            your browsing experience and analyse site traffic. By clicking
            &ldquo;Accept All&rdquo;, you consent to our use of cookies. You
            can manage your preferences anytime via the &ldquo;Cookie
            Settings&rdquo; link in the footer.
          </div>
          <div className="mesco-cookie-actions">
            <button
              type="button"
              className="mesco-cookie-btn mesco-cookie-btn-secondary"
              onClick={() => persist("rejected")}
            >
              Reject
            </button>
            <button
              type="button"
              className="mesco-cookie-btn mesco-cookie-btn-primary"
              onClick={() => persist("accepted")}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .mesco-cookie-banner {
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 9998;
          background: var(--card-bg-color, #ffffff);
          color: var(--text-color, #222222);
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
          border-radius: var(--card-radius, 12px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
          padding: 18px 20px;
          font-family: var(--font-family, system-ui, sans-serif);
          font-size: 14px;
          line-height: 1.55;
          animation: mescoCookieFadeIn 0.35s ease-out;
        }
        .mesco-cookie-inner {
          max-width: var(--layout-width, 1200px);
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
        }
        .mesco-cookie-text {
          flex: 1 1 320px;
          min-width: 0;
        }
        .mesco-cookie-text strong {
          color: var(--heading-color, var(--text-color, #111111));
        }
        .mesco-cookie-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex-shrink: 0;
        }
        .mesco-cookie-btn {
          appearance: none;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
          background: transparent;
          color: inherit;
          padding: 10px 18px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          border-radius: var(--button-radius, 8px);
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .mesco-cookie-btn:hover {
          transform: translateY(-1px);
        }
        .mesco-cookie-btn-primary {
          background: var(--primary-color, var(--theme-primary, #E03C33));
          border-color: var(--primary-color, var(--theme-primary, #E03C33));
          color: var(--button-color, #ffffff);
        }
        .mesco-cookie-btn-secondary {
          background: transparent;
          border-color: var(--primary-color, var(--theme-primary, #E03C33));
          color: var(--primary-color, var(--theme-primary, #E03C33));
        }
        @keyframes mescoCookieFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .mesco-cookie-banner {
            box-sizing: border-box;
            left: max(8px, env(safe-area-inset-left, 0px));
            right: max(8px, env(safe-area-inset-right, 0px));
            bottom: max(8px, env(safe-area-inset-bottom, 0px));
            max-height: calc(100vh - 16px - env(safe-area-inset-bottom, 0px));
            max-height: calc(100dvh - 16px - env(safe-area-inset-bottom, 0px));
            padding: 14px;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
          }
          .mesco-cookie-inner {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .mesco-cookie-text {
            flex: 0 1 auto;
            width: 100%;
            overflow-wrap: anywhere;
          }
          .mesco-cookie-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            gap: 8px;
          }
          .mesco-cookie-btn {
            width: 100%;
            min-height: 44px;
            padding: 10px 12px;
            line-height: 1.2;
            white-space: normal;
          }
        }
        @media (max-width: 360px) {
          .mesco-cookie-banner {
            padding: 12px;
            font-size: 13px;
          }
          .mesco-cookie-inner {
            gap: 10px;
          }
        }
      ` }} />
    </>
  );
}
