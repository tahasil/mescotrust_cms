"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import { ArrowRightOutlined } from "@ant-design/icons";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";

const HomeLongButton = styled.button`
  width: 100%;
  position: relative;
  height: auto;
  padding: 20px;
  border: 1px solid rgba(5, 5, 5, 0.1);
  border-radius: 20px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05) !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22px;
  font-weight: 600;
  color: ${() => getColor("black")};
  background: #fff !important;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;
  margin-bottom: 10px;
  cursor: pointer;
  @media (max-width: 768px) {
    padding: 16px;
    font-size: 18px;
  }
  &:last-child {
    margin-bottom: 0px;
  }
  .buttonIcon {
    margin: 0px;
    padding: 0px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${() => getColor("primary")};
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    rotate: -45deg;
    transition: all 0.3s ease;
    color: ${() => getColor("white")};
    flex-shrink: 0;
    @media (max-width: 768px) {
      width: 30px;
      height: 30px;
    }
    svg {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
  }
  &:hover {
    border-color: ${() => getColor("white")} !important;
    color: ${() => getColor("primary")} !important;
    transform: translateY(-3px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
    .buttonIcon {
      background: ${() => getColor("white")} !important;
      border: 1px solid ${() => getColor("primary")} !important;
    }
    svg {
      rotate: 0deg !important;
      color: ${() => getColor("primary")} !important;
    }
  }
  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(207, 55, 47, 0.15) !important;
  }
`;

const DEFAULT_ITEMS = [
  { label: "Form5A PF", link: "" },
  { label: "Form5A PF", link: "" },
  { label: "Form5A PF", link: "" },
];

function normalizeItem(it) {
  return {
    label: it?.label != null ? String(it.label).trim() : "",
    link: it?.link != null ? String(it.link).trim() : "",
  };
}

/**
 * Site component: Notices.
 * Title + list of notice buttons with arrow icons.
 * All elements are editable via EditForm.
 */
export default function Notices(props) {
  /* ── Title ── */
  const mainTitle = (props?.mainTitle ?? "Important Notices").toString().trim();
  const titleEnabled = props?.noticesTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;

  /* ── Items ── */
  const rawItems = props?.noticesItems;
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(normalizeItem)
      : DEFAULT_ITEMS;

  /* ── Section background ── */
  const sectionBgType = (props?.noticesSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.noticesSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.noticesSectionBgColorKey ?? "")
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
    props?.noticesSectionPaddingTop != null
      ? Number(props.noticesSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.noticesSectionPaddingBottom != null
      ? Number(props.noticesSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.noticesSectionMarginTop != null
      ? Number(props.noticesSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.noticesSectionMarginBottom != null
      ? Number(props.noticesSectionMarginBottom)
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
    props?.noticesPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.noticesPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.noticesPageContainerBgColorKey ?? "")
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
    props?.noticesPageContainerPaddingTop != null
      ? Number(props.noticesPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.noticesPageContainerPaddingRight != null
      ? Number(props.noticesPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.noticesPageContainerPaddingBottom != null
      ? Number(props.noticesPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.noticesPageContainerPaddingLeft != null
      ? Number(props.noticesPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.noticesPageContainerMarginTop != null
      ? Number(props.noticesPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.noticesPageContainerMarginBottom != null
      ? Number(props.noticesPageContainerMarginBottom)
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

  const handleClick = (link) => {
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {titleEnabled && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4 text-center">
              <MainTitle color={titleColor}>{mainTitle}</MainTitle>
            </Col>
          </Row>
        )}
        {items.map((item, i) => (
          <HomeLongButton
            key={i}
            type="button"
            onClick={() => handleClick(item.link)}
          >
            {item.label}
            <span className="buttonIcon">
              <ArrowRightOutlined />
            </span>
          </HomeLongButton>
        ))}
      </PageContainer>
    </FullWidthBackground>
  );
}
