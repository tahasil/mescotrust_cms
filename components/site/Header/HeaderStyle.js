import styled, { keyframes } from "styled-components";
import Theme, { BREAKPOINT } from "@/styles/Theme";

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
  background: ${(props) => (props.$preview ? "rgba(255, 255, 255, 0.98)" : "transparent")};
  padding: 16px 0;
  z-index: ${(props) => (props.$preview ? 0 : 1000)};
  transition: background 0.25s ease, box-shadow 0.25s ease;
  @media (max-width: ${BREAKPOINT}) {
    padding: 12px 0;
  }
  &.is-scrolled {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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
  justify-content: center;
  gap: 40px;
  flex: 1;
  max-width: 560px;
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
  color: ${Theme.colors.black};
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;
  cursor: pointer;
  &:hover {
    color: ${Theme.colors.black};
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + ${DROPDOWN_GAP}px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 260px;
  background: ${Theme.colors.white};
  border-radius: 0 0 8px 8px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s;
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
  color: ${Theme.colors.black};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease, color 0.2s ease;
  &:hover {
    background: #f5f5f5;
    color: ${Theme.colors.black};
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
  color: ${Theme.colors.black};
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
  color: ${Theme.colors.black};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: default;
  transition: background 0.2s ease, color 0.2s ease;
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
  background: ${Theme.colors.white};
  border-radius: 0 8px 8px 8px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: none;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s;
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
  transition: background 0.2s, box-shadow 0.2s, filter 0.2s;
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
  background: transparent;
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
  background: ${Theme.colors.headerCta};
  color: ${Theme.colors.primary};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 30px;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  }
`;

export const BtnDonate = styled(Btn)`
  background: ${Theme.colors.gradient};
  color: ${Theme.colors.white};
  box-shadow: 0 4px 14px rgba(139, 34, 32, 0.35);
  border-radius: 30px;
  &:hover {
    color: ${Theme.colors.white};
    box-shadow: 0 4px 18px rgba(139, 34, 32, 0.45);
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
  color: ${Theme.colors.black};
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
  background: rgba(0, 0, 0, 0.5);
  z-index: ${(props) => (props.$preview ? 1 : 1002)};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition: opacity 0.2s, visibility 0.2s;
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
  background: ${Theme.colors.headerBg};
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
    background: ${Theme.colors.white};
  }
`;

export const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid ${Theme.colors.themeBorder};
`;

export const MobileMenuLogo = styled.a`
  display: block;
  text-decoration: none;
  color: ${Theme.colors.black};
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
  color: ${Theme.colors.black};
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
  color: ${Theme.colors.black};
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  border-bottom: 1px solid ${Theme.colors.themeBorder};
  &:hover {
    opacity: 0.9;
  }
`;

export const MobileNavItem = styled.div`
  border-bottom: 1px solid ${Theme.colors.themeBorder};
`;

export const MobileAccordionTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  background: none;
  border: none;
  color: ${Theme.colors.black};
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
  color: ${Theme.colors.black};
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.9;
  cursor: default;
`;

export const MobileSubLink = styled.a`
  display: block;
  padding: 10px 0 10px 16px;
  color: ${Theme.colors.black};
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    color: ${Theme.colors.black};
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
  background: ${Theme.colors.headerCta};
  color: ${Theme.colors.primary};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

export const MobileBtnDonate = styled(MobileBtn)`
  background: ${Theme.colors.gradient};
  color: ${Theme.colors.white};
  box-shadow: 0 4px 14px rgba(139, 34, 32, 0.35);
`;
