"use client";

import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles, getParagraphAlign } from "@/components/site/titleUtils";

/* ── Styled Components ── */
const TestimonialsGrid = styled.div`
  && {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(18px, 2vw, 28px);
    align-items: stretch;
  }

  @media (max-width: 767px) {
    && { grid-template-columns: minmax(0, 1fr); }
  }
`;

const TestimonialsHeading = styled.header`
  width: 100%;
  margin-bottom: clamp(28px, 4vw, 54px);

  .fable-eyebrow {
    margin-bottom: 18px;
  }

  .fable-heading {
    margin-bottom: 0;
  }
`;

const TestimonialCard = styled.article`
  && {
    min-width: 0;
    min-height: clamp(210px, 18vw, 270px);
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: clamp(24px, 2.5vw, 34px);
    border: 1px solid var(--donor-card-border);
    border-radius: 16px;
    background: var(--donor-card-bg);
    box-shadow: none;
    transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms ease;
  }

  &&:nth-child(odd) {
    background: var(--donor-card-bg-alt);
    border-color: transparent;
  }

  &&:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 34px color-mix(in srgb, var(--donor-card-shadow) 9%, transparent);
  }

  @media (max-width: 767px) {
    && { min-height: 0; padding: 24px; }
  }
`;

const QuoteIcon = styled.span`
  display: block;
  margin: 0 0 clamp(24px, 2.4vw, 34px);
  color: var(--donor-quote-icon);
  font-family: Georgia, serif;
  font-size: calc(var(--donor-quote-icon-size) * 1px);
  font-weight: 700;
  line-height: 0.65;
`;

const QuoteText = styled.p`
  margin: 0 0 22px;
  color: var(--donor-quote-text);
  font-size: calc(var(--donor-quote-text-size) * 1px);
  font-weight: 400;
  line-height: 1.48;
`;

const PersonDetails = styled.footer`
  margin-top: auto;
`;

const PersonName = styled.strong`
  display: block;
  margin: 0 0 3px;
  color: var(--donor-name);
  font-size: calc(var(--donor-name-size) * 1px);
  font-weight: 650;
  line-height: 1.4;
`;

const PersonRole = styled.span`
  display: block;
  color: var(--donor-role);
  font-size: calc(var(--donor-role-size) * 1px);
  font-weight: 400;
  line-height: 1.4;
`;

/**
 * Site component: DonorTestimonials.
 * Vertical list of testimonial cards with quote icon, text, name, and role.
 */
export default function DonorTestimonials(props) {
  const titleAlign = getTitleAlign(props, "center", "donorTestimonials");
  const paragraphAlign = getParagraphAlign(props, "left", "donorTestimonials");
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.donorTestimonialsTitleEnabled !== false;
  const subTitleEnabled = props?.donorTestimonialsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.donorTestimonialsSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const quoteIconColorKey = (props?.donorTestimonialsQuoteIconColorKey ?? "")
    .toString()
    .trim();
  const quoteIconColor = quoteIconColorKey
    ? getColor(quoteIconColorKey)
    : "#E03C33";
  const nameColorKey = (props?.donorTestimonialsNameColorKey ?? "")
    .toString()
    .trim();
  const nameColor = nameColorKey ? getColor(nameColorKey) : undefined;
  const quoteTextColorKey = (props?.donorTestimonialsQuoteTextColorKey ?? "")
    .toString()
    .trim();
  const quoteTextColor = quoteTextColorKey
    ? getColor(quoteTextColorKey)
    : undefined;
  const roleColorKey = (props?.donorTestimonialsRoleColorKey ?? "")
    .toString()
    .trim();
  const roleColor = roleColorKey ? getColor(roleColorKey) : undefined;
  const fontSize = (value, fallback, min, max) => {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? Math.min(max, Math.max(min, parsed))
      : fallback;
  };
  const designStyle = {
    "--donor-card-bg": getColor("white"),
    "--donor-card-bg-alt": getColor("surface"),
    "--donor-card-border": getColor("border"),
    "--donor-card-shadow": getColor("black"),
    "--donor-quote-icon": quoteIconColor,
    "--donor-quote-text": quoteTextColor || getColor("black"),
    "--donor-name": nameColor || getColor("black"),
    "--donor-role": roleColor || getColor("blackLight"),
    "--donor-quote-icon-size": fontSize(props?.donorTestimonialsQuoteIconFontSize, 32, 16, 72),
    "--donor-quote-text-size": fontSize(props?.donorTestimonialsQuoteTextFontSize, 16, 11, 32),
    "--donor-name-size": fontSize(props?.donorTestimonialsNameFontSize, 12, 10, 28),
    "--donor-role-size": fontSize(props?.donorTestimonialsRoleFontSize, 11, 9, 24),
  };

  /* ── Items ── */
  const items = Array.isArray(props?.donorTestimonialsItems)
    ? props.donorTestimonialsItems
    : [];

  /* ── Section bg ── */
  const sectionBgType = (
    props?.donorTestimonialsSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.donorTestimonialsSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.donorTestimonialsSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.donorTestimonialsSectionPaddingTop != null
      ? Number(props.donorTestimonialsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.donorTestimonialsSectionPaddingBottom != null
      ? Number(props.donorTestimonialsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.donorTestimonialsSectionMarginTop != null
      ? Number(props.donorTestimonialsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.donorTestimonialsSectionMarginBottom != null
      ? Number(props.donorTestimonialsSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = (
    props?.donorTestimonialsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.donorTestimonialsPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.donorTestimonialsPageContainerBgColorKey ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.donorTestimonialsPageContainerPaddingTop != null
      ? Number(props.donorTestimonialsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.donorTestimonialsPageContainerPaddingRight != null
      ? Number(props.donorTestimonialsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.donorTestimonialsPageContainerPaddingBottom != null
      ? Number(props.donorTestimonialsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.donorTestimonialsPageContainerPaddingLeft != null
      ? Number(props.donorTestimonialsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.donorTestimonialsPageContainerMarginTop != null
      ? Number(props.donorTestimonialsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.donorTestimonialsPageContainerMarginBottom != null
      ? Number(props.donorTestimonialsPageContainerMarginBottom)
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section" style={designStyle}>
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <TestimonialsHeading style={getHeaderAlignStyles(titleAlign)}>
              {subTitleEnabled && subTitle && (
                <p className="fable-eyebrow"
                  style={{ ...(subTitleColor ? { color: subTitleColor } : {}), ...getSubtitleAlignStyles(titleAlign) }}
                >
                  {subTitle}
                </p>
              )}
              {titleEnabled && mainTitle && (
                <h2
                  className="fable-heading"
                  style={{ ...(titleColor ? { color: titleColor } : {}), ...getTitleAlignStyles(titleAlign) }}
                >
                  {renderHighlightedTitle(mainTitle, props)}
                </h2>
              )}
          </TestimonialsHeading>
        )}
        <TestimonialsGrid className="fable-testimonials">
        {items.map((item, idx) => {
          const quote = (item?.quote ?? "").toString().trim();
          const name = (item?.name ?? "").toString().trim();
          const role = (item?.role ?? "").toString().trim();
          return (
            <TestimonialCard key={idx} style={{ textAlign: paragraphAlign }}>
              <QuoteIcon
                aria-hidden="true"
                style={{
                  textAlign: paragraphAlign,
                  marginLeft: paragraphAlign === "center" ? "auto" : paragraphAlign === "right" ? "auto" : "0",
                  marginRight: paragraphAlign === "center" ? "auto" : paragraphAlign === "left" ? "auto" : "0",
                }}
              >
                &ldquo;
              </QuoteIcon>
              {quote && (
                <QuoteText style={{ textAlign: paragraphAlign }}>{quote}</QuoteText>
              )}
              {name || role ? (
                <PersonDetails style={{ textAlign: paragraphAlign }}>
                  {name ? <PersonName style={{ textAlign: paragraphAlign }}>{name}</PersonName> : null}
                  {role ? <PersonRole style={{ textAlign: paragraphAlign }}>{role}</PersonRole> : null}
                </PersonDetails>
              ) : null}
            </TestimonialCard>
          );
        })}
        </TestimonialsGrid>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
