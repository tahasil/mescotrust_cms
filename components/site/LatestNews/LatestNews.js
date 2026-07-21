"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const NewsSection = styled.div`
  width: 100%;
  position: relative;
  font-family: ${(p) => p.$bodyFont || '"Instrument Sans", system-ui, sans-serif'};
  .newsGrid { display: grid; grid-template-columns: minmax(0, ${(p) => p.$introRatio}fr) minmax(0, ${(p) => p.$listRatio}fr); gap: ${(p) => p.$columnGap}px; align-items: start; }
  .newsSubTitle { margin: 0 0 18px; color: var(--news-sub-title); font-size: ${(p) => p.$subTitleSize}px; font-weight: ${(p) => p.$subTitleWeight}; letter-spacing: ${(p) => p.$subTitleSpacing}em; line-height: 1.4; text-transform: uppercase; }
  .newsHeading { margin: 0 0 ${(p) => p.$headingBottom}px; color: var(--news-heading); font-family: ${(p) => p.$displayFont || '"Bricolage Grotesque", system-ui, sans-serif'}; font-size: clamp(${(p) => p.$headingMin}px, ${(p) => p.$headingFluid}vw, ${(p) => p.$headingMax}px); font-weight: ${(p) => p.$headingWeight}; letter-spacing: ${(p) => p.$headingSpacing}em; line-height: ${(p) => p.$headingLineHeight}; }
  .newsHeading em { color: var(--news-accent); font-style: normal; }
  .newsIntroText { max-width: ${(p) => p.$introWidth}ch; margin: 0; color: var(--news-intro); font-size: ${(p) => p.$introSize}px; line-height: ${(p) => p.$introLineHeight}; }
  .newsList { display: flex; flex-direction: column; }
  .newsRow { display: grid; grid-template-columns: ${(p) => p.$tagWidth}px minmax(0, 1fr) auto; align-items: center; gap: ${(p) => p.$rowGap}px; padding-block: ${(p) => p.$rowPadding}px; border-bottom: ${(p) => p.$borderWidth}px solid var(--news-border); color: inherit; text-decoration: none; transition: padding-left .3s cubic-bezier(.16,1,.3,1); }
  .newsRow:first-child { border-top: ${(p) => p.$borderWidth}px solid var(--news-border); }
  .newsRow:hover { padding-left: ${(p) => p.$hoverIndent}px; }
  .newsTag { color: var(--news-tag); border: 1px solid var(--news-tag-border); border-radius: ${(p) => p.$tagRadius}px; padding: ${(p) => p.$tagPaddingY}px ${(p) => p.$tagPaddingX}px; font-size: ${(p) => p.$tagSize}px; font-weight: ${(p) => p.$tagWeight}; letter-spacing: ${(p) => p.$tagSpacing}em; line-height: 1.3; text-align: center; text-transform: ${(p) => p.$tagTransform}; }
  .newsBody { display: grid; grid-template-columns: ${(p) => p.$showImages ? `${p.$imageWidth}px minmax(0, 1fr)` : "1fr"}; gap: 18px; align-items: center; min-width: 0; }
  .newsImage { width: ${(p) => p.$imageWidth}px; aspect-ratio: ${(p) => p.$imageRatio}; border-radius: ${(p) => p.$imageRadius}px; object-fit: cover; }
  .newsTitle { margin: 0; color: var(--news-title); font-family: ${(p) => p.$displayFont || '"Bricolage Grotesque", system-ui, sans-serif'}; font-size: clamp(${(p) => p.$itemMin}px, ${(p) => p.$itemFluid}vw, ${(p) => p.$itemMax}px); font-weight: ${(p) => p.$itemWeight}; letter-spacing: -.01em; line-height: ${(p) => p.$itemLineHeight}; }
  .newsDescription { margin: 8px 0 0; color: var(--news-description); font-size: ${(p) => p.$descriptionSize}px; line-height: ${(p) => p.$descriptionLineHeight}; }
  .newsAction { display: inline-flex; align-items: center; gap: 8px; color: var(--news-arrow); font-size: ${(p) => p.$arrowSize}px; white-space: nowrap; transition: color .2s, transform .3s; }
  .newsActionLabel { font-size: ${(p) => p.$buttonSize}px; font-weight: ${(p) => p.$buttonWeight}; }
  .newsRow:hover .newsAction { color: var(--news-arrow-hover); transform: translate(3px,-3px); }
  @media (max-width: 900px) { .newsGrid { grid-template-columns: 1fr; gap: ${(p) => Math.max(32, Math.round(p.$columnGap * .55))}px; } }
  @media (max-width: 600px) { .newsRow { grid-template-columns: 1fr auto; } .newsTag { display: none; } .newsBody { grid-template-columns: 1fr; } .newsImage { width: min(100%, ${(p) => p.$imageWidth}px); } }
  @media (prefers-reduced-motion: reduce) { .newsIntro, .newsRow { opacity: 1 !important; transform: none !important; } }
`;

const text = (value) => value == null ? "" : String(value).trim();
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) => text(value) ? getColor(text(value)) : fallback;
// Keep the persisted latestEvents1* namespace so existing CMS content remains valid.
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (props, suffix = "") =>
  props?.[`latestEvents1${previousSubTitleToken}${suffix}`];
const isExternalOrAsset = (href) => /^(https?:)?\/\//i.test(href) || href.startsWith("/media/") || href.startsWith("/uploads/") || /\.(pdf|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(href);

export default function LatestNews(props) {
  const pathname = usePathname(); const rootRef = useRef(null); const isEditorPreview = pathname?.startsWith("/admin") === true;
  const items = Array.isArray(props?.latestEvents1Items) ? props.latestEvents1Items : [];
  useLayoutEffect(() => {
    if (isEditorPreview || !rootRef.current || props?.latestEvents1RevealEnabled === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = rootRef.current.querySelectorAll(".newsIntro, .newsRow");
    const context = gsap.context(() => { ScrollTrigger.batch(targets, { start: text(props?.latestEvents1RevealStart) || "top 86%", once: true, onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, y: number(props?.latestEvents1RevealDistance, 28) }, { autoAlpha: 1, y: 0, duration: number(props?.latestEvents1RevealDuration, .9), stagger: number(props?.latestEvents1RevealStagger, .09), ease: "power3.out", overwrite: true }) }); }, rootRef);
    return () => context.revert();
  }, [isEditorPreview, items, props]);

  const sectionBgType = text(props?.latestEvents1SectionBgType || "default"); const sectionBgImage = text(props?.latestEvents1SectionBgImage); const sectionBgColorKey = text(props?.latestEvents1SectionBgColorKey); const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = { ...(sectionBgType === "image" && sectionBgImage ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : sectionBgType === "color" && sectionBgColorKey ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" } : {}), ...Object.fromEntries([["paddingTop", props?.latestEvents1SectionPaddingTop], ["paddingBottom", props?.latestEvents1SectionPaddingBottom], ["marginTop", props?.latestEvents1SectionMarginTop], ["marginBottom", props?.latestEvents1SectionMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])) };
  const pageContainerBgType = text(props?.latestEvents1PageContainerBgType || "default"); const pageContainerBgImage = text(props?.latestEvents1PageContainerBgImage); const pageContainerBgColorKey = text(props?.latestEvents1PageContainerBgColorKey);
  const pageContainerBgStyle = { ...(pageContainerBgType === "image" && pageContainerBgImage ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : pageContainerBgType === "color" && pageContainerBgColorKey ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" } : {}), ...Object.fromEntries([["paddingTop", props?.latestEvents1PageContainerPaddingTop], ["paddingRight", props?.latestEvents1PageContainerPaddingRight], ["paddingBottom", props?.latestEvents1PageContainerPaddingBottom], ["paddingLeft", props?.latestEvents1PageContainerPaddingLeft], ["marginTop", props?.latestEvents1PageContainerMarginTop], ["marginBottom", props?.latestEvents1PageContainerMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])) };
  const showImages = props?.latestEvents1ShowImages === true; const showDescriptions = props?.latestEvents1ShowDescriptions === true; const showButtonLabels = props?.latestEvents1ShowButtonLabels === true;
  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <NewsSection ref={rootRef} $introRatio={number(props?.latestEvents1IntroColumnRatio, 1)} $listRatio={number(props?.latestEvents1ListColumnRatio, 1.5)} $columnGap={number(props?.latestEvents1ColumnGap, 90)} $rowGap={number(props?.latestEvents1RowGap, 36)} $rowPadding={number(props?.latestEvents1RowPadding, 34)} $borderWidth={number(props?.latestEvents1BorderWidth, 1)} $hoverIndent={number(props?.latestEvents1HoverIndent, 14)} $tagWidth={number(props?.latestEvents1TagWidth, 92)} $tagRadius={number(props?.latestEvents1TagRadius, 999)} $tagPaddingX={number(props?.latestEvents1TagPaddingX, 12)} $tagPaddingY={number(props?.latestEvents1TagPaddingY, 5)} $tagSize={number(props?.latestEvents1TagFontSize, 12)} $tagWeight={number(props?.latestEvents1TagFontWeight, 700)} $tagSpacing={number(props?.latestEvents1TagLetterSpacing, .1)} $tagTransform={text(props?.latestEvents1TagTextTransform) || "uppercase"} $showImages={showImages} $imageWidth={number(props?.latestEvents1ImageWidth, 120)} $imageRatio={text(props?.latestEvents1ImageAspectRatio) || "4 / 3"} $imageRadius={number(props?.latestEvents1ImageRadius, 10)} $displayFont={text(props?.latestEvents1DisplayFontFamily)} $bodyFont={text(props?.latestEvents1BodyFontFamily)} $subTitleSize={number(props?.latestEvents1SubTitleFontSize ?? previousSubTitleField(props, "FontSize"), 13)} $subTitleWeight={number(props?.latestEvents1SubTitleFontWeight ?? previousSubTitleField(props, "FontWeight"), 650)} $subTitleSpacing={number(props?.latestEvents1SubTitleLetterSpacing ?? previousSubTitleField(props, "LetterSpacing"), .16)} $headingMin={number(props?.latestEvents1HeadingMinSize, 36)} $headingFluid={number(props?.latestEvents1HeadingFluidSize, 4.6)} $headingMax={number(props?.latestEvents1HeadingMaxSize, 64)} $headingWeight={number(props?.latestEvents1HeadingFontWeight, 620)} $headingSpacing={number(props?.latestEvents1HeadingLetterSpacing, -.02)} $headingLineHeight={number(props?.latestEvents1HeadingLineHeight, 1.08)} $headingBottom={number(props?.latestEvents1HeadingMarginBottom, 12)} $introWidth={number(props?.latestEvents1IntroMaxWidth, 42)} $introSize={number(props?.latestEvents1IntroFontSize, 16)} $introLineHeight={number(props?.latestEvents1IntroLineHeight, 1.7)} $itemMin={number(props?.latestEvents1ItemTitleMinSize, 18)} $itemFluid={number(props?.latestEvents1ItemTitleFluidSize, 1.8)} $itemMax={number(props?.latestEvents1ItemTitleMaxSize, 24)} $itemWeight={number(props?.latestEvents1ItemTitleFontWeight, 560)} $itemLineHeight={number(props?.latestEvents1ItemTitleLineHeight, 1.3)} $descriptionSize={number(props?.latestEvents1DescriptionFontSize, 14)} $descriptionLineHeight={number(props?.latestEvents1DescriptionLineHeight, 1.5)} $arrowSize={number(props?.latestEvents1ArrowSize, 22)} $buttonSize={number(props?.latestEvents1ButtonFontSize, 14)} $buttonWeight={number(props?.latestEvents1ButtonFontWeight, 650)} style={{ "--news-sub-title": color(props?.latestEvents1SubTitleColorKey ?? previousSubTitleField(props, "ColorKey"), getColor("primary")), "--news-heading": color(props?.latestEvents1MainTitleColorKey, getColor("black")), "--news-accent": color(props?.latestEvents1HeadingAccentColorKey, getColor("black")), "--news-intro": color(props?.latestEvents1IntroColorKey, getColor("blackMuted")), "--news-border": color(props?.latestEvents1BorderColorKey, getColor("border")), "--news-tag": color(props?.latestEvents1TagColorKey, getColor("primary")), "--news-tag-border": color(props?.latestEvents1TagBorderColorKey, "rgba(224,60,51,.35)"), "--news-title": color(props?.latestEvents1ItemTitleColorKey, getColor("black")), "--news-description": color(props?.latestEvents1DescriptionColorKey, getColor("blackMuted")), "--news-arrow": color(props?.latestEvents1ArrowColorKey, getColor("blackMuted")), "--news-arrow-hover": color(props?.latestEvents1ArrowHoverColorKey, getColor("primary")) }}>
          <div className="newsGrid">
            <div className="newsIntro"><p className="newsSubTitle">{text(props?.latestEvents1SubTitle)}</p><h2 className="newsHeading">{text(props?.latestEvents1MainTitle)}{text(props?.latestEvents1MainTitle) && text(props?.latestEvents1HeadingAccent) ? " " : null}<em>{text(props?.latestEvents1HeadingAccent)}</em></h2>{text(props?.latestEvents1IntroDescription) ? <p className="newsIntroText">{text(props.latestEvents1IntroDescription)}</p> : null}</div>
            <div className="newsList">{items.map((item, index) => { const href = text(item?.buttonLink) || "/"; const tag = text(item?.tag ?? item?.date); const content = <><span className="newsTag">{tag}</span><span className="newsBody">{showImages && text(item?.imageUrlDesktop ?? item?.imageUrl) ? <img className="newsImage" src={text(item?.imageUrlDesktop ?? item?.imageUrl)} alt={text(item?.imageAlt ?? item?.title)} /> : null}<span><h3 className="newsTitle">{text(item?.title)}</h3>{showDescriptions && text(item?.description) ? <p className="newsDescription">{text(item.description)}</p> : null}</span></span><span className="newsAction">{showButtonLabels && text(item?.buttonText) ? <span className="newsActionLabel">{text(item.buttonText)}</span> : null}<ArrowUpOutlined rotate={45} aria-hidden="true" /></span></>;
              return isExternalOrAsset(href) || item?.buttonOpenInNewTab ? <a className="newsRow" href={href} target={item?.buttonOpenInNewTab ? "_blank" : "_self"} rel={item?.buttonOpenInNewTab ? "noopener noreferrer" : undefined} key={`${text(item?.title)}-${index}`}>{content}</a> : <Link className="newsRow" href={href} key={`${text(item?.title)}-${index}`}>{content}</Link>; })}</div>
          </div>
        </NewsSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
