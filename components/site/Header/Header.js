"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { Row, Col, message as antMessage } from "antd";
import styled from "styled-components";
import { useFormState, useFormStatus } from "react-dom";
import { submitContact } from "@/app/actions/contact";
import { getColor } from "@/styles/Theme";
import {
  HeaderWrapper,
  HeaderMainWrapper,
  Logo,
  Nav,
  NavItem,
  NavLink,
  Chevron,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownParentRow,
  DropdownParentTrigger,
  DropdownSubmenu,
  Actions,
  BtnVolunteer,
  BtnDonate,
  IconWrap,
  HamburgerBtn,
  MobileOverlay,
  MobileMenu,
  MobileNav,
  MobileNavLink,
  MobileNavItem,
  MobileAccordionTrigger,
  MobileAccordionContent,
  MobileSubLink,
  MobileSubLinkNested,
  MobileNavLabel,
  MobileMenuHeader,
  MobileMenuLogo,
  MobileMenuCloseBtn,
  MobileActions,
  MobileBtnVolunteer,
  MobileBtnDonate,
} from "./HeaderStyle";

const SCROLL_THRESHOLD_PX = 10;

/** Convert CMS menu items { label, url, openInNewTab?, children? } to header shape { label, href, target?, submenu? } */
function cmsMenuToHeaderItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url = typeof item.url === "string" && item.url ? item.url : "#";
    const children = Array.isArray(item.children) ? item.children : [];
    const submenu = children.length
      ? cmsMenuToHeaderItems(children)
      : undefined;
    return {
      label: String(item.label ?? ""),
      href: url,
      target: item.openInNewTab ? "_blank" : undefined,
      submenu,
    };
  });
}

const DropdownChevron = () => (
  <Chevron>
    <svg
      width="10"
      height="6"
      viewBox="0 0 12 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 1 L6 6 L11 1" />
    </svg>
  </Chevron>
);

const RightArrow = () => (
  <svg
    width="8"
    height="12"
    viewBox="0 0 8 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 1 L6 6 L1 11" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="12"
    height="8"
    viewBox="0 0 12 8"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 1 L6 6 L11 1" />
  </svg>
);

/* ── Modal Styled Components ── */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? "auto" : "none")};
  transition: opacity 0.25s ease;
`;
const ModalCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
  position: relative;
  transform: ${(p) => (p.$open ? "translateY(0)" : "translateY(20px)")};
  transition: transform 0.25s ease;
  @media (max-width: 576px) {
    padding: 24px;
  }
`;
const ModalCloseBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 24px 0;
  padding-right: 40px;
`;
const ModalFormGroup = styled.div`
  margin-bottom: 16px;
  .mlabel {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }
  .mreq {
    color: #cf372f;
  }
  .mfield {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &:focus {
      border-color: rgba(0, 0, 0, 0.3);
    }
    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
  }
  textarea.mfield {
    resize: vertical;
    min-height: 100px;
  }
`;
const ModalBtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;
const ModalCancelBtn = styled.button`
  padding: 10px 28px;
  border: 1px solid;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.7;
  }
`;
const ModalSendBtn = styled.button`
  padding: 10px 28px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function ModalSubmitButton({ bgColor, textColor }) {
  const { pending } = useFormStatus();
  return (
    <ModalSendBtn
      type="submit"
      disabled={pending}
      style={{ background: bgColor || "#8b1a1a", color: textColor || "#fff" }}
    >
      {pending ? "Sending..." : "Send Message"}
    </ModalSendBtn>
  );
}

export default function Header({
  menuItems = [],
  siteTitle = "",
  logoType = "text",
  logoImageUrl = "",
  logoLightUrl = "",
  logoMobileUrl = "",
  logoDarkUrl = "",
  sticky = true,
  transparent = false,
  layout = "default",
  volunteerLabel = "",
  donateLabel = "",
  volunteerHref = "",
  donateHref = "",
  volunteerIconUrl = "",
  volunteerIconUrlMobile,
  donateIconUrl = "",
  donateIconUrlMobile,
  preview = false,
  headerBgValue = "",
  headerCtaBgValue = "",
  headerCtaTextValue = "",
  headerDonateBgValue = "",
  headerDonateTextValue = "",
  sectionBg = "",
  sectionPadding = "",
  sectionBorderSize = "",
  sectionBorderStyle = "",
  sectionBorderColor = "",
  sectionShadow = "",
  /* Modal props */
  volunteerModalTitle = "Leave us a message",
  volunteerModalBtnBg = "",
  volunteerModalBtnText = "",
  volunteerModalCancelColor = "",
}) {
  /* Resolve modal color keys to actual CSS color values */
  const resolvedModalBtnBg = volunteerModalBtnBg
    ? getColor(volunteerModalBtnBg) || volunteerModalBtnBg
    : "#8b1a1a";
  const resolvedModalBtnText = volunteerModalBtnText
    ? getColor(volunteerModalBtnText) || volunteerModalBtnText
    : "#fff";
  const resolvedModalCancelColor = volunteerModalCancelColor
    ? getColor(volunteerModalCancelColor) || volunteerModalCancelColor
    : "#8b1a1a";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const modalFormRef = useRef(null);
  const [modalState, modalFormAction] = useFormState(submitContact, null);

  /* Listen for global event so other buttons can open this modal */
  useEffect(() => {
    const handleOpen = () => setModalOpen(true);
    window.addEventListener("open-volunteer-modal", handleOpen);
    const handleHash = () => {
      if (window.location.hash === "#volunteer-modal") {
        setModalOpen(true);
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };
    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => {
      window.removeEventListener("open-volunteer-modal", handleOpen);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  useEffect(() => {
    if (!modalState) return;
    if (modalState.success) {
      antMessage.success("Message sent successfully!");
      modalFormRef.current?.reset();
      setModalOpen(false);
    } else if (modalState.error) {
      antMessage.error(modalState.error);
    }
  }, [modalState]);

  useEffect(() => {
    if (modalOpen) {
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }
  }, [modalOpen]);
  const [scrolled, setScrolled] = useState(false);

  const items = cmsMenuToHeaderItems(menuItems);
  const logoUrl = logoLightUrl || logoImageUrl;
  const logoUrlMobile = logoMobileUrl || logoUrl;
  const title = siteTitle ?? "";
  const volunteerIconMobile = volunteerIconUrlMobile ?? volunteerIconUrl;
  const donateIconMobile = donateIconUrlMobile ?? donateIconUrl;

  useEffect(() => {
    const onScroll = () =>
      setScrolled(
        typeof window !== "undefined" && window.scrollY >= SCROLL_THRESHOLD_PX,
      );
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenAccordion(null);
  };

  const toggleAccordion = (label) => {
    setOpenAccordion((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <HeaderWrapper
        $preview={preview}
        $sectionBg={sectionBg}
        $sectionPadding={sectionPadding}
        $sectionBorderSize={sectionBorderSize}
        $sectionBorderStyle={sectionBorderStyle}
        $sectionBorderColor={sectionBorderColor}
        $sectionShadow={sectionShadow}
        className={scrolled && !preview ? "is-scrolled" : ""}
      >
        <HeaderMainWrapper>
          <Logo href="/" onClick={closeMobile}>
            {logoType === "image" && logoUrl ? (
              <img
                loading="lazy"
                src={logoUrl}
                alt={title}
                className="img-fluid"
              />
            ) : (
              <span>{title}</span>
            )}
          </Logo>

          <Nav>
            {items.map((item) => (
              <NavItem key={item.label}>
                {item.submenu ? (
                  <>
                    <NavLink as="span" tabIndex={0}>
                      {item.label} <DropdownChevron />
                    </NavLink>
                    <Dropdown>
                      {item.submenu.map((sub) =>
                        sub.submenu ? (
                          <DropdownParentRow key={sub.label}>
                            <DropdownParentTrigger>
                              {sub.label}
                              <RightArrow />
                            </DropdownParentTrigger>
                            <DropdownSubmenu>
                              {sub.submenu.map((child) => (
                                <DropdownItem
                                  key={child.label}
                                  href={child.href}
                                  target={child.target}
                                  rel={
                                    child.target === "_blank"
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                >
                                  {child.label}
                                </DropdownItem>
                              ))}
                            </DropdownSubmenu>
                          </DropdownParentRow>
                        ) : sub.isLabel ? (
                          <DropdownLabel key={sub.label}>
                            {sub.label}
                          </DropdownLabel>
                        ) : (
                          <DropdownItem
                            key={sub.label}
                            href={sub.href}
                            target={sub.target}
                            rel={
                              sub.target === "_blank"
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {sub.label}
                          </DropdownItem>
                        ),
                      )}
                    </Dropdown>
                  </>
                ) : (
                  <NavLink
                    href={item.href}
                    target={item.target}
                    rel={
                      item.target === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {item.label}
                  </NavLink>
                )}
              </NavItem>
            ))}
          </Nav>

          <Actions>
            {(volunteerLabel || volunteerHref) && (
              <BtnVolunteer
                as="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setModalOpen(true);
                }}
                $headerCtaBgValue={headerCtaBgValue}
                $headerCtaTextValue={headerCtaTextValue}
                style={{ cursor: "pointer" }}
              >
                {volunteerLabel}
                <IconWrap>
                  {volunteerIconUrl ? (
                    <img
                      loading="lazy"
                      src={volunteerIconUrl}
                      alt={volunteerLabel}
                    />
                  ) : null}
                </IconWrap>
              </BtnVolunteer>
            )}
            {(donateLabel || donateHref) && (
              <BtnDonate
                href={donateHref || "#"}
                $headerDonateBgValue={headerDonateBgValue}
                $headerDonateTextValue={headerDonateTextValue}
              >
                {donateLabel}
                <IconWrap>
                  {donateIconUrl ? (
                    <img loading="lazy" src={donateIconUrl} alt={donateLabel} />
                  ) : null}
                </IconWrap>
              </BtnDonate>
            )}
          </Actions>

          <HamburgerBtn
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </HamburgerBtn>
        </HeaderMainWrapper>
      </HeaderWrapper>

      <MobileOverlay
        $open={mobileOpen}
        $preview={preview}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <MobileMenu
        $open={mobileOpen}
        $preview={preview}
        $headerBgValue={headerBgValue}
      >
        <MobileMenuHeader>
          <MobileMenuLogo href="/" onClick={closeMobile}>
            {logoType === "image" && logoUrlMobile ? (
              <img loading="lazy" src={logoUrlMobile} alt={title} />
            ) : (
              <span>{title}</span>
            )}
          </MobileMenuLogo>
          <MobileMenuCloseBtn
            type="button"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <CloseIcon />
          </MobileMenuCloseBtn>
        </MobileMenuHeader>
        <MobileNav>
          {items.map((item) =>
            item.submenu ? (
              <MobileNavItem key={item.label}>
                <MobileAccordionTrigger
                  type="button"
                  $open={openAccordion === item.label}
                  onClick={() => toggleAccordion(item.label)}
                  aria-expanded={openAccordion === item.label}
                >
                  {item.label}
                  <ChevronDown />
                </MobileAccordionTrigger>
                <MobileAccordionContent $open={openAccordion === item.label}>
                  {item.submenu.map((sub) =>
                    sub.submenu ? (
                      <Fragment key={sub.label}>
                        <MobileNavLabel>{sub.label}</MobileNavLabel>
                        {sub.submenu.map((child) => (
                          <MobileSubLinkNested
                            key={child.label}
                            href={child.href}
                            target={child.target}
                            rel={
                              child.target === "_blank"
                                ? "noopener noreferrer"
                                : undefined
                            }
                            onClick={closeMobile}
                          >
                            {child.label}
                          </MobileSubLinkNested>
                        ))}
                      </Fragment>
                    ) : sub.isLabel ? null : (
                      <MobileSubLink
                        key={sub.label}
                        href={sub.href}
                        target={sub.target}
                        rel={
                          sub.target === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        onClick={closeMobile}
                      >
                        {sub.label}
                      </MobileSubLink>
                    ),
                  )}
                </MobileAccordionContent>
              </MobileNavItem>
            ) : (
              <MobileNavLink
                key={item.label}
                href={item.href}
                target={item.target}
                rel={
                  item.target === "_blank" ? "noopener noreferrer" : undefined
                }
                onClick={closeMobile}
              >
                {item.label}
              </MobileNavLink>
            ),
          )}
        </MobileNav>
        <MobileActions>
          {(volunteerLabel || volunteerHref) && (
            <MobileBtnVolunteer
              as="button"
              type="button"
              onClick={() => {
                closeMobile();
                setModalOpen(true);
              }}
              $headerCtaBgValue={headerCtaBgValue}
              $headerCtaTextValue={headerCtaTextValue}
              style={{ cursor: "pointer" }}
            >
              <IconWrap>
                {volunteerIconMobile ? (
                  <img
                    loading="lazy"
                    src={volunteerIconMobile}
                    alt={volunteerLabel}
                  />
                ) : null}
              </IconWrap>
              {volunteerLabel}
            </MobileBtnVolunteer>
          )}
          {(donateLabel || donateHref) && (
            <MobileBtnDonate
              href={donateHref || "#"}
              onClick={closeMobile}
              $headerDonateBgValue={headerDonateBgValue}
              $headerDonateTextValue={headerDonateTextValue}
            >
              <IconWrap>
                {donateIconMobile ? (
                  <img
                    loading="lazy"
                    src={donateIconMobile}
                    alt={donateLabel}
                  />
                ) : null}
              </IconWrap>
              {donateLabel}
            </MobileBtnDonate>
          )}
        </MobileActions>
      </MobileMenu>
      {/* Volunteer Modal */}
      <ModalOverlay $open={modalOpen} onClick={() => setModalOpen(false)}>
        <ModalCard $open={modalOpen} onClick={(e) => e.stopPropagation()}>
          <ModalCloseBtn onClick={() => setModalOpen(false)}>
            &#x2715;
          </ModalCloseBtn>
          <ModalTitle>{volunteerModalTitle}</ModalTitle>
          <form ref={modalFormRef} action={modalFormAction}>
            <input type="hidden" name="page" value="volunteer-modal" />
            <input type="hidden" name="source" value="header-volunteer" />
            <input type="hidden" name="phone" value="" />
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <ModalFormGroup>
                  <label className="mlabel">
                    Full Name <span className="mreq">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    className="mfield"
                    placeholder="Your name"
                  />
                </ModalFormGroup>
              </Col>
              <Col xs={24} sm={12}>
                <ModalFormGroup>
                  <label className="mlabel">
                    Email <span className="mreq">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mfield"
                    placeholder="Your email address"
                  />
                </ModalFormGroup>
              </Col>
            </Row>
            <ModalFormGroup>
              <label className="mlabel">
                Subject <span className="mreq">*</span>
              </label>
              <input
                name="subject"
                required
                className="mfield"
                placeholder="Subject of message"
              />
            </ModalFormGroup>
            <ModalFormGroup>
              <label className="mlabel">
                Message <span className="mreq">*</span>
              </label>
              <textarea
                name="message"
                required
                className="mfield"
                placeholder="Message text"
                rows={4}
              />
            </ModalFormGroup>
            <ModalBtnRow>
              <ModalCancelBtn
                type="button"
                style={{
                  color: resolvedModalCancelColor,
                  borderColor: resolvedModalCancelColor,
                }}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </ModalCancelBtn>
              <ModalSubmitButton
                bgColor={resolvedModalBtnBg}
                textColor={resolvedModalBtnText}
              />
            </ModalBtnRow>
          </form>
        </ModalCard>
      </ModalOverlay>
    </>
  );
}
