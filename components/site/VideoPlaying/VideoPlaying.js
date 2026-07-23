"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const Chapter = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: ${(p) => p.$radius}px;
  padding: ${(p) => p.$paddingTop}px ${(p) => p.$paddingX}px ${(p) => p.$paddingBottom}px;
  background: var(--chapter-bg);
  color: var(--chapter-text);
  font-family: ${(p) => p.$bodyFont || '"Instrument Sans", system-ui, sans-serif'};

  .chapterHead { margin-bottom: ${(p) => p.$headGap}px; }
  .chapterSubTitle {
    margin: 0 0 18px;
    color: var(--chapter-sub-title);
    font-size: ${(p) => p.$subTitleSize}px;
    font-weight: ${(p) => p.$subTitleWeight};
    letter-spacing: ${(p) => p.$subTitleSpacing}em;
    line-height: 1.4;
    text-transform: uppercase;
  }
  .chapterTitle {
    max-width: ${(p) => p.$titleWidth}ch;
    margin: 0;
    color: var(--chapter-title);
    font-family: ${(p) => p.$displayFont || '"Bricolage Grotesque", system-ui, sans-serif'};
    font-size: clamp(${(p) => p.$titleMin}px, ${(p) => p.$titleFluid}vw, ${(p) => p.$titleMax}px);
    font-weight: ${(p) => p.$titleWeight};
    letter-spacing: ${(p) => p.$titleSpacing}em;
    line-height: ${(p) => p.$titleLineHeight};
  }
  .chapterTitle em { color: var(--chapter-accent); font-style: normal; }
  .chapterVideo { overflow: hidden; border-radius: ${(p) => p.$videoRadius}px; background: #000; }
  .chapterCover { position: relative; aspect-ratio: 16 / 9; cursor: pointer; }
  .chapterCover img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  .chapterCover:hover img { transform: scale(1.03); }
  .chapterPlay {
    position: absolute;
    top: 50%; left: 50%;
    display: grid; place-items: center;
    width: ${(p) => p.$playSize}px; height: ${(p) => p.$playSize}px;
    padding: 0;
    transform: translate(-50%, -50%);
    border: 0; border-radius: 50%;
    background: var(--chapter-play-bg); color: var(--chapter-play-color);
    box-shadow: 0 20px 50px color-mix(in srgb, var(--chapter-play-bg) 42%, transparent);
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s;
  }
  .chapterPlay:hover { transform: translate(-50%, -50%) scale(1.1); filter: brightness(0.88); }
  .chapterPlay svg { width: 38%; height: 38%; margin-left: 5%; }
  .chapterVideo iframe { display: block; width: 100%; aspect-ratio: 16 / 9; border: 0; }
  .chapterQuote { display: flex; justify-content: center; margin: ${(p) => p.$quoteTop}px 0 0; text-align: center; }
  .chapterQuote p {
    max-width: ${(p) => p.$quoteWidth}ch;
    margin: 0;
    color: var(--chapter-quote);
    font-family: ${(p) => p.$displayFont || '"Bricolage Grotesque", system-ui, sans-serif'};
    font-size: clamp(${(p) => p.$quoteMin}px, ${(p) => p.$quoteFluid}vw, ${(p) => p.$quoteMax}px);
    font-weight: ${(p) => p.$quoteWeight};
    letter-spacing: -0.01em;
    line-height: ${(p) => p.$quoteLineHeight};
  }
  .chapterQuoteWord { opacity: 0.14; }
  .chapterAttribution { display: flex; flex-direction: column; gap: 4px; margin-top: 28px; text-align: center; }
  .chapterAttribution strong { color: var(--chapter-author); font-size: ${(p) => p.$authorSize}px; }
  .chapterAttribution span { color: var(--chapter-role); font-size: ${(p) => p.$roleSize}px; }
  .chapterMore { margin-top: 26px; text-align: center; }
  .chapterLink { display: inline-flex; align-items: center; gap: 8px; color: var(--chapter-link); font-size: ${(p) => p.$linkSize}px; font-weight: 650; text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--chapter-link) 55%, transparent); padding-bottom: 3px; transition: gap 0.25s ease; }
  .chapterLink:hover { gap: 13px; }

  @media (max-width: 767px) {
    padding-inline: ${(p) => Math.min(p.$paddingX, 20)}px;
    .chapterPlay { width: min(${(p) => p.$playSize}px, 72px); height: min(${(p) => p.$playSize}px, 72px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .chapterVideo { transform: none !important; }
    .chapterQuoteWord { opacity: 1 !important; }
    .chapterCover img, .chapterPlay { transition: none; }
  }
`;

const text = (value) => (value == null ? "" : String(value).trim());
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) => text(value) ? getColor(text(value)) : fallback;
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (props, suffix = "") =>
  props?.[`videoPlaying${previousSubTitleToken}${suffix}`];

export default function VideoPlaying(props) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const quoteRef = useRef(null);
  const isEditorPreview = pathname?.startsWith("/admin") === true;

  const youtubeVideoId = text(props?.youtubeVideoId);
  const coverImageDesktop = text(props?.coverImageDesktop ?? props?.coverImage);
  const coverAlt = text(props?.coverAlt);
  const quote = text(props?.videoPlayingQuote);
  const quoteWords = quote.split(/\s+/).filter(Boolean);

  useLayoutEffect(() => {
    if (isEditorPreview || !rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      quoteRef.current?.querySelectorAll(".chapterQuoteWord").forEach((word) => { word.style.opacity = "1"; });
      return;
    }
    const context = gsap.context(() => {
      if (props?.videoPlayingScaleAnimationEnabled !== false && videoRef.current) {
        gsap.fromTo(videoRef.current, { scale: number(props?.videoPlayingScaleFrom, 0.9) }, {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: videoRef.current,
            start: text(props?.videoPlayingScaleStart) || "top 92%",
            end: text(props?.videoPlayingScaleEnd) || "top 35%",
            scrub: true,
          },
        });
      }
      if (props?.videoPlayingQuoteAnimationEnabled !== false && quoteRef.current) {
        gsap.to(quoteRef.current.querySelectorAll(".chapterQuoteWord"), {
          opacity: 1,
          stagger: number(props?.videoPlayingQuoteStagger, 0.05),
          ease: "none",
          scrollTrigger: {
            trigger: quoteRef.current,
            start: text(props?.videoPlayingQuoteStart) || "top 80%",
            end: text(props?.videoPlayingQuoteEnd) || "bottom 48%",
            scrub: true,
          },
        });
      }
    }, rootRef);
    return () => context.revert();
  }, [isEditorPreview, props, quote]);

  const sectionBgType = text(props?.videoPlayingSectionBgType || "default");
  const sectionBgImage = text(props?.videoPlayingSectionBgImage);
  const sectionBgColorKey = text(props?.videoPlayingSectionBgColorKey);
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionBgType === "image" && sectionBgImage ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : sectionBgType === "color" && sectionBgColorKey ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" } : {}),
    ...Object.fromEntries([["paddingTop", props?.videoPlayingSectionPaddingTop], ["paddingBottom", props?.videoPlayingSectionPaddingBottom], ["marginTop", props?.videoPlayingSectionMarginTop], ["marginBottom", props?.videoPlayingSectionMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])),
  };
  const pageContainerBgType = text(props?.videoPlayingPageContainerBgType || "default");
  const pageContainerBgImage = text(props?.videoPlayingPageContainerBgImage);
  const pageContainerBgColorKey = text(props?.videoPlayingPageContainerBgColorKey);
  const pageContainerBgStyle = {
    ...(pageContainerBgType === "image" && pageContainerBgImage ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : pageContainerBgType === "color" && pageContainerBgColorKey ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" } : {}),
    ...Object.fromEntries([["paddingTop", props?.videoPlayingPageContainerPaddingTop], ["paddingRight", props?.videoPlayingPageContainerPaddingRight], ["paddingBottom", props?.videoPlayingPageContainerPaddingBottom], ["paddingLeft", props?.videoPlayingPageContainerPaddingLeft], ["marginTop", props?.videoPlayingPageContainerMarginTop], ["marginBottom", props?.videoPlayingPageContainerMarginBottom]].filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0).map(([key, value]) => [key, `${number(value, 0)}px`])),
  };
  const link = text(props?.videoPlayingLinkUrl);
  const linkContent = <><span>{text(props?.videoPlayingLinkText)}</span><ArrowRightOutlined aria-hidden="true" /></>;

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <Chapter
          ref={rootRef}
          $radius={number(props?.videoPlayingChapterRadius, 56)}
          $paddingTop={number(props?.videoPlayingChapterPaddingTop, 96)}
          $paddingBottom={number(props?.videoPlayingChapterPaddingBottom, 110)}
          $paddingX={number(props?.videoPlayingChapterPaddingX, 48)}
          $headGap={number(props?.videoPlayingHeadGap, 56)}
          $videoRadius={number(props?.videoPlayingVideoRadius, 20)}
          $playSize={number(props?.videoPlayingPlayButtonSize, 96)}
          $quoteTop={number(props?.videoPlayingQuoteMarginTop, 88)}
          $quoteWidth={number(props?.videoPlayingQuoteMaxWidth, 26)}
          $titleWidth={number(props?.videoPlayingTitleMaxWidth, 20)}
          $titleMin={number(props?.videoPlayingTitleMinSize, 36)}
          $titleFluid={number(props?.videoPlayingTitleFluidSize, 4.6)}
          $titleMax={number(props?.videoPlayingTitleMaxSize, 64)}
          $titleWeight={number(props?.videoPlayingTitleFontWeight, 620)}
          $titleSpacing={number(props?.videoPlayingTitleLetterSpacing, -0.02)}
          $titleLineHeight={number(props?.videoPlayingTitleLineHeight, 1.08)}
          $quoteMin={number(props?.videoPlayingQuoteMinSize, 26)}
          $quoteFluid={number(props?.videoPlayingQuoteFluidSize, 3.4)}
          $quoteMax={number(props?.videoPlayingQuoteMaxSize, 48)}
          $quoteWeight={number(props?.videoPlayingQuoteFontWeight, 460)}
          $quoteLineHeight={number(props?.videoPlayingQuoteLineHeight, 1.28)}
          $subTitleSize={number(props?.videoPlayingSubTitleFontSize ?? previousSubTitleField(props, "FontSize"), 13)}
          $subTitleWeight={number(props?.videoPlayingSubTitleFontWeight ?? previousSubTitleField(props, "FontWeight"), 650)}
          $subTitleSpacing={number(props?.videoPlayingSubTitleLetterSpacing ?? previousSubTitleField(props, "LetterSpacing"), 0.16)}
          $authorSize={number(props?.videoPlayingAuthorFontSize, 17)}
          $roleSize={number(props?.videoPlayingRoleFontSize, 15)}
          $linkSize={number(props?.videoPlayingLinkFontSize, 15)}
          $displayFont={text(props?.videoPlayingDisplayFontFamily)}
          $bodyFont={text(props?.videoPlayingBodyFontFamily)}
          style={{
            "--chapter-bg": color(props?.videoPlayingChapterBgColorKey, getColor("dark")),
            "--chapter-text": color(props?.videoPlayingTextColorKey, getColor("cream")),
            "--chapter-sub-title": color(props?.videoPlayingSubTitleColorKey ?? previousSubTitleField(props, "ColorKey"), getColor("primary")),
            "--chapter-title": color(props?.videoPlayingTitleColorKey, getColor("cream")),
            "--chapter-accent": color(props?.videoPlayingTitleAccentColorKey, getColor("cream")),
            "--chapter-play-bg": color(props?.videoPlayingPlayBgColorKey, getColor("primary")),
            "--chapter-play-color": color(props?.videoPlayingPlayIconColorKey, getColor("white")),
            "--chapter-quote": color(props?.videoPlayingQuoteColorKey, getColor("cream")),
            "--chapter-author": color(props?.videoPlayingAuthorColorKey, getColor("white")),
            "--chapter-role": color(props?.videoPlayingRoleColorKey, "rgba(250,246,239,.6)"),
            "--chapter-link": color(props?.videoPlayingLinkColorKey, getColor("cream")),
          }}
        >
          <div className="chapterHead">
            {text(props?.videoPlayingSubTitle ?? previousSubTitleField(props)) ? <p className="chapterSubTitle">{text(props?.videoPlayingSubTitle ?? previousSubTitleField(props))}</p> : null}
            {text(props?.videoPlayingTitle) || text(props?.videoPlayingTitleAccent) ? <h2 className="chapterTitle">{text(props?.videoPlayingTitle)}{text(props?.videoPlayingTitle) && text(props?.videoPlayingTitleAccent) ? " " : null}<em>{text(props?.videoPlayingTitleAccent)}</em></h2> : null}
          </div>
          <div ref={videoRef} className="chapterVideo">
            {videoPlaying && youtubeVideoId ? <iframe src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`} title={text(props?.videoPlayingVideoTitle) || coverAlt} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="chapterCover" role="button" tabIndex={0} aria-label={text(props?.videoPlayingPlayAriaLabel) || coverAlt} onClick={() => setVideoPlaying(true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setVideoPlaying(true); } }}><img src={coverImageDesktop} alt={coverAlt} /><button type="button" className="chapterPlay" tabIndex={-1} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg></button></div>}
          </div>
          {quote ? <blockquote ref={quoteRef} className="chapterQuote"><p>{quoteWords.map((word, index) => <span className="chapterQuoteWord" key={`${word}-${index}`}>{index ? " " : ""}{word}</span>)}</p></blockquote> : null}
          {text(props?.videoPlayingAuthorName) || text(props?.videoPlayingAuthorRole) ? <figcaption className="chapterAttribution"><strong>{text(props?.videoPlayingAuthorName)}</strong><span>{text(props?.videoPlayingAuthorRole)}</span></figcaption> : null}
          {link && text(props?.videoPlayingLinkText) ? <div className="chapterMore">{(props?.videoPlayingLinkTarget === "_blank" || props?.videoPlayingLinkNewTab === true) ? <a className="chapterLink" href={link} target="_blank" rel="noopener noreferrer">{linkContent}</a> : <Link className="chapterLink" href={link}>{linkContent}</Link>}</div> : null}
        </Chapter>
      </PageContainer>
    </FullWidthBackground>
  );
}
