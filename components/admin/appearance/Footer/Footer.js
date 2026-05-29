"use client";

import { useState } from "react";
import Link from "next/link";
import { Row, Col, notification } from "antd";
import {
  FacebookFilled,
  InstagramFilled,
  LinkedinFilled,
  YoutubeFilled,
  XOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import {
  FooterContainer,
  FooterInner,
  FooterLogo,
  FooterParagraph,
  CopyrightBar,
} from "./FooterStyle";
import {
  ensureMailto,
  normalizeTargetFromItem,
} from "@/lib/linkUtils";

const SOCIAL_ICONS = {
  facebook: FacebookFilled,
  instagram: InstagramFilled,
  x: XOutlined,
  twitter: XOutlined,
  linkedin: LinkedinFilled,
  youtube: YoutubeFilled,
  website: GlobalOutlined,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSocialIcon(platform) {
  const key = String(platform || "")
    .toLowerCase()
    .trim();
  return SOCIAL_ICONS[key] || GlobalOutlined;
}

function isExternalUrl(url) {
  return /^(https?:)?\/\//i.test(String(url || "").trim());
}

function resolveCopyrightText(rawText, siteTitle = "") {
  const currentYear = String(new Date().getFullYear());
  const raw = String(rawText || "").trim();
  const fallbackTitle = String(siteTitle || "").trim();

  if (!raw) {
    return fallbackTitle
      ? `Copyright © ${currentYear} ${fallbackTitle}. All Rights Reserved.`
      : `Copyright © ${currentYear} All Rights Reserved.`;
  }

  const withYearToken = raw.replace(
    /\{\{\s*year\s*\}\}|\[\[\s*year\s*\]\]|\{year\}/gi,
    currentYear,
  );
  if (withYearToken !== raw) return withYearToken;

  return raw.replace(
    /(\b(?:copyright\s*(?:©|\(c\))?|©)\s*)\d{4}\b/i,
    (_, prefix) => `${prefix}${currentYear}`,
  );
}

function resolveFooterLinkTarget(item) {
  return normalizeTargetFromItem(item, {
    targetKeys: ["target"],
    boolKeys: ["openInNewTab"],
    fallback: "_self",
  });
}

function FooterLink({ href = "#", target = "_self", children }) {
  const url = ensureMailto(href || "#") || "#";
  const normalizedTarget =
    String(target || "").trim().toLowerCase() === "_blank" ? "_blank" : "_self";
  const shouldOpenInNewTab = normalizedTarget === "_blank";
  if (/^(mailto:|tel:|#)/i.test(url)) {
    return (
      <a
        href={url}
        target={shouldOpenInNewTab ? "_blank" : "_self"}
        rel={shouldOpenInNewTab ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }
  if (shouldOpenInNewTab) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  if (isExternalUrl(url)) {
    return <a href={url}>{children}</a>;
  }
  return <Link href={url}>{children}</Link>;
}

/**
 * Footer: appearance-managed, used in both frontend and admin preview.
 * Admin preview renders this same component to keep 1:1 visual parity.
 */
export default function Footer({
  siteTitle = "",
  footerLogoUrl = "",
  footerAddress = "",
  footerEmail = "",
  footerPhone = "",
  footerCol1Links = [],
  footerCol2Links = [],
  footerCol1Title = "",
  footerCol2Title = "",
  footerSocialLinks = [],
  footerLatestTitle = "",
  footerLatestPlaceholder = "",
  footerCopyrightText = "",
  footerBgValue = "",
  footerBackgroundImageUrl = "",
  footerSectionBgType = "default",
  footerSectionBgImage = "",
  footerSectionBgColorValue = "",
  footerTextValue = "",
  footerSocialValue = "",
  footerCopyrightBarValue = "",
  preview = false,
}) {
  const title = siteTitle?.trim() || "";
  const copy = resolveCopyrightText(footerCopyrightText, title);
  const address = footerAddress?.trim() || "";
  const email = footerEmail?.trim() || "";
  const emailHref = ensureMailto(email);
  const phone = footerPhone?.trim() || "";
  const col1 = Array.isArray(footerCol1Links) ? footerCol1Links : [];
  const col2 = Array.isArray(footerCol2Links) ? footerCol2Links : [];
  const col1Heading = String(footerCol1Title || "").trim() || "Our Pages";
  const col2Heading = String(footerCol2Title || "").trim() || "Quick Links";
  const latestHeading =
    String(footerLatestTitle || "").trim() || "Get the latest from TSV";
  const latestPlaceholder =
    String(footerLatestPlaceholder || "").trim() || "Enter email address";
  const socials = Array.isArray(footerSocialLinks)
    ? footerSocialLinks.filter((it) => it && String(it.url || "").trim())
    : [];

  const [latestEmail, setLatestEmail] = useState("");
  const [latestSubmitting, setLatestSubmitting] = useState(false);

  const hasLogo = !!footerLogoUrl?.trim();
  const hasAddress = !!address;
  const hasEmail = !!email;
  const hasPhone = !!phone;
  const hasCol1 = col1.length > 0;
  const hasCol2 = col2.length > 0;
  const hasCol1Section = hasCol1 || !!col1Heading;
  const hasCol2Section = hasCol2 || !!col2Heading;

  const sectionBgType = String(footerSectionBgType || "")
    .trim()
    .toLowerCase();
  const sectionBgImage = String(footerSectionBgImage || "").trim();
  const sectionBgColor = String(footerSectionBgColorValue || "").trim();

  // Manage Section background takes precedence over legacy footer background fields.
  const effectiveBgImage =
    sectionBgType === "image" && sectionBgImage
      ? sectionBgImage
      : sectionBgType === "color"
        ? ""
        : footerBackgroundImageUrl?.trim() || "";
  const effectiveBgColor =
    sectionBgType === "color" && sectionBgColor
      ? sectionBgColor
      : footerBgValue;

  const handleLatestSubmit = async (event) => {
    event.preventDefault();
    const normalized = String(latestEmail || "")
      .trim()
      .toLowerCase();
    if (!normalized) {
      notification.error({
        message: "Email required",
        description: "Please enter your email address.",
        placement: "bottomRight",
      });
      return;
    }
    if (!EMAIL_REGEX.test(normalized)) {
      notification.error({
        message: "Invalid email",
        description: "Please enter a valid email address.",
        placement: "bottomRight",
      });
      return;
    }

    setLatestSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          source: preview ? "footer-latest-preview" : "footer-latest",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to subscribe");
      }
      notification.success({
        message: "Subscribed",
        description: data?.message || "Successfully subscribed!",
        placement: "bottomRight",
      });
      setLatestEmail("");
    } catch (err) {
      notification.error({
        message: "Subscription failed",
        description: err?.message || "Please try again.",
        placement: "bottomRight",
      });
    } finally {
      setLatestSubmitting(false);
    }
  };

  return (
    <FooterContainer
      $footerBgValue={effectiveBgColor}
      $footerBackgroundImageUrl={effectiveBgImage}
      $footerTextValue={footerTextValue}
      $footerSocialValue={footerSocialValue || footerTextValue}
    >
      <FooterInner>
        <Row gutter={[32, 24]} align="top">
          <Col xs={24} md={24} lg={8} className="footer-brand-col">
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

            {hasAddress ? (
              <FooterParagraph
                className="footer-about-text"
                $footerTextValue={footerTextValue}
              >
                {address}
              </FooterParagraph>
            ) : null}
            {hasEmail ? (
              <div className="footer-contact-line">
                <Link href={emailHref}>{email}</Link>
              </div>
            ) : null}
            {hasPhone ? (
              <div className="footer-contact-line">{phone}</div>
            ) : null}
          </Col>

          {hasCol1Section ? (
            <Col xs={12} md={8} lg={4} className="footer-links-col">
              <h4 className="footer-link-title">{col1Heading}</h4>
              <ul>
                {col1.map((item, i) => (
                  <li key={`col1-${i}-${item.url || ""}-${item.label || ""}`}>
                    <FooterLink
                      href={item.url || "#"}
                      target={resolveFooterLinkTarget(item)}
                    >
                      {item.label || ""}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </Col>
          ) : null}

          {hasCol2Section ? (
            <Col xs={12} md={8} lg={4} className="footer-links-col">
              <h4 className="footer-link-title">{col2Heading}</h4>
              <ul>
                {col2.map((item, i) => (
                  <li key={`col2-${i}-${item.url || ""}-${item.label || ""}`}>
                    <FooterLink
                      href={item.url || "#"}
                      target={resolveFooterLinkTarget(item)}
                    >
                      {item.label || ""}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </Col>
          ) : null}

          <Col xs={24} md={8} lg={8} className="footer-latest-col">
            <h4 className="footer-latest-title">{latestHeading}</h4>
            <form className="footer-latest-form" onSubmit={handleLatestSubmit}>
              <input
                type="email"
                className="footer-latest-input"
                placeholder={latestPlaceholder}
                value={latestEmail}
                onChange={(e) => setLatestEmail(e.target.value)}
                aria-label={latestPlaceholder}
              />
              <button
                type="submit"
                className="footer-latest-btn"
                disabled={latestSubmitting}
                aria-label="Subscribe"
              >
                <ArrowRightOutlined />
              </button>
            </form>

            {socials.length > 0 ? (
              <div className="footer-socials-row">
                {socials.map((item, i) => {
                  const url = ensureMailto(item?.url);
                  if (!url) return null;
                  const target = resolveFooterLinkTarget(item);
                  const Icon = getSocialIcon(item?.platform);
                  return (
                    <a
                      key={`social-${i}-${String(item?.platform || "")}-${url}`}
                      href={url}
                      target={target === "_blank" ? "_blank" : "_self"}
                      rel={target === "_blank" ? "noopener noreferrer" : undefined}
                      aria-label={String(item?.platform || "social")}
                      className="footer-social-link"
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </Col>
        </Row>
      </FooterInner>
      {copy ? (
        <CopyrightBar $footerCopyrightBarValue={footerCopyrightBarValue}>
          {copy}
        </CopyrightBar>
      ) : null}
    </FooterContainer>
  );
}
