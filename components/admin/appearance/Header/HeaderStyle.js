import styled, { keyframes } from "styled-components";
import Theme, { BREAKPOINT, getColor } from "@/styles/Theme";

const dropdownFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

export const HeaderMainWrapper = styled.div`
  width: 95%;
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderWrapper = styled.header`
  --header-nav-color: ${(props) => props.$navColorValue || getColor("black")};
  --header-nav-hover-color: ${(props) =>
    props.$navHoverColorValue || props.$navColorValue || getColor("black")};
  --header-nav-dropdown-color: #3c3c3c;
  --header-nav-font-size: ${(props) =>
    props.$navFontSize && String(props.$navFontSize).trim()
      ? /^\d+(\.\d+)?$/.test(String(props.$navFontSize).trim())
        ? `${String(props.$navFontSize).trim()}px`
        : String(props.$navFontSize).trim()
      : "0.95rem"};
  --header-nav-font-weight: ${(props) =>
    props.$navFontWeight && String(props.$navFontWeight).trim()
      ? String(props.$navFontWeight).trim()
      : "500"};
  --header-nav-item-bg: ${(props) =>
    props.$navItemBackgroundValue || "transparent"};
  --header-nav-item-hover-bg: ${(props) =>
    props.$navItemHoverBackgroundValue ||
    props.$navItemBackgroundValue ||
    "transparent"};
  position: ${(props) => (props.$preview ? "relative" : "fixed")};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: ${(props) => {
    if (props.$sectionBg && String(props.$sectionBg).trim()) {
      return props.$sectionBg;
    }
    return props.$preview ? "rgba(255, 255, 255, 0.98)" : "transparent";
  }};
  padding: ${(props) =>
    props.$sectionPadding && String(props.$sectionPadding).trim()
      ? props.$sectionPadding
      : "16px 0"};
  z-index: ${(props) => (props.$preview ? 0 : 1000)};
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
  ${(props) =>
    props.$sectionBorderSize && String(props.$sectionBorderSize).trim()
      ? `
    border-width: ${props.$sectionBorderSize};
    border-style: ${props.$sectionBorderStyle && String(props.$sectionBorderStyle).trim() ? props.$sectionBorderStyle : "solid"};
    border-color: ${props.$sectionBorderColor && String(props.$sectionBorderColor).trim() ? props.$sectionBorderColor : "transparent"};
  `
      : ""}
  ${(props) =>
    props.$sectionShadow && String(props.$sectionShadow).trim()
      ? `box-shadow: ${props.$sectionShadow};`
      : ""}
  @media (max-width: ${BREAKPOINT}) {
    padding: ${(props) =>
      props.$sectionPadding && String(props.$sectionPadding).trim()
        ? props.$sectionPadding
        : "12px 0"};
  }
  &.is-scrolled {
    /* background: ${(props) =>
      props.$sectionBg && String(props.$sectionBg).trim()
        ? props.$sectionBg
        : "rgba(255, 255, 255, 0.8)"};
    backdrop-filter: ${(props) =>
      props.$sectionBg && String(props.$sectionBg).trim()
        ? "none"
        : "blur(8px)"};
    box-shadow: ${(props) =>
      props.$sectionShadow && String(props.$sectionShadow).trim()
        ? props.$sectionShadow
        : "0 2px 12px rgba(0, 0, 0, 0.08)"}; */
    background: #0f2f3a;
  }
`;

export const Logo = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  img {
    display: block;
    height: auto;
    max-height: 44px;
    width: auto;
  }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$menuPosition === "left"
      ? "flex-start"
      : props.$menuPosition === "right"
        ? "flex-end"
        : "center"};
  gap: clamp(18px, 2vw, 30px);
  flex: 1;
  max-width: 100%;
  margin: 0 48px;
  @media (max-width: ${BREAKPOINT}) {
    display: none;
  }
`;

const DROPDOWN_GAP = 27.5;

export const NavItem = styled.div`
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: -12px;
    right: -12px;
    height: ${DROPDOWN_GAP}px;
  }
`;

export const NavLink = styled.a`
  color: var(--header-nav-color);
  text-decoration: none;
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 8px;
  background: var(--header-nav-item-bg);
  transition: color 0.2s ease;
  cursor: pointer;
  &:hover {
    color: var(--header-nav-hover-color);
    background: var(--header-nav-item-hover-bg);
  }
  &.is-active {
    color: var(--header-nav-hover-color);
    background: var(--header-nav-item-hover-bg);
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + ${DROPDOWN_GAP}px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 260px;
  background: ${getColor("white")};
  border-radius: 0 0 8px 8px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    visibility 0.2s;
  z-index: 1001;
  ${NavItem}:hover & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    animation: ${dropdownFadeIn} 0.2s ease-out forwards;
  }
`;

export const DropdownItem = styled.a`
  display: block;
  padding: 10px 20px;
  color: var(--header-nav-dropdown-color);
  text-decoration: none;
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  transition:
    background 0.2s ease,
    color 0.2s ease;
  &:hover {
    background: var(--header-nav-item-hover-bg);
    color: var(--header-nav-dropdown-color);
    &:last-child {
      border-radius: 0 0 8px 8px;
    }
  }
  &.is-active {
    background: var(--header-nav-item-hover-bg);
    color: var(--header-nav-dropdown-color);
  }
`;

export const DropdownLabel = styled.span`
  display: block;
  padding: 8px 20px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--header-nav-dropdown-color);
`;

export const DropdownParentRow = styled.div`
  position: relative;
  display: block;
`;

export const DropdownParentTrigger = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  color: var(--header-nav-color);
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  cursor: default;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  ${DropdownParentRow}:hover & {
    background: var(--header-nav-item-hover-bg);
    color: var(--header-nav-dropdown-color);
  }
  &.is-active {
    background: var(--header-nav-item-hover-bg);
    color: var(--header-nav-dropdown-color);
  }
  svg {
    flex-shrink: 0;
    margin-left: 8px;
    opacity: 0.7;
  }
`;

export const DropdownSubmenu = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 240px;
  background: ${getColor("white")};
  border-radius: 0 8px 8px 8px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: none;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    visibility 0.2s;
  z-index: 1002;
  ${DropdownParentRow}:hover & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
`;

export const Chevron = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: inherit;
  svg {
    display: block;
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: ${BREAKPOINT}) {
    display: none;
  }
`;

export const Btn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    background 0.2s,
    box-shadow 0.2s,
    filter 0.2s;
  border: none;
  &:hover {
    filter: brightness(1.05);
  }
`;

export const IconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 50%;
  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    vertical-align: middle;
  }
`;

export const BtnVolunteer = styled(Btn)`
  background: ${(props) => props.$headerCtaBgValue || "transparent"};
  color: ${(props) => props.$headerCtaTextValue || "currentColor"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 30px;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  }
`;

export const BtnDonate = styled(Btn)`
  background: ${(props) => props.$headerDonateBgValue || "transparent"};
  color: ${(props) => props.$headerDonateTextValue || "currentColor"};
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  border-radius: 30px;
  &:hover {
    color: ${(props) => props.$headerDonateTextValue || "currentColor"};
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  }
`;

export const HamburgerBtn = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
  @media (max-width: ${BREAKPOINT}) {
    display: flex;
  }
`;

export const MobileOverlay = styled.div`
  display: none;
  position: ${(props) => (props.$preview ? "absolute" : "fixed")};
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: ${(props) => (props.$preview ? 1 : 1002)};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition:
    opacity 0.2s,
    visibility 0.2s;
  @media (max-width: ${BREAKPOINT}) {
    display: block;
  }
`;

export const MobileMenu = styled.div`
  --header-nav-color: ${(props) => props.$navColorValue || getColor("black")};
  --header-nav-hover-color: ${(props) =>
    props.$navHoverColorValue || props.$navColorValue || getColor("black")};
  --header-nav-font-size: ${(props) =>
    props.$navFontSize && String(props.$navFontSize).trim()
      ? /^\d+(\.\d+)?$/.test(String(props.$navFontSize).trim())
        ? `${String(props.$navFontSize).trim()}px`
        : String(props.$navFontSize).trim()
      : "0.95rem"};
  --header-nav-font-weight: ${(props) =>
    props.$navFontWeight && String(props.$navFontWeight).trim()
      ? String(props.$navFontWeight).trim()
      : "500"};
  --header-nav-item-bg: ${(props) =>
    props.$navItemBackgroundValue || "transparent"};
  --header-nav-item-hover-bg: ${(props) =>
    props.$navItemHoverBackgroundValue ||
    props.$navItemBackgroundValue ||
    "transparent"};
  --header-nav-dropdown-color: #3c3c3c;
  display: none;
  position: ${(props) => (props.$preview ? "absolute" : "fixed")};
  top: 0;
  right: 0;
  bottom: 0;
  width: min(320px, 85vw);
  background: ${(props) =>
    props.$headerBgValue && String(props.$headerBgValue).trim()
      ? props.$headerBgValue
      : getColor("white")};
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  z-index: ${(props) => (props.$preview ? 2 : 1003)};
  padding: 80px 24px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  transform: translateX(${(props) => (props.$open ? "0" : "100%")});
  transition: transform 0.25s ease;
  @media (max-width: ${BREAKPOINT}) {
    display: block;
    /* Responsive drawer menu text should remain dark on white panel */
    --header-nav-color: #3c3c3c;
    --header-nav-hover-color: ${(props) =>
      props.$navHoverColorValue || getColor("primary") || "#3c3c3c"};
    padding: 20px;
    background: ${(props) =>
      props.$headerBgValue && String(props.$headerBgValue).trim()
        ? props.$headerBgValue
        : getColor("white")};
  }
`;

export const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid ${getColor("themeBorder")};
  background: transparent;
  @media (max-width: ${BREAKPOINT}) {
    /* Full-width header strip; keep menu items using parent padding */
    margin: -20px -20px 0;
    padding: 20px 20px;
    background: ${(props) =>
      props.$headerMobileMenuHeaderBgValue &&
      String(props.$headerMobileMenuHeaderBgValue).trim()
        ? props.$headerMobileMenuHeaderBgValue
        : "transparent"};
  }
`;

export const MobileMenuLogo = styled.a`
  display: block;
  text-decoration: none;
  color: var(--header-nav-dropdown-color);
  img {
    display: block;
    max-height: 40px;
    width: auto;
    object-fit: contain;
  }
`;

export const MobileMenuCloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
`;

export const MobileNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const MobileNavLink = styled.a`
  display: block;
  padding: 14px 0;
  color: var(--header-nav-color);
  text-decoration: none;
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  border-bottom: 1px solid ${getColor("themeBorder")};
  &:hover {
    color: var(--header-nav-hover-color);
  }
  &.is-active {
    color: var(--header-nav-hover-color);
    background: var(--header-nav-item-hover-bg);
  }
`;

export const MobileNavItem = styled.div`
  border-bottom: 1px solid ${getColor("themeBorder")};
`;

export const MobileAccordionTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--header-nav-color);
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  text-align: left;
  cursor: pointer;
  &:hover {
    color: var(--header-nav-hover-color);
  }
  &.is-active {
    color: var(--header-nav-hover-color);
    background: var(--header-nav-item-hover-bg);
  }
  svg {
    flex-shrink: 0;
    margin-left: 8px;
    transition: transform 0.2s ease;
    transform: rotate(${(props) => (props.$open ? "180deg" : "0")});
  }
`;

export const MobileAccordionContent = styled.div`
  max-height: ${(props) => (props.$open ? props.$height || "500px" : "0")};
  overflow: hidden;
  transition: max-height 0.25s ease;
`;

export const MobileNavLabel = styled.span`
  display: block;
  padding: 12px 0 6px;
  color: var(--header-nav-color);
  font-size: var(--header-nav-font-size);
  font-weight: var(--header-nav-font-weight);
  opacity: 0.9;
  cursor: default;
`;

export const MobileSubLink = styled.a`
  display: block;
  padding: 10px 0 10px 16px;
  color: var(--header-nav-color);
  text-decoration: none;
  font-size: var(--header-nav-font-size);
  &:hover {
    color: var(--header-nav-hover-color);
  }
  &.is-active {
    color: var(--header-nav-hover-color);
    background: var(--header-nav-item-hover-bg);
  }
`;

export const MobileSubLinkNested = styled(MobileSubLink)`
  padding-left: 28px;
  font-size: 0.85rem;
`;

export const MobileActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 24px;
`;

export const MobileBtn = styled(Btn)`
  justify-content: center;
  width: 100%;
`;

export const MobileBtnVolunteer = styled(MobileBtn)`
  background: ${(props) => props.$headerCtaBgValue || "transparent"};
  color: ${(props) => props.$headerCtaTextValue || "currentColor"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

export const MobileBtnDonate = styled(MobileBtn)`
  background: ${(props) => props.$headerDonateBgValue || "transparent"};
  color: ${(props) => props.$headerDonateTextValue || "currentColor"};
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
`;

// Readable aliases for shared usage across admin/site layers.
export const HeaderBaseButton = Btn;
export const HeaderVolunteerButton = BtnVolunteer;
export const HeaderDonateButton = BtnDonate;
export const HeaderMobileBaseButton = MobileBtn;
export const HeaderMobileVolunteerButton = MobileBtnVolunteer;
export const HeaderMobileDonateButton = MobileBtnDonate;
