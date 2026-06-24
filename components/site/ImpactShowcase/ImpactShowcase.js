"use client";

import { Row, Col, Space } from "antd";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
} from "@/styles/Theme";
import { RightOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

/**
 * Site component: ImpactShowcase (Impact Showcase).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function ImpactShowcase(props) {
  const router = useRouter();
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
  const button2Text = (props?.impactShowcaseButton2Text ?? "Volunteer")
    .toString()
    .trim();
  const button2Link = (props?.impactShowcaseButton2Link ?? "/")
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
  const btn1HoverBgKey = (props?.impactShowcaseButton1HoverBgColorKey ?? "")
    .toString()
    .trim();
  const btn1HoverTextKey = (
    props?.impactShowcaseButton1HoverTextColorKey ?? ""
  )
    .toString()
    .trim();
  const btn2HoverBgKey = (props?.impactShowcaseButton2HoverBgColorKey ?? "")
    .toString()
    .trim();
  const btn2HoverTextKey = (
    props?.impactShowcaseButton2HoverTextColorKey ?? ""
  )
    .toString()
    .trim();
  const btn1BgColor = btn1BgKey ? getColor(btn1BgKey) : undefined;
  const btn1TextColor = btn1TextKey ? getColor(btn1TextKey) : undefined;
  const btn2BgColor = btn2BgKey ? getColor(btn2BgKey) : undefined;
  const btn2TextColor = btn2TextKey ? getColor(btn2TextKey) : undefined;
  const btn1HoverBgColor = btn1HoverBgKey ? getColor(btn1HoverBgKey) : undefined;
  const btn1HoverTextColor = btn1HoverTextKey
    ? getColor(btn1HoverTextKey)
    : undefined;
  const btn2HoverBgColor = btn2HoverBgKey ? getColor(btn2HoverBgKey) : undefined;
  const btn2HoverTextColor = btn2HoverTextKey
    ? getColor(btn2HoverTextKey)
    : undefined;

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

  const btn1BaseBgColor = btn1BgColor || getColor("gradient");
  const btn1BaseTextColor = btn1TextColor || getColor("white");
  const btn2BaseBgColor = btn2BgColor || getColor("primaryLight");
  const btn2BaseTextColor = btn2TextColor || getColor("primary");
  const btn1ResolvedHoverBgColor = btn1HoverBgColor || getColor("white");
  const btn1ResolvedHoverTextColor = btn1HoverTextColor || getColor("primary");
  const btn2ResolvedHoverBgColor = btn2HoverBgColor || getColor("primary");
  const btn2ResolvedHoverTextColor = btn2HoverTextColor || getColor("white");
  const btn1ResolvedHoverBorderColor =
    btn1HoverBgColor || getColor("primary");
  const btn2ResolvedHoverBorderColor =
    btn2HoverBgColor || getColor("primary");

  const btn1Style = {
    background: btn1BaseBgColor,
    color: btn1BaseTextColor,
    "--impact-btn-text": btn1BaseTextColor,
    "--impact-btn-border": getColor("ctaBorder"),
    "--impact-btn-hover-bg": btn1ResolvedHoverBgColor,
    "--impact-btn-hover-text": btn1ResolvedHoverTextColor,
    "--impact-btn-hover-border": btn1ResolvedHoverBorderColor,
    "--impact-btn-icon-color": getColor("primary"),
    "--impact-btn-icon-hover-color": btn1ResolvedHoverTextColor,
  };
  const btn2Style = {
    background: btn2BaseBgColor,
    color: btn2BaseTextColor,
    boxShadow: "none",
    border: "1px solid transparent",
    "--impact-btn-text": btn2BaseTextColor,
    "--impact-btn-border": "transparent",
    "--impact-btn-hover-bg": btn2ResolvedHoverBgColor,
    "--impact-btn-hover-text": btn2ResolvedHoverTextColor,
    "--impact-btn-hover-border": btn2ResolvedHoverBorderColor,
    "--impact-btn-icon-color": btn2BaseTextColor,
    "--impact-btn-icon-hover-color": btn2ResolvedHoverTextColor,
  };
  const actionButtonBaseStyle = {
    minHeight: 48,
    borderRadius: 999,
    paddingInlineStart: 20,
    paddingInlineEnd: 12,
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.2,
    display: "inline-flex",
    alignItems: "center",
  };
  const iconBubbleBaseStyle = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 28px",
  };
  const btn1FinalStyle = { ...actionButtonBaseStyle, ...(btn1Style || {}) };
  const btn2FinalStyle = { ...actionButtonBaseStyle, ...(btn2Style || {}) };
  const buttonLabelStyle = { color: "inherit" };
  const isModalVolunteerTrigger =
    !button2Link ||
    button2Link === "/" ||
    button2Link === "#" ||
    button2Link === "#volunteer-modal";

  const navigateTo = (href) => {
    const nextHref = String(href || "").trim();
    if (!nextHref || nextHref === "#") return;
    if (
      /^https?:\/\//i.test(nextHref) ||
      /^mailto:/i.test(nextHref) ||
      /^tel:/i.test(nextHref)
    ) {
      window.location.assign(nextHref);
      return;
    }
    router.push(nextHref);
  };

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
            <Space size={16} className="mb-4">
              {button1Text && (
                <ThemeButton
                  className="impact-showcase-btn impact-showcase-btn--one"
                  type="button"
                  size="large"
                  icon={
                    <span
                      className="impact-showcase-btn__icon-wrap"
                      style={iconBubbleBaseStyle}
                    >
                      <RightOutlined
                        className="impact-showcase-btn__icon-svg"
                        style={{ fontSize: 12 }}
                      />
                    </span>
                  }
                  iconPosition="end"
                  style={btn1FinalStyle}
                  onClick={() => navigateTo(button1Link || "/")}
                >
                  <span
                    className="impact-showcase-btn__label"
                    style={buttonLabelStyle}
                  >
                    {button1Text}
                  </span>
                </ThemeButton>
              )}
              {button2Text && (
                isModalVolunteerTrigger ? (
                  <ThemeButton
                    className="impact-showcase-btn impact-showcase-btn--two"
                    type="button"
                    size="large"
                    icon={
                      <span
                        className="impact-showcase-btn__icon-wrap"
                        style={iconBubbleBaseStyle}
                      >
                        <UserOutlined
                          className="impact-showcase-btn__icon-svg"
                          style={{ fontSize: 13 }}
                        />
                      </span>
                    }
                    iconPosition="end"
                    style={btn2FinalStyle}
                    onClick={() =>
                      window.dispatchEvent(new Event("open-volunteer-modal"))
                    }
                  >
                    <span
                      className="impact-showcase-btn__label"
                      style={buttonLabelStyle}
                    >
                      {button2Text}
                    </span>
                  </ThemeButton>
                ) : (
                  <ThemeButton
                    className="impact-showcase-btn impact-showcase-btn--two"
                    type="button"
                    size="large"
                    icon={
                      <span
                        className="impact-showcase-btn__icon-wrap"
                        style={iconBubbleBaseStyle}
                      >
                        <UserOutlined
                          className="impact-showcase-btn__icon-svg"
                          style={{ fontSize: 13 }}
                        />
                      </span>
                    }
                    iconPosition="end"
                    style={btn2FinalStyle}
                    onClick={() => navigateTo(button2Link)}
                  >
                    <span
                      className="impact-showcase-btn__label"
                      style={buttonLabelStyle}
                    >
                      {button2Text}
                    </span>
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
