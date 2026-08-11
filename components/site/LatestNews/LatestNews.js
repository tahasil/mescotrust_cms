"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  isPdfDocumentUrl,
  normalizePdfTarget,
  usePdfViewerModal,
} from "@/components/site/shared/PdfViewerModal";

gsap.registerPlugin(ScrollTrigger);

const NewsSection = styled.div`
  width: 100%; position: relative; font-family: "Instrument Sans",system-ui,sans-serif;
  .newsGrid { display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:90px;align-items:start; }
  .newsSubTitle { margin:0 0 18px;color:var(--news-sub-title);font-size:13px;font-weight:650;letter-spacing:.16em;line-height:1.4;text-transform:uppercase; }
  .newsHeading { margin:0;color:var(--news-heading);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(36px,4.6vw,64px);font-weight:620;letter-spacing:-.02em;line-height:1.08; }
  .newsList { display: flex; flex-direction: column; }
  .newsRow { display:grid;grid-template-columns:92px minmax(0,1fr) auto;align-items:center;gap:36px;width:100%;padding-block:34px;border:0;border-bottom:1px solid var(--news-border);background:transparent;color:inherit;font:inherit;text-align:left;text-decoration:none;cursor:pointer;transition:padding-left .3s cubic-bezier(.16,1,.3,1); }
  .newsRow:first-child { border-top:1px solid var(--news-border); }
  .newsRow:hover { padding-left:14px; }
  .newsTag { color:var(--news-tag);border:1px solid var(--news-tag-border);border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;letter-spacing:.1em;line-height:1.3;text-align:center;text-transform:uppercase; }
  .newsBody { min-width:0; }
  .newsTitle { margin:0;color:var(--news-title);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(18px,1.8vw,24px);font-weight:560;letter-spacing:-.01em;line-height:1.3; }
  .newsAction { display:inline-flex;align-items:center;color:var(--news-arrow);font-size:22px;white-space:nowrap;transition:color .2s,transform .3s; }
  .newsRow:hover .newsAction { color: var(--news-arrow-hover); transform: translate(3px,-3px); }
  @media (max-width:900px) { .newsGrid { grid-template-columns:1fr;gap:50px; } }
  @media (max-width:600px) { .newsRow { grid-template-columns:1fr auto; } .newsTag { display:none; } }
  @media (prefers-reduced-motion: reduce) { .newsIntro, .newsRow { opacity: 1 !important; transform: none !important; } }
`;

const text = (value) => value == null ? "" : String(value).trim();
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) => text(value) ? getColor(text(value)) : fallback;
const DOWNLOADABLE_FILE_RE = /\.(pdf|docx?|xlsx?|pptx?|csv|txt|rtf|odt|ods|odp|zip)(?:[?#].*)?$/i;
const isExternalOrAsset = (href) => /^(https?:)?\/\//i.test(href) || href.startsWith("/media/") || href.startsWith("/uploads/") || DOWNLOADABLE_FILE_RE.test(href);
const isLocalDownload = (href) => href.startsWith("/media/") || href.startsWith("/uploads/") || (href.startsWith("/") && DOWNLOADABLE_FILE_RE.test(href));

export default function LatestNews(props) {
  const pathname = usePathname(); const rootRef = useRef(null); const isEditorPreview = pathname?.startsWith("/admin") === true;
  const items = useMemo(
    () =>
      Array.isArray(props?.latestEvents1Items)
        ? props.latestEvents1Items
        : [],
    [props?.latestEvents1Items],
  );
  const modalAccent = color(props?.latestEvents1ArrowHoverColorKey, getColor("primary"));
  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal({ accentColor: modalAccent });
  useLayoutEffect(() => {
    if (isEditorPreview || !rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = rootRef.current.querySelectorAll(".newsIntro, .newsRow");
    const context = gsap.context(() => { ScrollTrigger.batch(targets, { start: "top 86%", once: true, onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: .9, stagger: .09, ease: "power3.out", overwrite: true }) }); }, rootRef);
    return () => context.revert();
  }, [isEditorPreview, items]);

  const sectionBgType = text(props?.latestEvents1SectionBgType || "default"); const sectionBgImage = text(props?.latestEvents1SectionBgImage); const sectionBgColorKey = text(props?.latestEvents1SectionBgColorKey); const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = { ...(sectionBgType === "image" && sectionBgImage ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : sectionBgType === "color" && sectionBgColorKey ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" } : {}), ...Object.fromEntries([["paddingTop", props?.latestEvents1SectionPaddingTop], ["paddingBottom", props?.latestEvents1SectionPaddingBottom], ["marginTop", props?.latestEvents1SectionMarginTop], ["marginBottom", props?.latestEvents1SectionMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])) };
  const pageContainerBgType = text(props?.latestEvents1PageContainerBgType || "default"); const pageContainerBgImage = text(props?.latestEvents1PageContainerBgImage); const pageContainerBgColorKey = text(props?.latestEvents1PageContainerBgColorKey);
  const pageContainerBgStyle = { ...(pageContainerBgType === "image" && pageContainerBgImage ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : pageContainerBgType === "color" && pageContainerBgColorKey ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" } : {}), ...Object.fromEntries([["paddingTop", props?.latestEvents1PageContainerPaddingTop], ["paddingRight", props?.latestEvents1PageContainerPaddingRight], ["paddingBottom", props?.latestEvents1PageContainerPaddingBottom], ["paddingLeft", props?.latestEvents1PageContainerPaddingLeft], ["marginTop", props?.latestEvents1PageContainerMarginTop], ["marginBottom", props?.latestEvents1PageContainerMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])) };
  const renderNewsItem = (item, index) => {
    const href = text(item?.buttonLink);
    const fallbackTarget = item?.buttonOpenInNewTab ? "_blank" : "_self";
    const configuredTarget = normalizePdfTarget(
      item?.target || item?.buttonTarget,
      fallbackTarget,
    );
    const target = configuredTarget === "_blank" ? "_blank" : "_self";
    const opensPdfModal =
      configuredTarget === "modal" && isPdfDocumentUrl(href);
    const title = text(item?.title);
    const key = `${title}-${index}`;
    const content = (
      <>
        <span className="newsTag">{text(item?.date)}</span>
        <span className="newsBody">
          <h3 className="newsTitle">{title}</h3>
        </span>
        <span className="newsAction">
          <ArrowUpOutlined rotate={45} aria-hidden="true" />
        </span>
      </>
    );

    if (!href) return <div className="newsRow" key={key}>{content}</div>;
    if (opensPdfModal) {
      return (
        <button
          type="button"
          className="newsRow"
          aria-haspopup="dialog"
          onClick={(event) =>
            openPdf({
              url: href,
              title: title || "PDF document",
              trigger: event.currentTarget,
            })
          }
          key={key}
        >
          {content}
        </button>
      );
    }
    if (isExternalOrAsset(href) || target === "_blank") {
      return (
        <a
          className="newsRow"
          href={href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          download={target === "_self" && isLocalDownload(href) ? true : undefined}
          key={key}
        >
          {content}
        </a>
      );
    }
    return <Link className="newsRow" href={href} key={key}>{content}</Link>;
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <NewsSection ref={rootRef} style={{ "--news-sub-title": color(props?.latestEvents1SubTitleColorKey, getColor("primary")), "--news-heading": color(props?.latestEvents1MainTitleColorKey, getColor("black")), "--news-border": color(props?.latestEvents1BorderColorKey, getColor("border")), "--news-tag": color(props?.latestEvents1TagColorKey, getColor("primary")), "--news-tag-border": color(props?.latestEvents1TagBorderColorKey, "rgba(224,60,51,.35)"), "--news-title": color(props?.latestEvents1ItemTitleColorKey, getColor("black")), "--news-arrow": color(props?.latestEvents1ArrowColorKey, getColor("blackMuted")), "--news-arrow-hover": modalAccent }}>
          <div className="newsGrid">
            <div className="newsIntro"><p className="newsSubTitle">{text(props?.latestEvents1SubTitle)}</p><h2 className="newsHeading">{renderHighlightedTitle(text(props?.latestEvents1MainTitle), props)}</h2></div>
            <div className="newsList">{items.map(renderNewsItem)}</div>
          </div>
        </NewsSection>
        {pdfViewerModal}
      </PageContainer>
    </FullWidthBackground>
  );
}
