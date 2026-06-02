"use client";

import { Row, Col } from "antd";
import { RightCircleFilled } from "@ant-design/icons";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  Paragraph,
  ThemeButton,
} from "@/styles/Theme";

/**
 * Site component: HelpingEvents.
 * Events section with background, centered title, and event card (image + text + button).
 * All elements are editable via EditForm.
 */
export default function HelpingEvents(props) {
  /* ── Titles ── */
  const subTitle = (props?.subTitle ?? "Events").toString().trim();
  const mainTitle = (props?.mainTitle ?? "Helping people live a better tomorrow!").toString().trim();

  /* ── Event card content ── */
  const eventTitle = (props?.eventTitle ?? "").toString().trim();
  const eventDescription = (props?.eventDescription ?? "").toString().trim();
  const eventImageDesktop = (
    props?.eventImageDesktop ?? props?.eventImage ?? "/images/event-img.png"
  )
    .toString()
    .trim();
  const eventImageMobile = (props?.eventImageMobile ?? "").toString().trim();
  const eventImageAlt = (props?.eventImageAlt ?? "Event").toString().trim();
  const buttonText = (props?.buttonText ?? "Donate Now").toString().trim();
  const buttonLink = (props?.buttonLink ?? "/").toString().trim();

  /* ── Colors ── */
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const buttonBgColorKey = (props?.helpingEventsButtonBgColorKey ?? "").toString().trim();
  const buttonTextColorKey = (props?.helpingEventsButtonTextColorKey ?? "").toString().trim();

  /* ── Section background ── */
  const sectionBgType = (props?.helpingEventsSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.helpingEventsSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.helpingEventsSectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.helpingEventsSectionPaddingTop != null ? Number(props.helpingEventsSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.helpingEventsSectionPaddingBottom != null ? Number(props.helpingEventsSectionPaddingBottom) : null;
  const sectionMarginTop = props?.helpingEventsSectionMarginTop != null ? Number(props.helpingEventsSectionMarginTop) : null;
  const sectionMarginBottom = props?.helpingEventsSectionMarginBottom != null ? Number(props.helpingEventsSectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  /* ── Page container background ── */
  const pageContainerBgType = (props?.helpingEventsPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.helpingEventsPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.helpingEventsPageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.helpingEventsPageContainerPaddingTop != null ? Number(props.helpingEventsPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.helpingEventsPageContainerPaddingRight != null ? Number(props.helpingEventsPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.helpingEventsPageContainerPaddingBottom != null ? Number(props.helpingEventsPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.helpingEventsPageContainerPaddingLeft != null ? Number(props.helpingEventsPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.helpingEventsPageContainerMarginTop != null ? Number(props.helpingEventsPageContainerMarginTop) : null;
  const containerMarginBottom = props?.helpingEventsPageContainerMarginBottom != null ? Number(props.helpingEventsPageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  const buttonStyle = {};
  if (buttonBgColorKey) buttonStyle.background = getColor(buttonBgColorKey);
  if (buttonTextColorKey) buttonStyle.color = getColor(buttonTextColorKey);

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]}>
          <Col
            span={24}
            sm={{ span: 24, offset: 0 }}
            md={{ span: 10, offset: 7 }}
            lg={{ span: 10, offset: 7 }}
            className="mb-4 text-center"
          >
            <SubTitle className="text-white">{subTitle}</SubTitle>
            <MainTitle className="text-white" color={titleColor}>
              {mainTitle}
            </MainTitle>
          </Col>
        </Row>
        <div className="innerEventBox">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={12} lg={10}>
              <picture>
                {eventImageMobile ? (
                  <source media="(max-width: 767px)" srcSet={eventImageMobile} />
                ) : null}
                <img
                  loading="lazy"
                  className="img-fluid"
                  src={eventImageDesktop || eventImageMobile}
                  alt={eventImageAlt}
                />
              </picture>
            </Col>
            <Col xs={24} sm={24} md={12} lg={14}>
              {eventTitle && <h2>{eventTitle}</h2>}
              {eventDescription && (
                <Paragraph
                  className="text-white"
                  opacity={0.8}
                  fontSize={16}
                  fontWeight={400}
                >
                  {eventDescription}
                </Paragraph>
              )}
              {buttonText && (
                <ThemeButton
                  className="mt-4"
                  type="button"
                  size="large"
                  style={Object.keys(buttonStyle).length > 0 ? buttonStyle : undefined}
                  onClick={() => (window.location.href = buttonLink)}
                  icon={<RightCircleFilled />}
                  iconPosition="end"
                >
                  {buttonText}
                </ThemeButton>
              )}
            </Col>
          </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
