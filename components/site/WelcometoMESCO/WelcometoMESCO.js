"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  Paragraph,
  ThemeButton,
} from "@/styles/Theme";

const HomeHelping = styled.div`
  width: 100%;
  position: relative;
  background: var(--card-bg-color, #fff);
  border: 1px solid var(--theme-theme-border, var(--border-color, rgba(0, 0, 0, 0.12)));
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  border-radius: 24px;
  @media (max-width: 992px) {
    padding: 24px;
  }
  @media (max-width: 576px) {
    padding: 20px;
    border-radius: 18px;
  }
`;

const HomeHelpingBottom = styled.div`
  width: 90%;
  margin: 0 auto;
  position: relative;
  border: none;
  background: ${() => getColor("gradient")};
  border-radius: 0px 0px 40px 40px;
  text-align: center;
  padding: 24px 0;
  @media (max-width: 768px) {
    width: 80%;
  }
  .borderRight {
    width: 100%;
    position: relative;
    border-right: 1px solid ${() => getColor("ctaBorder")};
    @media (max-width: 992px) {
      border-right: none;
    }
    @media (max-width: 576px) {
      border-right: none;
      border-bottom: 1px solid ${() => getColor("ctaBorder")};
      padding-bottom: 20px;
    }
  }
  svg {
    margin: 0 auto;
  }
  h2 {
    margin: 0px;
    font-size: 24px;
    font-weight: 600;
    color: ${() => getColor("white")};
    text-align: center;
    margin: 4px 0px;
    padding: 0px 24px;
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  p {
    margin: 0px;
    font-size: 16px;
    font-weight: 400;
    color: ${() => getColor("white")};
    text-align: center;
    padding: 0px 24px;
    @media (max-width: 768px) {
      font-size: 14px;
      padding: 0px 16px;
    }
  }
`;

const DEFAULT_STATS = [
  {
    number: "89052",
    label: "Educational Scholarships Students",
    iconImage: "",
  },
  {
    number: "12199",
    label: "Educational Scholarships Students",
    iconImage: "",
  },
  {
    number: "833000",
    label: "Educational Scholarships Students",
    iconImage: "",
  },
  { number: "2509", label: "Educational Scholarships Students", iconImage: "" },
];

function normalizeStatItem(it) {
  return {
    number: it?.number != null ? String(it.number).trim() : "",
    label: it?.label != null ? String(it.label).trim() : "",
    iconImage: it?.iconImage != null ? String(it.iconImage).trim() : "",
  };
}

/**
 * Site component: WelcometoMESCO (Welcome to MESCO).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * All elements are editable via EditForm.
 */
export default function WelcometoMESCO(props) {
  /* ── Title & texts ── */
  const welcomeLabel = (props?.welcomeLabel ?? "Welcome to MESCO")
    .toString()
    .trim();
  const mainTitle = (props?.mainTitle ?? "Helping people live better tomorrow")
    .toString()
    .trim();
  const highlightText = (
    props?.highlightText ?? "We are the largest crowdfunding"
  )
    .toString()
    .trim();
  const description = (
    props?.description ??
    "MESCO is a Secular Trust registered in 1968 with the Charity Commissioner of Mumbai. The organization is a selfless effort for serving mankind which began with a few friends who constituted the first Managing Committee. 'Education' was identified as a core theme for human development by the organization and later it expanded to provide Medical Assistance and Poverty Relief. The organization touches the lives of over 15,000 families annually through a combination of well strategized and implemented schemes, programs, activities and its institutions. The approach has always been to uphold ethical values in delivering and becoming a channel to deliver resources from those who want to giveto those who need it the most."
  )
    .toString()
    .trim();
  const secondaryText = (
    props?.secondaryText ??
    "Trusted today by a large number of noble souls (individuals, families, foundations, charities and corporate) both in the country and abroad, the organization strives to bring happiness..."
  )
    .toString()
    .trim();

  /* ── Button ── */
  const buttonText = (props?.buttonText ?? "Zakat Appeal").toString().trim();
  const buttonLink = (props?.buttonLink ?? "/").toString().trim();

  /* ── Image ── */
  const imageDesktop = (
    props?.imageDesktop ?? props?.imageUrl ?? "/images/helping.png"
  )
    .toString()
    .trim();
  const imageMobile = (props?.imageMobile ?? "").toString().trim();
  const imageAlt = (props?.imageAlt ?? "Helping").toString().trim();

  /* ── Stats ── */
  const rawStats = props?.welcometoMESCOStats;
  const stats =
    Array.isArray(rawStats) && rawStats.length > 0
      ? rawStats.map(normalizeStatItem)
      : DEFAULT_STATS;

  /* ── Colors ── */
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const highlightColorKey = (props?.welcometoMESCOHighlightColorKey ?? "")
    .toString()
    .trim();
  const highlightColor = highlightColorKey
    ? getColor(highlightColorKey)
    : getColor("primary");
  const buttonBgColorKey = (props?.welcometoMESCOButtonBgColorKey ?? "")
    .toString()
    .trim();
  const buttonTextColorKey = (props?.welcometoMESCOButtonTextColorKey ?? "")
    .toString()
    .trim();

  /* ── Section background ── */
  const sectionBgType = (
    props?.welcometoMESCOSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.welcometoMESCOSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.welcometoMESCOSectionBgColorKey ?? "")
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
    props?.welcometoMESCOSectionPaddingTop != null
      ? Number(props.welcometoMESCOSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.welcometoMESCOSectionPaddingBottom != null
      ? Number(props.welcometoMESCOSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.welcometoMESCOSectionMarginTop != null
      ? Number(props.welcometoMESCOSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.welcometoMESCOSectionMarginBottom != null
      ? Number(props.welcometoMESCOSectionMarginBottom)
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

  /* ── Page container background ── */
  const pageContainerBgType = (
    props?.welcometoMESCOPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.welcometoMESCOPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.welcometoMESCOPageContainerBgColorKey ?? ""
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
    props?.welcometoMESCOPageContainerPaddingTop != null
      ? Number(props.welcometoMESCOPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.welcometoMESCOPageContainerPaddingRight != null
      ? Number(props.welcometoMESCOPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.welcometoMESCOPageContainerPaddingBottom != null
      ? Number(props.welcometoMESCOPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.welcometoMESCOPageContainerPaddingLeft != null
      ? Number(props.welcometoMESCOPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.welcometoMESCOPageContainerMarginTop != null
      ? Number(props.welcometoMESCOPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.welcometoMESCOPageContainerMarginBottom != null
      ? Number(props.welcometoMESCOPageContainerMarginBottom)
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

  const buttonStyle = {};
  if (buttonBgColorKey) buttonStyle.background = getColor(buttonBgColorKey);
  if (buttonTextColorKey) buttonStyle.color = getColor(buttonTextColorKey);

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <HomeHelping>
          <Row gutter={[16, 16]} align="middle">
            <Col
              xs={{ span: 24, order: 2 }}
              sm={{ span: 24, order: 2 }}
              md={{ span: 24, order: 2 }}
              lg={{ span: 12, order: 1 }}
            >
              <SubTitle>{welcomeLabel}</SubTitle>
              <MainTitle className="mb-4" color={titleColor}>
                {mainTitle}
              </MainTitle>
              <SubTitle color={highlightColor}>{highlightText}</SubTitle>
              <Paragraph fontSize={14} fontWeight={500} opacity={1}>
                {description}
              </Paragraph>
              <Paragraph fontSize={14} fontWeight={500} opacity={0.5}>
                {secondaryText}
              </Paragraph>
              {buttonText && (
                <ThemeButton
                  className="mt-4"
                  type="button"
                  size="large"
                  style={
                    Object.keys(buttonStyle).length > 0
                      ? buttonStyle
                      : undefined
                  }
                  onClick={() => (window.location.href = buttonLink)}
                >
                  {buttonText}
                </ThemeButton>
              )}
            </Col>
            <Col
              xs={{ span: 24, order: 1 }}
              sm={{ span: 24, order: 1 }}
              md={{ span: 24, order: 1 }}
              lg={{ span: 12, order: 2 }}
            >
              <picture>
                {imageMobile ? (
                  <source media="(max-width: 767px)" srcSet={imageMobile} />
                ) : null}
                <img
                  loading="lazy"
                  className="w-100"
                  src={imageDesktop || imageMobile}
                  alt={imageAlt}
                />
              </picture>
            </Col>
          </Row>
        </HomeHelping>

        <HomeHelpingBottom>
          <Row gutter={[16, 16]}>
            {stats.map((stat, i) => (
              <Col key={i} span={24} sm={24} md={12} lg={6}>
                <div
                  className={
                    i < stats.length - 1
                      ? "borderRight text-center"
                      : "text-center"
                  }
                >
                  {stat.iconImage && (
                    <img
                      loading="lazy"
                      src={stat.iconImage}
                      alt={stat.label}
                      width={30}
                      height={30}
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  <h2>{stat.number}</h2>
                  <p>{stat.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </HomeHelpingBottom>
      </PageContainer>
    </FullWidthBackground>
  );
}
