"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  const SHOW_DELAY_MS = 90;

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

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
      window.history.pushState = originalPushState;
      clearTimers();
    };
  }, [enabled, minDuration]);

  useEffect(() => {
    if (!enabled) return;
    hideLoader();
  }, [enabled, routeKey, minDuration]);

  return null;
}
