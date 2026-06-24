"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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

  // Hash-only updates do not require route-data loading.
  const nextPath = `${url.pathname}${url.search}`;
  const currentPath = `${window.location.pathname}${window.location.search}`;
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
  const routeReadyRef = useRef(true);
  const pendingBoundariesRef = useRef(0);
  const SHOW_DELAY_MS = 30;
  const FAIL_SAFE_MS = 20000;

  const clearTimers = useCallback(() => {
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
  }, []);

  const hideNow = useCallback(() => {
    const loaderEl = loaderElRef.current || document.getElementById("page-loader");
    if (!loaderEl) return;
    loaderEl.classList.add("page-loader-hidden");
    loaderEl.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("page-loading");
    document.body.classList.remove("page-loading");
    activeRef.current = false;
  }, []);

  const hideLoader = useCallback(() => {
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
  }, [clearTimers, hideNow, minDuration]);

  const showLoader = useCallback(() => {
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
      }, FAIL_SAFE_MS);
      showDelayTimerRef.current = null;
    }, SHOW_DELAY_MS);
  }, [FAIL_SAFE_MS, SHOW_DELAY_MS, clearTimers, enabled, hideNow]);

  const startNavigationLoader = useCallback(() => {
    routeReadyRef.current = false;
    showLoader();
  }, [showLoader]);

  const tryHideLoader = useCallback(() => {
    if (!enabled) return;
    if (pendingBoundariesRef.current > 0) return;
    if (!routeReadyRef.current) return;
    hideLoader();
  }, [enabled, hideLoader]);

  useEffect(() => {
    loaderElRef.current = document.getElementById("page-loader");
    if (!enabled) {
      hideNow();
      clearTimers();
    }
  }, [enabled, hideNow, clearTimers]);

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
      startNavigationLoader();
    };

    window.history.pushState = function patchedPushState(...args) {
      if (args[2] != null) {
        try {
          const target = new URL(String(args[2]), window.location.href);
          const current = new URL(window.location.href);
          if (`${target.pathname}${target.search}` !== `${current.pathname}${current.search}`) {
            startNavigationLoader();
          }
        } catch {}
      }
      return originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function patchedReplaceState(...args) {
      if (args[2] != null) {
        try {
          const target = new URL(String(args[2]), window.location.href);
          const current = new URL(window.location.href);
          if (`${target.pathname}${target.search}` !== `${current.pathname}${current.search}`) {
            startNavigationLoader();
          }
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

    const onPopState = () => startNavigationLoader();
    const onPageShow = () => tryHideLoader();
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryHideLoader();
    };
    const onRouteLoadingBoundary = (event) => {
      const active = event?.detail?.active === true;
      if (active) {
        pendingBoundariesRef.current += 1;
        routeReadyRef.current = false;
        showLoader();
        return;
      }
      pendingBoundariesRef.current = Math.max(0, pendingBoundariesRef.current - 1);
      tryHideLoader();
    };

    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("site-route-loading", onRouteLoadingBoundary);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("site-route-loading", onRouteLoadingBoundary);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, [enabled, minDuration, showLoader, startNavigationLoader, tryHideLoader, hideNow, clearTimers]);

  useEffect(() => {
    if (!enabled) return;
    routeReadyRef.current = true;
    tryHideLoader();
  }, [enabled, routeKey, minDuration, tryHideLoader]);

  return null;
}
