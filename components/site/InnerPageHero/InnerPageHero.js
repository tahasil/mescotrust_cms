"use client";

import Link from "next/link";
import { getColor, InnerBanner, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

/** Inner-page banner matching the current MESCO page-hero design. */
export default function InnerPageHero(props) {
  const title = String(props?.title ?? "Page Title").trim();
  const description = String(props?.description ?? "").trim();
  const titleColor = props?.titleColorKey ? getColor(props.titleColorKey) : undefined;
  const accentColor = props?.innerPageHeroAccentColorKey
    ? getColor(props.innerPageHeroAccentColorKey)
    : getColor("primarySoft");
  const glowColor = props?.innerPageHeroGlowColorKey
    ? getColor(props.innerPageHeroGlowColorKey)
    : getColor("primary");
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
      style={{
        "--inner-banner-bg": "none",
        "--inner-banner-bg-mobile": "none",
        "--inner-page-hero-accent": accentColor,
        "--inner-page-hero-glow": glowColor,
      }}
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
            {renderHighlightedTitle(title, props, {
              legacyColorKey: props?.innerPageHeroAccentColorKey,
              fallbackColorKey: "primarySoft",
            })}
          </h1>
          {description ? (
            <p className="fable-page-hero__description" style={descriptionColor ? { color: descriptionColor } : undefined}>
              {description}
            </p>
          ) : null}
        </div>
      </PageContainer>
    </InnerBanner>
  );
}
