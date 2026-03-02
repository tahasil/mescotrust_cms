"use client";

import Link from "next/link";
import { Row, Col } from "antd";
import {
  FooterContainer,
  FooterInner,
  FooterLogo,
  FooterParagraph,
  CopyrightBar,
} from "./FooterStyle";

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
  footerCopyrightText = "",
  footerBgValue = "",
  footerTextValue = "",
  footerCopyrightBarValue = "",
  preview = false,
}) {
  const title = siteTitle?.trim() || "";
  const copy = footerCopyrightText?.trim() || "";
  const address = footerAddress?.trim() || "";
  const email = footerEmail?.trim() || "";
  const phone = footerPhone?.trim() || "";
  const col1 = Array.isArray(footerCol1Links) ? footerCol1Links : [];
  const col2 = Array.isArray(footerCol2Links) ? footerCol2Links : [];

  const hasLogo = !!footerLogoUrl?.trim();
  const hasAddress = !!address;
  const hasEmail = !!email;
  const hasPhone = !!phone;
  const hasCol1 = col1.length > 0;
  const hasCol2 = col2.length > 0;
  const hasAddressOrEmail = hasAddress || hasEmail;

  return (
    <FooterContainer
      $footerBgValue={footerBgValue}
      $footerTextValue={footerTextValue}
    >
      <FooterInner>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Link href="/">
              <FooterLogo as="span">
                {hasLogo ? (
                  <img
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
          {hasAddressOrEmail && (
            <Col xs={24} sm={12} md={12} lg={6}>
              {hasAddress && (
                <FooterParagraph $footerTextValue={footerTextValue}>
                  {address}
                </FooterParagraph>
              )}
              {hasEmail && (
                <ul className="ps-0" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li>
                    <Link href={`mailto:${email}`}>{email}</Link>
                  </li>
                </ul>
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
                  <li key={`col1-${i}-${(item.url || "")}-${(item.label || "")}`}>
                    <Link href={item.url || "#"}>{item.label || ""}</Link>
                  </li>
                ))}
              </ul>
            </Col>
          )}
          {hasCol2 && (
            <Col xs={12} sm={12} md={12} lg={6}>
              <ul>
                {col2.map((item, i) => (
                  <li key={`col2-${i}-${(item.url || "")}-${(item.label || "")}`}>
                    <Link href={item.url || "#"}>{item.label || ""}</Link>
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
