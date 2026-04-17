"use client";

import { Row, Col, Space } from "antd";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
} from "@/styles/Theme";
import { RightCircleFilled } from "@ant-design/icons";
import Link from "next/link";

/**
 * Site component: ImpactShowcase (Impact Showcase).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function ImpactShowcase(props) {
  const leftImageDesktop = (
    props?.impactShowcaseLeftImageDesktop ??
    props?.impactShowcaseLeftImage ??
    "/images/about-mesco-1.png"
  )
    .toString()
    .trim();
  const leftImageMobile = (props?.impactShowcaseLeftImageMobile ?? "")
    .toString()
    .trim();
  const rightImageDesktop = (
    props?.impactShowcaseRightImageDesktop ??
    props?.impactShowcaseRightImage ??
    "/images/about-mesco-2.png"
  )
    .toString()
    .trim();
  const rightImageMobile = (props?.impactShowcaseRightImageMobile ?? "")
    .toString()
    .trim();
  const button1Text = (props?.impactShowcaseButton1Text ?? "Contact Us")
    .toString()
    .trim();
  const button1Link = (props?.impactShowcaseButton1Link ?? "/")
    .toString()
    .trim();
  const button1IconUrl = (props?.impactShowcaseButton1IconUrl ?? "")
    .toString()
    .trim();
  const button2Text = (props?.impactShowcaseButton2Text ?? "Volunteer")
    .toString()
    .trim();
  const button2Link = (props?.impactShowcaseButton2Link ?? "/")
    .toString()
    .trim();
  const button2IconUrl = (
    props?.impactShowcaseButton2IconUrl ?? "/images/volunteer-icon.svg"
  )
    .toString()
    .trim();

  const btn1BgKey = (props?.impactShowcaseButton1BgColorKey ?? "")
    .toString()
    .trim();
  const btn1TextKey = (props?.impactShowcaseButton1TextColorKey ?? "")
    .toString()
    .trim();
  const btn2BgKey = (props?.impactShowcaseButton2BgColorKey ?? "")
    .toString()
    .trim();
  const btn2TextKey = (props?.impactShowcaseButton2TextColorKey ?? "")
    .toString()
    .trim();
  const btn1BgColor = btn1BgKey ? getColor(btn1BgKey) : undefined;
  const btn1TextColor = btn1TextKey ? getColor(btn1TextKey) : undefined;
  const btn2BgColor = btn2BgKey ? getColor(btn2BgKey) : undefined;
  const btn2TextColor = btn2TextKey ? getColor(btn2TextKey) : undefined;

  const sectionBgType = (
    props?.impactShowcaseSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.impactShowcaseSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.impactShowcaseSectionBgColorKey ?? "")
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
    props?.impactShowcaseSectionPaddingTop != null
      ? Number(props.impactShowcaseSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.impactShowcaseSectionPaddingBottom != null
      ? Number(props.impactShowcaseSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.impactShowcaseSectionMarginTop != null
      ? Number(props.impactShowcaseSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.impactShowcaseSectionMarginBottom != null
      ? Number(props.impactShowcaseSectionMarginBottom)
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
    props?.impactShowcasePageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.impactShowcasePageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.impactShowcasePageContainerBgColorKey ?? ""
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
    props?.impactShowcasePageContainerPaddingTop != null
      ? Number(props.impactShowcasePageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.impactShowcasePageContainerPaddingRight != null
      ? Number(props.impactShowcasePageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.impactShowcasePageContainerPaddingBottom != null
      ? Number(props.impactShowcasePageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.impactShowcasePageContainerPaddingLeft != null
      ? Number(props.impactShowcasePageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.impactShowcasePageContainerMarginTop != null
      ? Number(props.impactShowcasePageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.impactShowcasePageContainerMarginBottom != null
      ? Number(props.impactShowcasePageContainerMarginBottom)
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

  const btn1Style =
    btn1BgKey || btn1TextKey
      ? {
          ...(btn1BgColor ? { background: btn1BgColor } : {}),
          ...(btn1TextColor ? { color: btn1TextColor } : {}),
        }
      : undefined;
  const btn2Style =
    btn2BgKey || btn2TextKey
      ? {
          ...(btn2BgColor ? { background: btn2BgColor } : {}),
          ...(btn2TextColor ? { color: btn2TextColor } : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={14}>
            {leftImageDesktop || leftImageMobile ? (
              <picture>
                {leftImageMobile ? (
                  <source media="(max-width: 767px)" srcSet={leftImageMobile} />
                ) : null}
                <img
                  loading="lazy"
                  className="img-fluid"
                  src={leftImageDesktop || leftImageMobile}
                  alt="Impact"
                />
              </picture>
            ) : (
              <div
                style={{
                  minHeight: 200,
                  background: "#f0f0f0",
                  borderRadius: 8,
                }}
              />
            )}
          </Col>
          <Col xs={24} sm={24} md={24} lg={10}>
            <Space gap={16} className="mb-4">
              {button1Text && (
                <Link href={button1Link || "/"}>
                  <ThemeButton
                    type="button"
                    size="large"
                    icon={
                      button1IconUrl ? (
                        <img loading="lazy" alt="" src={button1IconUrl} />
                      ) : (
                        <RightCircleFilled />
                      )
                    }
                    iconPosition="end"
                    style={btn1Style}
                  >
                    {button1Text}
                  </ThemeButton>
                </Link>
              )}
              {button2Text && (
                button2Link && button2Link !== "/" && button2Link !== "#" && button2Link !== "#volunteer-modal" ? (
                  <Link href={button2Link}>
                    <ThemeButton
                      className="volunteer"
                      type="button"
                      size="large"
                      icon={
                        button2IconUrl ? (
                          <img loading="lazy" alt="" src={button2IconUrl} />
                        ) : (
                          <RightCircleFilled />
                        )
                      }
                      iconPosition="end"
                      style={btn2Style}
                    >
                      {button2Text}
                    </ThemeButton>
                  </Link>
                ) : (
                  <ThemeButton
                    className="volunteer"
                    type="button"
                    size="large"
                    icon={
                      button2IconUrl ? (
                        <img loading="lazy" alt="" src={button2IconUrl} />
                      ) : (
                        <RightCircleFilled />
                      )
                    }
                    iconPosition="end"
                    style={btn2Style}
                    onClick={() => window.dispatchEvent(new Event("open-volunteer-modal"))}
                  >
                    {button2Text}
                  </ThemeButton>
                )
              )}
            </Space>
            {rightImageDesktop || rightImageMobile ? (
              <picture>
                {rightImageMobile ? (
                  <source media="(max-width: 767px)" srcSet={rightImageMobile} />
                ) : null}
                <img
                  loading="lazy"
                  className="img-fluid"
                  src={rightImageDesktop || rightImageMobile}
                  alt="Impact"
                />
              </picture>
            ) : (
              <div
                style={{
                  minHeight: 200,
                  background: "#f0f0f0",
                  borderRadius: 8,
                }}
              />
            )}
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
