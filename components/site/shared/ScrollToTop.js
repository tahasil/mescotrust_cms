"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

const ScrollTopButton = styled.button`
  position: fixed;
  right: 28px;
  bottom: 84px;
  z-index: 990;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #211e30;
  color: #faf6ef;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.85)")};
  pointer-events: ${(p) => (p.$visible ? "auto" : "none")};
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: #d32f2f;
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(211, 47, 47, 0.35);
    transform: translateY(-3px) scale(1.05);
  }

  &:focus-visible {
    outline: 2px solid #d32f2f;
    outline-offset: 3px;
  }

  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    right: 18px;
    bottom: 74px;
    width: 42px;
    height: 42px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 0.2s ease;
    &:hover {
      transform: none;
    }
  }
`;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const toggleVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 320);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const isReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: isReduced ? "auto" : "smooth",
    });
  };

  return (
    <ScrollTopButton
      type="button"
      $visible={visible}
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Scroll to top"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </ScrollTopButton>
  );
}
