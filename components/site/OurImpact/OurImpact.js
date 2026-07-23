"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { normalizeTarget } from "@/components/appearance/editorUtils";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_CONTENT = {
  heading: "Numbers that",
  headingAccent: "carry names.",
  note: "Cumulative impact since 1968, audited year after year.",
  footerText: "Every number here is a person with a name in MESCO's files.",
  linkLabel: "See the audited annual reports",
  linkUrl: "/annual-reports",
  items: [
    {
      index: "01",
      number: 89052,
      label: "Educational scholarships awarded to students",
    },
    {
      index: "02",
      number: 12199,
      label: "Patients supported with medical aid",
    },
    {
      index: "03",
      number: 833000,
      label: "Cases treated at clinics & dispensaries",
    },
    {
      index: "04",
      number: 2509,
      label: "Sewing machines given as general aid",
    },
  ],
};

const Ledger = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  color: var(--impact-text);
  font-family: "Instrument Sans", system-ui, sans-serif;

  .impactHead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: ${(p) => p.$headGap}px;
    flex-wrap: wrap;
    margin-bottom: clamp(
      ${(p) => p.$headBottomMin}px,
      ${(p) => p.$headBottomFluid}vw,
      ${(p) => p.$headBottomMax}px
    );
  }

  .impactHeading {
    max-width: ${(p) => p.$headingWidth}ch;
    margin: 0;
    color: var(--impact-heading);
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: clamp(
      ${(p) => p.$headingMin}px,
      ${(p) => p.$headingFluid}vw,
      ${(p) => p.$headingMax}px
    );
    font-weight: ${(p) => p.$headingWeight};
    letter-spacing: ${(p) => p.$headingSpacing}em;
    line-height: ${(p) => p.$headingLineHeight};
  }

  .impactHeading em {
    color: var(--impact-heading-accent);
    font-style: normal;
  }

  .impactNote {
    max-width: ${(p) => p.$noteWidth}ch;
    margin: 0;
    color: var(--impact-note);
    font-size: ${(p) => p.$noteSize}px;
    line-height: 1.6;
  }

  .impactGrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .impactCell {
    min-width: 0;
    padding: 6px
      clamp(
        ${(p) => p.$cellPaddingMin}px,
        ${(p) => p.$cellPaddingFluid}vw,
        ${(p) => p.$cellPaddingMax}px
      )
      4px;
    border-left: 1px solid var(--impact-line);
  }

  .impactCell:first-child {
    padding-left: 0;
    border-left: 0;
  }

  .impactIndex {
    display: block;
    margin-bottom: clamp(18px, 2vw, 30px);
    color: var(--impact-index);
    font-size: ${(p) => p.$indexSize}px;
    font-weight: ${(p) => p.$indexWeight};
    letter-spacing: ${(p) => p.$indexSpacing}em;
    line-height: 1.4;
  }

  .impactNumber {
    display: block;
    margin-bottom: 12px;
    color: var(--impact-number);
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: clamp(
      ${(p) => p.$numberMin}px,
      ${(p) => p.$numberFluid}vw,
      ${(p) => p.$numberMax}px
    );
    font-weight: ${(p) => p.$numberWeight};
    font-variant-numeric: tabular-nums;
    letter-spacing: ${(p) => p.$numberSpacing}em;
    line-height: 1;
  }

  .impactLabel {
    display: inline-block;
    max-width: ${(p) => p.$labelWidth}ch;
    color: var(--impact-label);
    font-size: ${(p) => p.$labelSize}px;
    line-height: ${(p) => p.$labelLineHeight};
  }

  .impactFoot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-top: clamp(
      ${(p) => p.$footerTopMin}px,
      ${(p) => p.$footerTopFluid}vw,
      ${(p) => p.$footerTopMax}px
    );
    padding-top: ${(p) => p.$footerPaddingTop}px;
    border-top: 1px solid var(--impact-line);
  }

  .impactFoot p {
    margin: 0;
    color: var(--impact-footer-text);
    font-size: ${(p) => p.$footerSize}px;
    line-height: 1.6;
  }

  .impactLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid currentColor;
    color: var(--impact-link);
    font-size: ${(p) => p.$linkSize}px;
    font-weight: 600;
    line-height: 1.4;
    text-decoration: none;
    transition:
      color 0.2s,
      gap 0.25s;
  }

  .impactLink:hover {
    gap: 13px;
    color: var(--impact-link-hover);
  }

  &.isEditorPreview .impactReveal {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }

  @media (max-width: 1023px) {
    .impactGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 40px 0;
    }

    .impactCell:nth-child(odd) {
      padding-left: 0;
      border-left: 0;
    }
  }

  @media (max-width: 600px) {
    .impactGrid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .impactCell,
    .impactCell:nth-child(odd) {
      padding: 24px 0;
      border-top: 1px solid var(--impact-line);
      border-left: 0;
    }

    .impactCell:first-child {
      padding-top: 0;
      border-top: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .impactReveal {
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

const text = (value) => (value == null ? "" : String(value).trim());
const number = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) =>
  text(value) ? getColor(text(value)) : fallback;

function ImpactLink({ href, target, children }) {
  if (!href) return null;
  const resolvedTarget = normalizeTarget(target);
  const shared = {
    className: "impactLink",
    target: resolvedTarget,
    rel: resolvedTarget === "_blank" ? "noopener noreferrer" : undefined,
  };
  if (/^(https?:)?\/\//i.test(href)) {
    return (
      <a href={href} {...shared}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...shared}>
      {children}
    </Link>
  );
}

export default function OurImpact(props) {
  const pathname = usePathname();
  const rootRef = useRef(null);
  const isEditorPreview = pathname?.startsWith("/admin") === true;
  const items =
    Array.isArray(props?.ourImpactItems) && props.ourImpactItems.length > 0
      ? props.ourImpactItems
      : DEFAULT_CONTENT.items;
  const locale = text(props?.ourImpactNumberLocale) || "en-IN";

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const revealElements = root.querySelectorAll(".impactReveal");
    const counters = root.querySelectorAll(".impactNumber");
    const format = (value) => Math.round(value).toLocaleString(locale);

    if (isEditorPreview) {
      counters.forEach((element) => {
        element.textContent = format(number(element.dataset.count, 0));
      });
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(revealElements, { autoAlpha: 1, y: 0 });
      counters.forEach((element) => {
        element.textContent = format(number(element.dataset.count, 0));
      });
      return;
    }

    const context = gsap.context(() => {
      if (props?.ourImpactRevealEnabled !== false) {
        ScrollTrigger.batch(revealElements, {
          start: text(props?.ourImpactRevealStart) || "top 86%",
          once: true,
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              {
                autoAlpha: 0,
                y: number(props?.ourImpactRevealDistance, 30),
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: number(props?.ourImpactRevealDuration, 0.9),
                stagger: number(props?.ourImpactRevealStagger, 0.09),
                ease: "power3.out",
                overwrite: true,
              },
            );
          },
        });
      } else {
        gsap.set(revealElements, { autoAlpha: 1, y: 0 });
      }

      counters.forEach((element) => {
        const target = number(element.dataset.count, 0);
        const counter = { value: 0 };
        if (props?.ourImpactCountEnabled !== false) {
          gsap.to(counter, {
            value: target,
            duration: number(props?.ourImpactCountDuration, 2.4),
            ease: text(props?.ourImpactCountEase) || "power2.out",
            scrollTrigger: {
              trigger: element,
              start: text(props?.ourImpactCountStart) || "top 85%",
              once: true,
            },
            onUpdate: () => {
              element.textContent = format(counter.value);
            },
          });
        } else {
          element.textContent = format(target);
        }
      });
    }, root);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [isEditorPreview, items, locale, props]);

  const sectionBgType = text(props?.ourImpactSectionBgType || "default");
  const sectionBgImage = text(props?.ourImpactSectionBgImage);
  const sectionBgColorKey = text(props?.ourImpactSectionBgColorKey);
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const defaultBackground = color(
    props?.ourImpactBandBgColorKey,
    getColor("dark"),
  );
  const glowColor = color(
    props?.ourImpactGlowColorKey,
    "rgba(224, 60, 51, 0.14)",
  );
  const sectionBgStyle = {
    backgroundColor:
      sectionBgType === "color" && sectionBgColorKey
        ? getColor(sectionBgColorKey)
        : defaultBackground,
    backgroundImage:
      sectionBgType === "image" && sectionBgImage
        ? `url(${sectionBgImage})`
        : `radial-gradient(46% 60% at 90% 0%, ${glowColor}, transparent 70%)`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    ...Object.fromEntries(
      [
        ["paddingTop", props?.ourImpactSectionPaddingTop],
        ["paddingBottom", props?.ourImpactSectionPaddingBottom],
        ["marginTop", props?.ourImpactSectionMarginTop],
        ["marginBottom", props?.ourImpactSectionMarginBottom],
      ]
        .filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0)
        .map(([key, value]) => [key, `${number(value, 0)}px`]),
    ),
  };

  const pageContainerBgType = text(
    props?.ourImpactPageContainerBgType || "default",
  );
  const pageContainerBgImage = text(props?.ourImpactPageContainerBgImage);
  const pageContainerBgColorKey = text(
    props?.ourImpactPageContainerBgColorKey,
  );
  const pageContainerBgStyle = {
    
    ...(pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey) }
        : {}),
    ...Object.fromEntries(
      [
        ["paddingTop", props?.ourImpactPageContainerPaddingTop],
        ["paddingRight", props?.ourImpactPageContainerPaddingRight],
        ["paddingBottom", props?.ourImpactPageContainerPaddingBottom],
        ["paddingLeft", props?.ourImpactPageContainerPaddingLeft],
        ["marginTop", props?.ourImpactPageContainerMarginTop],
        ["marginBottom", props?.ourImpactPageContainerMarginBottom],
      ]
        .filter(([, value]) => value != null && value !== "" && number(value, -1) >= 0)
        .map(([key, value]) => [key, `${number(value, 0)}px`]),
    ),
  };

  const heading = text(props?.ourImpactHeading ?? DEFAULT_CONTENT.heading);
  const headingAccent = text(
    props?.ourImpactHeadingAccent ?? DEFAULT_CONTENT.headingAccent,
  );
  const note = text(props?.ourImpactNote ?? DEFAULT_CONTENT.note);
  const footerText = text(
    props?.ourImpactFooterText ?? DEFAULT_CONTENT.footerText,
  );
  const linkLabel = text(
    props?.ourImpactLinkLabel ?? DEFAULT_CONTENT.linkLabel,
  );
  const linkUrl = text(props?.ourImpactLinkUrl ?? DEFAULT_CONTENT.linkUrl);
  const linkTarget = normalizeTarget(props?.ourImpactLinkTarget);

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <Ledger
          ref={rootRef}
          className={isEditorPreview ? "isEditorPreview" : undefined}
          $headGap={number(props?.ourImpactHeadGap, 28)}
          $headBottomMin={number(
            props?.ourImpactHeadMarginBottomMin,
            44,
          )}
          $headBottomFluid={number(
            props?.ourImpactHeadMarginBottomFluid,
            5,
          )}
          $headBottomMax={number(
            props?.ourImpactHeadMarginBottomMax,
            72,
          )}
          $headingMin={number(props?.ourImpactHeadingMinSize, 36)}
          $headingFluid={number(props?.ourImpactHeadingFluidSize, 4.6)}
          $headingMax={number(props?.ourImpactHeadingMaxSize, 64)}
          $headingWeight={number(props?.ourImpactHeadingFontWeight, 620)}
          $headingSpacing={number(
            props?.ourImpactHeadingLetterSpacing,
            -0.02,
          )}
          $headingLineHeight={number(
            props?.ourImpactHeadingLineHeight,
            1.08,
          )}
          $headingWidth={number(props?.ourImpactHeadingMaxWidth, 16)}
          $noteSize={number(props?.ourImpactNoteFontSize, 15)}
          $noteWidth={number(props?.ourImpactNoteMaxWidth, 30)}
          $cellPaddingMin={number(props?.ourImpactCellPaddingMin, 20)}
          $cellPaddingFluid={number(props?.ourImpactCellPaddingFluid, 2.4)}
          $cellPaddingMax={number(props?.ourImpactCellPaddingMax, 44)}
          $indexSize={number(props?.ourImpactIndexFontSize, 12)}
          $indexWeight={number(props?.ourImpactIndexFontWeight, 700)}
          $indexSpacing={number(
            props?.ourImpactIndexLetterSpacing,
            0.2,
          )}
          $numberMin={number(props?.ourImpactNumberMinSize, 42)}
          $numberFluid={number(props?.ourImpactNumberFluidSize, 4.8)}
          $numberMax={number(props?.ourImpactNumberMaxSize, 80)}
          $numberWeight={number(props?.ourImpactNumberFontWeight, 700)}
          $numberSpacing={number(
            props?.ourImpactNumberLetterSpacing,
            -0.025,
          )}
          $labelSize={number(props?.ourImpactLabelFontSize, 15)}
          $labelLineHeight={number(props?.ourImpactLabelLineHeight, 1.5)}
          $labelWidth={number(props?.ourImpactLabelMaxWidth, 21)}
          $footerTopMin={number(
            props?.ourImpactFooterMarginTopMin,
            44,
          )}
          $footerTopFluid={number(
            props?.ourImpactFooterMarginTopFluid,
            5,
          )}
          $footerTopMax={number(
            props?.ourImpactFooterMarginTopMax,
            72,
          )}
          $footerPaddingTop={number(props?.ourImpactFooterPaddingTop, 26)}
          $footerSize={number(props?.ourImpactFooterFontSize, 14.5)}
          $linkSize={number(props?.ourImpactLinkFontSize, 15)}
          style={{
            "--impact-text": color(
              props?.ourImpactBaseTextColorKey,
              getColor("cream"),
            ),
            "--impact-heading": color(
              props?.ourImpactHeadingColorKey,
              getColor("cream"),
            ),
            "--impact-heading-accent": color(
              props?.ourImpactHeadingAccentColorKey,
              "#F2867F",
            ),
            "--impact-note": color(
              props?.ourImpactNoteColorKey,
              "rgba(250, 246, 239, 0.55)",
            ),
            "--impact-index": color(
              props?.ourImpactIndexColorKey,
              "#F2867F",
            ),
            "--impact-number": color(
              props?.ourImpactNumberColorKey,
              getColor("cream"),
            ),
            "--impact-label": color(
              props?.ourImpactLabelColorKey,
              "rgba(250, 246, 239, 0.68)",
            ),
            "--impact-line": color(
              props?.ourImpactLineColorKey,
              "rgba(250, 246, 239, 0.16)",
            ),
            "--impact-footer-text": color(
              props?.ourImpactFooterTextColorKey,
              "rgba(250, 246, 239, 0.55)",
            ),
            "--impact-link": color(
              props?.ourImpactLinkColorKey,
              "rgba(250, 246, 239, 0.92)",
            ),
            "--impact-link-hover": color(
              props?.ourImpactLinkHoverColorKey,
              "#F2867F",
            ),
          }}
        >
          <div className="impactHead">
            {heading || headingAccent ? (
              <h2 className="impactHeading impactReveal">
                {heading}
                {heading && headingAccent ? " " : null}
                {headingAccent ? <em>{headingAccent}</em> : null}
              </h2>
            ) : null}
            {note ? <p className="impactNote impactReveal">{note}</p> : null}
          </div>
          <div className="impactGrid">
            {items.map((item, index) => (
              <div className="impactCell" key={`${text(item?.index)}-${index}`}>
                <span className="impactIndex">
                  {text(item?.index) || String(index + 1).padStart(2, "0")}
                </span>
                <span className="impactNumber" data-count={number(item?.number, 0)}>
                  {isEditorPreview
                    ? number(item?.number, 0).toLocaleString(locale)
                    : "0"}
                </span>
                <span className="impactLabel">{text(item?.label)}</span>
              </div>
            ))}
          </div>
          {footerText || (linkLabel && linkUrl) ? (
            <div className="impactFoot impactReveal">
              {footerText ? <p>{footerText}</p> : null}
              {linkLabel && linkUrl ? (
                <ImpactLink href={linkUrl} target={linkTarget}>
                  <span>{linkLabel}</span>
                  <ArrowRightOutlined aria-hidden="true" />
                </ImpactLink>
              ) : null}
            </div>
          ) : null}
        </Ledger>
      </PageContainer>
    </FullWidthBackground>
  );
}
