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

function NavDropdownItemRecursive({ item, j, navColor, navSize, navWeight }) {
  const hasDropdown = item.hasDropdown || item.dropdown;
  const children = item.children || [];
  if (hasDropdown && children.length > 0) {
    return (
      <NavDropdown.Item key={j} as="div" className="dropdown-submenu" style={{ padding: 0 }}>
        <NavDropdown drop="end" title={item.label || "Link"} id={`header-nav-dropdown-sub-${j}`} style={{ color: navColor, fontSize: navSize, fontWeight: navWeight }} menuVariant="light">
          {children.map((c, k) => (
            <NavDropdownItemRecursive key={k} item={c} j={k} navColor={navColor} navSize={navSize} navWeight={navWeight} />
          ))}
        </NavDropdown>
      </NavDropdown.Item>
    );
  }
  if (isExternal(item.url)) {
    return (
      <NavDropdown.Item key={j} as="a" href={item.url || "#"} target="_blank" rel="noopener noreferrer">
        {item.label || "Link"}
      </NavDropdown.Item>
    );
  }
  return (
    <NavDropdown.Item key={j} as={Link} href={item.url || "#"}>
      {item.label || "Link"}
    </NavDropdown.Item>
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

  const effectiveBg = (headerBackground || "").trim().toLowerCase();
  const isDefaultNavBg = !effectiveBg || effectiveBg === "#f8f9fa";
  const effectiveBorder = (headerBorderBottom || "").trim().replace(/\s+/g, " ");
  const isDefaultNavBorder = /^1px\s+solid\s+#dee2e[56]$/i.test(effectiveBorder);
  const headerStyle = {
    background: isDefaultNavBg ? "transparent" : headerBackground,
    padding: `${Number(paddingY) || 16}px ${Number(paddingX) || 0}`,
    lineHeight: "inherit",
    ...(headerBorderBottom && !isDefaultNavBorder && { borderBottom: headerBorderBottom }),
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
              {children.map((c, j) => (
                <NavDropdownItemRecursive key={j} item={c} j={j} navColor={navColor} navSize={navSize} navWeight={navWeight} />
              ))}
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
            <Offcanvas.Header
              closeButton
              style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", alignItems: "center" }}
              className="d-flex align-items-center justify-content-between w-100"
            >
              <Offcanvas.Title id="cms-header-offcanvas-label" className="mb-0 d-flex align-items-center flex-grow-1">
                {logoSection}
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-flex flex-column pt-3">
              <div
                className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between flex-wrap flex-grow-1 w-100"
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
