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
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderWrapper = styled.header`
  position: ${(props) => (props.$preview ? "relative" : "fixed")};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: ${(props) => {
    if (props.$sectionBg && String(props.$sectionBg).trim())
      return props.$sectionBg;
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
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    box-shadow: ${(props) =>
      props.$sectionShadow && String(props.$sectionShadow).trim()
        ? props.$sectionShadow
        : "0 2px 12px rgba(0, 0, 0, 0.08)"};
  }
`;

export const Logo = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  img {
    display: block;
    height: 44px;
    width: clamp(120px, 11vw, 170px);
    object-fit: contain;
    object-position: left center;
  }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex: 1;
  max-width: 100%;
  margin: 0 auto;
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
    left: -20px;
    right: -20px;
    height: ${DROPDOWN_GAP}px;
  }
`;

export const NavLink = styled.a`
  color: ${getColor("black")};
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;
  cursor: pointer;
  &:hover {
    color: ${getColor("black")};
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
  color: ${getColor("black")};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  &:hover {
    background: #f5f5f5;
    color: ${getColor("black")};
    &:last-child {
      border-radius: 0 0 8px 8px;
    }
  }
`;

export const DropdownLabel = styled.span`
  display: block;
  padding: 8px 20px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${getColor("black")};
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
  color: ${getColor("black")};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: default;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  ${DropdownParentRow}:hover & {
    background: #f5f5f5;
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

export const SearchBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 30px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: rgba(255, 255, 255, 0.86);
  color: ${getColor("black")};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  &:hover {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.24);
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 2px solid rgba(0, 0, 0, 0.3);
    outline-offset: 2px;
  }
  svg {
    display: block;
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
    width: 16px;
    height: 16px;
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
  color: ${getColor("black")};
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
  display: none;
  position: ${(props) => (props.$preview ? "absolute" : "fixed")};
  top: 0;
  right: 0;
  bottom: 0;
  width: min(320px, 85vw);
  background: ${(props) => props.$headerBgValue || "transparent"};
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  z-index: ${(props) => (props.$preview ? 2 : 1003)};
  padding: 80px 24px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  transform: translateX(${(props) => (props.$open ? "0" : "100%")});
  transition: transform 0.25s ease;
  @media (max-width: ${BREAKPOINT}) {
    display: block;
    padding: 20px;
    background: #fff;
  }
`;

export const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid ${getColor("themeBorder")};
`;

export const MobileMenuLogo = styled.a`
  display: block;
  text-decoration: none;
  color: ${getColor("black")};
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
  color: ${getColor("black")};
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
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
  color: ${getColor("black")};
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  border-bottom: 1px solid ${getColor("themeBorder")};
  &:hover {
    opacity: 0.9;
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
  color: ${getColor("black")};
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
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
  color: ${getColor("black")};
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.9;
  cursor: default;
`;

export const MobileSubLink = styled.a`
  display: block;
  padding: 10px 0 10px 16px;
  color: ${getColor("black")};
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    color: ${getColor("black")};
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

export const MobileBtnSearch = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: #fff;
  color: ${getColor("black")};
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.24);
  }
  &:focus-visible {
    outline: 2px solid rgba(0, 0, 0, 0.3);
    outline-offset: 2px;
  }
  svg {
    display: block;
  }
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

export const SearchOverlay = styled.div`
  position: ${(props) => (props.$preview ? "absolute" : "fixed")};
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(84px, 14vh, 130px) 16px 18px;
  background: rgba(10, 15, 25, 0.6);
  z-index: ${(props) => (props.$preview ? 5 : 1400)};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  pointer-events: ${(props) => (props.$open ? "auto" : "none")};
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease;
  @media (max-width: ${BREAKPOINT}) {
    padding-top: 72px;
  }
`;

export const SearchPanel = styled.div`
  width: min(840px, 100%);
  max-height: min(70vh, 640px);
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${(props) =>
    props.$open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)"};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition:
    transform 0.28s cubic-bezier(0.2, 0.85, 0.32, 1),
    opacity 0.2s ease;
  @media (max-width: ${BREAKPOINT}) {
    max-height: calc(100vh - 96px);
    border-radius: 14px;
  }
`;

export const SearchTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 14px 16px;
`;

export const SearchTopIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.55);
  flex-shrink: 0;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: ${getColor("black")};
  font-size: 1rem;
  font-weight: 500;
  min-width: 0;
  outline: none;
  &::placeholder {
    color: rgba(0, 0, 0, 0.45);
    font-weight: 400;
  }
`;

export const SearchCloseBtn = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover {
    background: rgba(0, 0, 0, 0.07);
  }
`;

export const SearchResults = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 8px 12px;
`;

export const SearchResultLink = styled.a`
  display: block;
  text-decoration: none;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 4px 0;
  color: ${getColor("black")};
  transition: background 0.2s ease;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const SearchResultType = styled.span`
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 0.67rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #8c1c13;
  margin-bottom: 4px;
`;

export const SearchResultTitle = styled.div`
  font-size: 0.97rem;
  font-weight: 600;
  line-height: 1.35;
`;

export const SearchResultMeta = styled.div`
  margin-top: 4px;
  font-size: 0.83rem;
  color: rgba(0, 0, 0, 0.57);
  line-height: 1.4;
`;

export const SearchState = styled.div`
  padding: 24px 18px 20px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.95rem;
  line-height: 1.5;
`;
