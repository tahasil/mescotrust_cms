"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const text = (v) => (v == null ? "" : String(v).trim());
const num = (v, f) => (Number.isFinite(Number(v)) ? Number(v) : f);
const color = (v, f) => (text(v) ? getColor(text(v)) : f);

export default function Testimonials(props) {
  const rootRef = useRef(null);
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/admin") === true;
  const items = useMemo(() => (Array.isArray(props?.testimonialsItems) ? props.testimonialsItems : []), [props?.testimonialsItems]);
  const [active, setActive] = useState(0);
  const autoplay = props?.testimonialsAutoplay !== false;
  const delay = Math.max(1000, num(props?.testimonialsAutoplaySpeed, 6500));

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
              <div className="qSlidesTrack">
                {items.map((entry, index) => {
                  const isActive = index === active;
                  return (
                    <figure
                      key={`quote-${text(entry?.name)}-${index}`}
                      className={`qSlide${isActive ? " is-active" : ""}`}
                      aria-hidden={!isActive}
                    >
                      <p className="qQuote">{text(entry?.quote)}</p>
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

