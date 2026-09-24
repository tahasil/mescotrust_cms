"use client";

import React from "react";
import { Button, Card, Modal } from "antd";
import styled, { createGlobalStyle } from "styled-components";
import Sider from "antd/es/layout/Sider";

/** Thin wrappers so styled() works with antd components (they receive className from styled-components) */
const ButtonWrapper = (props) => <Button {...props} />;
const CardWrapper = (props) => <Card {...props} />;
const ModalWrapper = (props) => <Modal {...props} />;
const SiderWrapper = (props) => <Sider {...props} />;
export const BREAKPOINT = "992px";
/** Space needed so content starts below the fixed header (desktop: top offset + bar height) */
export const HEADER_OFFSET_DESKTOP = "88px";
/** Space needed on mobile (full-width bar) */
export const HEADER_OFFSET_MOBILE = "56px";

/** Semantic aliases map to CSS vars injected from DB-backed theme config. */
export const THEME_COLOR_ALIASES = {
  primary: "var(--primary-color, var(--theme-primary, #D32F2F))",
  primaryDark: "var(--theme-primary-dark, #B71C1C)",
  primarySoft: "var(--theme-primary-soft, #EF5350)",
  primaryPale: "var(--theme-primary-pale, #FFCDD2)",
  secondary: "var(--secondary-color, var(--theme-black, #2A283E))",
  white: "var(--theme-white, #FFFFFF)",
  cream: "#FBFAF7",
  warmWhite: "var(--theme-warm-white, #FAF6EF)",
  surface: "var(--theme-surface, #F2F0EA)",
  black: "var(--theme-black, #2A283E)",
  blackLight: "var(--theme-black-light, rgba(42, 40, 62, 0.76))",
  blackMuted: "var(--theme-black-muted, rgba(42, 40, 62, 0.52))",
  dark: "var(--theme-dark, #211E30)",
  border: "var(--theme-border, rgba(42, 40, 62, 0.14))",
  headerBg: "var(--theme-header-bg)",
  headerCta: "var(--theme-header-cta)",
  ctaBorder: "var(--theme-cta-border, var(--theme-border, rgba(42, 40, 62, 0.14)))",
  gradient:
    "var(--theme-gradient, linear-gradient(90deg, #D32F2F 0%, #B71C1C 100%))",
  primaryLight: "var(--theme-primary-light, rgba(211, 47, 47, 0.1))",
  themeBorder: "var(--theme-theme-border, var(--theme-border, rgba(42, 40, 62, 0.14)))",
  imgWhite:
    "var(--theme-img-white, var(--theme-img-fill-white, brightness(0) saturate(100%) invert(100%)))",
  imgColor:
    "var(--theme-img-color, var(--theme-img-fill-theme, brightness(0) saturate(100%) invert(29%) sepia(88%) saturate(1615%) hue-rotate(339deg) brightness(90%) contrast(95%)))",
  imgFillWhite:
    "var(--theme-img-fill-white, var(--theme-img-white, brightness(0) saturate(100%) invert(100%)))",
  imgFillTheme:
    "var(--theme-img-fill-theme, var(--theme-img-color, brightness(0) saturate(100%) invert(29%) sepia(88%) saturate(1615%) hue-rotate(339deg) brightness(90%) contrast(95%)))",
  transparent: "var(--theme-transparent, transparent)",
};

const THEME_COLOR_FALLBACKS = {
  primary: "#D32F2F",
  "primary-dark": "#B71C1C",
  "primary-soft": "#EF5350",
  "primary-pale": "#FFCDD2",
  secondary: "#2A283E",
  black: "#2A283E",
  "black-light": "rgba(42, 40, 62, 0.76)",
  "black-muted": "rgba(42, 40, 62, 0.52)",
  white: "#FFFFFF",
  cream: "#FBFAF7",
  "warm-white": "#FAF6EF",
  surface: "#F2F0EA",
  dark: "#211E30",
  "primary-light": "rgba(211, 47, 47, 0.1)",
  gradient: "linear-gradient(90deg, #D32F2F 0%, #B71C1C 100%))",
  border: "rgba(42, 40, 62, 0.14)",
  transparent: "transparent",
};

const Theme = {
  colors: {
  },
  fonts: {
    sans: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
  },
};

/**
 * Resolve theme color by key. Uses Theme.colors, then semantic alias CSS vars (case-insensitive),
 * then CSS variable var(--theme-{key}) so layout-injected theme palette applies (admin + frontend).
 */
export const getColor = (key) => {
  if (key == null || String(key).trim() === "") return undefined;
  const k = String(key).trim();
  // Direct match
  if (Theme.colors[k]) return Theme.colors[k];
  // Normalize key into a stable slug (supports "Primary Light", "primaryLight", "primary-light")
  const slug = k
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const camel = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const compact = slug.replace(/-/g, "");
  if (Theme.colors[camel]) return Theme.colors[camel];
  if (Theme.colors[compact]) return Theme.colors[compact];
  // Case-insensitive match in Theme.colors
  const colorsKey = Object.keys(Theme.colors).find(
    (c) =>
      c.toLowerCase() === k.toLowerCase() ||
      c.toLowerCase() === camel.toLowerCase() ||
      c.toLowerCase() === compact.toLowerCase(),
  );
  if (colorsKey) return Theme.colors[colorsKey];
  // Semantic alias colors (CSS vars)
  const aliasKey = Object.keys(THEME_COLOR_ALIASES).find(
    (f) =>
      f.toLowerCase() === k.toLowerCase() ||
      f.toLowerCase() === camel.toLowerCase() ||
      f.toLowerCase() === compact.toLowerCase(),
  );
  if (aliasKey) {
    return THEME_COLOR_ALIASES[aliasKey];
  }
  const fallback = THEME_COLOR_FALLBACKS[slug];
  return fallback ? `var(--theme-${slug}, ${fallback})` : `var(--theme-${slug})`;
};

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0px;
    padding: 0px;
    font-family: ${Theme.fonts.sans};
    background: ${getColor("cream")};
    color: ${getColor("blackLight")};
  }
`;
export const PageContainer = styled.div`
  width: 90%;
  margin: 0 auto;
  position: relative;
  padding: 80px 0px;
  &.lightBackground {
    background: ${getColor("surface")};
  }
  @media (max-width: 768px) {
    width: 100%;
    padding: 40px 20px;
  }
  ${(props) =>
    props.$managedBackgroundImage
      ? `
          background-image: url(${JSON.stringify(props.$managedBackgroundImage)});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        `
      : props.$managedBackgroundColor
        ? `
            background-color: ${props.$managedBackgroundColor};
            background-image: none;
          `
        : ""}
  padding-top: ${(props) =>
    props.$managedPaddingTop != null
      ? `${props.$managedPaddingTop}px`
      : undefined};
  padding-right: ${(props) =>
    props.$managedPaddingRight != null
      ? `${props.$managedPaddingRight}px`
      : undefined};
  padding-bottom: ${(props) =>
    props.$managedPaddingBottom != null
      ? `${props.$managedPaddingBottom}px`
      : undefined};
  padding-left: ${(props) =>
    props.$managedPaddingLeft != null
      ? `${props.$managedPaddingLeft}px`
      : undefined};
  margin-top: ${(props) =>
    props.$managedMarginTop != null ? `${props.$managedMarginTop}px` : undefined};
  margin-bottom: ${(props) =>
    props.$managedMarginBottom != null
      ? `${props.$managedMarginBottom}px`
      : undefined};
  ${(props) => props.$managedStyle || {}}
`;
export const ThemeButton = styled(ButtonWrapper)`
  background: ${getColor("gradient")};
  border: 1px solid ${getColor("ctaBorder")};
  box-shadow: 0px 0px 10px rgba(224, 60, 51, 0.25);
  border-radius: 30px;
  color: ${getColor("white")};
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  transform: translateY(0);
  &:hover {
    background: ${getColor("white")} !important;
    border-color: ${getColor("primary")} !important;
    color: ${getColor("primary")} !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(224, 60, 51, 0.35);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(224, 60, 51, 0.25);
  }
  &.impact-showcase-btn {
    color: var(--impact-btn-text, inherit) !important;
    border-color: var(--impact-btn-border, transparent) !important;
    .impact-showcase-btn__label {
      color: var(--impact-btn-text, inherit) !important;
    }
    .impact-showcase-btn__icon-svg {
      color: var(--impact-btn-icon-color, currentColor);
      transition: color 0.3s ease;
    }
    &:hover {
      background: var(--impact-btn-hover-bg, ${getColor("white")}) !important;
      border-color: var(--impact-btn-hover-border, ${getColor("primary")}) !important;
      color: var(--impact-btn-hover-text, ${getColor("primary")}) !important;
    }
    &:hover .impact-showcase-btn__label {
      color: var(--impact-btn-hover-text, ${getColor("primary")}) !important;
    }
    &:hover .impact-showcase-btn__icon-svg {
      color: var(--impact-btn-icon-hover-color, var(--impact-btn-hover-text, ${getColor("primary")}));
    }
  }
  &.link {
    gap: 10px;
    background: transparent;
    border: none;
    color: ${(props) => props.color || getColor("ctaBorder")};
    padding: 0px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    transform: translateY(0);
    box-shadow: none !important;
    &:hover,
    &:active {
      background: transparent !important;
      border: none !important;
      color: ${getColor("primary")};
      text-decoration: none;
      box-shadow: none;
    }
    svg {
      rotate: ${(props) => props.rotate || -45}deg;
    }
  }
  &.volunteer {
    background: ${getColor("primaryLight")};
    box-shadow: none;
    border: 1px solid transparent;
    color: ${getColor("primary")};
    padding: 10px 20px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    img {
      width: 30px;
      height: 30px;
      background: ${getColor("white")};
      border: 1px solid transparent;
      padding: 7px;
      border-radius: 50%;
      object-fit: contain;
    }
    &:hover {
      background: ${getColor("primary")};
      color: ${getColor("white")};
      border: 1px solid ${getColor("primary")};
      box-shadow: 0px 0px 10px rgba(224, 60, 51, 0.25);
      img {
        background: ${getColor("white")};
        border: 1px solid ${getColor("primary")};
      }
    }
    &:active {
      transform: translateY(0);
      box-shadow: none;
    }
  }
`;
export const FullWidthBackground = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
  background: transparent no-repeat top center;
  background-size: cover;
  &.customInnerHero {
    padding-top: 40px;
    border-top: 1px solid #dbdbdb;
  }
  &.defaultBackground {
    background-image: none;
    background: none;
    @media (max-width: 768px) {
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  .innerEventBox {
    position: relative;
    width: 80%;
    margin: 0 auto;
    height: 100%;
    background: ${getColor("black")};
    border: 1px solid ${getColor("ctaBorder")};
    border-radius: 20px;
    padding: 24px;
    @media (max-width: 768px) {
      width: 100%;
      padding: 16px;
    }
    h2 {
      margin: 0px;
      font-size: 24px;
      font-weight: 600;
      color: ${getColor("white")};
      margin-bottom: 20px;
      @media (max-width: 768px) {
        font-size: 20px;
        margin-bottom: 16px;
      }
    }
  }
  ${(props) =>
    props.$managedBackgroundImage
      ? `
          background-image: url(${JSON.stringify(props.$managedBackgroundImage)});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        `
      : props.$managedBackgroundColor
        ? `
            background-color: ${props.$managedBackgroundColor};
            background-image: none;
          `
        : ""}
  padding-top: ${(props) =>
    props.$managedPaddingTop != null
      ? `${props.$managedPaddingTop}px`
      : undefined};
  padding-bottom: ${(props) =>
    props.$managedPaddingBottom != null
      ? `${props.$managedPaddingBottom}px`
      : undefined};
  margin-top: ${(props) =>
    props.$managedMarginTop != null ? `${props.$managedMarginTop}px` : undefined};
  margin-bottom: ${(props) =>
    props.$managedMarginBottom != null
      ? `${props.$managedMarginBottom}px`
      : undefined};
  ${(props) => props.$managedStyle || {}}
`;
export const ThemeCard = styled(CardWrapper)`
  width: 100%;
  height: 100%;
  background: ${getColor("white")};
  border: 1px solid ${getColor("themeBorder")};
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  border-radius: ${(props) => props.radius || 0}px;
  padding: ${(props) => props.padding || 0}px;
  .ant-card-body {
    padding: 0px;
  }
`;
export const MainTitle = styled.h1`
  width: 100%;
  position: relative;
  margin: 0px;
  font-size: ${(props) => props.fontSize || 36}px;
  font-weight: ${(props) => props.fontWeight || 600};
  line-height: ${(props) => props.lineHeight || 40}px;
  color: ${(props) => props.color || getColor("black")};
  margin-bottom: 10px;
  opacity: ${(props) => props.opacity || 1};
  @media (max-width: 768px) {
    font-size: 20px;
    line-height: 24px;
  }
`;
export const SubTitle = styled.h2`
  width: 100%;
  position: relative;
  margin: 0px;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.color || getColor("black")};
  margin-bottom: 4px;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;
export const Paragraph = styled.p`
  margin: 0px;
  font-size: ${(props) => props.fontSize || 16}px;
  font-weight: ${(props) => props.fontWeight || 400};
  line-height: ${(props) => props.lineHeight || 24}px;
  color: ${(props) => props.color || getColor("black")};
  opacity: ${(props) => props.opacity || 1};
  margin-bottom: 10px;
  overflow-wrap: break-word;
  word-wrap: break-word;
`;
export const InnerBanner = styled.section`
  width: 100%;
  margin-top: 80px;
  position: relative;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  align-items: center;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: none;
  border-right: none;
  border-image: linear-gradient(
      90deg,
      #e0e0e0 0%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0.5) 100%
    )
    1;
  background-color: transparent;
  background-image: var(--inner-banner-bg, url("/images/inner-banner.png"));
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  @media (max-width: 767px) {
    background-image: var(
      --inner-banner-bg-mobile,
      var(--inner-banner-bg, url("/images/inner-banner.png"))
    );
  }
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(248, 248, 248, 0.65) 100% b
    );
    pointer-events: none;
  }
  > div {
    position: relative;
    z-index: 1;
  }
  .inner-banner-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }
  .inner-banner-breadcrumb {
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.6;
    .ant-breadcrumb-link {
      color: ${getColor("black")};
    }
    a {
      color: ${getColor("black")};
      text-decoration: none;
      &:hover {
        background: transparent;
        color: ${getColor("primary")};
      }
    }
  }
  .innerBannerDesc {
    margin: 0;
    font-size: 16px;
    line-height: 24px;
    color: ${getColor("black")};
    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 20px;
    }
  }
`;
export const ScrolledText = styled.p`
  margin: 0;
  width: 100%;
  position: relative;
  font-size: ${(props) => props.fontSize || 18}px;
  font-weight: ${(props) => props.fontWeight || 400};
  line-height: ${(props) => props.lineHeight || 24}px;
  opacity: ${(props) => props.opacity ?? 0.8};
  margin-bottom: 10px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  [data-word] {
    display: inline;
    transition: none;
  }
  @media (max-width: 768px) {
    font-size: 16px;
    line-height: 26px;
  }
`;
export const PartnersSection = styled.section`
  width: 100%;
  position: relative;
  margin-top: -4%;
  background: transparent;
  overflow: hidden;
  @media (max-width: 768px) {
    margin-top: -4%;
  }
  @media (min-width: 992px) {
    margin-top: -16%;
  }
  @media (min-width: 1440px) {
    margin-top: -4%;
  }
  h2 {
    margin: 0px;
    font-size: 24px;
    font-weight: 600;
    color: ${getColor("black")};
    text-align: center;
    margin-bottom: 18px;
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  .marquee-item {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0px;
    @media (max-width: 992px) {
      width: 80px;
      margin-right: 20px;
    }
    @media (max-width: 576px) {
      width: 70px;
      margin-right: 10px;
    }
  }
`;
export const ThemeModal = styled(ModalWrapper)`
  .ant-modal-close {
    background: ${getColor("white")};
    top: -14px;
    right: -14px;
    border-radius: 50%;
    z-index: 1000;
    svg {
      font-size: 18px;
      color: ${getColor("black")};
    }
  }
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    cursor: default;
    aspect-ratio: auto;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  }
  .ant-modal-body {
    flex: 1 1 auto;
    min-height: 0;
    max-height: calc(100vh - 64px);
    max-height: calc(100dvh - 64px);
    overflow-y: auto;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
  }
  @media (max-width: 768px) {
    width: min(800px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px);
    margin-inline: auto;
    top: 12px;
    padding-bottom: 12px;
    .ant-modal-close {
      top: 6px;
      right: 6px;
    }
    .ant-modal-content {
      max-height: calc(100vh - 24px);
      max-height: calc(100dvh - 24px);
    }
    .ant-modal-body {
      max-height: calc(100vh - 48px);
      max-height: calc(100dvh - 48px);
    }
  }
`;

export const ThemeSider = styled(SiderWrapper)`
  background: #fff !important;
  .ant-layout-sider-children {
    background: #fff;
  }
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.04);
  height: 100vh;
  overflow: auto;
  position: fixed !important;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  scrollbar-width: thin;
  scrollbar-gutter: auto;
  .ant-menu-light {
    background: transparent;
  }
`;

export const ThemeAdminCard = styled(Card)`
  margin: 0;
  background: #fff;
  min-height: 280px;
  border-radius: 16px;
  .ant-card-body {
    padding: 24px;
  }
  @media (max-width: 768px) {
    border-radius: 10px;
    .ant-card-body {
      padding: 14px;
    }
    .ant-card-head {
      padding: 0 14px;
    }
    .ant-card-head-wrapper {
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0;
    }
    .ant-card-head-wrapper .ant-card-head-title {
      flex: none;
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    .ant-card-head-wrapper .ant-card-extra {
      flex: none;
      width: 100%;
      margin: 0;
    }
    .ant-card-extra .ant-space {
      flex-wrap: wrap;
      width: 100%;
      gap: 8px !important;
    }
    .ant-card-extra .ant-input-affix-wrapper,
    .ant-card-extra .ant-select,
    .ant-card-extra .ant-picker {
      width: 100% !important;
    }
  }
`;
export default Theme;
