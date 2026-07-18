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
        <a key={`${item?.label}-${index}`} href={item?.url || "#"}>{item?.label || ""}</a>
      ))}
    </nav>
  );
}

export default function AppearanceFooter({
  siteTitle = "MESCO Trust",
  footerLogoUrl = "",
  footerDescription = "",
  footerAddress = "",
  footerEmail = "",
  footerPhone = "",
  footerCol1Title = "Our Works",
  footerCol1Links = [],
  footerCol2Title = "Media",
  footerCol2Links = [],
  footerContactTitle = "Contact",
  footerSocialLinks = [],
  footerCopyrightText = "",
  footerPrivacyLabel = "Privacy Policy",
  footerPrivacyUrl = "",
  footerRefundLabel = "Refund & Cancellation Policy",
  footerRefundUrl = "",
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
      className="fable-footer"
      style={{
        backgroundColor: footerBgValue || undefined,
        backgroundImage: backgroundImage ? `url(${JSON.stringify(backgroundImage)})` : undefined,
        color: footerTextValue || undefined,
      }}
    >
      <div className="footer-grid">
        <div className="footer-brand">
          {footerLogoUrl ? <img src={footerLogoUrl} alt={siteTitle} /> : <strong>{siteTitle}</strong>}
          {footerDescription ? <p>{footerDescription}</p> : null}
          {socials.length > 0 ? (
            <div className="footer-socials">
              {socials.map((item, index) => {
                const Icon = SOCIAL_ICONS[String(item?.platform || "").toLowerCase()] || GlobalOutlined;
                return (
                  <a key={`${item.platform}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.platform}>
                    <Icon />
                    {socials.length === 1 ? (
                      <span>{String(item.platform || "").toLowerCase() === "youtube" ? "YouTube" : String(item.platform || "")}</span>
                    ) : null}
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
          {footerEmail ? <p><MailOutlined className="contact-icon" aria-hidden="true" /><a href={`mailto:${footerEmail}`}>{footerEmail}</a></p> : null}
          {footerPhone ? <p><PhoneOutlined className="contact-icon" aria-hidden="true" /><a href={`tel:${footerPhone.replace(/[^+\d]/g, "")}`}>{footerPhone}</a></p> : null}
        </div>
      </div>
      <div className="footer-bottom" style={{ background: footerCopyrightBarValue || undefined }}>
        <p>{copyright}</p>
        <div className="footer-legal">
          {footerPrivacyUrl ? <a href={footerPrivacyUrl}>{footerPrivacyLabel}</a> : null}
          {footerRefundUrl ? <a href={footerRefundUrl}>{footerRefundLabel}</a> : null}
        </div>
      </div>
      <style jsx global>{`
        .fable-footer, .fable-footer * { box-sizing: border-box; }
        .fable-footer { width: 100%; color: rgba(250,246,239,.82); background: #211e30 center/cover no-repeat; font-family: "Instrument Sans", system-ui, sans-serif; line-height: 1.6; }
        .fable-footer .footer-grid { width: 100%; max-width: 1400px; margin: 0 auto; padding: clamp(64px,7vw,96px) clamp(20px,4vw,48px); display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.4fr; gap: clamp(32px,3.6vw,64px); }
        .fable-footer .footer-brand { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
        .fable-footer .footer-brand img { display: block; width: 150px; height: auto; max-height: 72px; object-fit: contain; background: #faf6ef; border-radius: 12px; padding: 10px 14px; }
        .fable-footer .footer-brand p { margin: 0; max-width: 36ch; color: inherit; font-size: 15px; line-height: 1.7; }
        .fable-footer .footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; font-size: 15px; }
        .fable-footer .footer-column h2 { margin: 0 0 6px; color: #fff; font: inherit; font-weight: 650; line-height: 1.6; }
        .fable-footer .footer-column a { color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; -webkit-text-fill-color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; opacity: .78; text-decoration: none !important; transition: opacity .2s,color .2s; }
        .fable-footer .footer-column a:hover { color: #fff !important; -webkit-text-fill-color: #fff !important; opacity: 1; }
        .fable-footer .footer-contact p { display: flex; gap: 10px; margin: 0; color: inherit; font-size: 15px; line-height: 1.6; }
        .fable-footer .footer-contact .contact-icon { flex: 0 0 18px; margin-top: 3px; color: #e03c33; font-size: 18px; }
        .fable-footer .footer-socials { display: flex; flex-wrap: wrap; gap: 12px; }
        .fable-footer .footer-socials a { display: inline-flex; align-items: center; gap: 8px; color: #fff !important; -webkit-text-fill-color: #fff !important; font-weight: 600; text-decoration: none !important; }
        .fable-footer .footer-socials svg { color: #e03c33; font-size: 21px; }
        .fable-footer .footer-bottom { width: 100%; max-width: 1400px; margin: 0 auto; padding: 26px clamp(20px,4vw,48px); border-top: 1px solid rgba(250,246,239,.14); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 14px; }
        .fable-footer .footer-bottom p { margin: 0; color: inherit; opacity: .72; }
        .fable-footer .footer-legal { display: flex; flex-wrap: wrap; gap: 24px; opacity: .72; }
        .fable-footer .footer-legal a { color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; -webkit-text-fill-color: ${footerTextValue || "rgba(250,246,239,.82)"} !important; text-decoration: none !important; }
        @media (max-width: 1023px) {
          .fable-footer .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 767px) {
          .fable-footer .footer-grid { grid-template-columns: 1fr; padding-top: 48px; padding-bottom: 48px; gap: 38px; }
          .fable-footer .footer-brand p { max-width: none; }
          .fable-footer .footer-bottom { flex-direction: column; padding-top: 22px; padding-bottom: 22px; }
          .fable-footer .footer-legal { gap: 12px 20px; }
        }
      `}</style>
    </footer>
  );
}
