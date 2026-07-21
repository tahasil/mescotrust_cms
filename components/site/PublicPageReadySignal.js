"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isVisibleMedia(element) {
  if (element.closest?.("[aria-hidden='true']")) return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom >= 0 && rect.top <= window.innerHeight * 1.25;
}

function waitForImage(image) {
  if (image.complete) {
    return typeof image.decode === "function" ? image.decode().catch(() => {}) : Promise.resolve();
  }
  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function waitForVideo(video) {
  if (video.readyState >= 2 || video.preload === "none") return Promise.resolve();
  return new Promise((resolve) => {
    video.addEventListener("loadeddata", resolve, { once: true });
    video.addEventListener("error", resolve, { once: true });
  });
}

function waitForBackgrounds() {
  const elements = Array.from(
    document.querySelectorAll(".public-site section, .public-site [style*='background-image']"),
  ).filter(isVisibleMedia);
  const urls = new Set();

  elements.forEach((element) => {
    const background = window.getComputedStyle(element).backgroundImage || "";
    for (const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (match[1]) urls.add(match[1]);
    }
  });

  return Array.from(urls).map(
    (url) =>
      new Promise((resolve) => {
        const image = new window.Image();
        image.onload = resolve;
        image.onerror = resolve;
        image.src = url;
        if (image.complete) resolve();
      }),
  );
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function criticalLayoutStylesReady() {
  const shell = document.querySelector(".public-site");
  const header = document.querySelector(".appearance-header");
  const desktopHeader = header?.querySelector(".appearance-desktop");
  const mobileHeader = header?.querySelector(".current-mobile");
  const footerGrid = document.querySelector(".appearance-footer .footer-grid");
  if (!shell || !header || !desktopHeader || !mobileHeader || !footerGrid) {
    return false;
  }

  const shellStyle = getComputedStyle(shell);
  const desktopStyle = getComputedStyle(desktopHeader);
  const mobileStyle = getComputedStyle(mobileHeader);
  const footerStyle = getComputedStyle(footerGrid);
  const expectsMobileHeader = window.matchMedia("(max-width: 991px)").matches;
  const headerReady = expectsMobileHeader
    ? mobileStyle.display !== "none" && desktopStyle.display === "none"
    : mobileStyle.display === "none" && desktopStyle.display !== "none";

  return (
    shellStyle.display === "flex" &&
    shellStyle.flexDirection === "column" &&
    headerReady &&
    footerStyle.display === "grid"
  );
}

function waitForCriticalLayoutStyles() {
  if (criticalLayoutStylesReady()) return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (criticalLayoutStylesReady()) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

function waitForRegisteredTasks() {
  if (!window.__mescoPageReady || window.__mescoPageReady.pendingCount?.() === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onChange = () => {
      if (window.__mescoPageReady?.pendingCount?.() !== 0) return;
      window.removeEventListener("site-page-readiness-change", onChange);
      resolve();
    };
    window.addEventListener("site-page-readiness-change", onChange);
  });
}

export default function PublicPageReadySignal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname || ""}?${searchParams?.toString() || ""}`,
    [pathname, searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function signalReady() {
      await waitForRegisteredTasks();
      if (cancelled) return;

      await waitForCriticalLayoutStyles();
      if (cancelled) return;

      const fontsReady = document.fonts?.ready?.catch?.(() => {}) || Promise.resolve();
      const images = Array.from(document.images).filter(
        (image) => isVisibleMedia(image) || image.fetchPriority === "high",
      );
      const videos = Array.from(document.querySelectorAll("video")).filter(isVisibleMedia);

      await Promise.all([
        fontsReady,
        ...images.map(waitForImage),
        ...videos.map(waitForVideo),
        ...waitForBackgrounds(),
      ]);
      await nextPaint();

      if (!cancelled) window.__mescoPageReady?.markHydrated?.(routeKey);
    }

    signalReady();
    return () => {
      cancelled = true;
    };
  }, [routeKey]);

  return null;
}
