"use client";

import { useEffect } from "react";

function emitRouteLoading(active) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("site-route-loading", {
      detail: { active: !!active },
    }),
  );
}

/**
 * Emits lifecycle events while an App Router loading boundary is mounted.
 * Used by PageTransitionLoader to keep the loader visible until server route data is ready.
 */
export default function RouteLoadingBridge() {
  useEffect(() => {
    emitRouteLoading(true);
    return () => emitRouteLoading(false);
  }, []);

  return null;
}

