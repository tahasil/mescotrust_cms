"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DownloadOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LeftOutlined,
  MenuOutlined,
  MinusOutlined,
  MoreOutlined,
  PlusOutlined,
  PrinterOutlined,
  RightOutlined,
  RotateRightOutlined,
} from "@ant-design/icons";
import { Document, Page, Thumbnail, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

const ZOOM_OPTIONS = [
  { label: "Automatic Zoom", value: "auto" },
  { label: "Page Width", value: "page-width" },
  { label: "Page Fit", value: "page-fit" },
  { label: "50%", value: "0.5" },
  { label: "75%", value: "0.75" },
  { label: "100%", value: "1" },
  { label: "125%", value: "1.25" },
  { label: "150%", value: "1.5" },
  { label: "200%", value: "2" },
];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function fileNameFromTitle(title) {
  const cleanTitle = String(title || "document")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleanTitle || "document"}.pdf`;
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export default function PdfDocumentViewer({
  initialPage = 1,
  onError,
  onReady,
  source,
  title,
}) {
  const appRef = useRef(null);
  const viewportRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreButtonRef = useRef(null);
  const [availableSize, setAvailableSize] = useState({ height: 0, width: 0 });
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageRatio, setPageRatio] = useState(1.414);
  const [rotation, setRotation] = useState(0);
  const [zoomMode, setZoomMode] = useState("auto");
  const [customZoom, setCustomZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ left: 8, top: 8 });
  const [activeAction, setActiveAction] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;

    const updateSize = () =>
      setAvailableSize({
        height: element.clientHeight,
        width: element.clientWidth,
      });
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pdfDocument]);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(window.document.fullscreenElement === appRef.current);
    window.document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      window.document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;

    const closeMenu = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) setMoreMenuOpen(false);
    };
    window.document.addEventListener("pointerdown", closeMenu);
    return () => window.document.removeEventListener("pointerdown", closeMenu);
  }, [moreMenuOpen]);

  const fitWidth = useMemo(() => {
    if (!availableSize.width) return 0;
    const gutter = availableSize.width <= 480 ? 12 : 24;
    return Math.max(220, Math.min(960, availableSize.width - gutter));
  }, [availableSize.width]);

  const pageFitWidth = useMemo(() => {
    if (!fitWidth || !availableSize.height || !pageRatio) return fitWidth;
    const verticalGutter = availableSize.width <= 480 ? 12 : 24;
    const heightLimitedWidth = Math.max(
      160,
      (availableSize.height - verticalGutter) / pageRatio,
    );
    return Math.min(fitWidth, heightLimitedWidth);
  }, [availableSize.height, availableSize.width, fitWidth, pageRatio]);

  const renderedWidth = useMemo(() => {
    if (zoomMode === "page-fit") return pageFitWidth;
    if (zoomMode === "auto" || zoomMode === "page-width") return fitWidth;
    return fitWidth * customZoom;
  }, [customZoom, fitWidth, pageFitWidth, zoomMode]);

  const displayedZoom =
    zoomMode === "auto" || zoomMode === "page-width" || zoomMode === "page-fit"
      ? 1
      : customZoom;

  const goToPage = useCallback(
    (nextPage) => {
      if (!numPages) return;
      const safePage = clamp(Number(nextPage) || 1, 1, numPages);
      setPageNumber(safePage);
      setPageInput(String(safePage));
      viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    },
    [numPages],
  );

  const handleDocumentReady = useCallback(
    (nextPdfDocument) => {
      const safePage = clamp(initialPage, 1, nextPdfDocument.numPages);
      setPdfDocument(nextPdfDocument);
      setNumPages(nextPdfDocument.numPages);
      setPageNumber(safePage);
      setPageInput(String(safePage));
    },
    [initialPage],
  );

  const handlePageReady = useCallback(
    (page) => {
      const viewport = page.getViewport({ scale: 1, rotation });
      setPageRatio(viewport.height / viewport.width);
    },
    [rotation],
  );

  const commitPageInput = useCallback(() => {
    goToPage(pageInput);
  }, [goToPage, pageInput]);

  const setNumericZoom = useCallback((nextZoom) => {
    const safeZoom = clamp(Number(nextZoom) || 1, MIN_ZOOM, MAX_ZOOM);
    setCustomZoom(safeZoom);
    setZoomMode(String(safeZoom));
  }, []);

  const changeZoom = useCallback(
    (amount) => {
      setNumericZoom(Number((displayedZoom + amount).toFixed(2)));
    },
    [displayedZoom, setNumericZoom],
  );

  const handleZoomSelect = useCallback((event) => {
    const value = event.target.value;
    if (["auto", "page-width", "page-fit"].includes(value)) {
      setZoomMode(value);
      return;
    }
    const numericZoom = clamp(Number(value) || 1, MIN_ZOOM, MAX_ZOOM);
    setCustomZoom(numericZoom);
    setZoomMode(value);
  }, []);

  const rotateClockwise = useCallback(() => {
    setRotation((current) => (current + 90) % 360);
    setMoreMenuOpen(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (window.document.fullscreenElement) {
        await window.document.exitFullscreen();
      } else {
        await appRef.current?.requestFullscreen();
      }
    } catch {
      setActionMessage("Fullscreen is not available in this browser.");
    }
  }, []);

  const downloadPdf = useCallback(async () => {
    if (activeAction) return;
    setActiveAction("download");
    setActionMessage("");
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Download failed");
      triggerBlobDownload(await response.blob(), fileNameFromTitle(title));
    } catch {
      setActionMessage("The PDF could not be downloaded. Please try again.");
    } finally {
      setActiveAction("");
      setMoreMenuOpen(false);
    }
  }, [activeAction, source, title]);

  const printPdf = useCallback(async () => {
    if (!pdfDocument || activeAction) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setActionMessage("Allow pop-ups to print this PDF.");
      return;
    }

    printWindow.opener = null;
    printWindow.document.write(
      "<!doctype html><html><head><title>Print PDF</title>" +
        "<style>html,body{margin:0;background:#777}main{display:grid;gap:12px;padding:12px;justify-content:center}img{display:block;max-width:100%;height:auto;background:white;box-shadow:0 1px 8px #333}@media print{html,body{background:white}main{display:block;padding:0}img{width:100%;page-break-after:always;box-shadow:none}img:last-child{page-break-after:auto}}</style>" +
        "</head><body><main id=pages><p id=status style=\"color:white;font:16px system-ui\">Preparing PDF for printing…</p></main></body></html>",
    );
    printWindow.document.close();
    printWindow.document.title = fileNameFromTitle(title);

    setActiveAction("print");
    setActionMessage("Preparing all PDF pages for printing…");
    setMoreMenuOpen(false);

    try {
      const pagesRoot = printWindow.document.getElementById("pages");
      const statusNode = printWindow.document.getElementById("status");
      for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
        if (printWindow.closed) throw new Error("Print window closed");
        statusNode.textContent = `Preparing page ${pageIndex} of ${pdfDocument.numPages}…`;
        const page = await pdfDocument.getPage(pageIndex);
        const naturalViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1500 / naturalViewport.width);
        const printViewport = page.getViewport({ scale });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(printViewport.width);
        canvas.height = Math.ceil(printViewport.height);
        await page.render({
          canvasContext: canvas.getContext("2d", { alpha: false }),
          viewport: printViewport,
        }).promise;
        const image = printWindow.document.createElement("img");
        image.alt = `Page ${pageIndex}`;
        image.src = canvas.toDataURL("image/jpeg", 0.94);
        pagesRoot.appendChild(image);
      }
      statusNode.remove();
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 250);
      setActionMessage("");
    } catch {
      if (!printWindow.closed) printWindow.close();
      setActionMessage("The PDF could not be prepared for printing.");
    } finally {
      setActiveAction("");
    }
  }, [activeAction, pdfDocument, title]);

  const selectThumbnail = useCallback(
    (nextPage) => {
      goToPage(nextPage);
      if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
    },
    [goToPage],
  );

  const toggleMoreMenu = useCallback(() => {
    if (moreMenuOpen) {
      setMoreMenuOpen(false);
      return;
    }

    const buttonBox = moreButtonRef.current?.getBoundingClientRect();
    if (buttonBox) {
      const menuWidth = 180;
      const menuHeight = 192;
      const preferredTop = buttonBox.bottom + 5;
      setMoreMenuPosition({
        left: clamp(buttonBox.right - menuWidth, 8, window.innerWidth - menuWidth - 8),
        top:
          preferredTop + menuHeight <= window.innerHeight - 8
            ? preferredTop
            : Math.max(8, buttonBox.top - menuHeight - 5),
      });
    }
    setMoreMenuOpen(true);
  }, [moreMenuOpen]);

  return (
    <div
      className="sharedPdfViewer__app"
      ref={appRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
    >
      <div className="sharedPdfViewer__toolbar" role="toolbar" aria-label="PDF controls">
        <div className="sharedPdfViewer__toolbarTrack">
          <div className="sharedPdfViewer__controlGroup sharedPdfViewer__sidebarGroup">
            <button
              type="button"
              className={sidebarOpen ? "isActive" : ""}
              aria-label={sidebarOpen ? "Hide page thumbnails" : "Show page thumbnails"}
              aria-pressed={sidebarOpen}
              title={sidebarOpen ? "Hide page thumbnails" : "Show page thumbnails"}
              onClick={() => setSidebarOpen((current) => !current)}
            >
              <MenuOutlined />
            </button>
          </div>

          <div className="sharedPdfViewer__separator" aria-hidden="true" />

          <div className="sharedPdfViewer__controlGroup">
            <button
              type="button"
              aria-label="Previous page"
              title="Previous page"
              disabled={pageNumber <= 1}
              onClick={() => goToPage(pageNumber - 1)}
            >
              <LeftOutlined />
            </button>
            <label className="sharedPdfViewer__pageControl">
              <span className="sharedPdfViewer__srOnly">Page</span>
              <input
                type="number"
                min="1"
                max={numPages || 1}
                inputMode="numeric"
                value={pageInput}
                onBlur={commitPageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitPageInput();
                    event.currentTarget.blur();
                  }
                }}
              />
              <span aria-hidden="true">/</span>
              <span aria-label={`${numPages || 1} pages`}>{numPages || "-"}</span>
            </label>
            <button
              type="button"
              aria-label="Next page"
              title="Next page"
              disabled={!numPages || pageNumber >= numPages}
              onClick={() => goToPage(pageNumber + 1)}
            >
              <RightOutlined />
            </button>
          </div>

          <div className="sharedPdfViewer__separator" aria-hidden="true" />

          <div className="sharedPdfViewer__controlGroup sharedPdfViewer__zoomGroup">
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              disabled={displayedZoom <= MIN_ZOOM}
              onClick={() => changeZoom(-ZOOM_STEP)}
            >
              <MinusOutlined />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              disabled={displayedZoom >= MAX_ZOOM}
              onClick={() => changeZoom(ZOOM_STEP)}
            >
              <PlusOutlined />
            </button>
            <label className="sharedPdfViewer__zoomSelectLabel">
              <span className="sharedPdfViewer__srOnly">Zoom</span>
              <select value={zoomMode} onChange={handleZoomSelect} title="Zoom level">
                {ZOOM_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sharedPdfViewer__toolbarSpacer" />

          <div className="sharedPdfViewer__controlGroup sharedPdfViewer__actionGroup">
            <button
              type="button"
              aria-label="Rotate clockwise"
              title="Rotate clockwise"
              onClick={rotateClockwise}
            >
              <RotateRightOutlined />
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
            <button
              type="button"
              aria-label="Download PDF"
              title="Download PDF"
              disabled={Boolean(activeAction)}
              onClick={downloadPdf}
            >
              <DownloadOutlined />
            </button>
            <button
              type="button"
              aria-label="Print PDF"
              title="Print PDF"
              disabled={!pdfDocument || Boolean(activeAction)}
              onClick={printPdf}
            >
              <PrinterOutlined />
            </button>
            <div className="sharedPdfViewer__more" ref={moreMenuRef}>
              <button
                ref={moreButtonRef}
                type="button"
                aria-label="More PDF actions"
                title="More PDF actions"
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
                onClick={toggleMoreMenu}
              >
                <MoreOutlined />
              </button>
              {moreMenuOpen ? (
                <div
                  className="sharedPdfViewer__moreMenu"
                  role="menu"
                  style={moreMenuPosition}
                >
                  <button type="button" role="menuitem" onClick={() => goToPage(1)}>
                    First page
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => goToPage(numPages)}
                  >
                    Last page
                  </button>
                  <button type="button" role="menuitem" onClick={rotateClockwise}>
                    Rotate clockwise
                  </button>
                  <button type="button" role="menuitem" onClick={downloadPdf}>
                    Download PDF
                  </button>
                  <button type="button" role="menuitem" onClick={printPdf}>
                    Print PDF
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {actionMessage ? (
        <div className="sharedPdfViewer__actionMessage" role="status" aria-live="polite">
          {actionMessage}
        </div>
      ) : null}

      <Document
        file={source}
        loading={null}
        error={null}
        onLoadSuccess={handleDocumentReady}
        onLoadError={onError}
        onSourceError={onError}
      >
        <div className={`sharedPdfViewer__workspace${sidebarOpen ? " hasSidebar" : ""}`}>
          {sidebarOpen ? (
            <aside className="sharedPdfViewer__sidebar" aria-label="PDF page thumbnails">
              {Array.from({ length: numPages }, (_, index) => index + 1).map(
                (thumbnailPage) => (
                  <button
                    type="button"
                    className={thumbnailPage === pageNumber ? "isActive" : ""}
                    aria-label={`Open page ${thumbnailPage}`}
                    aria-current={thumbnailPage === pageNumber ? "page" : undefined}
                    onClick={() => selectThumbnail(thumbnailPage)}
                    key={thumbnailPage}
                  >
                    <Thumbnail
                      pageNumber={thumbnailPage}
                      width={112}
                      devicePixelRatio={1}
                    />
                    <span>{thumbnailPage}</span>
                  </button>
                ),
              )}
            </aside>
          ) : null}

          <div
            className="sharedPdfViewer__viewport"
            ref={viewportRef}
            tabIndex="0"
            aria-label={`${title} PDF viewer`}
          >
            {renderedWidth ? (
              <Page
                key={`${pageNumber}-${Math.round(renderedWidth)}-${rotation}`}
                pageNumber={pageNumber}
                width={renderedWidth}
                rotate={rotation}
                devicePixelRatio={
                  typeof window === "undefined"
                    ? 1
                    : Math.min(window.devicePixelRatio || 1, 2)
                }
                renderAnnotationLayer={false}
                renderTextLayer={false}
                loading={null}
                error={null}
                onLoadSuccess={handlePageReady}
                onRenderError={onError}
                onRenderSuccess={onReady}
              />
            ) : null}
          </div>
        </div>
      </Document>
    </div>
  );
}
