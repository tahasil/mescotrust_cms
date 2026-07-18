"use client";

import React, { useEffect, useRef } from "react";
import { Row, Col } from "antd";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ScrolledText,
} from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
`;

const DEFAULT_PARAGRAPHS = [
  "MESCO is a Secular Trust registered in 1968 with the Charity Commissioner of Mumbai. The organization is a selfless effort for serving mankind which began with a few friends who constituted the first Managing Committee.",
];

const LIGHT_COLOR = "rgba(42, 40, 62, 0.25)";
const DARK_COLOR = "rgb(42, 40, 62)";

/**
 * Site component: AnimationsText (Scroll Reveal Text).
 * Words animate from light to dark as user scrolls.
 * Props from theme/Component defaultProps via EditForm.
 */
export default function AnimationsText(props) {
  const rawParagraphs = props?.animationsTextParagraphs;
  const paragraphs =
    Array.isArray(rawParagraphs) && rawParagraphs.length > 0
      ? rawParagraphs
          .map((p) => (typeof p === "string" ? p : p?.text ?? "").toString().trim())
          .filter(Boolean)
      : DEFAULT_PARAGRAPHS;

  const fontSize = props?.animationsTextFontSize != null ? Number(props.animationsTextFontSize) || 20 : 20;
  const lineHeight = props?.animationsTextLineHeight != null ? Number(props.animationsTextLineHeight) || 34 : 34;
  const fontWeight = props?.animationsTextFontWeight != null ? Number(props.animationsTextFontWeight) || 500 : 500;
  const opacity = props?.animationsTextOpacity != null ? Number(props.animationsTextOpacity) : 1;

  const lightColorKey = (props?.animationsTextLightColorKey ?? "").toString().trim();
  const darkColorKey = (props?.animationsTextDarkColorKey ?? "").toString().trim();
  const lightColor = lightColorKey ? getColor(lightColorKey) : LIGHT_COLOR;
  const darkColor = darkColorKey ? getColor(darkColorKey) : DARK_COLOR;

  const animationEnabled = props?.animationsTextEnabled !== false && props?.animationsTextEnabled !== "false";
  const scrollStart = (props?.animationsTextScrollStart ?? "top 90%").toString().trim();
  const scrollEnd = (props?.animationsTextScrollEnd ?? "bottom 50%").toString().trim();
  const scrub = props?.animationsTextScrub != null ? Number(props.animationsTextScrub) : 1;

  const wrapRef = useRef(null);
  const textRefs = useRef([]);

  useEffect(() => {
    if (!animationEnabled) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const allWords = [];
    textRefs.current.forEach((el) => {
      if (el) {
        allWords.push(...el.querySelectorAll("[data-word]"));
      }
    });
    if (!allWords.length) return;

    gsap.set(allWords, { color: lightColor || LIGHT_COLOR });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: scrollStart,
        end: scrollEnd,
        scrub: scrub,
      },
    });

    const n = allWords.length;
    allWords.forEach((el, i) => {
      tl.to(el, { color: darkColor || DARK_COLOR, duration: 0.001 }, i / n);
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [paragraphs, lightColor, darkColor, animationEnabled, scrollStart, scrollEnd, scrub]);

  // Section background
  const PREFIX = "animationsText";
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
        <Row gutter={[16, 16]}>
          <Col
            xs={{ span: 24, offset: 0 }}
            md={{ span: 20, offset: 2 }}
            lg={{ span: 20, offset: 2 }}
          >
            <Wrapper ref={wrapRef} className="text-center">
              {paragraphs.map((text, pIdx) => {
                const words = text.split(/\s+/);
                return (
                  <ScrolledText
                    key={pIdx}
                    ref={(el) => (textRefs.current[pIdx] = el)}
                    fontSize={fontSize}
                    lineHeight={lineHeight}
                    fontWeight={fontWeight}
                    opacity={opacity}
                    className={`text-center${pIdx > 0 ? " mt-4" : ""}${pIdx === paragraphs.length - 1 ? " mb-0" : ""}`}
                  >
                    {words.map((word, i) => (
                      <React.Fragment key={i}>
                        <span data-word style={!animationEnabled ? { color: darkColor || DARK_COLOR } : undefined}>{word}</span>
                        {i < words.length - 1 ? " " : ""}
                      </React.Fragment>
                    ))}
                  </ScrolledText>
                );
              })}
            </Wrapper>
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
