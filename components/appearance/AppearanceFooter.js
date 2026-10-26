"use client";

import {
  FacebookFilled,
  EnvironmentOutlined,
  GlobalOutlined,
  InstagramFilled,
  LinkedinFilled,
  MailOutlined,
  PhoneOutlined,
  YoutubeFilled,
  XOutlined,
} from "@ant-design/icons";
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";
import { PageContainer } from "@/styles/Theme";
import { sanitizeUrl } from "@/lib/security/sanitize";

const SOCIAL_ICONS = {
  facebook: FacebookFilled,
  instagram: InstagramFilled,
  linkedin: LinkedinFilled,
  youtube: YoutubeFilled,
  x: XOutlined,
  twitter: XOutlined,
  website: GlobalOutlined,
};

function LinkColumn({ title, links = [], titleClassName = "" }) {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <nav className={`footer-column${titleClassName ? ` ${titleClassName}` : ""}`} aria-label={title}>
      <h2>{title}</h2>
      {links.map((item, index) => (
        <a
          key={`${item?.label}-${index}`}
          href={sanitizeUrl(item?.url, "#")}
          target={item?.target === "_blank" ? "_blank" : "_self"}
          rel={item?.target === "_blank" ? "noopener noreferrer" : undefined}
        >
          {item?.label || ""}
        </a>
      ))}
    </nav>
  );
}

export default function AppearanceFooter({
  siteTitle = "MESCO Trust",
  footerLogoUrl = "",
  footerLogoHref = "/",
  footerLogoTarget = "_self",
  footerDescription = "",
  footerAddress = "",
  footerEmail = "",
  footerEmailTarget = "_self",
  footerPhone = "",
  footerPhoneTarget = "_self",
  footerCol1Title = "Our Works",
  footerCol1Links = [],
  footerCol2Title = "Media",
  footerCol2Links = [],
  footerContactTitle = "Contact",
  footerSocialLinks = [],
  footerCopyrightText = "",
  footerPrivacyLabel = "Privacy Policy",
  footerPrivacyUrl = "",
  footerPrivacyTarget = "_self",
  footerRefundLabel = "Refund & Cancellation Policy",
  footerRefundUrl = "",
  footerRefundTarget = "_self",
  footerBgValue = "",
  footerBackgroundImageUrl = "",
  footerTextValue = "",
  footerCopyrightBarValue = "",
  footerSectionTitleValue = "",
  footerTopBorderValue = "",
  footerCopyrightTopBorderValue = "",
  footerCopyrightTextValue = "",
  footerLinkHoverValue = "",
  footerBrandDescriptionValue = "",
}) {
  const socials = Array.isArray(footerSocialLinks)
    ? footerSocialLinks.filter((item) => String(item?.url || "").trim())
    : [];
  const copyright = resolveYearPlaceholder(footerCopyrightText);
  const backgroundImage = String(footerBackgroundImageUrl || "").trim();
  const sectionTitleColor = footerSectionTitleValue || "#ffffff";
  const topBorderColor = String(footerTopBorderValue || "").trim();
  const copyrightBorderColor =
    footerCopyrightTopBorderValue || "rgba(250,246,239,.14)";
  const copyrightTextColor =
    footerCopyrightTextValue ||
    footerTextValue ||
    "rgba(250,246,239,.82)";
  const linkHoverColor =
    footerLinkHoverValue || footerTextValue || "#ffffff";
  const bodyTextColor = footerTextValue || "rgba(250,246,239,.82)";
  const brandDescriptionColor =
    footerBrandDescriptionValue || bodyTextColor;

  return (
    <footer
      id="contact"
      className="appearance-footer"
      style={{
        backgroundColor: footerBgValue || undefined,
        backgroundImage: backgroundImage ? `url(${JSON.stringify(backgroundImage)})` : undefined,
        color: footerTextValue || undefined,
        borderTop: topBorderColor ? `1px solid ${topBorderColor}` : undefined,
        "--appearance-footer-section-title": sectionTitleColor,
        "--appearance-footer-copyright-border": copyrightBorderColor,
        "--appearance-footer-copyright-text": copyrightTextColor,
        "--appearance-footer-link-hover": linkHoverColor,
        "--appearance-footer-body-text": bodyTextColor,
        "--appearance-footer-brand-description": brandDescriptionColor,
      }}
    >
      <PageContainer className="footer-grid page-container-footer">
        <div className="footer-brand">
          {footerLogoUrl ? (
            <a
              className="footer-logo-link"
              href={sanitizeUrl(footerLogoHref, "/")}
              target={footerLogoTarget === "_blank" ? "_blank" : "_self"}
              rel={footerLogoTarget === "_blank" ? "noopener noreferrer" : undefined}
            >
              <img src={footerLogoUrl} alt={siteTitle} />
            </a>
          ) : <strong>{siteTitle}</strong>}
          {footerDescription ? <p>{footerDescription}</p> : null}
          {socials.length > 0 ? (
            <div className="footer-socials">
              {socials.map((item, index) => {
                const Icon = SOCIAL_ICONS[String(item?.platform || "").toLowerCase()] || GlobalOutlined;
                const safeSocialUrl = sanitizeUrl(item.url, "");
                if (!safeSocialUrl) return null;
                return (
                  <a
                    key={`${item.platform}-${index}`}
                    href={safeSocialUrl}
                    target={item?.target === "_blank" ? "_blank" : "_self"}
                    rel={item?.target === "_blank" ? "noopener noreferrer" : undefined}
                    aria-label={item.platform}
                    className="footer-social-link"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
        <LinkColumn title={footerCol1Title} links={footerCol1Links} />
        <LinkColumn title={footerCol2Title} links={footerCol2Links} />
        <div className="footer-column footer-contact">
          <h2>{footerContactTitle}</h2>
          {footerAddress ? <p><EnvironmentOutlined className="contact-icon" aria-hidden="true" /><span>{footerAddress}</span></p> : null}
          {footerEmail ? <p><MailOutlined className="contact-icon" aria-hidden="true" /><a href={`mailto:${footerEmail}`} target={footerEmailTarget === "_blank" ? "_blank" : "_self"} rel={footerEmailTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerEmail}</a></p> : null}
          {footerPhone ? <p><PhoneOutlined className="contact-icon" aria-hidden="true" /><a href={`tel:${footerPhone.replace(/[^+\d]/g, "")}`} target={footerPhoneTarget === "_blank" ? "_blank" : "_self"} rel={footerPhoneTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerPhone}</a></p> : null}
        </div>
      </PageContainer>
      <div
        className="footer-copyright-shell"
        style={{ background: footerCopyrightBarValue || undefined }}
      >
        <PageContainer className="footer-bottom page-container-footer">
          <p>{copyright}</p>
          <div className="footer-legal">
            {sanitizeUrl(footerPrivacyUrl, "") ? <a href={sanitizeUrl(footerPrivacyUrl, "#")} target={footerPrivacyTarget === "_blank" ? "_blank" : "_self"} rel={footerPrivacyTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerPrivacyLabel}</a> : null}
            {sanitizeUrl(footerRefundUrl, "") ? <a href={sanitizeUrl(footerRefundUrl, "#")} target={footerRefundTarget === "_blank" ? "_blank" : "_self"} rel={footerRefundTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerRefundLabel}</a> : null}
          </div>
        </PageContainer>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .appearance-footer, .appearance-footer * { box-sizing: border-box; }
        .appearance-footer { --appearance-font-body: "Instrument Sans", system-ui, sans-serif; width: 100%; color: rgba(250,246,239,.82); background: #211e30 center/cover no-repeat; font-family: var(--appearance-font-body); font-synthesis: none; -webkit-font-smoothing: antialiased; line-height: 1.6; }
        .appearance-footer *, .appearance-footer *::before, .appearance-footer *::after { font-family: var(--appearance-font-body); }
        .appearance-footer .footer-grid { padding-top: calc(clamp(64px, 7vw, 96px) * 0.7); padding-bottom: calc(clamp(64px, 7vw, 96px) * 0.7); display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.4fr; gap: clamp(32px,3.6vw,64px); }
        .appearance-footer .footer-brand { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
        .appearance-footer .footer-logo-link { display: inline-flex; text-decoration: none !important; }
        .appearance-footer .footer-brand img { display: block; width: 198px; height: auto; max-height: 95.04px; object-fit: contain; background: transparent; border-radius: 0; padding: 0; }
        .appearance-footer .footer-brand p { margin: 0; max-width: 36ch; color: var(--appearance-footer-brand-description, rgba(250,246,239,.82)) !important; -webkit-text-fill-color: var(--appearance-footer-brand-description, rgba(250,246,239,.82)) !important; font-size: 15px; line-height: 1.7; }
        .appearance-footer .footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; font-size: 15px; }
        .appearance-footer .footer-column h2 { margin: 0 0 6px; color: var(--appearance-footer-section-title, #fff) !important; -webkit-text-fill-color: var(--appearance-footer-section-title, #fff) !important; font: inherit; font-weight: 650; line-height: 1.6; }
        .appearance-footer .footer-copyright-shell { width: 100%; border-top: 1px solid var(--appearance-footer-copyright-border, rgba(250,246,239,.14)); }
        .appearance-footer .footer-column a,
        .appearance-footer .footer-contact p,
        .appearance-footer .footer-contact p > span,
        .appearance-footer .footer-contact p > a { color: var(--appearance-footer-body-text, rgba(250,246,239,.82)) !important; -webkit-text-fill-color: var(--appearance-footer-body-text, rgba(250,246,239,.82)) !important; text-decoration: none !important; transition: color .2s; }
        .appearance-footer .footer-contact p { display: grid; grid-template-columns: 18px minmax(0,1fr); align-items: start; column-gap: 10px; margin: 0; font-size: 15px; line-height: 24px; }
        .appearance-footer .footer-column a:hover,
        .appearance-footer .footer-contact p > a:hover { color: var(--appearance-footer-link-hover, #fff) !important; -webkit-text-fill-color: var(--appearance-footer-link-hover, #fff) !important; }
        .appearance-footer .footer-contact p > span:last-child,
        .appearance-footer .footer-contact p > a { min-width: 0; line-height: 24px; }
        .appearance-footer .footer-contact .contact-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 24px; margin: 0; color: #e03c33; font-size: 18px; line-height: 1; }
        .appearance-footer .footer-contact .contact-icon svg { display: block; }
        .appearance-footer .footer-socials { display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }
        .appearance-footer .footer-socials a.footer-social-link { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; border-radius: 50%; background: #fff; color: #000 !important; -webkit-text-fill-color: #000 !important; opacity: 1; line-height: 1; text-decoration: none !important; transition: transform .2s ease,opacity .2s ease; }
        .appearance-footer .footer-socials a.footer-social-link:hover { color: #000 !important; -webkit-text-fill-color: #000 !important; opacity: 1; transform: translateY(-1px); }
        .appearance-footer .footer-socials a.footer-social-link .anticon { display: inline-flex; color: #000 !important; font-size: 16px; line-height: 1; }
        .appearance-footer .footer-socials a.footer-social-link svg { display: block; width: 1em; height: 1em; color: #000 !important; fill: currentColor; }
        .appearance-footer .footer-bottom { padding-top: 18.2px; padding-bottom: 18.2px; border-top: 0; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 14px; background: transparent; }
        .appearance-footer .footer-bottom p { margin: 0; color: var(--appearance-footer-copyright-text, rgba(250,246,239,.82)) !important; -webkit-text-fill-color: var(--appearance-footer-copyright-text, rgba(250,246,239,.82)) !important; opacity: 1; }
        .appearance-footer .footer-legal { display: flex; flex-wrap: wrap; gap: 24px; opacity: 1; }
        .appearance-footer .footer-legal a { color: var(--appearance-footer-copyright-text, rgba(250,246,239,.82)) !important; -webkit-text-fill-color: var(--appearance-footer-copyright-text, rgba(250,246,239,.82)) !important; text-decoration: none !important; }
        @media (max-width: 1023px) {
          .appearance-footer .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 767px) {
          .appearance-footer .footer-grid { grid-template-columns: 1fr; padding-top: 33.6px; padding-bottom: 33.6px; gap: 38px; }
          .appearance-footer .footer-brand p { max-width: none; }
          .appearance-footer .footer-bottom { flex-direction: column; padding-top: 15.4px; padding-bottom: 15.4px; }
          .appearance-footer .footer-legal { gap: 12px 20px; }
        }
      ` }} />
    </footer>
  );
}
