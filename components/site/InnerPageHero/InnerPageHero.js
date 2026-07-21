"use client";

import Link from "next/link";
import { getColor, InnerBanner, PageContainer } from "@/styles/Theme";

function renderTitle(value) {
  const text = String(value || "");
  if (!text.includes("*")) {
    const parts = text.split(/\s+/).filter(Boolean);
    const accent = parts.pop();
    return <>{parts.length ? `${parts.join(" ")} ` : ""}<em>{accent}</em></>;
  }
  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

/** Inner-page banner matching the current MESCO page-hero design. */
export default function InnerPageHero(props) {
  const title = String(props?.title ?? "Page Title").trim();
  const description = String(props?.description ?? "").trim();
  const titleColor = props?.titleColorKey ? getColor(props.titleColorKey) : undefined;
  const descriptionColor = props?.innerPageHeroDescriptionColorKey
    ? getColor(props.innerPageHeroDescriptionColorKey)
    : undefined;
  const breadcrumbColor = props?.innerPageHeroBreadcrumbColor1Key
    ? getColor(props.innerPageHeroBreadcrumbColor1Key)
    : undefined;
  const currentColor = props?.innerPageHeroBreadcrumbColor2Key
    ? getColor(props.innerPageHeroBreadcrumbColor2Key)
    : undefined;
  const rawItems = Array.isArray(props?.breadcrumbItems) ? props.breadcrumbItems : [];
  const items = rawItems.length
    ? rawItems
    : [{ label: "Home", href: "/" }, { label: title, href: "" }];

  return (
    <InnerBanner
      className="fable-page-hero"
      style={{ "--inner-banner-bg": "none", "--inner-banner-bg-mobile": "none" }}
    >
      <PageContainer>
        <div className="fable-section fable-page-hero__content">
          <nav className="fable-page-hero__crumb" aria-label="Breadcrumb">
            {items.map((item, index) => {
              const label = String(item?.label || "").trim();
              const href = String(item?.href || "").trim();
              const isCurrent = index === items.length - 1;
              return (
                <span key={`${label}-${index}`}>
                  {index > 0 ? <span aria-hidden="true"> / </span> : null}
                  {href && !isCurrent ? (
                    <Link href={href} style={breadcrumbColor ? { color: breadcrumbColor } : undefined}>
                      {label}
                    </Link>
                  ) : (
                    <span style={isCurrent && currentColor ? { color: currentColor } : undefined}>
                      {label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
          <h1 className="fable-page-hero__title" style={titleColor ? { color: titleColor } : undefined}>
            {renderTitle(title)}
          </h1>
          {description ? (
            <p className="fable-page-hero__description" style={descriptionColor ? { color: descriptionColor } : undefined}>
              {description}
            </p>
          ) : null}
        </div>
      </PageContainer>
      <style jsx global>{`
        .fable-page-hero {
          min-height: 0;
          margin-top: 0;
          color: ${getColor("cream")};
          background-color: ${getColor("dark")};
          background-position: center;
          background-size: cover;
          border: 0;
        }
        .fable-page-hero::before {
          background: linear-gradient(90deg, color-mix(in srgb, ${getColor("dark")} 92%, transparent), color-mix(in srgb, ${getColor("dark")} 68%, transparent));
        }
        .fable-page-hero > div { z-index: 1; }
        .fable-page-hero .fable-page-hero__content { padding-block: clamp(30px, 4vw, 53px); }
        .fable-page-hero__crumb { margin-bottom: 22px; color: color-mix(in srgb, ${getColor("cream")} 52%, transparent); font-size: 13.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
        .fable-page-hero__crumb a:hover { color: ${getColor("primarySoft")}; }
        .fable-page-hero__title { max-width: 16ch; margin: 0 0 20px; color: ${getColor("cream")}; font-family: var(--fable-display); font-size: clamp(40px, 6.4vw, 92px); font-weight: 630; letter-spacing: -.02em; line-height: 1.05; }
        .fable-page-hero__title em { color: ${getColor("primarySoft")}; font-style: normal; }
        .fable-page-hero__description { max-width: 56ch; margin: 0; color: color-mix(in srgb, ${getColor("cream")} 76%, transparent); font-size: clamp(16px, 1.4vw, 19px); }
        @media (max-width: 767px) { .fable-page-hero { padding-top: 72px; } }
      `}</style>
    </InnerBanner>
  );
}
