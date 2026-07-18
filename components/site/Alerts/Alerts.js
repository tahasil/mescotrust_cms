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
const AlertCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  background: #fff;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 576px) {
    padding: 16px;
    gap: 12px;
  }
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: 10px;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  @media (max-width: 576px) {
    width: 32px;
    height: 32px;
  }
`;

const AlertContent = styled.div`
  flex: 1;
  min-width: 0;
  .alert-heading {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 4px;
    text-transform: capitalize !important;
    @media (max-width: 576px) {
      font-size: 14px;
    }
  }
  .alert-text {
    font-size: 16px;
    line-height: 1.4;
    color: rgba(0, 0, 0, 0.7);
    margin: 0;
    font-weight: 400;
    @media (max-width: 576px) {
      font-size: 12px;
    }
  }
`;

/**
 * Site component: Alerts.
 * Vertical list of alert cards with icon, optional heading, and description text.
 */
export default function Alerts(props) {
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.alertsTitleEnabled !== false;
  const subTitleEnabled = props?.alertsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.alertsSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const iconColorKey = (props?.alertsIconColorKey ?? "").toString().trim();
  const iconColor = iconColorKey ? getColor(iconColorKey) : "#E03C33";
  const headingColorKey = (props?.alertsHeadingColorKey ?? "")
    .toString()
    .trim();
  const headingColor = headingColorKey ? getColor(headingColorKey) : undefined;
  const textColorKey = (props?.alertsTextColorKey ?? "").toString().trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;

  /* ── Items ── */
  const items = Array.isArray(props?.alertsItems) ? props.alertsItems : [];

  /* ── Section bg ── */
  const PREFIX = "alerts";
  const sectionBgType = (
    props?.[PREFIX + "SectionBgType"] ?? "default"
  ).toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "")
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
    props?.[PREFIX + "SectionPaddingTop"] != null
      ? Number(props[PREFIX + "SectionPaddingTop"])
      : null;
  const sectionPaddingBottom =
    props?.[PREFIX + "SectionPaddingBottom"] != null
      ? Number(props[PREFIX + "SectionPaddingBottom"])
      : null;
  const sectionMarginTop =
    props?.[PREFIX + "SectionMarginTop"] != null
      ? Number(props[PREFIX + "SectionMarginTop"])
      : null;
  const sectionMarginBottom =
    props?.[PREFIX + "SectionMarginBottom"] != null
      ? Number(props[PREFIX + "SectionMarginBottom"])
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
    props?.[PREFIX + "PageContainerBgType"] ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.[PREFIX + "PageContainerBgColorKey"] ?? ""
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
    props?.[PREFIX + "PageContainerPaddingTop"] != null
      ? Number(props[PREFIX + "PageContainerPaddingTop"])
      : null;
  const containerPaddingRight =
    props?.[PREFIX + "PageContainerPaddingRight"] != null
      ? Number(props[PREFIX + "PageContainerPaddingRight"])
      : null;
  const containerPaddingBottom =
    props?.[PREFIX + "PageContainerPaddingBottom"] != null
      ? Number(props[PREFIX + "PageContainerPaddingBottom"])
      : null;
  const containerPaddingLeft =
    props?.[PREFIX + "PageContainerPaddingLeft"] != null
      ? Number(props[PREFIX + "PageContainerPaddingLeft"])
      : null;
  const containerMarginTop =
    props?.[PREFIX + "PageContainerMarginTop"] != null
      ? Number(props[PREFIX + "PageContainerMarginTop"])
      : null;
  const containerMarginBottom =
    props?.[PREFIX + "PageContainerMarginBottom"] != null
      ? Number(props[PREFIX + "PageContainerMarginBottom"])
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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        {items.map((item, idx) => {
          const heading = (item?.heading ?? "").toString().trim();
          const text = (item?.text ?? "").toString().trim();
          const itemIconUrl = (item?.iconUrl ?? "").toString().trim();
          return (
            <AlertCard key={idx}>
              <IconWrap>
                {itemIconUrl ? (
                  <img loading="lazy" src={itemIconUrl} alt="" />
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="16"
                      cy="13"
                      r="5"
                      stroke={iconColor}
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M16 8V6"
                      stroke={iconColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11.5 18L10 22H22L20.5 18"
                      stroke={iconColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 22V24"
                      stroke={iconColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M19 22V24"
                      stroke={iconColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 22V26"
                      stroke={iconColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="16" cy="13" r="2" fill={iconColor} />
                  </svg>
                )}
              </IconWrap>
              <AlertContent>
                {heading && (
                  <div
                    className="alert-heading"
                    style={headingColor ? { color: headingColor } : undefined}
                  >
                    {heading}
                  </div>
                )}
                {text && (
                  <p
                    className="alert-text"
                    style={textColor ? { color: textColor } : undefined}
                  >
                    {text}
                  </p>
                )}
              </AlertContent>
            </AlertCard>
          );
        })}
      </PageContainer>
    </FullWidthBackground>
  );
}
