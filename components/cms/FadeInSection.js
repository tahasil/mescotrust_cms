"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Scroll-triggered fade-in animation wrapper.
 * Reads --fade-enabled and --fade-threshold from CSS custom properties (set by theme settings).
 * CSS lives in globals.css (.fadeEffects / .fadeEffects.is-visible).
 */
export default function FadeInSection({
  children,
  className = "",
  as: Wrapper = "div",
  ...rest
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const styles = getComputedStyle(document.documentElement);
    const enabled = styles.getPropertyValue("--fade-enabled").trim();
    if (enabled === "0") {
      setDisabled(true);
      return;
    }

    const threshold = parseFloat(styles.getPropertyValue("--fade-threshold")) || 0.1;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cls = disabled
    ? `fadeEffects fade-disabled ${className}`.trim()
    : `fadeEffects ${isVisible ? "is-visible" : ""} ${className}`.trim();

  return (
    <Wrapper ref={ref} className={cls} {...rest}>
      {children}
    </Wrapper>
  );
}
