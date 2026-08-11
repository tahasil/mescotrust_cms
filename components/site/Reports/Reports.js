"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  isPdfDocumentUrl,
  normalizePdfTarget,
  usePdfViewerModal,
} from "@/components/site/shared/PdfViewerModal";

/* ── Styled Components (same hover effect as InMedia) ── */
const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  border-radius: 20px;
  overflow: hidden;
  z-index: 0;
  &:hover {
    z-index: 2;
    box-shadow: 0 12px 30px color-mix(in srgb, var(--reports-card-shadow) 18%, transparent);
  }
`;

const ReportCard = styled.div`
  width: 100%;
  height: auto;
  border: 1px solid var(--reports-card-border);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: var(--reports-card-bg);
  padding: 0;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s, border-color 0.3s;
  &:hover {
    transform: translateY(-5px);
    border-color: var(--reports-card-border);
    box-shadow: 0 26px 54px color-mix(in srgb, var(--reports-card-shadow) 18%, transparent);
  }
  .card-wrapper:hover & {
    border-color: var(--reports-card-border);
  }
  .imageWrapper {
    width: 100%;
    height: auto;
    aspect-ratio: auto;
    overflow: hidden;
    border-radius: 0;
    background: var(--reports-card-bg);

    picture,
    img {
      width: 100%;
      height: auto;
      display: block;
    }

    img {
      max-width: 100%;
    }
  }
`;

const CardBody = styled.div`
  padding: clamp(20px, 2.2vw, 30px);
  text-align: start;
  .name {
    color: var(--reports-title);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 8px;
    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
  .description {
    margin: 0 0 8px;
    color: var(--reports-description);
    font-size: 14px;
    line-height: 1.55;
  }
  .tag {
    display: inline-block;
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    color: var(--reports-date);
  }
`;

const ProfileOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: var(--reports-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  transform-origin: center center;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
  z-index: 2;
  .card-wrapper:hover & {
    transform: scale(1);
    opacity: 1;
    pointer-events: auto;
  }
`;

const ViewBtn = styled.a`
  display: inline-block;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 30px;
  border: 2px solid var(--reports-button-border);
  background: var(--reports-button-bg);
  color: var(--reports-button-text);
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity 0.3s ease 0.08s,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s,
    background 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease;
  .card-wrapper:hover & {
    opacity: 1;
    transform: scale(1);
  }
  &:hover {
    border-color: var(--reports-button-hover-border);
    background: var(--reports-button-hover-bg);
    color: var(--reports-button-hover-text);
  }
`;

function color(value, fallback) {
  const key = value == null ? "" : String(value).trim();
  return key ? getColor(key) : fallback;
}

/**
 * Site component: Reports.
 * Same card UI + hover overlay as InMedia.
 * View button opens PDF in new tab.
 */
export default function Reports(props) {
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "Reports").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.reportsTitleEnabled !== false;
  const subTitleEnabled = props?.reportsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColor = color(props?.reportsSubTitleColorKey, undefined);

  /* ── Items ── */
  const items = Array.isArray(props?.reportsItems) ? props.reportsItems : [];

  /* ── Colors ── */
  const overlayText = color(props?.reportsOverlayTextColorKey, "#fff");
  const designStyle = {
    "--reports-card-bg": color(props?.reportsCardBgColorKey, "#fff"),
    "--reports-card-border": color(props?.reportsCardBorderColorKey, "rgba(0,0,0,0.1)"),
    "--reports-card-shadow": color(props?.reportsCardShadowColorKey, getColor("dark")),
    "--reports-title": color(props?.reportsNameColorKey, getColor("black")),
    "--reports-description": color(props?.reportsDescriptionColorKey, getColor("blackLight")),
    "--reports-date": color(props?.reportsDateColorKey, "rgba(0,0,0,0.65)"),
    "--reports-overlay": color(props?.reportsOverlayColorKey, "rgba(0,0,0,0.1)"),
    "--reports-overlay-text": overlayText,
    "--reports-button-bg": color(props?.reportsButtonBgColorKey, getColor("primary")),
    "--reports-button-text": color(props?.reportsButtonTextColorKey, overlayText),
    "--reports-button-border": color(props?.reportsButtonBorderColorKey, getColor("primary")),
    "--reports-button-hover-bg": color(props?.reportsButtonHoverBgColorKey, "#fff"),
    "--reports-button-hover-text": color(props?.reportsButtonHoverTextColorKey, getColor("primary")),
    "--reports-button-hover-border": color(props?.reportsButtonHoverBorderColorKey, getColor("primary")),
  };
  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal({
    accentColor: designStyle["--reports-button-bg"],
  });

  /* ── Section bg ── */
  const sectionBgType = (props?.reportsSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.reportsSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.reportsSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" && !sectionBgColorKey ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.reportsSectionPaddingTop != null
      ? Number(props.reportsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.reportsSectionPaddingBottom != null
      ? Number(props.reportsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.reportsSectionMarginTop != null
      ? Number(props.reportsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.reportsSectionMarginBottom != null
      ? Number(props.reportsSectionMarginBottom)
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
    props?.reportsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.reportsPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.reportsPageContainerBgColorKey ?? "")
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
    props?.reportsPageContainerPaddingTop != null
      ? Number(props.reportsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.reportsPageContainerPaddingRight != null
      ? Number(props.reportsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.reportsPageContainerPaddingBottom != null
      ? Number(props.reportsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.reportsPageContainerPaddingLeft != null
      ? Number(props.reportsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.reportsPageContainerMarginTop != null
      ? Number(props.reportsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.reportsPageContainerMarginBottom != null
      ? Number(props.reportsPageContainerMarginBottom)
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
        {(titleEnabled || subTitleEnabled) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow"
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && (
                <h2
                  className="fable-heading"
                  style={titleColor ? { color: titleColor } : undefined}
                >
                  {renderHighlightedTitle(mainTitle, props)}
                </h2>
              )}
            </Col>
          </Row>
        )}
        <Row gutter={[24, 24]}>
          {items.map((item, idx) => {
            const name = (item?.name ?? "").toString().trim();
            const tag = (item?.tag ?? "").toString().trim();
            const description = (item?.description ?? "").toString().trim();
            const imageDesktop = (
              item?.imageDesktop ?? item?.image ?? ""
            )
              .toString()
              .trim();
            const imageMobile = (item?.imageMobile ?? "").toString().trim();
            const image = imageDesktop || imageMobile;
            const pdfUrl = (item?.pdfUrl ?? "").toString().trim();
            const configuredTarget = normalizePdfTarget(item?.target, "_blank");
            const opensPdfModal =
              configuredTarget === "modal" && isPdfDocumentUrl(pdfUrl);
            const target = configuredTarget === "_blank" ? "_blank" : "_self";
            return (
              <Col key={idx} xs={24} sm={12} md={12} lg={8}>
                <CardWrapper className="card-wrapper fable-card">
                  <ReportCard className="fable-card__inner">
                    {image ? (
                      <div className="imageWrapper">
                        <picture>
                          {imageMobile ? (
                            <source media="(max-width: 767px)" srcSet={imageMobile} />
                          ) : null}
                          <img
                            loading="lazy"
                            className="w-100"
                            src={imageDesktop || imageMobile}
                            alt={name}
                            style={{ display: "block" }}
                          />
                        </picture>
                      </div>
                    ) : (
                      <div className="imageWrapper" />
                    )}
                    <CardBody className="fable-card__body">
                      {name && <div className="name">{name}</div>}
                      {description ? <p className="description">{description}</p> : null}
                      {tag && <span className="tag">{tag}</span>}
                    </CardBody>
                  </ReportCard>
                  {pdfUrl && (
                    <ProfileOverlay>
                      {opensPdfModal ? (
                        <ViewBtn
                          as="button"
                          type="button"
                          aria-haspopup="dialog"
                          onClick={(event) =>
                            openPdf({
                              url: pdfUrl,
                              title: name || "PDF document",
                              trigger: event.currentTarget,
                            })
                          }
                        >
                          View
                        </ViewBtn>
                      ) : (
                        <ViewBtn
                          href={pdfUrl}
                          target={target}
                          rel={target === "_blank" ? "noopener noreferrer" : undefined}
                        >
                          View
                        </ViewBtn>
                      )}
                    </ProfileOverlay>
                  )}
                </CardWrapper>
              </Col>
            );
          })}
        </Row>
        </div>
        {pdfViewerModal}
      </PageContainer>
    </FullWidthBackground>
  );
}
