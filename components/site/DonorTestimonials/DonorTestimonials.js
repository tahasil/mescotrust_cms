"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/* ── Styled Components ── */
const TestimonialCard = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 32px;
  background: #fff;
  margin-bottom: 16px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const QuoteIcon = styled.div`
  margin-bottom: 16px;
  svg {
    width: 40px;
    height: 40px;
  }
  @media (max-width: 768px) {
    svg {
      width: 32px;
      height: 32px;
    }
  }
`;

const QuoteText = styled.p`
  font-size: 16px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 20px;
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const PersonName = styled.div`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 2px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const PersonRole = styled.div`
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.5);
`;

/**
 * Site component: DonorTestimonials.
 * Vertical list of testimonial cards with quote icon, text, name, and role.
 */
export default function DonorTestimonials(props) {
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
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow"
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        <div className="fable-testimonials">
        {items.map((item, idx) => {
          const quote = (item?.quote ?? "").toString().trim();
          const name = (item?.name ?? "").toString().trim();
          const role = (item?.role ?? "").toString().trim();
          return (
            <TestimonialCard className="fable-testimonial" key={idx}>
              <QuoteIcon className="fable-testimonial__mark">
                <svg
                  viewBox="0 0 40 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 32V12.8C0 9.07 0.853 5.97 2.56 3.52C4.267 1.07 7.04 0 10.88 0V6.4C9.173 6.4 7.893 7.04 7.04 8.32C6.187 9.6 5.76 11.2 5.76 13.12H12.8V32H0ZM21.76 32V12.8C21.76 9.07 22.613 5.97 24.32 3.52C26.027 1.07 28.8 0 32.64 0V6.4C30.933 6.4 29.653 7.04 28.8 8.32C27.947 9.6 27.52 11.2 27.52 13.12H34.56V32H21.76Z"
                    fill={quoteIconColor}
                  />
                </svg>
              </QuoteIcon>
              {quote && (
                <QuoteText
                  style={quoteTextColor ? { color: quoteTextColor } : undefined}
                >
                  {quote}
                </QuoteText>
              )}
              {name && (
                <PersonName
                  style={nameColor ? { color: nameColor } : undefined}
                >
                  {name}
                </PersonName>
              )}
              {role && (
                <PersonRole
                  style={roleColor ? { color: roleColor } : undefined}
                >
                  {role}
                </PersonRole>
              )}
            </TestimonialCard>
          );
        })}
        </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
