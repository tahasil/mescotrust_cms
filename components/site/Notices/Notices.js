"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Modal } from "antd";
import { ArrowRightOutlined, ArrowUpOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

gsap.registerPlugin(ScrollTrigger);

const NoticeBoard = styled.div`
  width: 100%;
  color: var(--notice-ink);
  font-family: "Instrument Sans", system-ui, sans-serif;

  .noticeHeader {
    max-width: min(100%, 760px);
    margin-bottom: clamp(32px, 4vw, 56px);
  }

  .noticeSubTitle {
    margin: 0 0 18px;
    color: var(--notice-subtitle);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.16em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .noticeHeading {
    max-width: 16ch;
    margin: 0;
    color: var(--notice-heading);
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-size: clamp(36px, 4.6vw, 64px);
    font-weight: 620;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }

  .noticeHeading em {
    color: var(--notice-accent);
    font-style: normal;
  }

  .noticeIntro {
    max-width: 58ch;
    margin: 18px 0 0;
    color: var(--notice-copy);
    font-size: 16px;
    line-height: 1.7;
  }

  .noticeList {
    display: flex;
    flex-direction: column;
  }

  .noticeRow {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(16px, 2vw, 28px);
    width: 100%;
    min-width: 0;
    padding: clamp(18px, 2vw, 26px) 0;
    border: 0;
    border-bottom: 1px solid var(--notice-border);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    text-decoration: none;
    transition:
      padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      background-color 0.25s ease;
  }

  .noticeRow:first-child {
    border-top: 1px solid var(--notice-border);
  }

  .noticeRow.isInteractive {
    cursor: pointer;
  }

  .noticeRow.isInteractive:hover,
  .noticeRow.isInteractive:focus-visible {
    padding-left: 12px;
    background: var(--notice-row-hover);
  }

  .noticeRow:focus-visible {
    outline: 2px solid var(--notice-arrow-hover);
    outline-offset: 4px;
  }

  .noticeIndex {
    color: var(--notice-index);
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    line-height: 1;
  }

  .noticeBody {
    min-width: 0;
  }

  .noticeTitle {
    margin: 0;
    color: var(--notice-title);
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-size: clamp(17px, 1.7vw, 22px);
    font-weight: 560;
    letter-spacing: -0.01em;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .noticeMeta {
    margin: 3px 0 0;
    color: var(--notice-meta);
    font-size: 14px;
    line-height: 1.5;
  }

  .noticeArrow {
    color: var(--notice-arrow);
    font-size: 22px;
    transition: color 0.2s ease, transform 0.3s ease;
  }

  .noticeRow.isInteractive:hover .noticeArrow,
  .noticeRow.isInteractive:focus-visible .noticeArrow {
    color: var(--notice-arrow-hover);
    transform: translate(3px, -3px);
  }

  .noticeMore {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 28px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid currentColor;
    color: var(--notice-link);
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease, gap 0.25s ease;
  }

  .noticeMore:hover,
  .noticeMore:focus-visible {
    gap: 13px;
    color: var(--notice-link-hover);
  }

  .noticeMore:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 5px;
  }

  &.noticeBoard--style2 {
    display: grid;
    grid-template-columns: minmax(240px, 0.78fr) minmax(0, 1.22fr);
    grid-template-rows: auto auto;
    column-gap: clamp(56px, 8vw, 144px);
    align-items: start;
  }

  &.noticeBoard--style2 .noticeHeader {
    grid-column: 1;
    grid-row: 1 / span 2;
    max-width: 400px;
    margin-bottom: 0;
  }

  &.noticeBoard--style2 .noticeHeading {
    max-width: 10ch;
    font-size: clamp(38px, 4vw, 58px);
  }

  &.noticeBoard--style2 .noticeIntro {
    max-width: 36ch;
    font-size: 14px;
    line-height: 1.55;
  }

  &.noticeBoard--style2 .noticeList {
    grid-column: 2;
    grid-row: 1;
  }

  &.noticeBoard--style2 .noticeRow {
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 18px;
    padding: 18px 0;
  }

  &.noticeBoard--style2 .noticeIndex {
    font-size: 12px;
  }

  &.noticeBoard--style2 .noticeTitle {
    font-size: clamp(15px, 1.15vw, 18px);
    font-weight: 560;
  }

  &.noticeBoard--style2 .noticeMeta {
    margin-top: 2px;
    font-size: 10px;
    letter-spacing: 0.08em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  &.noticeBoard--style2 .noticeArrow {
    font-size: 16px;
  }

  &.noticeBoard--style2 .noticeMore {
    grid-column: 2;
    grid-row: 2;
    justify-self: start;
    margin-top: 18px;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    &.noticeBoard--style2 {
      display: block;
    }

    &.noticeBoard--style2 .noticeHeader {
      max-width: min(100%, 760px);
      margin-bottom: 30px;
    }

    &.noticeBoard--style2 .noticeHeading {
      max-width: 16ch;
    }

    &.noticeBoard--style2 .noticeIntro {
      max-width: 58ch;
    }
  }

  @media (max-width: 767px) {
    .noticeHeader {
      margin-bottom: 30px;
    }

    .noticeIntro {
      margin-top: 14px;
      font-size: 15px;
    }

    .noticeRow {
      grid-template-columns: 38px minmax(0, 1fr) auto;
      gap: 12px;
      padding-block: 18px;
    }

    .noticeRow.isInteractive:hover,
    .noticeRow.isInteractive:focus-visible {
      padding-left: 6px;
    }

    .noticeIndex {
      font-size: 13px;
    }

    .noticeTitle {
      font-size: 17px;
    }

    .noticeMeta {
      font-size: 13px;
    }

    .noticeArrow {
      font-size: 19px;
    }
  }

  @media (max-width: 420px) {
    .noticeRow {
      grid-template-columns: 30px minmax(0, 1fr) auto;
      gap: 9px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .noticeReveal,
    .noticeRow,
    .noticeArrow,
    .noticeMore {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }

`;

const NoticesPdfModal = styled(Modal)`
  width: min(1120px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px);
  padding-bottom: 0;

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: min(860px, calc(100vh - 32px));
    height: min(860px, calc(100dvh - 32px));
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    padding: 0;
    overflow: hidden;
    border: 1px solid #e3e5e8;
    border-radius: 9px;
    background: #ffffff;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
  }

  .ant-modal-header {
    flex: 0 0 auto;
    margin: 0;
    min-height: 32px;
    padding: 22px 64px 18px 22px;
    border: 0;
    border-radius: 0;
    background: #ffffff;
  }

  .ant-modal-title {
    overflow: hidden;
    color: #2a283e;
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-size: clamp(15px, 1.5vw, 18px);
    font-weight: 500;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ant-modal-close {
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
    color: #8c8c8c;
  }

  .ant-modal-close:hover {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.88);
  }

  .ant-modal-close:focus-visible {
    outline: 2px solid rgba(0, 0, 0, 0.2);
    outline-offset: 1px;
  }

  .ant-modal-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 767px) {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px);
    margin-inline: auto;
    padding-bottom: 0;

    .ant-modal-content {
      height: calc(100vh - 16px);
      height: calc(100dvh - 16px);
      max-height: calc(100vh - 16px);
      max-height: calc(100dvh - 16px);
      border-radius: 9px;
    }

    .ant-modal-header {
      min-height: 40px;
      padding: 14px 52px 12px 14px;
    }

    .ant-modal-close {
      top: 7px;
      right: 7px;
    }

    .ant-modal-title {
      font-size: 15px;
    }
  }

  @media (max-width: 359px) {
    width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px);

    .ant-modal-content {
      height: calc(100vh - 12px);
      height: calc(100dvh - 12px);
      max-height: calc(100vh - 12px);
      max-height: calc(100dvh - 12px);
      border-radius: 7px;
    }

    .ant-modal-header {
      padding: 12px 48px 10px 12px;
    }

    .ant-modal-title {
      font-size: 14px;
    }

    .ant-modal-close {
      top: 5px;
      right: 5px;
    }
  }

  @media (max-height: 479px) {
    .ant-modal-content {
      height: calc(100vh - 12px);
      height: calc(100dvh - 12px);
      max-height: calc(100vh - 12px);
      max-height: calc(100dvh - 12px);
    }

    .ant-modal-header {
      min-height: 36px;
      padding: 9px 50px 8px 12px;
    }

    .ant-modal-close {
      top: 4px;
      right: 5px;
      width: 36px;
      height: 36px;
    }
  }
`;

const PdfViewerBody = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0 0 8px 8px;
  background: #525659;

  .noticePdfFrame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #525659;
    opacity: 0;
  }

  .noticePdfFrame.isLoaded {
    opacity: 1;
  }

  .noticePdfStatus {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 24px;
    background: #f3f4f6;
    color: #303744;
    font: 600 15px/1.5 "Instrument Sans", system-ui, sans-serif;
    text-align: center;
  }

  .noticePdfSpinner {
    width: 38px;
    height: 38px;
    border: 4px solid rgba(48, 55, 68, 0.2);
    border-top-color: var(--notice-pdf-accent);
    border-radius: 50%;
    animation: noticePdfSpin 0.85s linear infinite;
  }

  @keyframes noticePdfSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .noticePdfSpinner {
      animation-duration: 1.8s;
    }
  }
`;

const text = (value) => (value == null ? "" : String(value).trim());
const number = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) =>
  text(value) ? getColor(text(value)) : fallback;
const managedNumber = (value) =>
  value !== "" && value != null && number(value, -1) >= 0
    ? number(value, 0)
    : undefined;

function normalizeNoticeTarget(value) {
  if (value === "modal") return "modal";
  return value === "_blank" ? "_blank" : "_self";
}

function isPdfDocumentLink(value) {
  const href = text(value);
  if (!href || href.startsWith("#")) return false;

  try {
    const parsed = new URL(href, "https://notices.local");
    const pathname = parsed.pathname.toLowerCase();
    return (
      pathname.endsWith(".pdf") ||
      /^\/(?:api\/)?media\/[0-9a-f]{24}\/?$/i.test(pathname)
    );
  } catch {
    return false;
  }
}

function getPdfViewerHref(value) {
  const href = text(value);
  if (!href || typeof window === "undefined") return "";

  try {
    const parsed = new URL(href, window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";

    const documentHash = parsed.hash;
    parsed.hash = "";
    const source =
      parsed.origin === window.location.origin
        ? `${parsed.pathname}${parsed.search}`
        : parsed.toString();
    return `/api/public/notices/pdf?src=${encodeURIComponent(source)}${documentHash}`;
  } catch {
    return "";
  }
}

async function verifyPdfResponse(viewerHref, signal) {
  const response = await fetch(viewerHref.split("#", 1)[0], {
    headers: { Range: "bytes=0-0" },
    signal,
  });
  const contentType = String(response.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  await response.body?.cancel();
  return {
    isPdf: response.ok && contentType === "application/pdf",
    status: response.status,
  };
}

function backgrounds(props) {
  const type = text(props?.noticesSectionBgType || "default");
  const image = text(props?.noticesSectionBgImage);
  const key = text(props?.noticesSectionBgColorKey);
  const containerType = text(props?.noticesPageContainerBgType || "default");
  const containerImage = text(props?.noticesPageContainerBgImage);
  const containerKey = text(props?.noticesPageContainerBgColorKey);

  return {
    sectionBgClassName: type === "default" ? "defaultBackground" : undefined,
    sectionProps: {
      $managedBackgroundImage: type === "image" ? image || undefined : undefined,
      $managedBackgroundColor:
        type === "color" && key ? getColor(key) : undefined,
      $managedPaddingTop: managedNumber(props?.noticesSectionPaddingTop),
      $managedPaddingBottom: managedNumber(props?.noticesSectionPaddingBottom),
      $managedMarginTop: managedNumber(props?.noticesSectionMarginTop),
      $managedMarginBottom: managedNumber(props?.noticesSectionMarginBottom),
    },
    containerProps: {
      $managedBackgroundImage:
        containerType === "image" ? containerImage || undefined : undefined,
      $managedBackgroundColor:
        containerType === "color" && containerKey
          ? getColor(containerKey)
          : undefined,
      $managedPaddingTop: managedNumber(props?.noticesPageContainerPaddingTop),
      $managedPaddingRight: managedNumber(props?.noticesPageContainerPaddingRight),
      $managedPaddingBottom: managedNumber(props?.noticesPageContainerPaddingBottom),
      $managedPaddingLeft: managedNumber(props?.noticesPageContainerPaddingLeft),
      $managedMarginTop: managedNumber(props?.noticesPageContainerMarginTop),
      $managedMarginBottom: managedNumber(props?.noticesPageContainerMarginBottom),
    },
  };
}

function NoticeRow({ item, index, onOpenPdf }) {
  const href = text(item?.link);
  const configuredTarget = normalizeNoticeTarget(item?.target);
  const opensPdfModal = configuredTarget === "modal" && isPdfDocumentLink(href);
  const target = configuredTarget === "_blank" ? "_blank" : "_self";
  const indexLabel = text(item?.indexLabel) || String(index + 1).padStart(2, "0");
  const content = (
    <>
      <span className="noticeIndex" aria-hidden="true">
        {indexLabel}
      </span>
      <div className="noticeBody">
        <h3 className="noticeTitle">{text(item?.label)}</h3>
        {text(item?.subLabel) ? (
          <p className="noticeMeta">{text(item.subLabel)}</p>
        ) : null}
      </div>
      {href ? (
        <ArrowUpOutlined
          className="noticeArrow"
          rotate={45}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (!href) {
    return <div className="noticeRow noticeReveal">{content}</div>;
  }

  if (opensPdfModal) {
    return (
      <button
        type="button"
        className="noticeRow noticeReveal isInteractive noticeRow--modal"
        onClick={(event) =>
          onOpenPdf({
            href,
            title: text(item?.label) || "PDF document",
            trigger: event.currentTarget,
          })
        }
        aria-label={text(item?.ariaLabel) || undefined}
        aria-haspopup="dialog"
      >
        {content}
      </button>
    );
  }

  return (
    <a
      className="noticeRow noticeReveal isInteractive"
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      aria-label={text(item?.ariaLabel) || undefined}
    >
      {content}
    </a>
  );
}

function PdfViewerModal({ pdfDocument, onClose, onUnsupportedDocument }) {
  const [viewerSrc, setViewerSrc] = useState("");
  const [viewerState, setViewerState] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    const viewerHref = text(pdfDocument?.viewerHref);

    setViewerSrc("");
    setViewerState("loading");

    if (!viewerHref) {
      setViewerState("error");
      return () => controller.abort();
    }

    async function verifyPdf() {
      try {
        const result = await verifyPdfResponse(viewerHref, controller.signal);
        if (result.status === 415) {
          onUnsupportedDocument(pdfDocument.sourceHref);
          return;
        }
        if (!result.isPdf) {
          throw new Error("Invalid PDF response");
        }

        setViewerSrc(viewerHref);
        setViewerState("ready");
      } catch (error) {
        if (error?.name !== "AbortError") setViewerState("error");
      }
    }

    verifyPdf();
    return () => controller.abort();
  }, [onUnsupportedDocument, pdfDocument?.sourceHref, pdfDocument?.viewerHref]);

  return (
    <NoticesPdfModal
      open
      centered
      destroyOnHidden
      footer={null}
      keyboard
      maskClosable
      onCancel={onClose}
      title={pdfDocument.title}
      width="min(1120px, calc(100vw - 24px))"
      zIndex={10050}
      style={{ "--notice-pdf-accent": pdfDocument.accent }}
      styles={{
        mask: {
          background: "rgba(5, 10, 18, 0.72)",
          backdropFilter: "blur(3px)",
        },
      }}
    >
      <PdfViewerBody>
        {viewerState === "loading" ? (
          <div className="noticePdfStatus" role="status" aria-live="polite">
            <span className="noticePdfSpinner" aria-hidden="true" />
            <span>Loading PDF…</span>
          </div>
        ) : null}
        {viewerState === "error" ? (
          <div className="noticePdfStatus" role="alert">
            The PDF could not be loaded. Please close the viewer and try again.
          </div>
        ) : null}
        {viewerSrc ? (
          <iframe
            className={`noticePdfFrame${viewerState === "ready" ? " isLoaded" : ""}`}
            src={viewerSrc}
            title={`${pdfDocument.title} PDF document`}
            onLoad={() => setViewerState("ready")}
            onError={() => setViewerState("error")}
          />
        ) : null}
      </PdfViewerBody>
    </NoticesPdfModal>
  );
}

export default function Notices(props) {
  const rootRef = useRef(null);
  const lastModalTriggerRef = useRef(null);
  const pdfSelectionRef = useRef(0);
  const [activePdf, setActivePdf] = useState(null);
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/admin") === true;
  const items = useMemo(
    () => (Array.isArray(props?.noticesItems) ? props.noticesItems : []),
    [props?.noticesItems],
  );
  const { sectionBgClassName, sectionProps, containerProps } = backgrounds(props);
  const moreTarget = props?.noticesMoreTarget === "_blank" ? "_blank" : "_self";
  const showHeader = props?.noticesTitleEnabled !== false;
  const itemsStyle = props?.noticesItemsStyle === "style2" ? "style2" : "style1";
  const modalAccent = color(
    props?.noticesArrowHoverColorKey,
    getColor("primary"),
  );

  const openPdfModal = useCallback((document) => {
    lastModalTriggerRef.current = document.trigger || null;
    pdfSelectionRef.current += 1;
    setActivePdf({
      accent: modalAccent,
      id: pdfSelectionRef.current,
      sourceHref: document.href,
      title: document.title,
      viewerHref: getPdfViewerHref(document.href),
    });
  }, [modalAccent]);

  const closePdfModal = useCallback(() => {
    setActivePdf(null);
    window.requestAnimationFrame(() => lastModalTriggerRef.current?.focus());
  }, []);

  const openUnsupportedDocument = useCallback((href) => {
    setActivePdf(null);
    window.location.assign(href);
  }, []);

  useLayoutEffect(() => {
    if (
      isEditor ||
      !rootRef.current ||
      props?.noticesRevealEnabled === false ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const targets = rootRef.current.querySelectorAll(".noticeReveal");
    const context = gsap.context(() => {
      ScrollTrigger.batch(targets, {
        start: text(props?.noticesRevealStart) || "top 86%",
        once: true,
        onEnter: (elements) =>
          gsap.fromTo(
            elements,
            { autoAlpha: 0, y: number(props?.noticesRevealDistance, 30) },
            {
              autoAlpha: 1,
              y: 0,
              duration: number(props?.noticesRevealDuration, 0.9),
              stagger: number(props?.noticesRevealStagger, 0.08),
              ease: text(props?.noticesRevealEase) || "power3.out",
              overwrite: true,
            },
          ),
      });
    }, rootRef);

    return () => context.revert();
  }, [isEditor, items, props]);

  return <FullWidthBackground className={sectionBgClassName} {...sectionProps}>
    <PageContainer {...containerProps}>
      <NoticeBoard
        ref={rootRef}
        className={`noticeBoard--${itemsStyle}`}
        style={{
          "--notice-ink": color(props?.noticesTextColorKey, getColor("black")),
          "--notice-subtitle": color(
            props?.noticesSubTitleColorKey || props?.titleColorKey,
            getColor("primary"),
          ),
          "--notice-heading": color(
            props?.noticesHeadingColorKey,
            getColor("black"),
          ),
          "--notice-accent": color(
            props?.noticesAccentColorKey,
            getColor("black"),
          ),
          "--notice-copy": color(
            props?.noticesDescriptionColorKey,
            getColor("blackLight"),
          ),
          "--notice-border": color(
            props?.noticesBorderColorKey,
            getColor("border"),
          ),
          "--notice-index": color(
            props?.noticesIndexColorKey || props?.noticesMetaColorKey,
            getColor("blackMuted"),
          ),
          "--notice-meta": color(
            props?.noticesMetaColorKey,
            getColor("blackMuted"),
          ),
          "--notice-title": color(
            props?.noticesItemTitleColorKey,
            getColor("black"),
          ),
          "--notice-arrow": color(
            props?.noticesArrowColorKey,
            getColor("blackMuted"),
          ),
          "--notice-arrow-hover": color(
            props?.noticesArrowHoverColorKey,
            modalAccent,
          ),
          "--notice-row-hover": color(
            props?.noticesRowHoverColorKey,
            "transparent",
          ),
          "--notice-link": color(
            props?.noticesLinkColorKey,
            getColor("black"),
          ),
          "--notice-link-hover": color(
            props?.noticesLinkHoverColorKey || props?.noticesArrowHoverColorKey,
            getColor("primary"),
          ),
        }}
      >
        {showHeader ? (
          <header className="noticeHeader noticeReveal">
            {text(props?.noticesSubTitle || props?.mainTitle) ? (
              <p className="noticeSubTitle">
                {text(props?.noticesSubTitle || props?.mainTitle)}
              </p>
            ) : null}
            {text(props?.noticesHeading) || text(props?.noticesHeadingAccent) ? (
              <h2 className="noticeHeading">
                {renderHighlightedTitle(
                  text(props?.noticesHeadingAccent)
                    ? `${text(props?.noticesHeading)}${text(props?.noticesHeading) ? " " : ""}*${text(props?.noticesHeadingAccent)}*`
                    : text(props?.noticesHeading),
                  props,
                  { legacyColorKey: props?.noticesAccentColorKey },
                )}
              </h2>
            ) : null}
            {text(props?.noticesDescription) ? (
              <p className="noticeIntro">{text(props.noticesDescription)}</p>
            ) : null}
          </header>
        ) : null}

        <div className="noticeList">
          {items.map((item, index) => (
            <NoticeRow
              item={item}
              index={index}
              onOpenPdf={openPdfModal}
              key={`${text(item?.indexLabel)}-${text(item?.label)}-${index}`}
            />
          ))}
        </div>

        {text(props?.noticesMoreLabel) && text(props?.noticesMoreUrl) ? (
          <a
            className="noticeMore noticeReveal"
            href={text(props.noticesMoreUrl)}
            target={moreTarget}
            rel={moreTarget === "_blank" ? "noopener noreferrer" : undefined}
          >
            {text(props.noticesMoreLabel)}
            <ArrowRightOutlined aria-hidden="true" />
          </a>
        ) : null}
        {activePdf ? (
          <PdfViewerModal
            key={activePdf.id}
            pdfDocument={activePdf}
            onClose={closePdfModal}
            onUnsupportedDocument={openUnsupportedDocument}
          />
        ) : null}
      </NoticeBoard>
    </PageContainer>
  </FullWidthBackground>;
}
