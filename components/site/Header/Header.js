"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { Row, Col, notification } from "antd";
import styled from "styled-components";
import { useFormState, useFormStatus } from "react-dom";
import { submitContact } from "@/app/actions/contact";
import { getColor } from "@/styles/Theme";
import {
  hasMinText,
  isValidEmail,
  isValidName,
  normalizeText,
} from "@/lib/formValidation";
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
  SearchBtn,
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
  MobileBtnSearch,
  MobileBtnVolunteer,
  MobileBtnDonate,
  SearchOverlay,
  SearchPanel,
  SearchTopRow,
  SearchTopIcon,
  SearchInput,
  SearchCloseBtn,
  SearchResults,
  SearchResultLink,
  SearchResultType,
  SearchResultTitle,
  SearchResultMeta,
  SearchState,
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
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.4-3.4" />
  </svg>
);

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

function ModalSubmitButton({
  bgColor,
  textColor,
  sendLabel = "",
  sendingLabel = "",
}) {
  const { pending } = useFormStatus();
  return (
    <ModalSendBtn
      type="submit"
      disabled={pending}
      style={{
        background: bgColor || getColor("primary") || "var(--theme-primary)",
        color: textColor || getColor("white") || "var(--theme-white)",
      }}
    >
      {pending ? sendingLabel : sendLabel}
    </ModalSendBtn>
  );
}

export default function Header({
  menuItems = [],
  siteTitle = "",
  headerSearchEnabled = false,
  headerSearchLabel = "",
  headerSearchOpenAriaLabel = "",
  headerSearchPlaceholder = "",
  headerSearchDialogLabel = "",
  headerSearchInputAriaLabel = "",
  headerSearchCloseAriaLabel = "",
  headerSearchMinCharsMessage = "",
  headerSearchLoadingMessage = "",
  headerSearchNoResultsMessage = "",
  headerSearchErrorMessage = "",
  headerSearchResultTypePageLabel = "",
  headerSearchResultTypeBlogLabel = "",
  headerSearchResultTypeEventLabel = "",
  headerSearchFallbackTitle = "",
  headerSearchFallbackMeta = "",
  logoType = "text",
  logoUrl = "",
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
  volunteerModalTitle = "",
  volunteerModalSuccessTitle = "",
  volunteerModalSuccessDescription = "",
  volunteerModalErrorTitle = "",
  volunteerModalNameLabel = "",
  volunteerModalEmailLabel = "",
  volunteerModalSubjectLabel = "",
  volunteerModalMessageLabel = "",
  volunteerModalNamePlaceholder = "",
  volunteerModalEmailPlaceholder = "",
  volunteerModalSubjectPlaceholder = "",
  volunteerModalMessagePlaceholder = "",
  volunteerModalCancelLabel = "",
  volunteerModalSendLabel = "",
  volunteerModalSendingLabel = "",
  volunteerModalNameRequiredMessage = "",
  volunteerModalEmailRequiredMessage = "",
  volunteerModalEmailInvalidMessage = "",
  volunteerModalSubjectRequiredMessage = "",
  volunteerModalSubjectMinMessage = "",
  volunteerModalMessageRequiredMessage = "",
  volunteerModalMessageMinMessage = "",
  volunteerModalBtnBg = "",
  volunteerModalBtnText = "",
  volunteerModalCancelColor = "",
}) {
  /* Resolve modal color keys to actual CSS color values */
  const resolvedModalBtnBg = volunteerModalBtnBg
    ? getColor(volunteerModalBtnBg) || volunteerModalBtnBg
    : getColor("primary") || "var(--theme-primary)";
  const resolvedModalBtnText = volunteerModalBtnText
    ? getColor(volunteerModalBtnText) || volunteerModalBtnText
    : getColor("white") || "var(--theme-white)";
  const resolvedModalCancelColor = volunteerModalCancelColor
    ? getColor(volunteerModalCancelColor) || volunteerModalCancelColor
    : getColor("primary") || "var(--theme-primary)";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [modalErrors, setModalErrors] = useState({});
  const modalFormRef = useRef(null);
  const searchInputRef = useRef(null);
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
      if (volunteerModalSuccessTitle || volunteerModalSuccessDescription) {
        notification.success({
          message: volunteerModalSuccessTitle,
          description: volunteerModalSuccessDescription,
          placement: "bottomRight",
        });
      }
      modalFormRef.current?.reset();
      setModalErrors({});
      setModalOpen(false);
      window.dispatchEvent(new Event("new-contact-submission"));
    } else if (modalState.error) {
      if (volunteerModalErrorTitle || modalState.error) {
        notification.error({
          message: volunteerModalErrorTitle,
          description: modalState.error,
          placement: "bottomRight",
        });
      }
    }
  }, [
    modalState,
    volunteerModalSuccessTitle,
    volunteerModalSuccessDescription,
    volunteerModalErrorTitle,
  ]);

  useEffect(() => {
    if (modalOpen || searchOpen) {
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }
  }, [modalOpen, searchOpen]);
  const [scrolled, setScrolled] = useState(false);

  const items = cmsMenuToHeaderItems(menuItems);
  const logoImage = logoLightUrl || logoImageUrl;
  const logoUrlMobile = logoMobileUrl || logoImage;
  const logoHref = String(logoUrl || "").trim();
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

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchItems([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const response = await fetch(
          `/api/public/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(headerSearchErrorMessage || "");
        }
        const payload = await response.json();
        setSearchItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setSearchItems([]);
          setSearchError(error?.message || headerSearchErrorMessage || "");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 250);
    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [searchOpen, searchQuery, headerSearchErrorMessage]);

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenAccordion(null);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchError("");
  };

  const toggleAccordion = (label) => {
    setOpenAccordion((prev) => (prev === label ? null : label));
  };

  const handleModalSubmit = (event) => {
    const formData = new FormData(event.currentTarget);
    const name = normalizeText(formData.get("name"));
    const email = normalizeText(formData.get("email"));
    const subject = normalizeText(formData.get("subject"));
    const body = normalizeText(formData.get("message"));
    const nextErrors = {};
    if (!name) nextErrors.name = volunteerModalNameRequiredMessage || "";
    if (name && !isValidName(name))
      nextErrors.name = volunteerModalNameRequiredMessage || "";
    if (!email) nextErrors.email = volunteerModalEmailRequiredMessage || "";
    if (email && !isValidEmail(email))
      nextErrors.email = volunteerModalEmailInvalidMessage || "";
    if (!subject) nextErrors.subject = volunteerModalSubjectRequiredMessage || "";
    if (subject && !hasMinText(subject, 3))
      nextErrors.subject = volunteerModalSubjectMinMessage || "";
    if (!body) nextErrors.message = volunteerModalMessageRequiredMessage || "";
    if (body && !hasMinText(body, 5))
      nextErrors.message = volunteerModalMessageMinMessage || "";
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setModalErrors(nextErrors);
      return;
    }
    setModalErrors({});
  };

  const trimmedSearchQuery = searchQuery.trim();
  const hasMinSearchChars = trimmedSearchQuery.length >= 2;
  const resultLabel = (type) => {
    if (type === "blog")
      return headerSearchResultTypeBlogLabel || String(type || "");
    if (type === "event")
      return headerSearchResultTypeEventLabel || String(type || "");
    return headerSearchResultTypePageLabel || String(type || "");
  };
  const hasSearchAction =
    headerSearchEnabled === true && String(headerSearchLabel || "").trim() !== "";
  const noResultsText = headerSearchNoResultsMessage
    ? headerSearchNoResultsMessage.replace("{query}", trimmedSearchQuery)
    : "";
  const toExcerpt = (value) => {
    if (!value || typeof value !== "string") return "";
    const plain = value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!plain) return "";
    return plain.length > 130 ? `${plain.slice(0, 127)}...` : plain;
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
          <Logo
            as={logoHref ? "a" : "span"}
            href={logoHref || undefined}
            onClick={closeMobile}
          >
            {logoType === "image" && logoImage ? (
              <img
                loading="eager"
                fetchPriority="high"
                decoding="async"
                src={logoImage}
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
            {hasSearchAction && (
              <SearchBtn
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={headerSearchOpenAriaLabel || headerSearchLabel}
              >
                <SearchIcon />
                {headerSearchLabel}
              </SearchBtn>
            )}
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
                // href="#volunteer-modal"
              >
                {volunteerLabel}
                <IconWrap>
                  {volunteerIconUrl ? (
                    <img
                      loading="eager"
                      decoding="async"
                      src={volunteerIconUrl}
                      alt={volunteerLabel}
                    />
                  ) : null}
                </IconWrap>
              </BtnVolunteer>
            )}
            {(donateLabel || donateHref) && donateHref && (
              <BtnDonate
                href={donateHref}
                $headerDonateBgValue={headerDonateBgValue}
                $headerDonateTextValue={headerDonateTextValue}
              >
                {donateLabel}
                <IconWrap>
                  {donateIconUrl ? (
                    <img
                      loading="eager"
                      decoding="async"
                      src={donateIconUrl}
                      alt={donateLabel}
                    />
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
          <MobileMenuLogo
            as={logoHref ? "a" : "span"}
            href={logoHref || undefined}
            onClick={closeMobile}
          >
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
          {hasSearchAction && (
            <MobileBtnSearch
              type="button"
              onClick={() => {
                closeMobile();
                setSearchOpen(true);
              }}
              aria-label={headerSearchOpenAriaLabel || headerSearchLabel}
            >
              <SearchIcon />
              {headerSearchLabel}
            </MobileBtnSearch>
          )}
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
          {(donateLabel || donateHref) && donateHref && (
            <MobileBtnDonate
              href={donateHref}
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
      <SearchOverlay
        $open={searchOpen}
        $preview={preview}
        onClick={closeSearch}
        aria-hidden={!searchOpen}
      >
        <SearchPanel
          $open={searchOpen}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={headerSearchDialogLabel || headerSearchLabel}
        >
          <SearchTopRow>
            <SearchTopIcon>
              <SearchIcon />
            </SearchTopIcon>
            <SearchInput
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={headerSearchPlaceholder}
              aria-label={headerSearchInputAriaLabel || headerSearchLabel}
            />
            <SearchCloseBtn
              type="button"
              aria-label={headerSearchCloseAriaLabel || headerSearchLabel}
              onClick={closeSearch}
            >
              <CloseIcon />
            </SearchCloseBtn>
          </SearchTopRow>
          <SearchResults>
            {!hasMinSearchChars ? (
              <SearchState>{headerSearchMinCharsMessage}</SearchState>
            ) : searchLoading ? (
              <SearchState>{headerSearchLoadingMessage}</SearchState>
            ) : searchError ? (
              <SearchState>{searchError}</SearchState>
            ) : searchItems.length === 0 ? (
              <SearchState>{noResultsText}</SearchState>
            ) : (
              searchItems.map((item, index) => (
                <SearchResultLink
                  key={`${item.type || "result"}-${item.slug || item.url || index}`}
                  href={item.url || ""}
                  onClick={closeSearch}
                >
                  <SearchResultType>{resultLabel(item.type)}</SearchResultType>
                  <SearchResultTitle>
                    {item.title || headerSearchFallbackTitle}
                  </SearchResultTitle>
                  {toExcerpt(item.excerpt) ? (
                    <SearchResultMeta>{toExcerpt(item.excerpt)}</SearchResultMeta>
                  ) : (
                    <SearchResultMeta>
                      {item.url || headerSearchFallbackMeta}
                    </SearchResultMeta>
                  )}
                </SearchResultLink>
              ))
            )}
          </SearchResults>
        </SearchPanel>
      </SearchOverlay>
      {/* Volunteer Modal */}
      <ModalOverlay $open={modalOpen} onClick={() => setModalOpen(false)}>
        <ModalCard $open={modalOpen} onClick={(e) => e.stopPropagation()}>
          <ModalCloseBtn onClick={() => setModalOpen(false)}>
            &#x2715;
          </ModalCloseBtn>
          <ModalTitle>{volunteerModalTitle}</ModalTitle>
          <form
            ref={modalFormRef}
            action={modalFormAction}
            onSubmit={handleModalSubmit}
            noValidate
          >
            <input type="hidden" name="page" value="volunteer-modal" />
            <input type="hidden" name="source" value="header-volunteer" />
            <input type="hidden" name="phone" value="" />
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <ModalFormGroup>
                  <label className="mlabel">
                    {volunteerModalNameLabel} <span className="mreq">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    className="mfield"
                    placeholder={volunteerModalNamePlaceholder}
                    onChange={() =>
                      Object.prototype.hasOwnProperty.call(modalErrors, "name") &&
                      setModalErrors((prev) => ({ ...prev, name: "" }))
                    }
                    style={
                      Object.prototype.hasOwnProperty.call(modalErrors, "name")
                        ? { borderColor: "#cf372f" }
                        : undefined
                    }
                  />
                  {Object.prototype.hasOwnProperty.call(modalErrors, "name") &&
                  modalErrors.name ? (
                    <div
                      style={{ marginTop: 6, fontSize: 12, color: "#cf372f" }}
                    >
                      {modalErrors.name}
                    </div>
                  ) : null}
                </ModalFormGroup>
              </Col>
              <Col xs={24} sm={12}>
                <ModalFormGroup>
                  <label className="mlabel">
                    {volunteerModalEmailLabel} <span className="mreq">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mfield"
                    placeholder={volunteerModalEmailPlaceholder}
                    onChange={() =>
                      Object.prototype.hasOwnProperty.call(modalErrors, "email") &&
                      setModalErrors((prev) => ({ ...prev, email: "" }))
                    }
                    style={
                      Object.prototype.hasOwnProperty.call(modalErrors, "email")
                        ? { borderColor: "#cf372f" }
                        : undefined
                    }
                  />
                  {Object.prototype.hasOwnProperty.call(modalErrors, "email") &&
                  modalErrors.email ? (
                    <div
                      style={{ marginTop: 6, fontSize: 12, color: "#cf372f" }}
                    >
                      {modalErrors.email}
                    </div>
                  ) : null}
                </ModalFormGroup>
              </Col>
            </Row>
            <ModalFormGroup>
              <label className="mlabel">
                {volunteerModalSubjectLabel} <span className="mreq">*</span>
              </label>
              <input
                name="subject"
                required
                className="mfield"
                placeholder={volunteerModalSubjectPlaceholder}
                onChange={() =>
                  Object.prototype.hasOwnProperty.call(modalErrors, "subject") &&
                  setModalErrors((prev) => ({ ...prev, subject: "" }))
                }
                style={
                  Object.prototype.hasOwnProperty.call(modalErrors, "subject")
                    ? { borderColor: "#cf372f" }
                    : undefined
                }
              />
              {Object.prototype.hasOwnProperty.call(modalErrors, "subject") &&
              modalErrors.subject ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "#cf372f" }}>
                  {modalErrors.subject}
                </div>
              ) : null}
            </ModalFormGroup>
            <ModalFormGroup>
              <label className="mlabel">
                {volunteerModalMessageLabel} <span className="mreq">*</span>
              </label>
              <textarea
                name="message"
                required
                className="mfield"
                placeholder={volunteerModalMessagePlaceholder}
                rows={4}
                onChange={() =>
                  Object.prototype.hasOwnProperty.call(modalErrors, "message") &&
                  setModalErrors((prev) => ({ ...prev, message: "" }))
                }
                style={
                  Object.prototype.hasOwnProperty.call(modalErrors, "message")
                    ? { borderColor: "#cf372f" }
                    : undefined
                }
              />
              {Object.prototype.hasOwnProperty.call(modalErrors, "message") &&
              modalErrors.message ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "#cf372f" }}>
                  {modalErrors.message}
                </div>
              ) : null}
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
                {volunteerModalCancelLabel}
              </ModalCancelBtn>
              <ModalSubmitButton
                bgColor={resolvedModalBtnBg}
                textColor={resolvedModalBtnText}
                sendLabel={volunteerModalSendLabel}
                sendingLabel={volunteerModalSendingLabel}
              />
            </ModalBtnRow>
          </form>
        </ModalCard>
      </ModalOverlay>
    </>
  );
}
