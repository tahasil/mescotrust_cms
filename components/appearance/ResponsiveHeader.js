"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
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
  BtnMembership,
  BtnVolunteer,
  BtnDonate,
  IconWrap,
  HamburgerBtn,
  MobileOverlay,
  MobileMenu,
  MobileQuickActions,
  MobileQuickActionBtn,
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
  MobileBtnMembership,
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
  SearchViewAllLink,
} from "./ResponsiveHeaderStyle";
import { isPdfDocumentUrl } from "@/components/site/shared/PdfViewerModal";

const SCROLL_THRESHOLD_PX = 10;

/**
 * A menu item is only navigable when it has a real destination.
 * Dropdown parents saved as `javascript:void(0)` / `#` only exist to open the
 * dropdown; emitting that as an href creates links crawlers cannot follow.
 */
function isNavigableMenuUrl(url) {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return false;
  if (value === "#") return false;
  if (/^javascript:/i.test(value)) return false;
  return true;
}

/** Convert CMS menu items { label, url, openInNewTab?, children? } to header shape { label, href, target?, submenu? } */
function cmsMenuToHeaderItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const rawUrl = typeof item.url === "string" ? item.url : "";
    const children = Array.isArray(item.children) ? item.children : [];
    const submenu = children.length
      ? cmsMenuToHeaderItems(children)
      : undefined;

    let url = rawUrl;
    let configuredTarget =
      item.target === "modal" || item.type === "modal"
        ? "modal"
        : item.target === "_blank" || item.openInNewTab
          ? "_blank"
          : "_self";

    // Dropdown parent without a real destination: fall back to the first
    // navigable descendant so the link is crawlable.
    if (!isNavigableMenuUrl(url) && Array.isArray(submenu)) {
      const firstChild = submenu.find((child) => isNavigableMenuUrl(child.href));
      if (firstChild) {
        url = firstChild.href;
        configuredTarget = firstChild.target === "_blank" ? "_blank" : "_self";
      } else {
        url = "#";
      }
    }
    if (!isNavigableMenuUrl(url)) url = "#";

    return {
      label: String(item.label ?? ""),
      href: url,
      target:
        configuredTarget === "_blank"
          ? "_blank"
          : configuredTarget === "modal"
            ? "modal"
            : undefined,
      opensPdfModal:
        configuredTarget === "modal" && isPdfDocumentUrl(rawUrl),
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

const CompactMenuIcon = () => (
  <svg
    width="26"
    height="18"
    viewBox="0 0 26 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M1 3h24M1 9h24M1 15h24" />
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
  headerMembershipEnabled = true,
  membershipLabel = "Membership",
  membershipHref = "",
  membershipHrefTarget = "_self",
  headerMembershipBgValue = "",
  headerMembershipTextValue = "",
  headerMembershipHoverBgValue = "",
  headerMembershipHoverTextValue = "",
  headerMembershipBorderValue = "",
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
  headerCtaHoverBgValue = "",
  headerCtaHoverTextValue = "",
  headerDonateBgValue = "",
  headerDonateTextValue = "",
  headerDonateHoverBgValue = "",
  headerDonateHoverTextValue = "",
  headerSearchBgValue = "",
  headerSearchTextValue = "",
  headerSearchHoverBgValue = "",
  headerSearchHoverTextValue = "",
  headerNavTextValue = "",
  sectionBg = "",
  sectionPadding = "",
  sectionBorderSize = "",
  sectionBorderStyle = "",
  sectionBorderColor = "",
  sectionShadow = "",
  appearanceResponsive = false,
  onResponsiveLayerChange,
  onOpenPdf,
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
  const membershipHrefValue = String(membershipHref || "").trim();
  const membershipTarget =
    String(membershipHrefTarget || "").trim() === "_blank" ? "_blank" : "_self";
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
  const showAppearanceMobileIconActions =
    appearanceResponsive && (volunteerHrefValue || donateHref);
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
    onResponsiveLayerChange?.(mobileOpen || searchOpen);
  }, [mobileOpen, onResponsiveLayerChange, searchOpen]);

  useEffect(
    () => () => onResponsiveLayerChange?.(false),
    [onResponsiveLayerChange],
  );

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

  const handleMenuLinkClick = (event, item, closeMenu = false) => {
    if (closeMenu) closeMobile();
    if (!item?.opensPdfModal) return;
    event.preventDefault();
    onOpenPdf?.({
      url: item.href,
      title: item.label || "PDF document",
      trigger: event.currentTarget,
    });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchError("");
  };

  const toggleAccordion = (label) => {
    setOpenAccordion((prev) => (prev === label ? null : label));
  };

  const router = useRouter();
  const trimmedSearchQuery = searchQuery.trim();
  const hasMinSearchChars = trimmedSearchQuery.length >= 2;
  const resultLabel = (type) => {
    if (type === "blog") return headerSearchResultTypeBlogLabel || "Blog";
    if (type === "event") return headerSearchResultTypeEventLabel || "Event";
    if (type === "news") return "News";
    if (type === "report") return "Annual Report";
    return headerSearchResultTypePageLabel || "Page";
  };
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (trimmedSearchQuery.length >= 2) {
      closeSearch();
      router.push(`/search?q=${encodeURIComponent(trimmedSearchQuery)}`);
    }
  };
  const hasSearchAction =
    headerSearchEnabled === true && String(headerSearchLabel || "").trim() !== "";
  const hasMembershipAction =
    headerMembershipEnabled !== false &&
    Boolean(membershipHrefValue && membershipLabel);
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
        className={`site-header-shell${scrolled && !preview ? " is-scrolled" : ""}`}
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
        <HeaderContent className="site-header-content page-container-header" $sectionPadding={sectionPadding}>
          <HeaderMainWrapper className="site-header-main">
            <Logo
              className="site-header-logo"
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

            <Nav className="site-header-nav">
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
                                    data-opens-pdf-modal={
                                      child.opensPdfModal ? "true" : undefined
                                    }
                                    aria-haspopup={
                                      child.opensPdfModal ? "dialog" : undefined
                                    }
                                    onClick={(event) =>
                                      handleMenuLinkClick(event, child)
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
                              data-opens-pdf-modal={
                                sub.opensPdfModal ? "true" : undefined
                              }
                              aria-haspopup={
                                sub.opensPdfModal ? "dialog" : undefined
                              }
                              onClick={(event) =>
                                handleMenuLinkClick(event, sub)
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
                      data-opens-pdf-modal={
                        item.opensPdfModal ? "true" : undefined
                      }
                      aria-haspopup={
                        item.opensPdfModal ? "dialog" : undefined
                      }
                      onClick={(event) => handleMenuLinkClick(event, item)}
                    >
                      {item.label}
                    </NavLink>
                  )}
                </NavItem>
              ))}
            </Nav>

            <Actions className="site-header-actions">
              {hasSearchAction && (
                <SearchBtn
                  className="site-header-search"
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={headerSearchOpenAriaLabel || headerSearchLabel}
                  $headerSearchBgValue={headerSearchBgValue}
                  $headerSearchTextValue={headerSearchTextValue}
                  $headerSearchHoverBgValue={headerSearchHoverBgValue}
                  $headerSearchHoverTextValue={headerSearchHoverTextValue}
                >
                  <SearchIcon />
                  {headerSearchLabel}
                </SearchBtn>
              )}
              {hasMembershipAction && (
                <BtnMembership
                  className="site-header-membership"
                  href={membershipHrefValue}
                  target={membershipTarget}
                  rel={membershipTarget === "_blank" ? "noopener noreferrer" : undefined}
                  $headerMembershipBgValue={headerMembershipBgValue}
                  $headerMembershipTextValue={headerMembershipTextValue}
                  $headerMembershipHoverBgValue={headerMembershipHoverBgValue}
                  $headerMembershipHoverTextValue={headerMembershipHoverTextValue}
                  $headerMembershipBorderValue={headerMembershipBorderValue}
                >
                  <span className="btn-label">{membershipLabel}</span>
                </BtnMembership>
              )}
              {hasVolunteerAction && (
                <BtnVolunteer
                  className="site-header-volunteer"
                  href={volunteerHrefValue}
                  target={volunteerTarget}
                  rel={volunteerTarget === "_blank" ? "noopener noreferrer" : undefined}
                  $headerCtaBgValue={headerCtaBgValue}
                  $headerCtaTextValue={headerCtaTextValue}
                  $headerCtaHoverBgValue={headerCtaHoverBgValue}
                  $headerCtaHoverTextValue={headerCtaHoverTextValue}
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
                  className="site-header-donate"
                  href={donateHref}
                  target={donateTarget}
                  rel={donateTarget === "_blank" ? "noopener noreferrer" : undefined}
                  $headerDonateBgValue={headerDonateBgValue}
                  $headerDonateTextValue={headerDonateTextValue}
                  $headerDonateHoverBgValue={headerDonateHoverBgValue}
                  $headerDonateHoverTextValue={headerDonateHoverTextValue}
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

            {showAppearanceMobileIconActions ? (
              <MobileQuickActions className="site-header-mobile-quick-actions">
                {volunteerHrefValue ? (
                  <MobileQuickActionBtn
                    className="site-header-mobile-quick-action site-header-mobile-volunteer"
                    href={volunteerHrefValue}
                    target={volunteerTarget}
                    rel={
                      volunteerTarget === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={volunteerLabel || "Volunteer"}
                    style={{
                      "--mobile-quick-action-icon-url": `url("${volunteerIconMobileSrc}")`,
                    }}
                  >
                    <span
                      className="site-header-mobile-quick-action-icon"
                      aria-hidden="true"
                    />
                  </MobileQuickActionBtn>
                ) : null}
                {donateHref ? (
                  <MobileQuickActionBtn
                    className="site-header-mobile-quick-action site-header-mobile-donate"
                    href={donateHref}
                    target={donateTarget}
                    rel={
                      donateTarget === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={donateLabel || "Donate Now"}
                    style={{
                      "--mobile-quick-action-icon-url": `url("${donateIconSrc}")`,
                    }}
                  >
                    <span
                      className="site-header-mobile-quick-action-icon"
                      aria-hidden="true"
                    />
                  </MobileQuickActionBtn>
                ) : null}
              </MobileQuickActions>
            ) : null}

            <HamburgerBtn
              className="site-header-hamburger"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <CloseIcon /> : appearanceResponsive ? <CompactMenuIcon /> : <MenuIcon />}
            </HamburgerBtn>
          </HeaderMainWrapper>
        </HeaderContent>
      </HeaderWrapper>

      <MobileOverlay
        className="site-mobile-overlay"
        $open={mobileOpen}
        $preview={preview}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <MobileMenu
        className={`site-mobile-menu${mobileOpen ? " is-open" : ""}`}
        $open={mobileOpen}
        $preview={preview}
        $headerBgValue={headerBgValue}
        aria-hidden={!mobileOpen}
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
                            data-opens-pdf-modal={
                              child.opensPdfModal ? "true" : undefined
                            }
                            aria-haspopup={
                              child.opensPdfModal ? "dialog" : undefined
                            }
                            onClick={(event) =>
                              handleMenuLinkClick(event, child, true)
                            }
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
                        data-opens-pdf-modal={
                          sub.opensPdfModal ? "true" : undefined
                        }
                        aria-haspopup={
                          sub.opensPdfModal ? "dialog" : undefined
                        }
                        onClick={(event) =>
                          handleMenuLinkClick(event, sub, true)
                        }
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
                data-opens-pdf-modal={
                  item.opensPdfModal ? "true" : undefined
                }
                aria-haspopup={
                  item.opensPdfModal ? "dialog" : undefined
                }
                onClick={(event) => handleMenuLinkClick(event, item, true)}
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
              $headerSearchBgValue={headerSearchBgValue}
              $headerSearchTextValue={headerSearchTextValue}
              $headerSearchHoverBgValue={headerSearchHoverBgValue}
              $headerSearchHoverTextValue={headerSearchHoverTextValue}
            >
              <SearchIcon />
              {headerSearchLabel}
            </MobileBtnSearch>
          )}
          {hasMembershipAction && (
            <MobileBtnMembership
              className="site-header-mobile-membership"
              href={membershipHrefValue}
              target={membershipTarget}
              rel={membershipTarget === "_blank" ? "noopener noreferrer" : undefined}
              onClick={closeMobile}
              $headerMembershipBgValue={headerMembershipBgValue}
              $headerMembershipTextValue={headerMembershipTextValue}
              $headerMembershipHoverBgValue={headerMembershipHoverBgValue}
              $headerMembershipHoverTextValue={headerMembershipHoverTextValue}
              $headerMembershipBorderValue={headerMembershipBorderValue}
            >
              <span className="btn-label">{membershipLabel}</span>
            </MobileBtnMembership>
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
              $headerCtaHoverBgValue={headerCtaHoverBgValue}
              $headerCtaHoverTextValue={headerCtaHoverTextValue}
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
              $headerDonateHoverBgValue={headerDonateHoverBgValue}
              $headerDonateHoverTextValue={headerDonateHoverTextValue}
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
          <SearchTopRow as="form" onSubmit={handleSearchSubmit}>
            <SearchTopIcon>
              <SearchIcon />
            </SearchTopIcon>
            <SearchInput
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit(event);
                }
              }}
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
            <button type="submit" style={{ display: "none" }} aria-hidden="true" tabIndex={-1}>
              Search
            </button>
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
              <>
                {searchItems.map((item, index) => (
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
                ))}
                <SearchViewAllLink
                  href={`/search?q=${encodeURIComponent(trimmedSearchQuery)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    closeSearch();
                    router.push(`/search?q=${encodeURIComponent(trimmedSearchQuery)}`);
                  }}
                >
                  <span>See all results for “{trimmedSearchQuery}”</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </SearchViewAllLink>
              </>
            )}
          </SearchResults>
        </SearchPanel>
      </SearchOverlay>
    </>
  );
}
