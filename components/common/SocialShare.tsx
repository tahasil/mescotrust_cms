"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  FacebookFilled,
  LinkedinFilled,
  LinkOutlined,
  MailOutlined,
  SendOutlined,
  ShareAltOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import {
  copyShareLink,
  generateShareUrl,
  type SharePlatform,
} from "@/helpers/socialShare";

type SocialShareProps = {
  canonicalUrl: string;
  title: string;
  description?: string;
  image?: string;
  buttonLabel?: string;
  className?: string;
};

type ShareOption = {
  platform: SharePlatform;
  label: string;
  icon: ReactNode;
};

const SHARE_OPTIONS: ShareOption[] = [
  { platform: "facebook", label: "Facebook", icon: <FacebookFilled /> },
  {
    platform: "x",
    label: "X",
    icon: <span className="social-share-x-icon" aria-hidden>X</span>,
  },
  { platform: "linkedin", label: "LinkedIn", icon: <LinkedinFilled /> },
  { platform: "whatsapp", label: "WhatsApp", icon: <WhatsAppOutlined /> },
  { platform: "telegram", label: "Telegram", icon: <SendOutlined /> },
  { platform: "email", label: "Email", icon: <MailOutlined /> },
  { platform: "copy", label: "Copy Link", icon: <LinkOutlined /> },
];

const EXTERNAL_PLATFORMS = new Set<SharePlatform>([
  "facebook",
  "x",
  "linkedin",
  "whatsapp",
  "telegram",
]);

export default function SocialShare({
  canonicalUrl,
  title,
  description = "",
  image = "",
  buttonLabel = "Share",
  className = "",
}: SocialShareProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLAnchorElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState("Link copied successfully");

  const shareData = useMemo(
    () => ({
      url: canonicalUrl,
      title,
      description,
      image,
    }),
    [canonicalUrl, title, description, image],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!target || !(target instanceof Node)) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      firstActionRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = window.setTimeout(() => setToastVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, [toastVisible]);

  const handleCopy = async () => {
    const copied = await copyShareLink(canonicalUrl);
    setToastText(copied ? "Link copied successfully" : "Unable to copy link");
    setToastVisible(true);
    setIsOpen(false);
  };

  return (
    <div
      className={`social-share ${className} ${isOpen ? "is-open" : ""}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        className="social-share-trigger"
        aria-label="Share this page"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ShareAltOutlined />
        <span>{buttonLabel}</span>
      </button>

      <div className="social-share-overlay" onClick={() => setIsOpen(false)} aria-hidden />

      <div className="social-share-menu" role="menu" aria-label="Share options">
        <ul>
          {SHARE_OPTIONS.map((option, idx) => {
            const href = generateShareUrl(option.platform, shareData);
            const key = option.platform;

            if (option.platform === "copy") {
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="menuitem"
                    className="social-share-action"
                    aria-label={`Copy link for ${title || "this page"}`}
                    onClick={handleCopy}
                  >
                    <span className="icon-wrap">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                </li>
              );
            }

            const isExternal = EXTERNAL_PLATFORMS.has(option.platform);

            return (
              <li key={key}>
                <a
                  ref={idx === 0 ? firstActionRef : null}
                  role="menuitem"
                  className="social-share-action"
                  href={href}
                  aria-label={`Share on ${option.label}`}
                  target={isExternal ? "_blank" : "_self"}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="icon-wrap">{option.icon}</span>
                  <span>{option.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`social-share-toast ${toastVisible ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toastText}
      </div>

      <style jsx>{`
        .social-share {
          position: relative;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          z-index: 4;
        }

        .social-share-trigger {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          color: rgba(0, 0, 0, 0.78);
          border-radius: 999px;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .social-share-trigger:hover {
          color: var(--primary-color, #8b1a1a);
          border-color: var(--primary-color, #8b1a1a);
        }

        .social-share-trigger:focus-visible,
        .social-share-action:focus-visible {
          outline: 2px solid var(--primary-color, #8b1a1a);
          outline-offset: 2px;
        }

        .social-share-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 1198;
        }

        .social-share-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          max-width: min(90vw, 260px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
          transform-origin: top right;
          transition: opacity 0.2s ease, transform 0.24s ease;
          pointer-events: none;
          z-index: 1200;
        }

        .social-share.is-open .social-share-menu {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .social-share-menu ul {
          list-style: none;
          margin: 0;
          padding: 8px;
        }

        .social-share-menu li {
          margin: 0;
        }

        .social-share-action {
          width: 100%;
          border: none;
          background: transparent;
          color: rgba(0, 0, 0, 0.78);
          border-radius: 8px;
          padding: 10px 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-size: 14px;
          line-height: 1.2;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .social-share-action:hover {
          background: rgba(0, 0, 0, 0.04);
          color: var(--primary-color, #8b1a1a);
        }

        .icon-wrap {
          width: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }

        .social-share-x-icon {
          display: inline-flex;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
        }

        .social-share-toast {
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translate(-50%, 12px);
          background: rgba(20, 20, 20, 0.92);
          color: #fff;
          font-size: 13px;
          line-height: 1.3;
          padding: 8px 14px;
          border-radius: 999px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 1300;
          white-space: nowrap;
        }

        .social-share-toast.is-visible {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        @media (max-width: 768px) {
          .social-share.is-open .social-share-overlay {
            opacity: 1;
            pointer-events: auto;
          }

          .social-share-menu {
            position: fixed;
            left: 0;
            right: 0;
            top: auto;
            bottom: 0;
            width: 100%;
            max-width: 100%;
            border-radius: 16px 16px 0 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
            transform: translateY(100%);
            transform-origin: bottom center;
            max-height: min(72vh, 520px);
            overflow-y: auto;
            padding-bottom: max(10px, env(safe-area-inset-bottom));
          }

          .social-share.is-open .social-share-menu {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

