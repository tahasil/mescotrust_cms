"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

gsap.registerPlugin(ScrollTrigger);

const QuoteSection = styled.div`
  width: 100%;
  text-align: center;
  color: var(--q-ink);
  font-family: "Instrument Sans", system-ui, sans-serif;

  .qSubTitle {
    margin: 0 0 30px;
    color: var(--q-subtitle);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: .16em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .qSlider {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .qMark {
    display: block;
    color: var(--q-mark);
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-weight: 700;
    font-size: 76px;
    line-height: .55;
    margin-bottom: 30px;
  }

  .qSlidesTrack {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    align-items: center;
    position: relative;
    width: 100%;
    min-height: 0;
  }

  .qSlide {
    grid-area: 1 / 1 / 2 / 2;
    margin: 0;
    padding: 0;
    width: 100%;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(12px);
    transition: opacity var(--q-duration) ease, transform var(--q-duration) cubic-bezier(.16,1,.3,1), visibility var(--q-duration);
  }

  /*
   * Fixed slide height: every slide is clamped to the same number of lines,
   * so the grid row height never changes as the carousel advances. Without
   * this the section jumps when a longer testimonial rotates in.
   */
  .qSlide {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .qSlide.is-active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  .qQuote {
    margin: 0 0 30px;
    color: var(--q-quote);
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-weight: 480;
    font-size: clamp(23px, 2.8vw, 38px);
    line-height: 1.3;
    letter-spacing: -.015em;
  }

  /*
   * Clamp the visible quote to --q-clamp lines with an ellipsis. The full
   * text stays in the DOM for screen readers and is shown in the tooltip.
   */
  .qQuoteText {
    display: -webkit-box;
    -webkit-line-clamp: var(--q-clamp);
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: break-word;
  }

  /*
   * Must be a block box: the overflow check in JS reads clientHeight /
   * scrollHeight, and both are 0 on an inline element. A hidden tooltip
   * (measuring wrapper) would otherwise always report "not truncated".
   */
  .qQuoteWrap {
    position: relative;
    display: block;
    cursor: help;
  }

  /* Only advertise the affordance when the text is genuinely truncated. */
  .qQuoteWrap.is-clamped:hover .qQuoteText {
    text-decoration: underline;
    text-decoration-color: var(--q-mark);
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
  }

  .qWho strong {
    display: block;
    color: var(--q-name);
    font-size: 16.5px;
  }

  .qWho span {
    display: block;
    color: var(--q-role);
    font-size: 14.5px;
  }

  .qDots {
    display: flex;
    gap: 9px;
    justify-content: center;
    margin-top: 34px;
  }

  .qDot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 0;
    padding: 0;
    background: var(--q-dot);
    cursor: pointer;
    transition: background .25s, transform .25s;
  }

  .qDot.is-active {
    background: var(--q-dot-active);
    transform: scale(1.25);
  }

  .qAll {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 30px;
    padding-bottom: 5px;
    border-bottom: 1px solid currentColor;
    color: var(--q-link);
    font-size: 14px;
    font-weight: 650;
    text-decoration: none;
  }

  .qAll svg {
    transition: transform .3s cubic-bezier(.16,1,.3,1);
  }

  .qAll:hover svg {
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    .qQuote {
      font-size: clamp(19px, 5.2vw, 26px);
      line-height: 1.35;
      margin-bottom: 24px;
    }
    .qMark {
      font-size: 60px;
      margin-bottom: 22px;
    }
    .qDots {
      margin-top: 26px;
    }
    .qAll {
      margin-top: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qSlide {
      transition: none !important;
      transform: none !important;
    }
  }
`;

/*
 * ── Full testimonial overlay ─────────────────────────────────────
 * Rendered into document.body through a portal and centred on the viewport.
 *
 * Two problems forced this design:
 *  1. Anchoring the card to the quote never worked: the section wrapper
 *     (FullWidthBackground) sets overflow:hidden, which clipped the card at
 *     the section edge no matter which direction it opened in.
 *  2. It therefore has to be a separate top-level styled component rather than
 *     more rules inside QuoteSection. styled-components scopes descendant
 *     selectors to the component that owns them, so portalled markup rendered
 *     into <body> would not have matched QuoteSection's rules at all.
 */
const TipOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(24, 21, 38, .58);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: qTipFade .22s cubic-bezier(.16, 1, .3, 1);

  .qTip {
    position: relative;
    width: 100%;
    max-width: min(680px, 100%);
    max-height: min(82vh, 640px);
    display: flex;
    flex-direction: column;
    padding: 28px 30px 30px;
    border-radius: 20px;
    background: #1E1B2E;
    color: #F4F3F7;
    font-family: "Instrument Sans", system-ui, sans-serif;
    box-shadow: 0 32px 80px -20px rgba(15, 13, 26, .62), 0 6px 18px -8px rgba(15, 13, 26, .4);
    animation: qTipPop .28s cubic-bezier(.16, 1, .3, 1);
    cursor: default;
  }

  .qTipHead {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: none;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, .12);
  }

  .qTipScroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .qTipScroll::-webkit-scrollbar {
    width: 6px;
  }

  .qTipScroll::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: rgba(255, 255, 255, .26);
  }

  .qTipScroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .qTipBody {
    margin: 0;
    color: rgba(255, 255, 255, .92);
    font-size: 16px;
    font-weight: 450;
    line-height: 1.75;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  .qTipRole {
    flex: none;
    margin: 14px 0 0;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, .12);
    color: rgba(255, 255, 255, .6);
    font-size: 13px;
    font-weight: 500;
  }

  .qTipTitle {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    color: #FFFFFF;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: .005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .qTipClose {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin: -4px -6px 0 auto;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, .08);
    color: rgba(255, 255, 255, .7);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
    transition: background .2s, color .2s;
  }

  .qTipClose:hover,
  .qTipClose:focus-visible {
    background: rgba(255, 255, 255, .16);
    color: #FFFFFF;
    outline: none;
  }

  @keyframes qTipFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes qTipPop {
    from { opacity: 0; transform: translateY(14px) scale(.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .qTip {
      padding: 22px 20px 24px;
      border-radius: 16px;
    }

    .qTipBody {
      font-size: 15px;
      line-height: 1.7;
    }
  }
`;

const text = (v) => (v == null ? "" : String(v).trim());
const num = (v, f) => (Number.isFinite(Number(v)) ? Number(v) : f);
const color = (v, f) => (text(v) ? getColor(text(v)) : f);

export default function Testimonials(props) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/admin") === true;
  const items = useMemo(() => (Array.isArray(props?.testimonialsItems) ? props.testimonialsItems : []), [props?.testimonialsItems]);
  const [active, setActive] = useState(0);
  const autoplay = props?.testimonialsAutoplay !== false;
  const delay = Math.max(1000, num(props?.testimonialsAutoplaySpeed, 6500));
  // How many lines of quote stay visible before the ellipsis.
  const clampLines = Math.max(1, Math.round(num(props?.testimonialsClampLines, 5)));
  // Index of quotes that overflow their clamp → only those get a tooltip.
  const [clamped, setClamped] = useState(() => new Set());
  // Which slide's full testimonial is open in the centred overlay (null = closed).
  const [tipIndex, setTipIndex] = useState(null);
  // The overlay is portalled to document.body, which only exists client-side.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /**
   * While the overlay is open the carousel keeps rotating, so follow the
   * active slide: if the next slide is clamped, show its testimonial instead of
   * leaving the previous one on screen.
   */
  useEffect(() => {
    setTipIndex((current) => {
      if (current === null) return null;
      return clamped.has(active) ? active : null;
    });
  }, [active, clamped]);

  // Escape closes the overlay.
  useEffect(() => {
    if (tipIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setTipIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tipIndex]);

  // Lock background scrolling while the overlay is open.
  useEffect(() => {
    if (tipIndex === null || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [tipIndex]);

  /**
   * A CSS line-clamp hides overflow without a reliable JS flag, so measure it.
   *
   * The overflow must be read from the clamped box itself (`.qQuoteText`),
   * not from its wrapper: the clamp applies `overflow:hidden` on the inner
   * box, so the wrapper's scrollHeight always equals its clientHeight and
   * would report every quote as "not truncated".
   */
  const measureOverflow = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const next = new Set();
    root.querySelectorAll("[data-quote-index]").forEach((wrap) => {
      const box = wrap.querySelector(".qQuoteText");
      if (!box) return;
      // 1px tolerance for sub-pixel rounding in fractional font sizes.
      if (box.scrollHeight - box.clientHeight > 1) {
        next.add(Number(wrap.getAttribute("data-quote-index")));
      }
    });
    setClamped((prev) => {
      const sameSize = prev.size === next.size;
      const sameItems = sameSize && Array.from(next).every((v) => prev.has(v));
      return sameItems ? prev : next;
    });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let cancelled = false;
    const remeasure = () => {
      if (!cancelled) measureOverflow();
    };

    remeasure();

    /*
     * Webfonts swap in after first paint and change the line metrics, which
     * can turn a quote that fitted into one that overflows. ResizeObserver
     * cannot catch this: the clamp pins the box to exactly N lines either
     * way, so the element (and its parent) never changes size and the
     * observer stays silent. Re-measure explicitly once fonts settle.
     */
    document.fonts?.ready.then(remeasure).catch(() => {});
    const timers = [setTimeout(remeasure, 300), setTimeout(remeasure, 1200)];

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(remeasure);
      observer.observe(root);
    }
    window.addEventListener("resize", remeasure);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      observer?.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [measureOverflow, items, clampLines]);

  useEffect(() => {
    setActive((v) => (items.length ? Math.min(v, items.length - 1) : 0));
  }, [items.length]);

  useEffect(() => {
    if (!autoplay || items.length < 2 || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = window.setInterval(() => setActive((v) => (v + 1) % items.length), delay);
    return () => window.clearInterval(timer);
  }, [autoplay, delay, items.length]);

  useLayoutEffect(() => {
    if (isEditor || !rootRef.current || props?.testimonialsRevealEnabled === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const targets = rootRef.current.querySelectorAll(".qReveal");
    const context = gsap.context(() => {
      ScrollTrigger.batch(targets, {
        start: "top 86%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, y: num(props?.testimonialsRevealDistance, 30) },
            {
              autoAlpha: 1,
              y: 0,
              duration: num(props?.testimonialsRevealDuration, 0.9),
              stagger: 0.08,
              ease: "power3.out",
              overwrite: true,
            },
          ),
      });
    }, rootRef);
    return () => context.revert();
  }, [isEditor, items, props]);

  const target = text(props?.testimonialsViewAllTarget) || "_self";

  const sectionBgType = text(props?.testimonialsSectionBgType || "default");
  const sectionBgImage = text(props?.testimonialsSectionBgImage);
  const sectionBgColorKey = text(props?.testimonialsSectionBgColorKey);
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : {}),
    ...Object.fromEntries(
      [["paddingTop", props?.testimonialsSectionPaddingTop], ["paddingBottom", props?.testimonialsSectionPaddingBottom], ["marginTop", props?.testimonialsSectionMarginTop], ["marginBottom", props?.testimonialsSectionMarginBottom]]
        .filter(([, value]) => value != null && value !== "" && num(value, -1) >= 0)
        .map(([key, value]) => [key, `${num(value, 0)}px`]),
    ),
  };
  const pageContainerBgType = text(props?.testimonialsPageContainerBgType || "default");
  const pageContainerBgImage = text(props?.testimonialsPageContainerBgImage);
  const pageContainerBgColorKey = text(props?.testimonialsPageContainerBgColorKey);
  const pageContainerBgStyle = {
    ...(pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : {}),
    ...Object.fromEntries(
      [["paddingTop", props?.testimonialsPageContainerPaddingTop], ["paddingRight", props?.testimonialsPageContainerPaddingRight], ["paddingBottom", props?.testimonialsPageContainerPaddingBottom], ["paddingLeft", props?.testimonialsPageContainerPaddingLeft], ["marginTop", props?.testimonialsPageContainerMarginTop], ["marginBottom", props?.testimonialsPageContainerMarginBottom]]
        .filter(([, value]) => value != null && value !== "" && num(value, -1) >= 0)
        .map(([key, value]) => [key, `${num(value, 0)}px`]),
    ),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer className="py-0" $managedStyle={pageContainerBgStyle}>
        <QuoteSection
          ref={rootRef}
          style={{
            "--q-ink": color(props?.testimonialsTitleColorKey, "#2A283E"),
            "--q-subtitle": color(props?.testimonialsTitleColorKey, "#E03C33"),
            "--q-mark": color(props?.testimonialsQuoteMarkColorKey, "#E03C33"),
            "--q-quote": color(props?.testimonialsQuoteColorKey, "#2A283E"),
            "--q-name": color(props?.testimonialsNameColorKey, "#2A283E"),
            "--q-role": color(props?.testimonialsRoleColorKey, "rgba(42,40,62,.55)"),
            "--q-dot": color(props?.testimonialsDotColorKey, "rgba(42,40,62,.18)"),
            "--q-dot-active": color(props?.testimonialsDotActiveColorKey, "#E03C33"),
            "--q-link": color(props?.testimonialsLinkColorKey, "#2A283E"),
            "--q-duration": `${num(props?.testimonialsSpeed, 650) / 1000}s`,
            "--q-clamp": String(clampLines),
          }}
        >
          {props?.testimonialsTitleEnabled !== false && text(props?.testimonialsTitle) ? (
            <p className="qSubTitle qReveal">
              {renderHighlightedTitle(text(props.testimonialsTitle), props)}
            </p>
          ) : null}
          {items.length > 0 ? (
            <div className="qSlider qReveal">
              <span className="qMark" aria-hidden="true">
                “
              </span>
              <div className="qSlidesTrack" ref={trackRef}>
                {items.map((entry, index) => {
                  const isActive = index === active;
                  const isClamped = clamped.has(index);
                  return (
                    <figure
                      key={`quote-${text(entry?.name)}-${index}`}
                      className={`qSlide${isActive ? " is-active" : ""}`}
                      aria-hidden={!isActive}
                    >
                      <p className="qQuote">
                        <span
                          className={`qQuoteWrap${isClamped ? " is-clamped" : ""}`}
                          data-quote-index={index}
                          tabIndex={isClamped ? 0 : -1}
                          aria-haspopup={isClamped ? "dialog" : undefined}
                          aria-expanded={isClamped ? tipIndex === index : undefined}
                          onClick={() => isClamped && setTipIndex(index)}
                          onKeyDown={(event) => {
                            if (!isClamped) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setTipIndex(index);
                            }
                          }}
                        >
                          <span className="qQuoteText">{text(entry?.quote)}</span>
                        </span>
                      </p>
                      <figcaption className="qWho">
                        <strong>{text(entry?.name)}</strong>
                        <span>{text(entry?.title)}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
              {props?.testimonialsShowDots !== false && items.length > 1 ? (
                <div className="qDots" role="tablist" aria-label="Choose testimonial">
                  {items.map((entry, index) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={index === active}
                      aria-label={`Show testimonial ${index + 1}`}
                      className={`qDot${index === active ? " is-active" : ""}`}
                      onClick={() => setActive(index)}
                      key={`dot-${text(entry?.name)}-${index}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {/*
            Full testimonial overlay.

            Portalled to document.body on purpose: the section wrapper sets
            overflow:hidden, which clipped the anchored card at the section
            edge. A portal also escapes the carousel's GSAP transform
            context, so position:fixed resolves against the viewport.
          */}
          {mounted && tipIndex !== null && clamped.has(tipIndex)
            ? createPortal(
                <TipOverlay
                  className="qTipOverlay"
                  role="presentation"
                  style={{
                    "--tip-mark": color(
                      props?.testimonialsQuoteMarkColorKey,
                      "#E03C33",
                    ),
                  }}
                  onClick={() => setTipIndex(null)}
                >
                  <div
                    className="qTip"
                    role="dialog"
                    aria-modal="true"
                    aria-label={text(items[tipIndex]?.name) || "Testimonial"}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="qTipHead">
                      <span className="qTipTitle">
                        {text(items[tipIndex]?.name) || "Testimonial"}
                      </span>
                      <button
                        type="button"
                        className="qTipClose"
                        aria-label="Close"
                        onClick={() => setTipIndex(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="qTipScroll">
                      <p className="qTipBody">{text(items[tipIndex]?.quote)}</p>
                    </div>
                    {text(items[tipIndex]?.title) ? (
                      <p className="qTipRole">{text(items[tipIndex]?.title)}</p>
                    ) : null}
                  </div>
                </TipOverlay>,
                document.body,
              )
            : null}
          {text(props?.testimonialsViewAllLabel) && text(props?.testimonialsViewAllUrl) ? (
            <a
              className="qAll qReveal"
              href={text(props.testimonialsViewAllUrl)}
              target={target}
              rel={target === "_blank" ? "noopener noreferrer" : undefined}
            >
              {text(props.testimonialsViewAllLabel)} <ArrowRightOutlined aria-hidden="true" />
            </a>
          ) : null}
        </QuoteSection>
      </PageContainer>
    </FullWidthBackground>
  );
}

