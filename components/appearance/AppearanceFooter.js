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

const SOCIAL_ICONS = {
  facebook: FacebookFilled,
  instagram: InstagramFilled,
  linkedin: LinkedinFilled,
  youtube: YoutubeFilled,
  x: XOutlined,
  twitter: XOutlined,
  website: GlobalOutlined,
};

function LinkColumn({ title, links = [] }) {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <nav className="footer-column" aria-label={title}>
      <h2>{title}</h2>
      {links.map((item, index) => (
        <a
          key={`${item?.label}-${index}`}
          href={item?.url || "#"}
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
}) {
  const socials = Array.isArray(footerSocialLinks)
    ? footerSocialLinks.filter((item) => String(item?.url || "").trim())
    : [];
  const copyright = resolveYearPlaceholder(footerCopyrightText);
  const backgroundImage = String(footerBackgroundImageUrl || "").trim();

  return (
    <footer
      id="contact"
      className="appearance-footer"
      style={{
        backgroundColor: footerBgValue || undefined,
        backgroundImage: backgroundImage ? `url(${JSON.stringify(backgroundImage)})` : undefined,
        color: footerTextValue || undefined,
      }}
    >
      <div className="footer-grid">
        <div className="footer-brand">
          {footerLogoUrl ? (
            <a
              className="footer-logo-link"
              href={footerLogoHref || "/"}
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
                return (
                  <a
                    key={`${item.platform}-${index}`}
                    href={item.url}
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
      </div>
      <div className="footer-bottom" style={{ background: footerCopyrightBarValue || undefined }}>
        <p>{copyright}</p>
        <div className="footer-legal">
          {footerPrivacyUrl ? <a href={footerPrivacyUrl} target={footerPrivacyTarget === "_blank" ? "_blank" : "_self"} rel={footerPrivacyTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerPrivacyLabel}</a> : null}
          {footerRefundUrl ? <a href={footerRefundUrl} target={footerRefundTarget === "_blank" ? "_blank" : "_self"} rel={footerRefundTarget === "_blank" ? "noopener noreferrer" : undefined}>{footerRefundLabel}</a> : null}
        </div>
      </div>
      <style jsx global>{`
        .appearance-footer, .appearance-footer * { box-sizing: border-box; }
        .appearance-footer { width: 100%; color: rgba(250,246,239,.82); background: #211e30 center/cover no-repeat; font-family: "Instrument Sans", system-ui, sans-serif; font-synthesis: none; line-height: 1.6; }
        .appearance-footer *, .appearance-footer *::before, .appearance-footer *::after { font-family: "Instrument Sans", system-ui, sans-serif; }
        .appearance-footer .footer-grid { width: 100%; max-width: 1400px; margin: 0 auto; padding: clamp(64px,7vw,96px) clamp(20px,4vw,48px); display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.4fr; gap: clamp(32px,3.6vw,64px); }
        .appearance-footer .footer-brand { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
        .appearance-footer .footer-logo-link { display: inline-flex; text-decoration: none !important; }
        .appearance-footer .footer-brand img { display: block; width: 150px; height: auto; max-height: 72px; object-fit: contain; background: #faf6ef; border-radius: 12px; padding: 10px 14px; }
        .appearance-footer .footer-brand p { margin: 0; max-width: 36ch; color: inherit; font-size: 15px; line-height: 1.7; }
        .appearance-footer .footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; font-size: 15px; }
        .appearance-footer .footer-column h2 { margin: 0 0 6px; color: #fff; font: inherit; font-weight: 650; line-height: 1.6; }
        .appearance-footer .footer-column a { color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; -webkit-text-fill-color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; opacity: .78; text-decoration: none !important; transition: opacity .2s,color .2s; }
        .appearance-footer .footer-column a:hover { color: #fff !important; -webkit-text-fill-color: #fff !important; opacity: 1; }
        .appearance-footer .footer-contact p { display: grid; grid-template-columns: 18px minmax(0,1fr); align-items: start; column-gap: 10px; margin: 0; color: inherit; font-size: 15px; line-height: 24px; }
        .appearance-footer .footer-contact p > span:last-child,
        .appearance-footer .footer-contact p > a { min-width: 0; line-height: 24px; }
        .appearance-footer .footer-contact .contact-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 24px; margin: 0; color: #e03c33; font-size: 18px; line-height: 1; }
        .appearance-footer .footer-contact .contact-icon svg { display: block; }
        .appearance-footer .footer-socials { display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }
        .appearance-footer .footer-socials a.footer-social-link { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; border-radius: 50%; background: #fff; color: #000 !important; -webkit-text-fill-color: #000 !important; opacity: 1; line-height: 1; text-decoration: none !important; transition: transform .2s ease,opacity .2s ease; }
        .appearance-footer .footer-socials a.footer-social-link:hover { color: #000 !important; -webkit-text-fill-color: #000 !important; opacity: 1; transform: translateY(-1px); }
        .appearance-footer .footer-socials a.footer-social-link .anticon { display: inline-flex; color: #000 !important; font-size: 16px; line-height: 1; }
        .appearance-footer .footer-socials a.footer-social-link svg { display: block; width: 1em; height: 1em; color: #000 !important; fill: currentColor; }
        .appearance-footer .footer-bottom { width: 100%; max-width: 1400px; margin: 0 auto; padding: 26px clamp(20px,4vw,48px); border-top: 1px solid rgba(250,246,239,.14); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 14px; }
        .appearance-footer .footer-bottom p { margin: 0; color: inherit; opacity: .72; }
        .appearance-footer .footer-legal { display: flex; flex-wrap: wrap; gap: 24px; opacity: .72; }
        .appearance-footer .footer-legal a { color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; -webkit-text-fill-color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; text-decoration: none !important; }
        @media (max-width: 1023px) {
          .appearance-footer .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 767px) {
          .appearance-footer .footer-grid { grid-template-columns: 1fr; padding-top: 48px; padding-bottom: 48px; gap: 38px; }
          .appearance-footer .footer-brand p { max-width: none; }
          .appearance-footer .footer-bottom { flex-direction: column; padding-top: 22px; padding-bottom: 22px; }
          .appearance-footer .footer-legal { gap: 12px 20px; }
        }
      `}</style>
    </footer>
  );
}
