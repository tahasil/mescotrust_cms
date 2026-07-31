"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

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
  .storyCarousel { width: 100%; overflow: hidden; touch-action: pan-y; user-select: none; padding-bottom: 1px; }
  .storyCarousel img { -webkit-user-drag: none; user-select: none; }
  .storyCarouselTrack { display: flex; align-items: stretch; gap: clamp(18px, 2vw, 30px); will-change: transform; }
  .storyCarouselTrack.is-animated { transition: transform var(--story-transition-speed) cubic-bezier(.22,.61,.36,1); }
  .storyCarouselTrack.is-dragging { cursor: grabbing; }
  .storySlide { flex: 0 0 clamp(290px, 27vw, 400px); min-width: 0; }
  .storyPanel { width: 100%; height: 100%; min-height: 460px; box-sizing: border-box; margin: 0; border-radius: var(--story-radius); overflow: hidden; display: flex; flex-direction: column; background: var(--story-card-bg); border: 1px solid var(--story-border); color: inherit; text-decoration: none; }
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
  .storyButton:disabled { opacity: .38; cursor: not-allowed; transform: none; }
  .storyDots { display: flex; justify-content: center; align-items: center; gap: 10px; height: 12px; margin-top: 24px; }
  .storyDot { width: 9px; height: 9px; padding: 0; border: 0; border-radius: 50%; background: color-mix(in srgb, var(--story-dot-active) 30%, transparent); cursor: pointer; transition: background .2s ease; }
  .storyDot.is-active { background: var(--story-dot-active); }
  .storyDot:focus-visible { outline: 2px solid var(--story-dot-active); outline-offset: 3px; }

  @media (max-width: 767px) {
    .storySlide { flex-basis: 82vw; }
    .storyPanel { min-height: 0; }
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
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const dragStartRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const draggingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [physicalIndex, setPhysicalIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [animated, setAnimated] = useState(true);
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/admin") === true;
  const sourceItems = props?.storiesSliderItems;
  const items = useMemo(() => Array.isArray(sourceItems) ? sourceItems : [], [sourceItems]);
  const itemCount = items.length;
  const infinite = props?.storiesSliderInfinite !== false && itemCount > 1;
  const autoplay = props?.storiesSliderAutoplay === true && itemCount > 1;
  const autoplayDelay = Math.max(1000, num(props?.storiesSliderAutoplaySpeed, 5000));
  const transitionDuration = Math.max(200, num(props?.storiesSliderSpeed, 400));
  const renderedItems = useMemo(() => {
    const copies = infinite ? 3 : 1;
    return Array.from({ length: copies }, (_, copyIndex) =>
      items.map((item, logicalIndex) => ({
        item,
        logicalIndex,
        clone: infinite && copyIndex !== 1,
        key: `${copyIndex}-${logicalIndex}-${text(item?.name)}`,
      })),
    ).flat();
  }, [infinite, items]);
  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = backgroundProps(props, "storiesSlider");

  const move = useCallback((direction) => {
    if (itemCount < 2) return;
    setAnimated(true);
    setDragOffset(0);
    setPhysicalIndex((current) => {
      const next = infinite
        ? current + direction
        : Math.min(itemCount - 1, Math.max(0, current + direction));
      setActiveIndex(((next % itemCount) + itemCount) % itemCount);
      return next;
    });
  }, [infinite, itemCount]);

  useLayoutEffect(() => {
    const initialIndex = infinite ? itemCount : 0;
    setAnimated(false);
    setPhysicalIndex(initialIndex);
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [infinite, itemCount]);

  useLayoutEffect(() => {
    const viewport = carouselRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return undefined;
    const measure = () => {
      const firstSlide = track.firstElementChild;
      if (!firstSlide) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      setStep(firstSlide.getBoundingClientRect().width + gap);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [renderedItems.length]);

  useEffect(() => {
    if (!autoplay || paused || !step) return undefined;
    const timer = window.setTimeout(() => move(1), autoplayDelay);
    return () => window.clearTimeout(timer);
  }, [autoplay, autoplayDelay, move, paused, physicalIndex, step]);

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || !infinite || !itemCount) return;
    if (physicalIndex >= itemCount && physicalIndex < itemCount * 2) return;
    const normalized = itemCount + (((physicalIndex % itemCount) + itemCount) % itemCount);
    setAnimated(false);
    setPhysicalIndex(normalized);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  };

  const handlePointerDown = (event) => {
    if (itemCount < 2) return;
    dragStartRef.current = event.clientX;
    dragOffsetRef.current = 0;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPaused(true);
    setDragging(true);
    setAnimated(false);
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return;
    const nextOffset = event.clientX - dragStartRef.current;
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const finishDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const threshold = Math.max(40, step * 0.12);
    const finalOffset = dragOffsetRef.current;
    const direction = Math.abs(finalOffset) >= threshold ? (finalOffset < 0 ? 1 : -1) : 0;
    dragOffsetRef.current = 0;
    setDragging(false);
    setPaused(false);
    setAnimated(true);
    if (direction) move(direction);
    else setDragOffset(0);
  };

  useLayoutEffect(() => {
    if (isEditor || !rootRef.current || props?.storiesSliderRevealEnabled === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = rootRef.current.querySelectorAll(".storyReveal");
    const context = gsap.context(() => ScrollTrigger.batch(targets, { start: text(props?.storiesSliderRevealStart) || "top 86%", once: true, onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: num(props?.storiesSliderRevealDistance, 30) }, { autoAlpha: 1, y: 0, duration: num(props?.storiesSliderRevealDuration, .9), stagger: num(props?.storiesSliderRevealStagger, .08), ease: "power3.out", overwrite: true }) }), rootRef);
    return () => context.revert();
  }, [isEditor, items, props]);


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
          "--story-dot-active": color(props?.storiesSliderDotActiveColorKey, "#E03C33"),
          "--story-radius": `${num(props?.storiesSliderCardRadius, 18)}px`,
        }}>
          <div className="storyHead storyReveal">
            <div>
              {props?.storiesSliderSubTitleEnabled !== false && text(props?.subTitle) ? <p className="storySubTitle">{text(props.subTitle)}</p> : null}
              {props?.storiesSliderTitleEnabled !== false && (text(props?.mainTitle) || text(props?.storiesSliderHeadingAccent)) ? <h2 className="storyHeading">{renderHighlightedTitle(text(props?.storiesSliderHeadingAccent) ? `${text(props?.mainTitle)}${text(props?.mainTitle) ? " " : ""}*${text(props?.storiesSliderHeadingAccent)}*` : text(props?.mainTitle), props, { legacyColorKey: props?.storiesSliderHeadingAccentColorKey })}</h2> : null}
            </div>
            <div className="storyNav">
              {text(props?.storiesSliderViewAllLabel) && text(props?.storiesSliderViewAllUrl) ? <a className="storyLink" href={text(props.storiesSliderViewAllUrl)} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}>{text(props.storiesSliderViewAllLabel)} <ArrowRightOutlined aria-hidden="true" /></a> : null}
              {props?.storiesSliderShowArrows !== false && items.length > 1 ? <><button type="button" className="storyButton" disabled={!infinite && activeIndex === 0} onClick={() => move(-1)} aria-label={text(props?.storiesSliderPreviousLabel) || "Previous story"}><ArrowLeftOutlined /></button><button type="button" className="storyButton" disabled={!infinite && activeIndex === itemCount - 1} onClick={() => move(1)} aria-label={text(props?.storiesSliderNextLabel) || "Next story"}><ArrowRightOutlined /></button></> : null}
            </div>
          </div>
          <div
            ref={carouselRef}
            className="storyCarousel storyReveal"
            role="region"
            aria-roledescription="carousel"
            aria-label="Success stories"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={finishDrag}
            onDragStart={(event) => event.preventDefault()}
          >
            <div
              ref={trackRef}
              className={`storyCarouselTrack${animated && !dragging ? " is-animated" : ""}${dragging ? " is-dragging" : ""}`}
              style={{ transform: `translate3d(${-(physicalIndex * step) + dragOffset}px, 0, 0)`, "--story-transition-speed": `${transitionDuration}ms`, opacity: step ? 1 : 0 }}
              onTransitionEnd={handleTransitionEnd}
            >
            {renderedItems.map(({ item, logicalIndex: index, clone, key }) => {
              const image = text(item?.image || item?.mobileImage);
              const style = text(item?.panelStyle) || (index % 4 === 1 ? "ink" : index % 4 === 3 ? "tint" : "default");
              const target = text(item?.target) || "_self";
              const content = <><picture>{text(item?.mobileImage) ? <source media="(max-width: 767px)" srcSet={text(item.mobileImage)} /> : null}{image ? <img className="storyImage" src={image} alt={text(item?.imageAlt || item?.name)} loading="lazy" /> : null}</picture><div className="storyBody"><span className="storyIndex">{text(item?.indexLabel) || String(index + 1).padStart(2, "0")}{text(item?.category) ? ` · ${text(item.category)}` : ""}</span>{text(item?.quote) ? <p className="storyQuote">{text(item.quote)}</p> : null}<figcaption className="storyWho"><strong>{text(item?.name)}</strong><span>{text(item?.role)}</span></figcaption></div></>;
              return <div className="storySlide" key={key} aria-hidden={clone || undefined}>{text(item?.link) ? <a className={`storyPanel is-${style}`} href={text(item.link)} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} tabIndex={clone ? -1 : undefined}>{content}</a> : <figure className={`storyPanel is-${style}`}>{content}</figure>}</div>;
            })}
            </div>
          </div>
          {props?.storiesSliderShowDots !== false && itemCount > 1 ? <div className="storyDots" role="group" aria-label="Choose a story">{items.map((item, index) => <button type="button" className={`storyDot${activeIndex === index ? " is-active" : ""}`} aria-label={`Go to story ${index + 1}${text(item?.name) ? `: ${text(item.name)}` : ""}`} aria-current={activeIndex === index ? "true" : undefined} onClick={() => { setAnimated(true); setDragOffset(0); setActiveIndex(index); setPhysicalIndex(infinite ? itemCount + index : index); }} key={`${text(item?.name)}-${index}`} />)}</div> : null}
        </Board>
      </PageContainer>
    </FullWidthBackground>
  );
}
