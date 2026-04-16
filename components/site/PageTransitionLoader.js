"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isInternalNavigableAnchor(anchor) {
  if (!anchor) return false;
  const href = anchor.getAttribute("href") || "";
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;
  if (anchor.hasAttribute("download")) return false;
  if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") return false;
  if (anchor.getAttribute("rel")?.includes("external")) return false;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  const nextPath = `${url.pathname}${url.search}${url.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return nextPath !== currentPath;
}

export default function PageTransitionLoader({ enabled = true, minDuration = 400 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname || ""}?${searchParams?.toString() || ""}`,
    [pathname, searchParams]
  );

  const startedAtRef = useRef(0);
  const activeRef = useRef(false);
  const showDelayTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const failSafeTimerRef = useRef(null);
  const loaderElRef = useRef(null);
  const SHOW_DELAY_MS = 30;

  const clearTimers = () => {
    if (showDelayTimerRef.current) {
      window.clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (failSafeTimerRef.current) {
      window.clearTimeout(failSafeTimerRef.current);
      failSafeTimerRef.current = null;
    }
  };

  const hideNow = () => {
    const loaderEl = loaderElRef.current || document.getElementById("page-loader");
    if (!loaderEl) return;
    loaderEl.classList.add("page-loader-hidden");
    loaderEl.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("page-loading");
    document.body.classList.remove("page-loading");
    activeRef.current = false;
  };

  const hideLoader = () => {
    if (showDelayTimerRef.current) {
      window.clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }
    if (!activeRef.current) return;
    const elapsed = Date.now() - startedAtRef.current;
    const wait = Math.max(0, Number(minDuration || 0) - elapsed);
    clearTimers();
    hideTimerRef.current = window.setTimeout(() => {
      hideNow();
      clearTimers();
    }, wait);
  };

  const showLoader = () => {
    if (!enabled) return;
    if (activeRef.current || showDelayTimerRef.current) return;
    clearTimers();
    showDelayTimerRef.current = window.setTimeout(() => {
      const loaderEl = loaderElRef.current || document.getElementById("page-loader");
      if (!loaderEl) return;
      loaderElRef.current = loaderEl;
      startedAtRef.current = Date.now();
      activeRef.current = true;
      loaderEl.classList.remove("page-loader-hidden");
      loaderEl.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("page-loading");
      document.body.classList.add("page-loading");
      // Fallback: never let loader stay forever on failed/aborted navigations.
      failSafeTimerRef.current = window.setTimeout(() => {
        hideNow();
        clearTimers();
      }, 8000);
      showDelayTimerRef.current = null;
    }, SHOW_DELAY_MS);
  };

  useEffect(() => {
    loaderElRef.current = document.getElementById("page-loader");
    if (!enabled) {
      hideNow();
      clearTimers();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const onClickCapture = (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target?.closest?.("a[href]");
      if (!isInternalNavigableAnchor(anchor)) return;
      showLoader();
    };

    window.history.pushState = function patchedPushState(...args) {
      if (args[2] != null) {
        try {
          const target = new URL(String(args[2]), window.location.href);
          const current = new URL(window.location.href);
          if (`${target.pathname}${target.search}${target.hash}` !== `${current.pathname}${current.search}${current.hash}`) showLoader();
        } catch {}
      }
      return originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function patchedReplaceState(...args) {
      if (args[2] != null) {
        try {
          const target = new URL(String(args[2]), window.location.href);
          const current = new URL(window.location.href);
          if (`${target.pathname}${target.search}${target.hash}` !== `${current.pathname}${current.search}${current.hash}`) showLoader();
        } catch {}
      }
      return originalReplaceState.apply(window.history, args);
    };

    const onUnhandledRejection = () => {
      hideNow();
      clearTimers();
    };
    const onWindowError = () => {
      hideNow();
      clearTimers();
    };

    const onPopState = () => showLoader();
    const onPageShow = () => hideLoader();
    const onVisibility = () => {
      if (document.visibilityState === "visible") hideLoader();
    };

    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, [enabled, minDuration]);

  useEffect(() => {
    if (!enabled) return;
    hideLoader();
  }, [enabled, routeKey, minDuration]);

  return null;
}
