"use client";

import { useState, useEffect, Fragment } from "react";
import {
  HeaderWrapper,
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
  HeaderMainWrapper,
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
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
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
        className={scrolled && !preview ? "is-scrolled" : ""}
      >
        <HeaderMainWrapper>
          <Logo href="/" onClick={closeMobile}>
            {logoType === "image" && logoUrl ? (
              <img src={logoUrl} alt={title} className="img-fluid" />
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
                href={volunteerHref || "#"}
                $headerCtaBgValue={headerCtaBgValue}
                $headerCtaTextValue={headerCtaTextValue}
              >
                {volunteerLabel}
                <IconWrap>
                  {volunteerIconUrl ? (
                    <img src={volunteerIconUrl} alt={volunteerLabel} />
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
                    <img src={donateIconUrl} alt={donateLabel} />
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
              <img src={logoUrlMobile} alt={title} />
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
              href={volunteerHref || "#"}
              onClick={closeMobile}
              $headerCtaBgValue={headerCtaBgValue}
              $headerCtaTextValue={headerCtaTextValue}
            >
              <IconWrap>
                {volunteerIconMobile ? (
                  <img src={volunteerIconMobile} alt={volunteerLabel} />
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
                  <img src={donateIconMobile} alt={donateLabel} />
                ) : null}
              </IconWrap>
              {donateLabel}
            </MobileBtnDonate>
          )}
        </MobileActions>
      </MobileMenu>
    </>
  );
}
