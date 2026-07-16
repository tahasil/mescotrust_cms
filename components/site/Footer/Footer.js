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
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";

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

function withDynamicCopyrightYear(text) {
  return resolveYearPlaceholder(text).trim();
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
  const title = siteTitle?.trim() || "";
  const copy = withDynamicCopyrightYear(footerCopyrightText);
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
            <FooterLogo as="span" $hasLogo={hasLogo}>
              {hasLogo ? (
                <img
                  loading="lazy"
                  src={footerLogoUrl}
                  alt={title || ""}
                  className="img-fluid"
                />
              ) : title ? (
                <span style={{ fontSize: 20, fontWeight: 600 }}>{title}</span>
              ) : null}
            </FooterLogo>
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
                        aria-label={String(item?.platform || "").trim()}
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
                    {item.url ? (
                      <a href={item.url}>{item.label || ""}</a>
                    ) : (
                      <span>{item.label || ""}</span>
                    )}
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
                    {item.url ? (
                      <a href={item.url}>{item.label || ""}</a>
                    ) : (
                      <span>{item.label || ""}</span>
                    )}
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

