"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const Board = styled.div`
  width: 100%;
  color: var(--story-ink);
  font-family: "Instrument Sans", system-ui, sans-serif;

  .storyHead { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(36px, 4vw, 56px); }
  .storySubTitle { margin: 0 0 18px; color: var(--story-subtitle); font-size: 13px; font-weight: 650; letter-spacing: .16em; line-height: 1.4; text-transform: uppercase; }
  .storyHeading { margin: 0; max-width: 18ch; color: var(--story-heading); font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: clamp(36px, 4.6vw, 64px); font-weight: 620; letter-spacing: -.02em; line-height: 1.08; }
  .storyHeading em { color: var(--story-accent); font-style: normal; }
  .storyNav { display: flex; align-items: center; gap: 12px; }
  .storyLink { display: inline-flex; align-items: center; gap: 9px; margin-right: 10px; color: var(--story-link); font-size: 14px; font-weight: 650; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 5px; }
  .storyLink svg { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .storyLink:hover svg { transform: translateX(4px); }
  .storyButton { width: 44px; height: 44px; padding: 0; border-radius: 50%; border: 1px solid var(--story-border); background: var(--story-button-bg); color: var(--story-button-icon); font-size: 18px; display: grid; place-items: center; cursor: pointer; transition: background .2s,color .2s,border-color .2s,transform .25s cubic-bezier(.16,1,.3,1); }
  .storyButton:hover { background: var(--story-button-hover-bg); color: var(--story-button-hover-icon); border-color: var(--story-button-hover-bg); transform: translateY(-2px); }
  .storyTrack { display: flex; gap: clamp(18px, 2vw, 30px); overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; scrollbar-width: none; -ms-overflow-style: none; }
  .storyTrack::-webkit-scrollbar { display: none; }
  .storyPanel { flex: 0 0 auto; width: clamp(290px, 27vw, 400px); min-height: 460px; margin: 0; border-radius: var(--story-radius); overflow: hidden; scroll-snap-align: start; display: flex; flex-direction: column; background: var(--story-card-bg); border: 1px solid var(--story-border); color: inherit; text-decoration: none; }
  .storyPanel.is-ink { background: var(--story-ink-card-bg); color: var(--story-ink-card-text); border-color: transparent; }
  .storyPanel.is-tint { background: var(--story-tint-card-bg); }
  .storyImage { width: 100%; height: 210px; object-fit: cover; display: block; }
  .storyBody { padding: clamp(22px, 2.2vw, 30px); display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .storyIndex { color: var(--story-index); font-family: "Bricolage Grotesque", system-ui, sans-serif; font-weight: 650; font-size: 14px; letter-spacing: .08em; }
  .is-ink .storyIndex { color: var(--story-ink-index); }
  .storyQuote { margin: 0; color: inherit; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-weight: 480; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.45; letter-spacing: -.005em; flex: 1; }
  .is-ink .storyQuote { font-size: clamp(19px, 1.7vw, 23px); }
  .storyWho { margin-top: 4px; }
  .storyWho strong { display: block; color: var(--story-name); font-size: 15px; }
  .storyWho span { display: block; color: var(--story-role); font-size: 13.5px; }
  .is-ink .storyWho strong { color: var(--story-ink-card-text); }
  .is-ink .storyWho span { color: var(--story-ink-role); }

  @media (max-width: 767px) {
    .storyPanel { width: 82vw; min-height: 0; }
    .storyHead { align-items: flex-start; }
    .storyNav { width: 100%; }
    .storyLink { margin-right: auto; }
  }
  @media (prefers-reduced-motion: reduce) { .storyReveal { opacity: 1 !important; transform: none !important; } }
`;

const text = (value) => value == null ? "" : String(value).trim();
const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) => text(value) ? getColor(text(value)) : fallback;

function backgroundProps(props, prefix) {
  const sectionType = text(props?.[`${prefix}SectionBgType`] || "default");
  const sectionImage = text(props?.[`${prefix}SectionBgImage`]);
  const sectionKey = text(props?.[`${prefix}SectionBgColorKey`]);
  const sectionBgClassName = sectionType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionType === "image" && sectionImage ? { backgroundImage: `url(${sectionImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : sectionType === "color" && sectionKey ? { backgroundColor: getColor(sectionKey), backgroundImage: "none" } : {}),
    ...Object.fromEntries([["paddingTop", props?.[`${prefix}SectionPaddingTop`]], ["paddingBottom", props?.[`${prefix}SectionPaddingBottom`]], ["marginTop", props?.[`${prefix}SectionMarginTop`]], ["marginBottom", props?.[`${prefix}SectionMarginBottom`]]].filter(([,v]) => v !== "" && v != null && num(v,-1) >= 0).map(([k,v]) => [k, `${num(v,0)}px`])),
  };
  const containerType = text(props?.[`${prefix}PageContainerBgType`] || "default");
  const containerImage = text(props?.[`${prefix}PageContainerBgImage`]);
  const containerKey = text(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = {
    ...(containerType === "image" && containerImage ? { backgroundImage: `url(${containerImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : containerType === "color" && containerKey ? { backgroundColor: getColor(containerKey), backgroundImage: "none" } : {}),
    ...Object.fromEntries([["paddingTop", props?.[`${prefix}PageContainerPaddingTop`]], ["paddingRight", props?.[`${prefix}PageContainerPaddingRight`]], ["paddingBottom", props?.[`${prefix}PageContainerPaddingBottom`]], ["paddingLeft", props?.[`${prefix}PageContainerPaddingLeft`]], ["marginTop", props?.[`${prefix}PageContainerMarginTop`]], ["marginBottom", props?.[`${prefix}PageContainerMarginBottom`]]].filter(([,v]) => v !== "" && v != null && num(v,-1) >= 0).map(([k,v]) => [k, `${num(v,0)}px`])),
  };
  return { sectionBgClassName, sectionBgStyle, pageContainerBgStyle };
}

export default function StoriesSlider(props) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/admin") === true;
  const items = Array.isArray(props?.storiesSliderItems) ? props.storiesSliderItems : [];
  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = backgroundProps(props, "storiesSlider");

  useLayoutEffect(() => {
    if (isEditor || !rootRef.current || props?.storiesSliderRevealEnabled === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = rootRef.current.querySelectorAll(".storyReveal");
    const context = gsap.context(() => ScrollTrigger.batch(targets, { start: text(props?.storiesSliderRevealStart) || "top 86%", once: true, onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: num(props?.storiesSliderRevealDistance, 30) }, { autoAlpha: 1, y: 0, duration: num(props?.storiesSliderRevealDuration, .9), stagger: num(props?.storiesSliderRevealStagger, .08), ease: "power3.out", overwrite: true }) }), rootRef);
    return () => context.revert();
  }, [isEditor, items, props]);

  const scroll = (direction) => {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    track.scrollBy({ left: direction * ((first?.getBoundingClientRect().width || 400) + gap), behavior: "smooth" });
  };

  const linkTarget = text(props?.storiesSliderViewAllTarget) || "_self";
  const isInnerPageVariant =
    props?.storiesSliderTitleEnabled === false &&
    props?.storiesSliderSubTitleEnabled === false;

  if (isInnerPageVariant) {
    return (
      <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
        <PageContainer $managedStyle={pageContainerBgStyle}>
          <div className="fable-section fable-testimonials" ref={rootRef}>
            {items.map((item, index) => (
              <figure className="fable-testimonial storyReveal" key={`${text(item?.name)}-${index}`}>
                {text(item?.image || item?.mobileImage) ? (
                  <picture>
                    {text(item?.mobileImage) ? <source media="(max-width: 767px)" srcSet={text(item.mobileImage)} /> : null}
                    <img className="fable-person__photo" src={text(item?.image || item?.mobileImage)} alt={text(item?.imageAlt || item?.name)} loading="lazy" />
                  </picture>
                ) : (
                  <span className="fable-testimonial__mark" aria-hidden="true">“</span>
                )}
                <blockquote><p>{text(item?.quote)}</p></blockquote>
                <figcaption>
                  <strong>{text(item?.name)}</strong>
                  {text(item?.role) ? <span>{text(item.role)}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <Board ref={rootRef} style={{
          "--story-ink": color(props?.storiesSliderTextColorKey, "#2A283E"),
          "--story-subtitle": color(props?.storiesSliderSubTitleColorKey, "#E03C33"),
          "--story-heading": color(props?.titleColorKey, "#2A283E"),
          "--story-accent": color(props?.storiesSliderHeadingAccentColorKey, "#2A283E"),
          "--story-link": color(props?.storiesSliderLinkColorKey, "#2A283E"),
          "--story-card-bg": color(props?.storiesSliderCardBgColorKey, "#fff"),
          "--story-tint-card-bg": color(props?.storiesSliderTintCardBgColorKey, "#F5F0E8"),
          "--story-ink-card-bg": color(props?.storiesSliderInkCardBgColorKey, "#211E2E"),
          "--story-ink-card-text": color(props?.storiesSliderInkCardTextColorKey, "#FAF6EF"),
          "--story-index": color(props?.storiesSliderIndexColorKey, "#E03C33"),
          "--story-ink-index": color(props?.storiesSliderInkIndexColorKey, "#F2867F"),
          "--story-name": color(props?.storiesSliderNameColorKey, "#2A283E"),
          "--story-role": color(props?.storiesSliderRoleColorKey, "rgba(42,40,62,.55)"),
          "--story-ink-role": color(props?.storiesSliderInkRoleColorKey, "rgba(250,246,239,.6)"),
          "--story-border": color(props?.storiesSliderBorderColorKey, "rgba(42,40,62,.14)"),
          "--story-button-bg": color(props?.storiesSliderButtonBgColorKey, "#fff"),
          "--story-button-icon": color(props?.storiesSliderArrowColorKey, "#2A283E"),
          "--story-button-hover-bg": color(props?.storiesSliderButtonHoverBgColorKey, "#2A283E"),
          "--story-button-hover-icon": color(props?.storiesSliderButtonHoverIconColorKey, "#FAF6EF"),
          "--story-radius": `${num(props?.storiesSliderCardRadius, 18)}px`,
        }}>
          <div className="storyHead storyReveal">
            <div>
              {props?.storiesSliderSubTitleEnabled !== false && text(props?.subTitle) ? <p className="storySubTitle">{text(props.subTitle)}</p> : null}
              {props?.storiesSliderTitleEnabled !== false && (text(props?.mainTitle) || text(props?.storiesSliderHeadingAccent)) ? <h2 className="storyHeading">{text(props?.mainTitle)}{text(props?.mainTitle) && text(props?.storiesSliderHeadingAccent) ? " " : null}<em>{text(props?.storiesSliderHeadingAccent)}</em></h2> : null}
            </div>
            <div className="storyNav">
              {text(props?.storiesSliderViewAllLabel) && text(props?.storiesSliderViewAllUrl) ? <a className="storyLink" href={text(props.storiesSliderViewAllUrl)} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}>{text(props.storiesSliderViewAllLabel)} <ArrowRightOutlined aria-hidden="true" /></a> : null}
              {props?.storiesSliderShowArrows !== false && items.length > 1 ? <><button type="button" className="storyButton" onClick={() => scroll(-1)} aria-label={text(props?.storiesSliderPreviousLabel) || "Previous story"}><ArrowLeftOutlined /></button><button type="button" className="storyButton" onClick={() => scroll(1)} aria-label={text(props?.storiesSliderNextLabel) || "Next story"}><ArrowRightOutlined /></button></> : null}
            </div>
          </div>
          <div className="storyTrack storyReveal" ref={trackRef}>
            {items.map((item, index) => {
              const image = text(item?.image || item?.mobileImage);
              const style = text(item?.panelStyle) || (index % 4 === 1 ? "ink" : index % 4 === 3 ? "tint" : "default");
              const target = text(item?.target) || "_self";
              const content = <><picture>{text(item?.mobileImage) ? <source media="(max-width: 767px)" srcSet={text(item.mobileImage)} /> : null}{image ? <img className="storyImage" src={image} alt={text(item?.imageAlt || item?.name)} loading="lazy" /> : null}</picture><div className="storyBody"><span className="storyIndex">{text(item?.indexLabel) || String(index + 1).padStart(2, "0")}{text(item?.category) ? ` · ${text(item.category)}` : ""}</span>{text(item?.quote) ? <p className="storyQuote">{text(item.quote)}</p> : null}<figcaption className="storyWho"><strong>{text(item?.name)}</strong><span>{text(item?.role)}</span></figcaption></div></>;
              return text(item?.link) ? <a className={`storyPanel is-${style}`} href={text(item.link)} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} key={`${text(item?.name)}-${index}`}>{content}</a> : <figure className={`storyPanel is-${style}`} key={`${text(item?.name)}-${index}`}>{content}</figure>;
            })}
          </div>
        </Board>
      </PageContainer>
    </FullWidthBackground>
  );
}
