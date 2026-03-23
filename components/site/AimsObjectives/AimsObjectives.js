"use client";

import { Row, Col, Card } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";

const AimsCard = styled(Card)`
  width: 100%;
  height: 100%;
  min-height: 88px;
  position: relative;
  background: #1c1d1d !important;
  border: none !important;
  border-left: 2px solid ${() => getColor("white")} !important;
  border-radius: 20px;
  color: ${(p) => p.$textColor || getColor("white")} !important;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: none !important;
  .ant-card-body {
    background: transparent;
    border: none;
  }
  @media (max-width: 992px) {
    font-size: 14px;
    line-height: 24px;
  }
`;

function normalizeItem(it) {
  return { text: it?.text != null ? String(it.text).trim() : "" };
}

const DEFAULT_ITEMS = [
  { text: "To promote education amongst the weaker section of society primarily and others generally. The promotion of education shall include the promotion of Science and Literature." },
  { text: "To work for the social upliftment of the backward sections of society." },
  { text: "To bring about a better understanding and appreciation of universal cultural values." },
];

/**
 * Site component: AimsObjectives (Aims & Objectives).
 * Centered title + stacked dark cards with white left border.
 */
export default function AimsObjectives(props) {
  const mainTitle = (props?.aimsObjectivesMainTitle ?? "Aims & Objectives").toString().trim();
  const titleColorKey = (props?.aimsObjectivesTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const textColorKey = (props?.aimsObjectivesTextColorKey ?? "").toString().trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;

  const rawItems = props?.aimsObjectivesItems;
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(normalizeItem).filter((i) => i.text)
      : DEFAULT_ITEMS;

  const PREFIX = "aimsObjectives";

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
          <Col xs={24} className="text-center">
            <MainTitle
              fontSize={36}
              fontWeight={600}
              lineHeight={40}
              className="text-white mb-3"
              {...(titleColor ? { color: titleColor } : {})}
            >
              {mainTitle}
            </MainTitle>
          </Col>
          <Col
            xs={{ span: 24, offset: 0 }}
            sm={{ span: 24, offset: 0 }}
            md={{ span: 20, offset: 2 }}
            lg={{ span: 18, offset: 3 }}
          >
            {items.map((item, index) => (
              <AimsCard key={index} className={index > 0 ? "mt-4" : undefined} $textColor={textColor}>
                {item.text}
              </AimsCard>
            ))}
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
