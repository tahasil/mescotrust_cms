"use client";

import Link from "next/link";
import { Row, Col } from "antd";
import {
  FacebookFilled,
  InstagramFilled,
  LinkedinFilled,
  YoutubeFilled,
  XOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  FooterContainer,
  FooterInner,
  FooterLogo,
  FooterParagraph,
  CopyrightBar,
} from "./FooterStyle";

const SOCIAL_ICONS = {
  facebook: FacebookFilled,
  instagram: InstagramFilled,
  x: XOutlined,
  twitter: XOutlined,
  linkedin: LinkedinFilled,
  youtube: YoutubeFilled,
  website: GlobalOutlined,
};

function getSocialIcon(platform) {
  const key = String(platform || "")
    .toLowerCase()
    .trim();
  return SOCIAL_ICONS[key] || GlobalOutlined;
}

function withDynamicCopyrightYear(text, year) {
  const raw = String(text || "").trim();
  if (!raw) return `Copyright © ${year} All Rights Reserved.`;

  // Prefer replacing the year directly after Copyright/© to preserve existing format.
  const copyScoped = raw.replace(
    /((?:copyright\s*©?|©)\s*)(\d{4})(?!\d)/i,
    (_, prefix) => `${prefix}${year}`,
  );
  if (copyScoped !== raw) return copyScoped;

  // Fallback: replace first standalone 4-digit year if present.
  if (/\b\d{4}\b/.test(raw)) {
    return raw.replace(/\b\d{4}\b/, String(year));
  }

  return raw;
}

/**
 * Footer: 100% database-driven. Layout matches reference (Ant Design Row/Col).
 * Logo full width; address+email | phone | col1 links | col2 links in responsive columns.
 */
export default function Footer({
  siteTitle = "",
  footerLogoUrl = "",
  footerAddress = "",
  footerEmail = "",
  footerPhone = "",
  footerCol1Links = [],
  footerCol2Links = [],
  footerSocialLinks = [],
  footerCopyrightText = "",
  footerBgValue = "",
  footerBackgroundImageUrl = "",
  footerTextValue = "",
  footerCopyrightBarValue = "",
  preview = false,
}) {
  const currentYear = new Date().getFullYear();
  const title = siteTitle?.trim() || "";
  const copy = withDynamicCopyrightYear(footerCopyrightText, currentYear);
  const address = footerAddress?.trim() || "";
  const email = footerEmail?.trim() || "";
  const phone = footerPhone?.trim() || "";
  const col1 = Array.isArray(footerCol1Links) ? footerCol1Links : [];
  const col2 = Array.isArray(footerCol2Links) ? footerCol2Links : [];
  const socials = Array.isArray(footerSocialLinks)
    ? footerSocialLinks.filter((it) => it && String(it.url || "").trim())
    : [];

  const hasLogo = !!footerLogoUrl?.trim();
  const hasAddress = !!address;
  const hasEmail = !!email;
  const hasPhone = !!phone;
  const hasCol1 = col1.length > 0;
  const hasCol2 = col2.length > 0;
  const hasAddressOrEmail = hasAddress || hasEmail;
  const hasContactOrSocial = hasAddressOrEmail || socials.length > 0;

  return (
    <FooterContainer
      $footerBgValue={footerBgValue}
      $footerBackgroundImageUrl={footerBackgroundImageUrl?.trim() || ""}
      $footerTextValue={footerTextValue}
    >
      <FooterInner>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Link href="/">
              <FooterLogo as="span">
                {hasLogo ? (
                  <img
                    loading="lazy"
                    src={footerLogoUrl}
                    alt={title || "Logo"}
                    className="img-fluid"
                  />
                ) : title ? (
                  <span style={{ fontSize: 20, fontWeight: 600 }}>{title}</span>
                ) : null}
              </FooterLogo>
            </Link>
          </Col>
          {hasContactOrSocial && (
            <Col xs={24} sm={12} md={12} lg={6}>
              {hasAddress && (
                <FooterParagraph $footerTextValue={footerTextValue}>
                  {address}
                </FooterParagraph>
              )}
              {hasEmail && (
                <ul
                  className="ps-0"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  <li>
                    <Link href={`mailto:${email}`}>{email}</Link>
                  </li>
                </ul>
              )}
              {socials.length > 0 && (
                <div className="footer-socials">
                  {socials.map((item, i) => {
                    const url = String(item?.url || "").trim();
                    if (!url) return null;
                    const Icon = getSocialIcon(item?.platform);
                    return (
                      <Link
                        key={`social-${i}-${String(item?.platform || "")}-${url}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={String(item?.platform || "social")}
                        className="footer-social-link"
                      >
                        <Icon />
                      </Link>
                    );
                  })}
                </div>
              )}
            </Col>
          )}
          {hasPhone && (
            <Col xs={24} sm={12} md={12} lg={6}>
              <ul>
                <li>
                  <span>{phone}</span>
                </li>
              </ul>
            </Col>
          )}
          {hasCol1 && (
            <Col xs={12} sm={12} md={12} lg={6}>
              <ul>
                {col1.map((item, i) => (
                  <li key={`col1-${i}-${item.url || ""}-${item.label || ""}`}>
                    <a href={item.url || "#"}>{item.label || ""}</a>
                  </li>
                ))}
              </ul>
            </Col>
          )}
          {hasCol2 && (
            <Col xs={12} sm={12} md={12} lg={6}>
              <ul>
                {col2.map((item, i) => (
                  <li key={`col2-${i}-${item.url || ""}-${item.label || ""}`}>
                    <a href={item.url || "#"}>{item.label || ""}</a>
                  </li>
                ))}
              </ul>
            </Col>
          )}
        </Row>
      </FooterInner>
      {copy && (
        <CopyrightBar $footerCopyrightBarValue={footerCopyrightBarValue}>
          {copy}
        </CopyrightBar>
      )}
    </FooterContainer>
  );
}
