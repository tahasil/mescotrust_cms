"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "antd";
import styled from "styled-components";
import { getColor } from "@/styles/Theme";

const PdfDocumentViewer = dynamic(() => import("./PdfDocumentViewer"), {
  ssr: false,
});

export const PDF_LINK_TARGET_OPTIONS = [
  { label: "Same Tab (_self)", value: "_self" },
  { label: "New Tab (_blank)", value: "_blank" },
  { label: "Modal", value: "modal" },
];

export function normalizePdfTarget(value, fallback = "_self") {
  const target = String(value || "").trim().toLowerCase();
  if (target === "modal") return "modal";
  if (target === "_blank") return "_blank";
  return fallback === "_blank" ? "_blank" : "_self";
}

export function isPdfDocumentUrl(value) {
  const href = String(value || "").trim();
  if (!href || href.startsWith("#")) return false;

  try {
    const pathname = new URL(href, "https://pdf-viewer.local").pathname;
    return (
      pathname.toLowerCase().endsWith(".pdf") ||
      /^\/(?:api\/)?media\/[0-9a-f]{24}\/?$/i.test(pathname)
    );
  } catch {
    return false;
  }
}

const SharedPdfModal = styled(Modal)`
  width: min(800px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px);
  padding-bottom: 0;

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: min(600px, calc(100vh - 32px));
    height: min(600px, calc(100dvh - 32px));
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 16px;
    background: #ffffff;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.18),
      0 18px 42px rgba(0, 0, 0, 0.14);
  }

  .ant-modal-header {
    flex: 0 0 auto;
    margin: 0;
    min-height: 32px;
    padding: 20px 52px 16px 20px;
    border: 0;
    border-radius: 16px 16px 0 0;
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
    top: 6px;
    right: 6px;
    z-index: 99;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #dbdbdb;
    color: rgba(42, 40, 62, 0.7);
  }

  .ant-modal-close:hover {
    background: #cccccc;
    color: #2a283e;
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

    .ant-modal-content {
      height: calc(100vh - 16px);
      height: calc(100dvh - 16px);
      max-height: calc(100vh - 16px);
      max-height: calc(100dvh - 16px);
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
      border-radius: 12px;
    }

    .ant-modal-header {
      padding: 12px 48px 10px 12px;
    }

    .ant-modal-title {
      font-size: 14px;
    }

    .ant-modal-close {
      top: 6px;
      right: 6px;
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
      top: 5px;
      right: 5px;
      width: 30px;
      height: 30px;
    }
  }
`;

const ViewerBody = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0 0 16px 16px;
  background: #525659;

  .sharedPdfViewer__app {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background: #525659;
  }

  .sharedPdfViewer__app:fullscreen {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: #525659;
  }

  .sharedPdfViewer__toolbar {
    z-index: 5;
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    min-height: 48px;
    overflow-x: auto;
    overflow-y: hidden;
    border-bottom: 1px solid #555b61;
    background: #323639;
    color: #ffffff;
    font: 500 13px/1 "Instrument Sans", system-ui, sans-serif;
    scrollbar-color: #6b7074 #323639;
    scrollbar-width: thin;
  }

  .sharedPdfViewer__toolbarTrack {
    display: flex;
    flex: 1 0 max-content;
    align-items: center;
    gap: 7px;
    min-width: max-content;
    min-height: 48px;
    padding: 6px 10px;
  }

  .sharedPdfViewer__controlGroup,
  .sharedPdfViewer__pageControl {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sharedPdfViewer__controlGroup {
    flex: 0 0 auto;
  }

  .sharedPdfViewer__toolbarSpacer {
    flex: 1 1 24px;
    min-width: 8px;
  }

  .sharedPdfViewer__separator {
    flex: 0 0 1px;
    width: 1px;
    height: 24px;
    margin-inline: 2px;
    background: rgba(255, 255, 255, 0.2);
  }

  .sharedPdfViewer__toolbar button,
  .sharedPdfViewer__toolbar input,
  .sharedPdfViewer__toolbar select {
    min-width: 34px;
    height: 34px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    font: inherit;
  }

  .sharedPdfViewer__toolbar button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    font-size: 16px;
    cursor: pointer;
  }

  .sharedPdfViewer__toolbar button.isActive {
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.15);
  }

  .sharedPdfViewer__toolbar button:hover:not(:disabled),
  .sharedPdfViewer__toolbar button:focus-visible {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.12);
    outline: none;
  }

  .sharedPdfViewer__toolbar button:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .sharedPdfViewer__toolbar input {
    width: 42px;
    padding: 0 4px;
    border-color: rgba(255, 255, 255, 0.2);
    background: #25282a;
    text-align: center;
    appearance: textfield;
  }

  .sharedPdfViewer__toolbar select {
    width: 142px;
    padding: 0 28px 0 9px;
    border-color: rgba(255, 255, 255, 0.2);
    background: #45494d;
    color: #ffffff;
    cursor: pointer;
  }

  .sharedPdfViewer__toolbar select:focus-visible {
    border-color: rgba(255, 255, 255, 0.5);
    outline: none;
  }

  .sharedPdfViewer__toolbar select option {
    background: #323639;
    color: #ffffff;
  }

  .sharedPdfViewer__toolbar input::-webkit-inner-spin-button,
  .sharedPdfViewer__toolbar input::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }

  .sharedPdfViewer__more {
    position: relative;
    flex: 0 0 auto;
  }

  .sharedPdfViewer__moreMenu {
    position: fixed;
    z-index: 10080;
    display: grid;
    width: 180px;
    overflow: hidden;
    border: 1px solid #575c60;
    border-radius: 5px;
    background: #323639;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  }

  .sharedPdfViewer__toolbar .sharedPdfViewer__moreMenu button {
    justify-content: flex-start;
    width: 100%;
    height: 38px;
    padding: 0 12px;
    border: 0;
    border-radius: 0;
    font-size: 13px;
    text-align: left;
  }

  .sharedPdfViewer__actionMessage {
    position: absolute;
    top: 56px;
    right: 12px;
    z-index: 4;
    max-width: min(360px, calc(100% - 24px));
    padding: 9px 12px;
    border-radius: 5px;
    background: rgba(22, 25, 28, 0.94);
    color: #ffffff;
    font: 500 12px/1.4 "Instrument Sans", system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  .sharedPdfViewer__app > .react-pdf__Document {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .sharedPdfViewer__workspace {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    min-height: 0;
  }

  .sharedPdfViewer__sidebar {
    z-index: 3;
    display: flex;
    flex: 0 0 154px;
    flex-direction: column;
    gap: 14px;
    width: 154px;
    min-height: 0;
    padding: 16px 12px;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: 1px solid #3c4043;
    background: #202124;
    scrollbar-color: #666 #202124;
    scrollbar-width: thin;
  }

  .sharedPdfViewer__sidebar > button {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    gap: 7px;
    width: 130px;
    padding: 5px;
    border: 2px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: #ffffff;
    font: 500 12px/1 "Instrument Sans", system-ui, sans-serif;
    cursor: pointer;
  }

  .sharedPdfViewer__sidebar > button:hover,
  .sharedPdfViewer__sidebar > button:focus-visible {
    background: rgba(255, 255, 255, 0.08);
    outline: none;
  }

  .sharedPdfViewer__sidebar > button.isActive {
    border-color: var(--shared-pdf-accent);
  }

  .sharedPdfViewer__sidebar .react-pdf__Thumbnail {
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.45);
  }

  .sharedPdfViewer__sidebar canvas {
    display: block;
    max-width: 112px;
    height: auto !important;
  }

  .sharedPdfViewer__viewport {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 12px;
    background: #525659;
    scrollbar-gutter: stable;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
  }

  .sharedPdfViewer__viewport:focus-visible {
    outline: 2px solid var(--shared-pdf-accent);
    outline-offset: -2px;
  }

  .sharedPdfViewer__viewport > .react-pdf__Page {
    display: flex;
    justify-content: center;
    min-width: min-content;
  }

  .react-pdf__Page {
    flex: 0 0 auto;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.42);
  }

  .react-pdf__Page canvas {
    display: block;
    max-width: none;
    height: auto !important;
  }

  .sharedPdfViewer__srOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sharedPdfViewer__status {
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

  .sharedPdfViewer__spinner {
    width: 38px;
    height: 38px;
    border: 4px solid rgba(48, 55, 68, 0.2);
    border-top-color: var(--shared-pdf-accent);
    border-radius: 50%;
    animation: sharedPdfSpin 0.85s linear infinite;
  }

  @keyframes sharedPdfSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sharedPdfViewer__spinner {
      animation-duration: 1.8s;
    }
  }

  @media (max-width: 479px) {
    .sharedPdfViewer__toolbar {
      min-height: 44px;
      font-size: 12px;
    }

    .sharedPdfViewer__toolbarTrack {
      gap: 4px;
      min-height: 44px;
      padding: 5px 6px;
    }

    .sharedPdfViewer__controlGroup,
    .sharedPdfViewer__pageControl {
      gap: 3px;
    }

    .sharedPdfViewer__toolbar button,
    .sharedPdfViewer__toolbar input {
      min-width: 30px;
      height: 32px;
    }

    .sharedPdfViewer__toolbar button {
      padding: 0 5px;
      font-size: 15px;
    }

    .sharedPdfViewer__toolbar input {
      width: 34px;
    }

    .sharedPdfViewer__toolbar select {
      width: 126px;
      padding-left: 7px;
    }

    .sharedPdfViewer__separator {
      margin-inline: 0;
    }

    .sharedPdfViewer__viewport {
      padding: 6px;
      scrollbar-gutter: auto;
    }

    & {
      border-radius: 0 0 12px 12px;
    }

    .sharedPdfViewer__sidebar {
      position: absolute;
      inset: 0 auto 0 0;
      width: min(170px, 72vw);
      box-shadow: 8px 0 18px rgba(0, 0, 0, 0.35);
    }
  }
`;

function buildViewerSource(value) {
  const href = String(value || "").trim();
  if (!href || typeof window === "undefined") return null;

  try {
    const parsed = new URL(href, window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";

    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const requestedPage = Number.parseInt(hashParams.get("page") || "1", 10);
    parsed.hash = "";
    const source =
      parsed.origin === window.location.origin
        ? `${parsed.pathname}${parsed.search}`
        : parsed.toString();
    return {
      initialPage:
        Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
      url: `/api/public/pdf-viewer?src=${encodeURIComponent(source)}`,
    };
  } catch {
    return null;
  }
}

async function verifyPdf(viewerUrl, signal) {
  const response = await fetch(viewerUrl.split("#", 1)[0], {
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

export function PdfViewerModal({ document, onClose, onUnsupportedDocument }) {
  const [viewerSource, setViewerSource] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    const nextViewerSource = buildViewerSource(document?.url);

    setViewerSource(null);
    setStatus("loading");

    if (!nextViewerSource) {
      setStatus("error");
      return () => controller.abort();
    }

    verifyPdf(nextViewerSource.url, controller.signal)
      .then((result) => {
        if (result.status === 415) {
          onUnsupportedDocument(document.url);
          return;
        }
        if (!result.isPdf) throw new Error("Invalid PDF response");
        setViewerSource(nextViewerSource);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
  }, [document?.url, onUnsupportedDocument]);

  return (
    <SharedPdfModal
      open
      centered
      destroyOnHidden
      footer={null}
      keyboard
      maskClosable
      onCancel={onClose}
      title={document.title}
      zIndex={10050}
      style={{
        "--shared-pdf-accent": document.accentColor || getColor("primary"),
      }}
      styles={{
        mask: {
          background: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <ViewerBody
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
      >
        {status === "loading" ? (
          <div className="sharedPdfViewer__status" role="status" aria-live="polite">
            <span className="sharedPdfViewer__spinner" aria-hidden="true" />
            <span>Loading PDF…</span>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="sharedPdfViewer__status" role="alert">
            The PDF could not be loaded. Please close the viewer and try again.
          </div>
        ) : null}
        {viewerSource ? (
          <PdfDocumentViewer
            initialPage={viewerSource.initialPage}
            source={viewerSource.url}
            title={document.title}
            onReady={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        ) : null}
      </ViewerBody>
    </SharedPdfModal>
  );
}

export function usePdfViewerModal({ accentColor } = {}) {
  const [activeDocument, setActiveDocument] = useState(null);
  const sequenceRef = useRef(0);
  const triggerRef = useRef(null);

  const openPdf = useCallback(
    ({ url, title = "PDF document", trigger = null }) => {
      const sourceUrl = String(url || "").trim();
      if (!sourceUrl) return;

      sequenceRef.current += 1;
      triggerRef.current = trigger;
      setActiveDocument({
        accentColor,
        id: sequenceRef.current,
        title: String(title || "PDF document").trim() || "PDF document",
        url: sourceUrl,
      });
    },
    [accentColor],
  );

  const closePdf = useCallback(() => {
    setActiveDocument(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openUnsupportedDocument = useCallback((url) => {
    setActiveDocument(null);
    window.location.assign(url);
  }, []);

  const modal = useMemo(
    () =>
      activeDocument ? (
        <PdfViewerModal
          key={activeDocument.id}
          document={activeDocument}
          onClose={closePdf}
          onUnsupportedDocument={openUnsupportedDocument}
        />
      ) : null,
    [activeDocument, closePdf, openUnsupportedDocument],
  );

  return { activeDocument, closePdf, modal, openPdf };
}
