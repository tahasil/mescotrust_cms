"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll — reads settings from CSS custom properties (set by theme).
 * Renders nothing; just initializes Lenis on mount.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const enabled = styles.getPropertyValue("--smooth-scroll-enabled").trim();
    if (enabled === "0") return;

    const duration = parseFloat(styles.getPropertyValue("--smooth-scroll-duration")) || 1.4;
    const wheelMultiplier = parseFloat(styles.getPropertyValue("--smooth-scroll-wheel")) || 1;
    const touchMultiplier = parseFloat(styles.getPropertyValue("--smooth-scroll-touch")) || 1.2;

    const lenis = new Lenis({
      duration,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier,
      touchMultiplier,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return null;
}
