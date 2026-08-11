"use client";

import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  isPdfDocumentUrl,
  normalizePdfTarget,
  usePdfViewerModal,
} from "@/components/site/shared/PdfViewerModal";

const text = (value, fallback = "") =>
  value == null ? fallback : String(value).trim();

function isDownloadable(value) {
  const href = text(value).split(/[?#]/)[0].toLowerCase();
  return (
    href.startsWith("/media/") ||
    /\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|rar|7z)$/.test(href)
  );
}

function CtaButton({ className, href, target, children, onOpenPdf }) {
  if (!href || !children) return null;
  const configuredTarget = normalizePdfTarget(target);
  const opensPdfModal =
    configuredTarget === "modal" && isPdfDocumentUrl(href);
  const resolvedTarget = configuredTarget === "_blank" ? "_blank" : "_self";

  if (opensPdfModal) {
    return (
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={(event) =>
          onOpenPdf({
            url: href,
            title: String(children),
            trigger: event.currentTarget,
          })
        }
      >
        {children}
      </button>
    );
  }
  return (
    <a
      className={className}
      href={href}
      target={resolvedTarget}
      rel={resolvedTarget === "_blank" ? "noopener noreferrer" : undefined}
      download={resolvedTarget === "_self" && isDownloadable(href) ? true : undefined}
    >
      {children}
    </a>
  );
}

export default function CTABanner(props) {
  const title = text(props?.ctaBannerTitle, "Be someone's *tomorrow.*");
  const donateText = text(props?.ctaBannerDonateText, "Donate Now");
  const donateLink = text(props?.ctaBannerDonateLink, "/donate-now");
  const volunteerText = text(
    props?.ctaBannerVolunteerText,
    "Become a Volunteer",
  );
  const volunteerLink = text(
    props?.ctaBannerVolunteerLink,
    "/about-us/volunteer",
  );
  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal({
    accentColor: getColor("primary"),
  });

  // CTA Banner deliberately exposes only the seven design/content fields.
  const sectionBgClassName = undefined;
  const sectionBgStyle = undefined;
  const pageContainerBgStyle = {
    // width: "100%",
    // paddingTop: 0,
    // paddingRight: 0,
    // paddingBottom: 0,
    // paddingLeft: 0,
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div
          className="ctaBanner"
          style={{
            "--cta-banner-dark": getColor("dark"),
            "--cta-banner-cream": getColor("cream"),
            "--cta-banner-accent": getColor("primary"),
            "--cta-banner-accent-hover": getColor("primaryDark"),
            "--cta-banner-accent-soft": props?.titleHighlightColorKey
              ? getColor(props.titleHighlightColorKey)
              : getColor("primarySoft"),
          }}
        >
          <div className="ctaBanner__inner">
            <h2 aria-label={title.replaceAll("*", "")}>{renderHighlightedTitle(title, props, { fallbackColorKey: "primarySoft" })}</h2>
            <div className="ctaBanner__actions">
              <CtaButton
                className="ctaBanner__button ctaBanner__button--primary"
                href={donateLink}
                target={props?.ctaBannerDonateTarget}
                onOpenPdf={openPdf}
              >
                {donateText}
              </CtaButton>
              <CtaButton
                className="ctaBanner__button ctaBanner__button--ghost"
                href={volunteerLink}
                target={props?.ctaBannerVolunteerTarget}
                onOpenPdf={openPdf}
              >
                {volunteerText}
              </CtaButton>
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .ctaBanner {
            position: relative;
            overflow: hidden;
            margin: 0 clamp(8px, 1.4vw, 24px) clamp(40px, 4vw, 64px);
            padding: clamp(56px, 7vw, 100px) 0;
            border-radius: clamp(24px, 4vw, 48px);
            background: var(--cta-banner-dark);
            color: var(--cta-banner-cream);
            text-align: center;
          }
          .ctaBanner::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
              50% 80% at 50% 0%,
              color-mix(in srgb, var(--cta-banner-accent) 14%, transparent),
              transparent 70%
            );
            pointer-events: none;
          }
          .ctaBanner__inner {
            position: relative;
            z-index: 1;
            width: min(1280px, 90%);
            margin-inline: auto;
          }
          .ctaBanner h2 {
            margin: 0 0 28px;
            color: var(--cta-banner-cream);
            font-family: "Bricolage Grotesque", system-ui, sans-serif;
            font-size: clamp(34px, 4.6vw, 64px);
            font-weight: 620;
            line-height: 1.1;
            letter-spacing: -0.02em;
          }
          .ctaBanner h2 em {
            padding-bottom: 3px;
            color: var(--cta-banner-accent-soft);
            font-style: normal;
          }
          .ctaBanner__actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 14px;
          }
          .ctaBanner__button {
            appearance: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 58px;
            padding: 17px 34px;
            border: 1px solid transparent;
            border-radius: 999px;
            font-family: "Instrument Sans", system-ui, sans-serif;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.45;
            text-decoration: none;
            cursor: pointer;
            transition:
              transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.25s,
              color 0.25s,
              border-color 0.25s,
              box-shadow 0.25s;
          }
          .ctaBanner__button:active {
            transform: scale(0.97);
          }
          .ctaBanner__button--primary {
            background: var(--cta-banner-accent);
            color: #fff;
            box-shadow: 0 14px 30px rgba(224, 60, 51, 0.28);
          }
          .ctaBanner__button--primary:hover {
            background: var(--cta-banner-accent-hover);
            color: #fff;
            transform: translateY(-2px);
          }
          .ctaBanner__button--ghost {
            border-color: color-mix(
              in srgb,
              var(--cta-banner-cream) 32%,
              transparent
            );
            background: transparent;
            color: var(--cta-banner-cream);
          }
          .ctaBanner__button--ghost:hover {
            border-color: var(--cta-banner-cream);
            background: transparent;
            color: var(--cta-banner-cream);
            transform: translateY(-2px);
          }
          @media (max-width: 767px) {
            .ctaBanner__inner {
              width: calc(100% - 40px);
            }
            .ctaBanner__button {
              width: 100%;
              min-height: 52px;
              padding: 14px 24px;
              font-size: 15px;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .ctaBanner__button {
              transition: none;
            }
          }
        ` }} />
        {pdfViewerModal}
      </PageContainer>
    </FullWidthBackground>
  );
}
