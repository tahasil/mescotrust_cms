"use client";

import { Row, Col, Card } from "antd";
import styled from "styled-components";
import { TrademarkCircleOutlined } from "@ant-design/icons";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";

const RegisteredUnderCard = styled(Card)`
  width: 100%;
  height: 100%;
  min-height: 88px;
  border: 1px solid ${() => getColor("themeBorder") || "rgba(0,0,0,0.1)"};
  border-radius: 20px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  .ant-card-body {
    width: 100%;
    height: 100%;
    min-height: 88px;
    display: flex;
    align-items: center;
    padding: 20px 24px;
    gap: 12px;
  }
  .registered-icon {
    flex-shrink: 0;
    font-size: 26px;
    color: ${() => getColor("black")};
    display: flex;
    align-items: center;
  }
  .registered-text {
    margin: 0px;
    font-size: 20px;
    line-height: 28px;
    font-weight: 700;
    color: ${() => getColor("black")};
    em {
      color: ${() => getColor("primary")};
      font-style: normal;
    }
    @media (max-width: 992px) {
      font-size: 16px;
      line-height: 24px;
      font-weight: 500;
    }
  }
`;

function normalizeItem(it) {
  return {
    text: it?.text != null ? String(it.text).trim() : "",
  };
}

/** Parse *highlighted* parts in text and render as <em> (primary color) */
function RenderCardText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

const DEFAULT_ITEMS = [
  { text: "The Societies Registration Act, *1860.*" },
  { text: "The Bombay Public Trust Act *1950.*" },
  { text: "Section 80-G of the Income Tax, *1961.*" },
  { text: "Foreign Contribution Regulation Act, (FCRA) *2010*, Ministry of Home Affairs. GOI." },
];

/**
 * Site component: Registered (Registered Under).
 * Centered title + 2x2 grid of cards with trademark icon.
 */
export default function Registered(props) {
  const mainTitle = (props?.registeredMainTitle ?? "Registered Under").toString().trim();
  const titleColorKey = (props?.registeredTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;

  const rawItems = props?.registeredItems;
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(normalizeItem).filter((i) => i.text)
      : DEFAULT_ITEMS;

  const PREFIX = "registered";

  // Section background
  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.[PREFIX + "SectionPaddingTop"] != null ? Number(props[PREFIX + "SectionPaddingTop"]) : null;
  const sectionPaddingBottom = props?.[PREFIX + "SectionPaddingBottom"] != null ? Number(props[PREFIX + "SectionPaddingBottom"]) : null;
  const sectionMarginTop = props?.[PREFIX + "SectionMarginTop"] != null ? Number(props[PREFIX + "SectionMarginTop"]) : null;
  const sectionMarginBottom = props?.[PREFIX + "SectionMarginBottom"] != null ? Number(props[PREFIX + "SectionMarginBottom"]) : null;
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

  // Page container background
  const pageContainerBgType = (props?.[PREFIX + "PageContainerBgType"] ?? "default").toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.[PREFIX + "PageContainerBgColorKey"] ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.[PREFIX + "PageContainerPaddingTop"] != null ? Number(props[PREFIX + "PageContainerPaddingTop"]) : null;
  const containerPaddingRight = props?.[PREFIX + "PageContainerPaddingRight"] != null ? Number(props[PREFIX + "PageContainerPaddingRight"]) : null;
  const containerPaddingBottom = props?.[PREFIX + "PageContainerPaddingBottom"] != null ? Number(props[PREFIX + "PageContainerPaddingBottom"]) : null;
  const containerPaddingLeft = props?.[PREFIX + "PageContainerPaddingLeft"] != null ? Number(props[PREFIX + "PageContainerPaddingLeft"]) : null;
  const containerMarginTop = props?.[PREFIX + "PageContainerMarginTop"] != null ? Number(props[PREFIX + "PageContainerMarginTop"]) : null;
  const containerMarginBottom = props?.[PREFIX + "PageContainerMarginBottom"] != null ? Number(props[PREFIX + "PageContainerMarginBottom"]) : null;
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

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24}>
            <MainTitle className="text-center mb-4" {...(titleColor ? { color: titleColor } : {})}>
              {mainTitle}
            </MainTitle>
          </Col>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          {items.map((item, index) => (
            <Col key={index} xs={24} sm={24} md={12} lg={12}>
              <RegisteredUnderCard>
                <span className="registered-icon">
                  <TrademarkCircleOutlined />
                </span>
                <h2 className="registered-text">
                  <RenderCardText text={item.text} />
                </h2>
              </RegisteredUnderCard>
            </Col>
          ))}
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
