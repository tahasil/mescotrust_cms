"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
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
  subTitle: "Welcome to MESCO",
  statement:
    "A selfless effort for serving mankind. What began in 1968 as a few friends around a table now reaches 15,000 families a year, carrying education, medical aid and dignity from those who want to give to those who need it most.",
  primaryLabel: "Mesco at a Glance",
  primaryUrl: "/about-us/mesco-at-glance",
  secondaryLabel: "Zakat Appeal",
  secondaryUrl: "/donate-now",
  establishmentLabel: "Est. 1968",
  establishmentText: "Charity Commissioner of Mumbai",
  inlineImages: [
    {
      imageUrl: "https://mescotrust.org/uploads/142023143119787_1.jpg",
      alt: "Students at their felicitation",
      afterWord: 24,
    },
    {
      imageUrl:
        "https://mescotrust.org/uploads/2632025123339212_webimage1.jpg",
      alt: "A patient receiving medical aid",
      afterWord: 25,
    },
    {
      imageUrl: "https://mescotrust.org/uploads/34202310157525_3.jpg",
      alt: "A woman receiving a sewing machine",
      afterWord: 28,
    },
  ],
};

const Statement = styled.div`
  width: 100%;
  position: relative;
  font-family: "Instrument Sans", system-ui, sans-serif;

  .statementSubTitle {
    margin: 0 0 18px;
    color: var(--statement-sub-title);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.16em;
    line-height: 1.6;
    text-transform: uppercase;
  }

  .statementText {
    max-width: 26ch;
    margin: 0 0 clamp(30px, 4vw, 48px);
    color: var(--statement-word-active);
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: clamp(26px, 3.6vw, 54px);
    font-weight: 560;
    letter-spacing: -0.02em;
    line-height: 1.22;
  }

  .statementWord {
    color: var(--statement-word-active);
    opacity: var(--statement-word-inactive-opacity);
  }

  .statementChip {
    display: inline-block;
    width: clamp(58px, 5.4vw, 92px);
    height: clamp(38px, 3.6vw, 58px);
    margin: 0 8px;
    border-radius: 999px;
    box-shadow: 0 8px 20px rgba(33, 30, 46, 0.18);
    object-fit: cover;
    transform: translateY(-5px);
    vertical-align: middle;
  }

  .statementRow {
    display: flex;
    align-items: center;
    gap: 26px;
    flex-wrap: wrap;
  }

  .statementPrimary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 26px;
    border: 1px solid var(--statement-primary-border);
    border-radius: 999px;
    background: var(--statement-primary-bg);
    color: var(--statement-primary-text);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.6;
    text-decoration: none;
    transition:
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.25s,
      color 0.25s,
      border-color 0.25s,
      box-shadow 0.25s;
  }

  .statementPrimary:hover {
    background: var(--statement-primary-hover-bg);
    border-color: var(--statement-primary-hover-border);
    color: var(--statement-primary-hover-text);
    transform: translateY(-2px);
  }

  .statementPrimary:active {
    transform: scale(0.97);
  }

  .statementSecondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid currentColor;
    color: var(--statement-secondary-text);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.6;
    text-decoration: none;
    transition:
      color 0.2s,
      gap 0.25s;
  }

  .statementSecondary:hover {
    gap: 13px;
    color: var(--statement-secondary-hover);
  }

  .statementEstablishment {
    margin: 0 0 0 auto;
    color: var(--statement-establishment-text);
    font-size: 14.5px;
    line-height: 1.6;
  }

  .statementEstablishment strong {
    margin-right: 8px;
    color: var(--statement-establishment-label);
    font-weight: 700;
  }

  @media (max-width: 767px) {
    .statementEstablishment {
      width: 100%;
      margin-left: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .statementWord {
      opacity: 1 !important;
    }

    .statementSubTitle,
    .statementRow {
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

const textValue = (value) => (value == null ? "" : String(value).trim());
const numberValue = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const colorValue = (value, fallback) =>
  textValue(value) ? getColor(textValue(value)) : fallback;

function ConfigurableLink({ href, target, className, children }) {
  if (!href) return null;
  const resolvedTarget = normalizeTarget(target);
  const commonProps = {
    className,
    target: resolvedTarget,
    rel: resolvedTarget === "_blank" ? "noopener noreferrer" : undefined,
  };
  if (/^(https?:)?\/\//i.test(href)) {
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...commonProps}>
      {children}
    </Link>
  );
}

function createStatementNodes(statement, images) {
  const words = statement.split(/\s+/).filter(Boolean);
  const imagesByPosition = new Map();
  images.forEach((item, imageIndex) => {
    const position = Math.max(0, Math.round(numberValue(item?.afterWord, 0)));
    if (!imagesByPosition.has(position)) imagesByPosition.set(position, []);
    imagesByPosition.get(position).push({ ...item, imageIndex });
  });

  const nodes = [];
  words.forEach((word, wordIndex) => {
    nodes.push(
      <span className="statementWord" key={`word-${wordIndex}`}>
        {nodes.length ? " " : ""}
        {word}
      </span>,
    );
    (imagesByPosition.get(wordIndex + 1) || []).forEach((item) => {
      if (!textValue(item.imageUrl)) return;
      nodes.push(
        <img
          className="statementWord statementChip"
          src={textValue(item.imageUrl)}
          alt={textValue(item.alt)}
          loading="lazy"
          key={`image-${item.imageIndex}`}
        />,
      );
    });
  });
  return nodes;
}

export default function WelcometoMESCO(props) {
  const pathname = usePathname();
  const statementRef = useRef(null);
  const isEditorPreview = pathname?.startsWith("/admin") === true;

  const subTitle = textValue(
    props?.welcometoMESCOSubTitle ?? props?.welcomeLabel ?? DEFAULT_CONTENT.subTitle,
  );
  const statementText = textValue(
    props?.welcometoMESCOStatementText ?? DEFAULT_CONTENT.statement,
  );
  const inlineImages = Array.isArray(props?.welcometoMESCOInlineImages)
    ? props.welcometoMESCOInlineImages
    : DEFAULT_CONTENT.inlineImages;
  const statementNodes = useMemo(
    () => createStatementNodes(statementText, inlineImages),
    [inlineImages, statementText],
  );

  useLayoutEffect(() => {
    const root = statementRef.current;
    if (!root) return;
    const wordElements = root.querySelectorAll(".statementWord");
    const revealElements = root.querySelectorAll(
      ".statementSubTitle, .statementRow",
    );

    if (
      isEditorPreview ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      gsap.set(wordElements, { opacity: 1 });
      gsap.set(revealElements, { autoAlpha: 1, y: 0 });
      return;
    }

    const context = gsap.context(() => {
      gsap.to(wordElements, {
        opacity: 1,
        stagger: 0.04,
        ease: "none",
        scrollTrigger: {
          trigger: root.querySelector(".statementText"),
          start: "top 80%",
          end: "bottom 52%",
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: -10,
        },
      });

      gsap.fromTo(
        revealElements,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: "power3.out",
          overwrite: true,
          scrollTrigger: {
            trigger: root,
            start: "top 86%",
            once: true,
            refreshPriority: -10,
          },
        },
      );
    }, root);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [isEditorPreview, statementNodes]);

  const sectionBgType = textValue(
    props?.welcometoMESCOSectionBgType || "default",
  );
  const sectionBgImage = textValue(props?.welcometoMESCOSectionBgImage);
  const sectionBgColorKey = textValue(props?.welcometoMESCOSectionBgColorKey);
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : {}),
    ...Object.fromEntries(
      [
        ["paddingTop", props?.welcometoMESCOSectionPaddingTop],
        ["paddingBottom", props?.welcometoMESCOSectionPaddingBottom],
        ["marginTop", props?.welcometoMESCOSectionMarginTop],
        ["marginBottom", props?.welcometoMESCOSectionMarginBottom],
      ]
        .filter(([, value]) => value != null && value !== "" && numberValue(value, -1) >= 0)
        .map(([key, value]) => [key, `${numberValue(value, 0)}px`]),
    ),
  };

  const pageContainerBgType = textValue(
    props?.welcometoMESCOPageContainerBgType || "default",
  );
  const pageContainerBgImage = textValue(
    props?.welcometoMESCOPageContainerBgImage,
  );
  const pageContainerBgColorKey = textValue(
    props?.welcometoMESCOPageContainerBgColorKey,
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
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : {}),
    ...Object.fromEntries(
      [
        ["paddingTop", props?.welcometoMESCOPageContainerPaddingTop],
        ["paddingRight", props?.welcometoMESCOPageContainerPaddingRight],
        ["paddingBottom", props?.welcometoMESCOPageContainerPaddingBottom],
        ["paddingLeft", props?.welcometoMESCOPageContainerPaddingLeft],
        ["marginTop", props?.welcometoMESCOPageContainerMarginTop],
        ["marginBottom", props?.welcometoMESCOPageContainerMarginBottom],
      ]
        .filter(([, value]) => value != null && value !== "" && numberValue(value, -1) >= 0)
        .map(([key, value]) => [key, `${numberValue(value, 0)}px`]),
    ),
  };

  const primaryText = textValue(
    props?.welcometoMESCOPrimaryButtonText ?? DEFAULT_CONTENT.primaryLabel,
  );
  const primaryLink = textValue(
    props?.welcometoMESCOPrimaryButtonLink ?? DEFAULT_CONTENT.primaryUrl,
  );
  const primaryTarget = normalizeTarget(
    props?.welcometoMESCOPrimaryButtonTarget ??
      (props?.welcometoMESCOPrimaryButtonNewTab === true ? "_blank" : "_self"),
  );
  const secondaryText = textValue(
    props?.welcometoMESCOSecondaryLinkText ??
      props?.buttonText ??
      DEFAULT_CONTENT.secondaryLabel,
  );
  const secondaryLink = textValue(
    props?.welcometoMESCOSecondaryLinkUrl ??
      props?.buttonLink ??
      DEFAULT_CONTENT.secondaryUrl,
  );
  const secondaryTarget = normalizeTarget(
    props?.welcometoMESCOSecondaryLinkTarget ??
      (props?.welcometoMESCOSecondaryLinkNewTab === true ? "_blank" : "_self"),
  );
  const establishmentLabel = textValue(
    props?.welcometoMESCOEstablishmentLabel ??
      DEFAULT_CONTENT.establishmentLabel,
  );
  const establishmentText = textValue(
    props?.welcometoMESCOEstablishmentText ?? DEFAULT_CONTENT.establishmentText,
  );

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Statement
          ref={statementRef}
          style={{
            "--statement-sub-title": colorValue(
              props?.welcometoMESCOSubTitleColorKey,
              getColor("primary"),
            ),
            "--statement-word-active": colorValue(
              props?.welcometoMESCOStatementColorKey,
              getColor("black"),
            ),
            "--statement-word-inactive-opacity": 0.14,
            "--statement-primary-bg": colorValue(
              props?.welcometoMESCOPrimaryButtonBgColorKey,
              getColor("black"),
            ),
            "--statement-primary-text": colorValue(
              props?.welcometoMESCOPrimaryButtonTextColorKey,
              getColor("cream"),
            ),
            "--statement-primary-border": colorValue(
              props?.welcometoMESCOPrimaryButtonBorderColorKey,
              "transparent",
            ),
            "--statement-primary-hover-bg": colorValue(
              props?.welcometoMESCOPrimaryButtonHoverBgColorKey,
              "#000",
            ),
            "--statement-primary-hover-text": colorValue(
              props?.welcometoMESCOPrimaryButtonHoverTextColorKey,
              getColor("cream"),
            ),
            "--statement-primary-hover-border": colorValue(
              props?.welcometoMESCOPrimaryButtonHoverBorderColorKey,
              "transparent",
            ),
            "--statement-secondary-text": colorValue(
              props?.welcometoMESCOSecondaryLinkColorKey,
              getColor("black"),
            ),
            "--statement-secondary-hover": colorValue(
              props?.welcometoMESCOSecondaryLinkHoverColorKey,
              getColor("primary"),
            ),
            "--statement-establishment-label": colorValue(
              props?.welcometoMESCOEstablishmentLabelColorKey,
              getColor("black"),
            ),
            "--statement-establishment-text": colorValue(
              props?.welcometoMESCOEstablishmentTextColorKey,
              getColor("blackMuted"),
            ),
          }}
        >
          {subTitle ? <p className="statementSubTitle">{subTitle}</p> : null}
          {statementText ? (
            <p className="statementText">{statementNodes}</p>
          ) : null}
          <div className="statementRow">
            {primaryText && primaryLink ? (
              <ConfigurableLink
                className="statementPrimary"
                href={primaryLink}
                target={primaryTarget}
              >
                {primaryText}
              </ConfigurableLink>
            ) : null}
            {secondaryText && secondaryLink ? (
              <ConfigurableLink
                className="statementSecondary"
                href={secondaryLink}
                target={secondaryTarget}
              >
                <span>{secondaryText}</span>
                <ArrowRightOutlined aria-hidden="true" />
              </ConfigurableLink>
            ) : null}
            {establishmentLabel || establishmentText ? (
              <p className="statementEstablishment">
                {establishmentLabel ? <strong>{establishmentLabel}</strong> : null}
                {establishmentText}
              </p>
            ) : null}
          </div>
        </Statement>
      </PageContainer>
    </FullWidthBackground>
  );
}
