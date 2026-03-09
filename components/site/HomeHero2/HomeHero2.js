"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";
import { Row, Col } from "antd";
import { RightCircleFilled } from "@ant-design/icons";
import { getColor, PageContainer, ThemeButton } from "@/styles/Theme";
import CircularSlider from "@/components/site/CircularSlider";

/**
 * Hero section styling matching mescotrust home index (lines 50–84):
 * background from Manage Section (image/color) or default image; h1 with icon + gradient span, paragraph, CTA button.
 */
const HomeContainer = styled.section`
  width: 100%;
  position: relative;
  padding: 12% 0px 0% 0px;
  ${(p) =>
    p.$bgType === "color" && p.$bgColor
      ? `background: ${p.$bgColor};`
      : `background: transparent url(${p.$bgImage || "/images/hero_bg.png"}) no-repeat top center; background-size: contain;`}
  h1 {
    margin: 0px;
    display: inline-block;
    color: ${getColor("black")};
    font-size: 48px;
    line-height: 56px;
    font-weight: 700;
    @media (max-width: 768px) {
      padding: 2% 0px 2% 0px;
      font-size: 30px;
      line-height: 40px;
    }
    @media (max-width: 576px) {
      padding: 16% 0px 0% 0px;
    }
    em {
      position: absolute;
      margin-left: -36px;
      margin-top: -10px;
    }
    span {
      background: linear-gradient(90deg, #cf372f 0%, #691c18 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
  p {
    color: ${getColor("black")};
    font-size: 20px;
    line-height: 28px;
    font-weight: 400;
    @media (max-width: 768px) {
      font-size: 16px;
      line-height: 24px;
    }
  }
`;

/**
 * Site component: Home Hero 2.
 * Matches mescotrust src/pages/index.js lines 50–84: hero title, subtitle, CTA button, CircularSlider.
 * Props from theme/Component defaultProps; Manage Section and Title & Colors from EditForm.
 */
export default function HomeHero2(props) {
  const mainTitle = (props?.mainTitle ?? "Because Every Learner")
    .toString()
    .trim();
  const mainTitleHighlight = (props?.mainTitleHighlight ?? "Deserves Support")
    .toString()
    .trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const buttonText = (props?.buttonText ?? "Contact Us").toString().trim();
  const buttonHref = (props?.buttonHref ?? "/").toString().trim();
  const heroIconUrl = (props?.heroIconUrl ?? "/images/hero-icon.svg")
    .toString()
    .trim();
  const sectionBgType = (props?.homeHero2SectionBgType ?? "default").toString();
  const sectionBgImage = (props?.homeHero2SectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.homeHero2SectionBgColorKey ?? "").toString().trim();
  const sectionBgColor = sectionBgType === "color" && sectionBgColorKey ? getColor(sectionBgColorKey) : undefined;
  const heroBgImage =
    sectionBgType === "image" && sectionBgImage
      ? sectionBgImage
      : (props?.heroBgImageUrl ?? "/images/hero_bg.png").toString().trim();
  const buttonBgColorKey = (props?.homeHero2ButtonBgColorKey ?? "").toString().trim();
  const buttonTextColorKey = (props?.homeHero2ButtonTextColorKey ?? "").toString().trim();
  const buttonStyle =
    buttonBgColorKey || buttonTextColorKey
      ? {
          ...(buttonBgColorKey ? { backgroundColor: getColor(buttonBgColorKey) } : {}),
          ...(buttonTextColorKey ? { color: getColor(buttonTextColorKey) } : {}),
        }
      : undefined;
  const sliderImages = Array.isArray(props?.homeHero2SliderImages)
    ? props.homeHero2SliderImages.filter((s) => s && (s.src || s.url))
    : [];

  const router = useRouter();
  const isExternal =
    !buttonHref ||
    buttonHref.startsWith("http") ||
    buttonHref.startsWith("mailto:") ||
    buttonHref.startsWith("tel:");
  const onButtonClick = () => {
    if (!buttonHref) return;
    if (isExternal) window.location.href = buttonHref;
    else router.push(buttonHref);
  };

  return (
    <HomeContainer
      $bgType={sectionBgType}
      $bgImage={sectionBgType === "image" ? heroBgImage : undefined}
      $bgColor={sectionBgColor}
    >
      <PageContainer className="py-0">
        <Row gutter={[16, 16]}>
          <Col xs={24} className="text-center">
            <h1>
              <em>
                <img
                  src={heroIconUrl || "/images/hero-icon.svg"}
                  alt="Hero Icon"
                />
              </em>
              {mainTitle} <br /> <span>{mainTitleHighlight}</span>
            </h1>
          </Col>
          <Col
            xs={{ span: 24, offset: 0 }}
            sm={{ span: 24, offset: 0 }}
            md={{ span: 24, offset: 0 }}
            lg={{ span: 12, offset: 6 }}
            className="text-center"
          >
            {subTitle ? <p>{subTitle}</p> : null}
          </Col>
          <Col xs={24} className="text-center">
            <ThemeButton type="button" size="large" onClick={onButtonClick} style={buttonStyle}>
              {buttonText} <RightCircleFilled />
            </ThemeButton>
          </Col>
        </Row>
      </PageContainer>
      {sliderImages.length > 0 ? (
        <CircularSlider
          images={sliderImages.map((s) => ({
            src: s.src || s.url,
            alt: s.alt != null ? String(s.alt) : "Slider",
          }))}
        />
      ) : null}
    </HomeContainer>
  );
}
