"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import {
  HeaderWrapper,
  HeaderContent,
  HeaderMainWrapper,
  AnnouncementBar,
  AnnouncementTrack,
  AnnouncementSequence,
  AnnouncementItemText,
  AnnouncementItemLink,
  AnnouncementDivider,
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
  headerAnnouncementEnabled = false,
  headerAnnouncementItems = [],
  headerAnnouncementText = "",
  headerAnnouncementLinkUrl = "",
  headerAnnouncementLinkTarget = "_self",
  headerAnnouncementFontSize = 14,
  headerAnnouncementFontWeight = "600",
  headerAnnouncementTextColor = "#ffffff",
  headerAnnouncementBackgroundColor = "#d92d20",
  headerAnnouncementMarqueeSpeed = 20,
  headerAnnouncementDirection = "rtl",
  headerAnnouncementPaddingX = 24,
  logoType = "text",
  logoUrl = "",
  logoTarget = "_self",
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
  volunteerHrefTarget = "_self",
  donateHref = "",
  donateHrefTarget = "_self",
  volunteerIconUrl = "",
  volunteerIconUrlMobile,
  donateIconUrl = "",
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
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);
  const announcementBarRef = useRef(null);
  const announcementSequenceRef = useRef(null);
  const [announcementLayout, setAnnouncementLayout] = useState({
    containerWidth: 0,
    sequenceWidth: 0,
  });

  useEffect(() => {
    if (searchOpen) {
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }
  }, [searchOpen]);
  const [scrolled, setScrolled] = useState(false);

  const items = cmsMenuToHeaderItems(menuItems);
  const logoImage = logoLightUrl || logoImageUrl;
  const logoUrlMobile = logoMobileUrl || logoImage;
  const logoHref = String(logoUrl || "").trim();
  const logoHrefTarget = logoTarget === "_blank" ? "_blank" : "_self";
  const volunteerHrefValue = String(volunteerHref || "").trim();
  const volunteerTarget =
    String(volunteerHrefTarget || "").trim() === "_blank" ? "_blank" : "_self";
  const donateTarget =
    String(donateHrefTarget || "").trim() === "_blank" ? "_blank" : "_self";
  const title = siteTitle ?? "";
  const volunteerIconMobile = volunteerIconUrlMobile ?? volunteerIconUrl;
  const volunteerIconDesktopSrc =
    String(volunteerIconUrl || "").trim() || "/images/volunteer-icon.svg";
  const volunteerIconMobileSrc =
    String(volunteerIconMobile || "").trim() || volunteerIconDesktopSrc;
  const donateIconSrc =
    String(donateIconUrl || "").trim() || "/images/donate-now-icon.svg";
  const announcementEnabled = headerAnnouncementEnabled === true;
  const normalizeAnnouncementItem = (item) => ({
    text: item?.text != null ? String(item.text).trim() : "",
    url: item?.url != null ? String(item.url).trim() : "",
    target: String(item?.target || "").trim() === "_blank" ? "_blank" : "_self",
  });
  const announcementItems = Array.isArray(headerAnnouncementItems)
    ? headerAnnouncementItems.map(normalizeAnnouncementItem).filter((it) => it.text)
    : [];
  if (announcementItems.length === 0) {
    const fallbackText = String(headerAnnouncementText || "").trim();
    if (fallbackText) {
      announcementItems.push(
        normalizeAnnouncementItem({
          text: fallbackText,
          url: headerAnnouncementLinkUrl,
          target: headerAnnouncementLinkTarget,
        }),
      );
    }
  }
  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const announcementSpeedSeconds = clamp(
    toNumber(headerAnnouncementMarqueeSpeed, 20),
    4,
    120,
  );
  const announcementDirectionValue =
    String(headerAnnouncementDirection || "").trim().toLowerCase() === "ltr"
      ? "ltr"
      : "rtl";
  const announcementFontSizePx = clamp(
    toNumber(headerAnnouncementFontSize, 14),
    10,
    40,
  );
  const announcementPaddingXpx = clamp(
    toNumber(headerAnnouncementPaddingX, 24),
    0,
    120,
  );
  const announcementFontWeightValue =
    String(headerAnnouncementFontWeight || "").trim() || "600";
  const hasAnnouncementBar =
    announcementEnabled && Array.isArray(announcementItems) && announcementItems.length > 0;
  const announcementSignature = announcementItems
    .map((item) => `${item.text}|${item.url}|${item.target}`)
    .join("||");
  const announcementShiftPx = announcementLayout.sequenceWidth;
  const announcementCopies =
    announcementLayout.sequenceWidth > 0 && announcementLayout.containerWidth > 0
      ? Math.max(
          2,
          Math.ceil(
            announcementLayout.containerWidth / announcementLayout.sequenceWidth,
          ) + 1,
        )
      : 2;

  const renderAnnouncementSequence = (
    sequenceKey,
    hidden = false,
    sequenceRef = undefined,
  ) => (
    <AnnouncementSequence key={sequenceKey} aria-hidden={hidden} ref={sequenceRef}>
      {announcementItems.map((item, index) => (
        <Fragment key={`${sequenceKey}-${index}`}>
          {item.url ? (
            <AnnouncementItemLink
              href={item.url}
              target={item.target}
              rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
              aria-label={item.text}
            >
              <AnnouncementItemText
                $fontSize={announcementFontSizePx}
                $fontWeight={announcementFontWeightValue}
                $paddingX={announcementPaddingXpx}
              >
                {item.text}
              </AnnouncementItemText>
            </AnnouncementItemLink>
          ) : (
            <AnnouncementItemText
              $fontSize={announcementFontSizePx}
              $fontWeight={announcementFontWeightValue}
              $paddingX={announcementPaddingXpx}
            >
              {item.text}
            </AnnouncementItemText>
          )}
          <AnnouncementDivider
            aria-hidden="true"
            $fontSize={announcementFontSizePx}
            $fontWeight={announcementFontWeightValue}
          >
            |
          </AnnouncementDivider>
        </Fragment>
      ))}
    </AnnouncementSequence>
  );

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
    if (!hasAnnouncementBar) return;
    const measure = () => {
      const containerWidth = announcementBarRef.current?.offsetWidth || 0;
      const sequenceWidth = announcementSequenceRef.current?.offsetWidth || 0;
      setAnnouncementLayout((prev) => {
        if (
          prev.containerWidth === containerWidth &&
          prev.sequenceWidth === sequenceWidth
        ) {
          return prev;
        }
        return { containerWidth, sequenceWidth };
      });
    };

    measure();

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measure());
      if (announcementBarRef.current) observer.observe(announcementBarRef.current);
      if (announcementSequenceRef.current) {
        observer.observe(announcementSequenceRef.current);
      }
    }
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    hasAnnouncementBar,
    announcementSignature,
    announcementFontSizePx,
    announcementFontWeightValue,
    announcementPaddingXpx,
  ]);

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
  const hasVolunteerAction =
    (volunteerLabel || volunteerHrefValue) && volunteerHrefValue;
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
        $sectionBorderSize={sectionBorderSize}
        $sectionBorderStyle={sectionBorderStyle}
        $sectionBorderColor={sectionBorderColor}
        $sectionShadow={sectionShadow}
        className={scrolled && !preview ? "is-scrolled" : ""}
      >
        {hasAnnouncementBar && (
          <AnnouncementBar
            ref={announcementBarRef}
            $textColor={headerAnnouncementTextColor}
            $background={headerAnnouncementBackgroundColor}
          >
            <AnnouncementTrack
              $speedSeconds={announcementSpeedSeconds}
              $direction={announcementDirectionValue}
              style={
                announcementShiftPx > 0
                  ? {
                      "--announcement-shift": `${announcementShiftPx}px`,
                    }
                  : undefined
              }
            >
              {Array.from({ length: announcementCopies }).map((_, index) =>
                renderAnnouncementSequence(
                  `sequence-${index}`,
                  index > 0,
                  index === 0 ? announcementSequenceRef : undefined,
                ),
              )}
            </AnnouncementTrack>
          </AnnouncementBar>
        )}
        <HeaderContent $sectionPadding={sectionPadding}>
          <HeaderMainWrapper>
            <Logo
              as={logoHref ? "a" : "span"}
              href={logoHref || undefined}
              target={logoHref ? logoHrefTarget : undefined}
              rel={logoHref && logoHrefTarget === "_blank" ? "noopener noreferrer" : undefined}
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
              {hasVolunteerAction && (
                <BtnVolunteer
                  href={volunteerHrefValue}
                  target={volunteerTarget}
                  rel={volunteerTarget === "_blank" ? "noopener noreferrer" : undefined}
                  $headerCtaBgValue={headerCtaBgValue}
                  $headerCtaTextValue={headerCtaTextValue}
                >
                  <span className="btn-label">{volunteerLabel}</span>
                  <IconWrap>
                    <img
                      loading="eager"
                      decoding="async"
                      src={volunteerIconDesktopSrc}
                      alt={volunteerLabel}
                    />
                  </IconWrap>
                </BtnVolunteer>
              )}
              {(donateLabel || donateHref) && donateHref && (
                <BtnDonate
                  href={donateHref}
                  target={donateTarget}
                  rel={donateTarget === "_blank" ? "noopener noreferrer" : undefined}
                  $headerDonateBgValue={headerDonateBgValue}
                  $headerDonateTextValue={headerDonateTextValue}
                >
                  <span className="btn-label">{donateLabel}</span>
                  <IconWrap>
                    <img
                      loading="eager"
                      decoding="async"
                      src={donateIconSrc}
                      alt={donateLabel}
                    />
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
        </HeaderContent>
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
            target={logoHref ? logoHrefTarget : undefined}
            rel={logoHref && logoHrefTarget === "_blank" ? "noopener noreferrer" : undefined}
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
          {hasVolunteerAction && (
            <MobileBtnVolunteer
              href={volunteerHrefValue}
              target={volunteerTarget}
              rel={volunteerTarget === "_blank" ? "noopener noreferrer" : undefined}
              onClick={() => {
                closeMobile();
              }}
              $headerCtaBgValue={headerCtaBgValue}
              $headerCtaTextValue={headerCtaTextValue}
            >
              <span className="btn-label">{volunteerLabel}</span>
            </MobileBtnVolunteer>
          )}
          {(donateLabel || donateHref) && donateHref && (
            <MobileBtnDonate
              href={donateHref}
              target={donateTarget}
              rel={donateTarget === "_blank" ? "noopener noreferrer" : undefined}
              onClick={closeMobile}
              $headerDonateBgValue={headerDonateBgValue}
              $headerDonateTextValue={headerDonateTextValue}
            >
              <span className="btn-label">{donateLabel}</span>
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
    </>
  );
}
