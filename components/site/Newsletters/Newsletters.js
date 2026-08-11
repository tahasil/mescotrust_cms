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
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  isPdfDocumentUrl,
  normalizePdfTarget,
  usePdfViewerModal,
} from "@/components/site/shared/PdfViewerModal";

/* Styled Components */
const NewsletterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border: 1px solid
    ${({ $rowBorderColor }) => $rowBorderColor || getColor("border")} !important;
  border-radius: 12px;
  background: ${getColor("white")};
  margin-bottom: 12px;
  transition: border-color 0.2s ease;
  &:last-child {
    margin-bottom: 0;
  }
  &:hover {
    border-color: ${({ $rowBorderColor }) => $rowBorderColor || getColor("primary")};
  }
  @media (max-width: 576px) {
    padding: 8px 10px;
    gap: 12px;
  }
`;

const PdfIcon = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background-color: rgba(224, 60, 51, 0.1); */
  @media (max-width: 576px) {
    width: 36px;
    height: 36px;
  }
  svg {
    width: 24px;
    height: 24px;
    @media (max-width: 576px) {
      width: 18px;
      height: 18px;
    }
  }
`;

const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
  .nl-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    @media (max-width: 576px) {
      font-size: 12px;
      white-space: normal;
    }
  }
  .nl-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.45);
    @media (max-width: 576px) {
      font-size: 10px;
      white-space: normal;
    }
    .nl-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.45;
      flex-shrink: 0;
    }
  }
`;

const ViewLink = styled.a`
  flex-shrink: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  padding: 6px 20px;
  border: 1px solid ${getColor("transparent")};
  border-radius: 24px;
  transition: all 0.2s ease;
  @media (max-width: 576px) {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 16px;
  }
`;

/**
 * Site component: Newsletters.
 * Vertical list of PDF newsletter rows with icon, title, date, tag, and View link.
 */
export default function Newsletters(props) {
  const resolveThemeColor = (value) => {
    const raw = value != null ? String(value).trim() : "";
    if (!raw) return undefined;
    if (
      raw.startsWith("#") ||
      /^rgba?\(/i.test(raw) ||
      /^hsla?\(/i.test(raw) ||
      /gradient\(/i.test(raw) ||
      /^var\(/i.test(raw)
    ) {
      return raw;
    }
    return getColor(raw);
  };
  /* Title fields */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.newslettersTitleEnabled !== false;
  const subTitleEnabled = props?.newslettersSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? resolveThemeColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.newslettersSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? resolveThemeColor(subTitleColorKey)
    : undefined;

  /* Colors */
  const iconColorKey = (props?.newslettersIconColorKey ?? "").toString().trim();
  const iconColor = iconColorKey ? resolveThemeColor(iconColorKey) : "#E03C33";
  const viewColorKey = (props?.newslettersViewColorKey ?? "").toString().trim();
  const viewColor = viewColorKey ? resolveThemeColor(viewColorKey) : "#E03C33";
  const viewBgColorKey = (props?.newslettersViewBgColorKey ?? "")
    .toString()
    .trim();
  const viewBgColor = viewBgColorKey
    ? resolveThemeColor(viewBgColorKey)
    : undefined;
  const isViewBgGradient =
    typeof viewBgColor === "string" &&
    viewBgColor.toLowerCase().includes("gradient(");
  const cardBgColorKey = (props?.newslettersCardBgColorKey ?? "")
    .toString()
    .trim();
  const rowBorderColor = cardBgColorKey
    ? resolveThemeColor(cardBgColorKey)
    : undefined;
  const titleItemColorKey = (props?.newslettersTitleItemColorKey ?? "")
    .toString()
    .trim();
  const titleItemColor = titleItemColorKey
    ? resolveThemeColor(titleItemColorKey)
    : undefined;
  const dateColorKey = (props?.newslettersDateColorKey ?? "").toString().trim();
  const dateColor = dateColorKey ? resolveThemeColor(dateColorKey) : undefined;
  const iconBgColorKey = (props?.newslettersIconBgColorKey ?? "")
    .toString()
    .trim();
  const iconBgColor = iconBgColorKey
    ? resolveThemeColor(iconBgColorKey)
    : "rgba(224, 60, 51, 0.08)";

  /* Items */
  const items = Array.isArray(props?.newslettersItems)
    ? props.newslettersItems
    : [];
  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal({
    accentColor: viewColor,
  });

  /* Section bg */
  const PREFIX = "newsletters";
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
                <MainTitle className="fable-heading" color={titleColor}>{renderHighlightedTitle(mainTitle, props)}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        {items.map((item, idx) => {
          const title = (item?.title ?? "").toString().trim();
          const date = (item?.date ?? "").toString().trim();
          const tag = (item?.tag ?? "").toString().trim();
          const pdfUrl = (item?.pdfUrl ?? "").toString().trim();
          const configuredTarget = normalizePdfTarget(item?.target, "_blank");
          const opensPdfModal =
            configuredTarget === "modal" && isPdfDocumentUrl(pdfUrl);
          const target = configuredTarget === "_blank" ? "_blank" : "_self";
          return (
            <NewsletterRow className="fable-row-link"
              key={idx}
              $rowBorderColor={rowBorderColor}
            >
              <PdfIcon className="fable-row-icon" style={{ background: iconBgColor }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.97 24.165C11.97 24.87 11.355 25.455 10.635 25.455H9.39V22.875H10.65C11.37 22.875 11.985 23.46 11.985 24.165H11.97ZM22.5 12H32.31C31.785 10.635 30.99 9.375 29.925 8.31L24.705 3.075C23.64 2.01 22.38 1.215 21.015 0.69V10.5C21.015 11.325 21.69 12 22.515 12H22.5ZM18.135 22.875H16.875V28.125H18.135C18.855 28.125 19.47 27.54 19.47 26.835V24.165C19.47 23.46 18.855 22.875 18.135 22.875ZM33 15.735V28.5C33 32.64 29.64 36 25.5 36H10.5C6.36 36 3 32.64 3 28.5V7.5C3 3.36 6.36 0 10.5 0H17.265C17.505 0 17.745 0.015 18 0.03V10.5C18 12.975 20.025 15 22.5 15H32.97C32.985 15.24 33 15.48 33 15.735ZM13.845 24.165C13.845 22.425 12.405 21 10.635 21H9C8.175 21 7.5 21.675 7.5 22.5V29.16C7.5 29.685 7.92 30.09 8.43 30.09C8.94 30.09 9.36 29.67 9.36 29.16V27.33H10.62C12.39 27.33 13.83 25.905 13.83 24.165H13.845ZM21.345 24.165C21.345 22.425 19.905 21 18.135 21H16.5C15.675 21 15 21.675 15 22.5V29.16C15 29.685 15.42 30 15.93 30C16.44 30 18.12 30 18.12 30C19.89 30 21.33 28.575 21.33 26.835V24.165H21.345ZM28.53 21.945C28.53 21.42 28.11 21.015 27.6 21.015H24.135C23.61 21.015 23.205 21.435 23.205 21.945V29.16C23.205 29.685 23.625 30.09 24.135 30.09C24.645 30.09 25.065 29.67 25.065 29.16V26.46H26.925C27.45 26.46 27.855 26.04 27.855 25.53C27.855 25.02 27.435 24.6 26.925 24.6H25.065V22.89H27.6C28.125 22.89 28.53 22.47 28.53 21.96V21.945Z"
                    fill={iconColor}
                  />
                </svg>
              </PdfIcon>
              <ContentArea className="fable-row-copy">
                {title && (
                  <div
                    className="nl-title"
                    style={
                      titleItemColor ? { color: titleItemColor } : undefined
                    }
                  >
                    {title}
                  </div>
                )}
                <div
                  className="nl-meta"
                  style={dateColor ? { color: dateColor } : undefined}
                >
                  {date && <span>{date}</span>}
                  {date && tag && <span className="nl-dot" />}
                  {tag && <span>{tag}</span>}
                </div>
              </ContentArea>
              <ViewLink
                as={opensPdfModal ? "button" : "a"}
                type={opensPdfModal ? "button" : undefined}
                href={opensPdfModal ? undefined : pdfUrl || "#"}
                target={!opensPdfModal && pdfUrl ? target : undefined}
                rel={
                  !opensPdfModal && pdfUrl && target === "_blank"
                    ? "noopener noreferrer"
                    : undefined
                }
                aria-haspopup={opensPdfModal ? "dialog" : undefined}
                style={{
                  color: viewColor,
                  ...(viewBgColor
                    ? {
                        background: viewBgColor,
                        borderColor: isViewBgGradient
                          ? "transparent"
                          : viewBgColor,
                      }
                    : {}),
                }}
                onClick={
                  opensPdfModal
                    ? (event) =>
                        openPdf({
                          url: pdfUrl,
                          title: title || "PDF document",
                          trigger: event.currentTarget,
                        })
                    : pdfUrl
                      ? undefined
                      : (event) => event.preventDefault()
                }
              >
                View
              </ViewLink>
            </NewsletterRow>
          );
        })}
        </div>
        {pdfViewerModal}
      </PageContainer>
    </FullWidthBackground>
  );
}
