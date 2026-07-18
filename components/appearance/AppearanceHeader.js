"use client";

import CurrentHeader from "@/components/site/Header/Header";

function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    label: String(item?.label || ""),
    url: String(item?.url || item?.href || "#"),
    openInNewTab: item?.openInNewTab === true || item?.target === "_blank",
    children: normalizeMenuItems(item?.children || item?.submenu),
  }));
}

function DesktopMenuItem({ item }) {
  const hasChildren = item.children.length > 0;
  const target = item.openInNewTab ? "_blank" : undefined;
  const rel = target ? "noopener noreferrer" : undefined;

  return (
    <div className={`fable-nav-item${hasChildren ? " has-dropdown" : ""}`}>
      <a href={item.url} target={target} rel={rel}>
        {item.label}
        {hasChildren ? (
          <svg viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
            <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : null}
      </a>
      {hasChildren ? (
        <div className="fable-dropdown">
          {item.children.map((child, index) => (
            <a
              key={`${child.label}-${index}`}
              href={child.url}
              target={child.openInNewTab ? "_blank" : undefined}
              rel={child.openInNewTab ? "noopener noreferrer" : undefined}
            >
              {child.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AppearanceHeader(props) {
  const {
    menuItems = [],
    siteTitle = "MESCO Trust",
    logoType = "image",
    logoUrl = "/",
    logoImageUrl = "",
    logoLightUrl = "",
    volunteerLabel = "Volunteer",
    volunteerHref = "/about-us/volunteer",
    volunteerHrefTarget = "_self",
    donateLabel = "Donate Now",
    donateHref = "/donate-now",
    headerBgValue = "",
    headerDonateBgValue = "",
    headerDonateTextValue = "",
    headerAnnouncementEnabled = false,
    headerAnnouncementItems = [],
    preview = false,
  } = props;
  const items = normalizeMenuItems(menuItems);
  const logo = logoLightUrl || logoImageUrl;
  const announcements = Array.isArray(headerAnnouncementItems)
    ? headerAnnouncementItems.filter((item) => String(item?.text || "").trim())
    : [];
  const showAnnouncement = headerAnnouncementEnabled === true && announcements.length > 0;
  const volunteerTarget = volunteerHrefTarget === "_blank" ? "_blank" : undefined;

  return (
    <div className={`appearance-header${preview ? " is-preview" : ""}`}>
      <div className="fable-desktop">
        {showAnnouncement ? (
          <div className="fable-announcement">
            {announcements.map((item, index) => (
              <span key={`${item.text}-${index}`}>
                {item.url ? (
                  <a href={item.url} target={item.target === "_blank" ? "_blank" : undefined} rel={item.target === "_blank" ? "noopener noreferrer" : undefined}>
                    {item.text}
                  </a>
                ) : item.text}
              </span>
            ))}
          </div>
        ) : null}
        <header className="fable-nav">
          <div className="fable-nav-inner" style={{ background: headerBgValue || undefined }}>
            <a className="fable-logo" href={logoUrl || "/"} aria-label={`${siteTitle} home`}>
              {logoType === "image" && logo ? (
                <img src={logo} alt={siteTitle} />
              ) : (
                <span>{siteTitle}</span>
              )}
            </a>
            <nav className="fable-links" aria-label="Primary navigation">
              {items.map((item, index) => (
                <DesktopMenuItem key={`${item.label}-${index}`} item={item} />
              ))}
            </nav>
            <div className="fable-actions">
              {volunteerHref ? (
                <a className="fable-volunteer" href={volunteerHref} target={volunteerTarget} rel={volunteerTarget ? "noopener noreferrer" : undefined}>
                  {volunteerLabel}
                </a>
              ) : null}
              {donateHref ? (
                <a
                  className="fable-donate"
                  href={donateHref}
                  style={{
                    background: headerDonateBgValue || undefined,
                    color: headerDonateTextValue || undefined,
                  }}
                >
                  {donateLabel}
                </a>
              ) : null}
            </div>
          </div>
        </header>
      </div>
      <div className="current-mobile">
        <CurrentHeader {...props} />
      </div>
      <style jsx global>{`
        .appearance-header, .appearance-header * { box-sizing: border-box; }
        .appearance-header { position: relative; z-index: 100; font-family: "Instrument Sans", system-ui, sans-serif; }
        .appearance-header .current-mobile { display: none; }
        .appearance-header .fable-nav { position: fixed; top: ${showAnnouncement ? "48px" : "14px"}; left: 0; right: 0; padding: 0 24px; z-index: 100; background: transparent; transition: top .3s; }
        .appearance-header.is-preview .fable-nav { position: relative; top: auto; padding: 14px 18px; }
        .appearance-header .fable-nav-inner { width: 100%; max-width: 1240px; height: 74px; margin: 0 auto; padding: 0 10px 0 14px; display: flex; align-items: center; justify-content: space-between; gap: 24px; background: rgba(27,24,38,.92); border: 1px solid rgba(255,255,255,.14); border-radius: 999px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 18px 50px rgba(15,12,26,.35); }
        .appearance-header .fable-logo { flex: 0 0 auto; display: inline-flex; align-items: center; color: #faf6ef; font-weight: 700; text-decoration: none; }
        .appearance-header .fable-logo img { display: block; width: auto; height: 42px; max-width: 150px; object-fit: contain; background: #faf6ef; border-radius: 999px; padding: 5px 12px; }
        .appearance-header .fable-links { display: flex; align-items: center; justify-content: center; gap: clamp(18px,2.6vw,38px); min-width: 0; margin: 0; }
        .appearance-header .fable-nav-item { position: relative; }
        .appearance-header .fable-nav-item > a { display: inline-flex; align-items: center; gap: 6px; color: #faf6ef !important; font-size: 15px; font-weight: 570; line-height: 1.6; white-space: nowrap; text-decoration: none !important; position: relative; }
        .appearance-header .fable-nav-item > a::after { content: ""; position: absolute; left: 0; bottom: -5px; width: 100%; height: 2px; background: #e03c33; transform: scaleX(0); transform-origin: right; transition: transform .3s cubic-bezier(.16,1,.3,1); }
        .appearance-header .fable-nav-item:hover > a::after, .appearance-header .fable-nav-item:focus-within > a::after { transform: scaleX(1); transform-origin: left; }
        .appearance-header .fable-dropdown { position: absolute; top: calc(100% + 14px); left: -18px; min-width: 250px; padding: 10px; display: flex; flex-direction: column; background: #2a283e; border: 1px solid rgba(250,246,239,.12); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.4); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
        .appearance-header .fable-nav-item:hover .fable-dropdown, .appearance-header .fable-nav-item:focus-within .fable-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
        .appearance-header .fable-dropdown a { padding: 10px 14px; border-radius: 10px; color: #faf6ef !important; font-size: 14.5px; font-weight: 550; text-decoration: none !important; }
        .appearance-header .fable-dropdown a:hover, .appearance-header .fable-dropdown a:focus-visible { color: #f2867f !important; background: rgba(250,246,239,.08); }
        .appearance-header .fable-actions { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .appearance-header .fable-actions a { display: inline-flex; align-items: center; padding: 13px 26px; border-radius: 999px; font-size: 15px; font-weight: 600; line-height: 1.2; text-decoration: none !important; white-space: nowrap; transition: transform .25s, background .25s, border-color .25s; }
        .appearance-header .fable-volunteer { color: #faf6ef !important; background: transparent; border: 1px solid rgba(250,246,239,.32); }
        .appearance-header .fable-volunteer:hover { border-color: #faf6ef; transform: translateY(-2px); }
        .appearance-header .fable-donate { color: #fff !important; background: #e03c33; border: 1px solid transparent; box-shadow: 0 14px 30px rgba(224,60,51,.28); }
        .appearance-header .fable-donate:hover { background: #b92e27 !important; transform: translateY(-2px); }
        .appearance-header .fable-announcement { position: fixed; inset: 0 0 auto; z-index: 101; min-height: 36px; display: flex; align-items: center; justify-content: center; gap: 32px; padding: 8px 20px; color: #fff; background: #e03c33; font-size: 13px; font-weight: 600; }
        .appearance-header.is-preview .fable-announcement { position: relative; }
        .appearance-header .fable-announcement a { color: inherit !important; text-decoration: none !important; }
        @media (max-width: 992px) {
          .appearance-header .fable-desktop { display: none; }
          .appearance-header .current-mobile { display: block; }
        }
        @media (min-width: 993px) {
          .appearance-header .fable-desktop { display: block; }
          .appearance-header .current-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
