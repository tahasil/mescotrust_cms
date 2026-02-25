"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Navbar, Container, Nav, NavDropdown, Button, Offcanvas } from "react-bootstrap";

function isExternal(url) {
  return /^https?:\/\//.test(url || "") || (url || "").startsWith("//");
}

function NavLinkItem({ item, navColor, navFontSize, navFontWeight, navHoverColor }) {
  const url = item.url || "#";
  const label = item.label || "Link";
  const style = {
    color: navColor,
    fontSize: navFontSize || undefined,
    fontWeight: navFontWeight || undefined,
  };
  const hover = (e, color) => {
    if (color) e.currentTarget.style.color = color;
  };
  if (isExternal(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={style} onMouseEnter={(e) => hover(e, navHoverColor)} onMouseLeave={(e) => (e.currentTarget.style.color = navColor)}>
        {label}
      </a>
    );
  }
  return (
    <Link href={url} style={style} onMouseEnter={(e) => hover(e, navHoverColor)} onMouseLeave={(e) => (e.currentTarget.style.color = navColor)}>
      {label}
    </Link>
  );
}

export default function HeaderBlock({
  logoImage = "",
  logoTitle = "MESCO",
  logoTagline = "A TRUST SINCE 1960",
  logoUrl = "",
  navItems = [],
  actionButtons = [],
  headerBackground = "",
  headerBorderBottom = "",
  headerShadow = "",
  navColor = "#333",
  navFontSize = "",
  navFontWeight = "",
  navHoverColor = "",
  logoColor = "",
  logoFontSize = "",
  taglineFontSize = "",
  logoImageWidth = 120,
  logoImageHeight = 48,
  logoImageWidthDesktop,
  logoImageHeightDesktop,
  logoImageWidthTablet,
  logoImageHeightTablet,
  logoImageWidthMobile,
  logoImageHeightMobile,
  primaryButtonBg = "#a52a2a",
  primaryButtonText = "#fff",
  secondaryButtonBg = "#f4c4c4",
  secondaryButtonText = "#8b0000",
  paddingY = 16,
  paddingX = 0,
  sectionsOrder = "logo,nav,buttons",
  navbarExpand = "lg",
  navbarFixed = "",
  navbarSticky = "",
  collapseOnSelect = false,
  navbarVariant = "light",
  navbarMobileMenu = "collapse",
  navbarOffcanvasPlacement = "end",
  menuPosition = "left",
}) {
  const navItemsList = Array.isArray(navItems) ? navItems : [];
  const actionButtonsList = Array.isArray(actionButtons) ? actionButtons : [];
  const logoTextColor = logoColor || navColor;
  const logoSize = logoFontSize ? `${logoFontSize}px` : "1.25rem";
  const taglineSize = taglineFontSize ? `${taglineFontSize}px` : "0.7rem";
  const navSize = navFontSize ? `${navFontSize}px` : "0.95rem";
  const navWeight = navFontWeight || "500";

  const headerStyle = {
    background: headerBackground || "#fff",
    padding: `${Number(paddingY) || 16}px ${Number(paddingX) || 0}`,
    lineHeight: "inherit",
    ...(headerBorderBottom && { borderBottom: headerBorderBottom }),
    ...(headerShadow && { boxShadow: headerShadow }),
  };

  const logoImgW = Number(logoImageWidth) || 120;
  const logoImgH = Number(logoImageHeight) || 48;
  const dW = Number(logoImageWidthDesktop) || logoImgW;
  const dH = Number(logoImageHeightDesktop) || logoImgH;
  const tW = Number(logoImageWidthTablet) || logoImgW;
  const tH = Number(logoImageHeightTablet) || logoImgH;
  const mW = Number(logoImageWidthMobile) || logoImgW;
  const mH = Number(logoImageHeightMobile) || logoImgH;
  const responsiveLogoCss = logoImage
    ? `.cms-header .cms-header-logo-img-wrap img { width: ${mW}px !important; height: ${mH}px !important; object-fit: contain; }
@media (min-width: 576px) { .cms-header .cms-header-logo-img-wrap img { width: ${tW}px !important; height: ${tH}px !important; } }
@media (min-width: 992px) { .cms-header .cms-header-logo-img-wrap img { width: ${dW}px !important; height: ${dH}px !important; } }`
    : "";

  const logoContent = logoImage ? (
    <div className="cms-header-logo-img-wrap">
      {responsiveLogoCss && <style dangerouslySetInnerHTML={{ __html: responsiveLogoCss }} />}
      <NextImage src={logoImage} alt={logoTitle} width={dW} height={dH} style={{ objectFit: "contain" }} />
    </div>
  ) : (
    <div style={{ textAlign: "left" }}>
      <div style={{ borderTop: "1px solid currentColor", width: "100%", marginBottom: 2 }} />
      <div style={{ fontWeight: 700, fontSize: logoSize, letterSpacing: "0.05em", color: logoTextColor }}>
        {logoTitle || "Logo"}
      </div>
      <div style={{ borderBottom: "1px solid currentColor", width: "100%", marginTop: 2 }} />
      {logoTagline && (
        <div style={{ fontSize: taglineSize, fontWeight: 500, color: logoTextColor, opacity: 0.9, marginTop: 2, letterSpacing: "0.02em" }}>
          {logoTagline}
        </div>
      )}
    </div>
  );

  const logoSection = (
    <div className="d-flex align-items-center flex-shrink-0">
      {logoUrl ? (
        <Link href={logoUrl} className="text-decoration-none d-flex align-items-center" style={{ color: "inherit" }}>
          {logoContent}
        </Link>
      ) : (
        logoContent
      )}
    </div>
  );

  const menuJustify = menuPosition === "center" ? "justify-content-lg-center" : menuPosition === "right" ? "justify-content-lg-end" : "justify-content-lg-start";
  const navSection = (
    <Nav as="div" className={`me-auto flex-grow-1 justify-content-center ${menuJustify} align-items-center flex-wrap gap-2 gap-lg-3`} style={{ minWidth: 0 }}>
      {navItemsList.map((item, i) => {
        const hasDropdown = item.hasDropdown || item.dropdown;
        const children = item.children || [];
        if (hasDropdown && children.length > 0) {
          return (
            <NavDropdown
              key={i}
              title={item.label || "Link"}
              id={`header-nav-dropdown-${i}`}
              style={{ color: navColor, fontSize: navSize, fontWeight: navWeight }}
              menuVariant="light"
            >
              {children.map((c, j) =>
                isExternal(c.url) ? (
                  <NavDropdown.Item key={j} as="a" href={c.url} target="_blank" rel="noopener noreferrer">
                    {c.label || "Link"}
                  </NavDropdown.Item>
                ) : (
                  <NavDropdown.Item key={j} as={Link} href={c.url || "#"}>
                    {c.label || "Link"}
                  </NavDropdown.Item>
                )
              )}
            </NavDropdown>
          );
        }
        return (
          <Nav.Link key={i} as="div" style={{ padding: 0 }}>
            <NavLinkItem item={item} navColor={navColor} navFontSize={navSize} navFontWeight={navWeight} navHoverColor={navHoverColor} />
          </Nav.Link>
        );
      })}
    </Nav>
  );

  const renderActionButton = (btn, isPrimary, key) => {
    const defaultBg = isPrimary ? primaryButtonBg : secondaryButtonBg;
    const defaultColor = isPrimary ? primaryButtonText : secondaryButtonText;
    const bg = btn.background || defaultBg;
    const color = btn.color || defaultColor;
    const borderRadius = btn.borderRadius != null && btn.borderRadius !== "" ? Number(btn.borderRadius) : 9999;
    const label = btn.label || "Button";
    const url = btn.url || "#";
    const style = {
      background: bg,
      color,
      borderColor: btn.borderColor || (isPrimary ? bg : "rgba(139, 0, 0, 0.25)"),
      borderRadius: `${borderRadius}px`,
      ...(btn.boxShadow && { boxShadow: btn.boxShadow }),
    };
    const btnEl = (
      <Button variant={isPrimary ? "primary" : "outline-secondary"} style={style}>
        {label}
      </Button>
    );
    if (isExternal(url)) {
      return (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
          {btnEl}
        </a>
      );
    }
    return (
      <Link key={key} href={url} className="text-decoration-none">
        {btnEl}
      </Link>
    );
  };

  const actionsSection = (
    <div className="d-flex align-items-center flex-shrink-0 gap-2 flex-wrap">
      {actionButtonsList.map((btn, i) => {
        const isPrimary = (btn.variant || "primary") === "primary";
        return renderActionButton(btn, isPrimary, `header-btn-${i}`);
      })}
    </div>
  );

  const orderKeys = (sectionsOrder || "logo,nav,buttons").split(",").map((s) => s.trim());
  const sectionMap = { logo: logoSection, nav: navSection, buttons: actionsSection };
  const orderWithoutLogo = orderKeys.filter((k) => k !== "logo");
  const collapseSections = orderWithoutLogo.map((k) => sectionMap[k]).filter(Boolean);
  if (collapseSections.length < 2) {
    collapseSections.push(navSection, actionsSection);
  }

  const expandValue = navbarExpand === "false" || navbarExpand === false ? false : (navbarExpand || "lg");
  const navbarProps = {
    expand: expandValue,
    style: headerStyle,
    className: "cms-header",
    "data-bs-theme": navbarVariant || "light",
    ...(collapseOnSelect && { collapseOnSelect: true }),
    ...(navbarFixed === "top" && { fixed: "top" }),
    ...(navbarFixed === "bottom" && { fixed: "bottom" }),
    ...(navbarSticky === "top" && { sticky: "top" }),
    ...(navbarSticky === "bottom" && { sticky: "bottom" }),
  };

  return (
    <Navbar {...navbarProps}>
      <Container fluid style={{ paddingLeft: Number(paddingX) || 0, paddingRight: Number(paddingX) || 0 }}>
        {/* Logo always visible (responsive: stays left, doesn't hide in collapse) */}
        <div className="cms-header-brand d-flex align-items-center me-auto me-lg-0">{logoSection}</div>
        <Navbar.Toggle aria-controls="cms-header-nav" className="border-0 py-1 px-2" />
        {navbarMobileMenu === "offcanvas" ? (
          <Navbar.Offcanvas
            id="cms-header-nav"
            aria-labelledby="cms-header-offcanvas-label"
            placement={navbarOffcanvasPlacement === "start" ? "start" : "end"}
            className="flex-lg-grow-1"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id="cms-header-offcanvas-label">Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div
                className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between flex-wrap flex-grow-1 w-100"
                style={{ gap: 16, minWidth: 0 }}
              >
                {collapseSections[0]}
                {collapseSections[1]}
              </div>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        ) : (
          <Navbar.Collapse id="cms-header-nav" className="flex-lg-grow-1">
            <div
              className="d-flex align-items-center justify-content-between flex-wrap w-100 flex-grow-1"
              style={{ gap: 16, minWidth: 0 }}
            >
              {collapseSections[0]}
              {collapseSections[1]}
            </div>
          </Navbar.Collapse>
        )}
      </Container>
    </Navbar>
  );
}
