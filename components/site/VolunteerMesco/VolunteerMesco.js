"use client";

import styled from "styled-components";
import Image from "next/image";
import SafeHtml from "@/components/cms/SafeHtml";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { VOLUNTEER_MESCO_DEFAULT_PROPS } from "./defaults";

const VolunteerMescoSection = styled.div`
  --volunteer-mesco-display: "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif;
  --volunteer-mesco-body: "Instrument Sans", system-ui, sans-serif;
  color: var(--volunteer-mesco-title);
  font-family: var(--volunteer-mesco-body);
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;

  &, *, *::before, *::after { box-sizing: border-box; }

  .volunteer-mesco__inner {
  }

  .volunteer-mesco__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(36px, 5vw, 90px);
    align-items: center;
  }

  .volunteer-mesco__eyebrow {
    margin: 0 0 18px;
    color: var(--volunteer-mesco-subtitle);
    font-size: 13px;
    font-weight: 650;
    line-height: 1.6;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .volunteer-mesco__title {
    max-width: 16ch;
    margin: 0;
    color: var(--volunteer-mesco-title);
    font-family: var(--volunteer-mesco-display);
    font-size: clamp(36px, 4.6vw, 64px);
    font-weight: 620;
    line-height: 1.08;
    letter-spacing: -.02em;
  }

  .volunteer-mesco__description {
    max-width: 62ch;
    margin-top: 20px;
    color: var(--volunteer-mesco-description);
    font-size: 17px;
    line-height: 1.6;
  }

  .volunteer-mesco__description p { margin: 0 0 18px; color: inherit; }
  .volunteer-mesco__description > :last-child { margin-bottom: 0; }

  .volunteer-mesco__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .volunteer-mesco__chip {
    padding: 8px 16px;
    color: var(--volunteer-mesco-chip-text);
    background: var(--volunteer-mesco-chip-bg);
    border: 1px solid var(--volunteer-mesco-chip-border);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 570;
    line-height: 1.6;
  }

  .volunteer-mesco__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 28px;
  }

  .volunteer-mesco__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 13px 26px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    transition: transform .25s cubic-bezier(.16, 1, .3, 1), background .25s, color .25s, border-color .25s, box-shadow .25s;
  }

  .volunteer-mesco__button:active { transform: scale(.97); }
  .volunteer-mesco__button--primary {
    color: var(--volunteer-mesco-primary-text);
    background: var(--volunteer-mesco-primary-bg);
    box-shadow: 0 14px 30px color-mix(in srgb, var(--volunteer-mesco-primary-bg) 28%, transparent);
  }
  .volunteer-mesco__button--primary:hover {
    color: var(--volunteer-mesco-primary-text);
    background: var(--volunteer-mesco-primary-hover-bg);
    transform: translateY(-2px);
  }
  .volunteer-mesco__button--secondary {
    color: var(--volunteer-mesco-secondary-text);
    background: transparent;
    border-color: var(--volunteer-mesco-secondary-border);
  }
  .volunteer-mesco__button--secondary:hover {
    color: var(--volunteer-mesco-secondary-text);
    border-color: var(--volunteer-mesco-secondary-hover-border);
    transform: translateY(-2px);
  }

  .volunteer-mesco__media {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: var(--volunteer-mesco-image-bg);
    border-radius: 20px;
  }

  .volunteer-mesco__media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform .7s cubic-bezier(.16, 1, .3, 1);
  }

  .volunteer-mesco__media:hover img { transform: scale(1.04); }

  @media (max-width: 1023px) {
    .volunteer-mesco__grid { grid-template-columns: minmax(0, 1fr); }
  }

  @media (max-width: 767px) {
    .volunteer-mesco__title { font-size: clamp(34px, 9.5vw, 48px); }
    .volunteer-mesco__description { font-size: 16px; }
    .volunteer-mesco__actions { align-items: stretch; flex-direction: column; }
    .volunteer-mesco__button { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .volunteer-mesco__media img,
    .volunteer-mesco__button { transition: none; }
  }
`;

const clean = (value) => value == null ? "" : String(value).trim();
const target = (value) => value === "_blank" ? "_blank" : "_self";

function resolveColor(value, fallbackKey) {
  return getColor(clean(value) || fallbackKey);
}

function managedNumber(value) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function pixelStyle(value) {
  const number = managedNumber(value);
  return number == null ? undefined : `${number}px`;
}

function wrapperProps(settings) {
  const prefix = "volunteerMesco";
  const sectionType = clean(settings[`${prefix}SectionBgType`]) || "default";
  const sectionImage = clean(settings[`${prefix}SectionBgImage`]);
  const sectionColor = clean(settings[`${prefix}SectionBgColorKey`]);
  const pageType = clean(settings[`${prefix}PageContainerBgType`]) || "default";
  const pageImage = clean(settings[`${prefix}PageContainerBgImage`]);
  const pageColor = clean(settings[`${prefix}PageContainerBgColorKey`]);
  return {
    sectionBgClassName: sectionType === "default" ? "defaultBackground" : undefined,
    sectionBgStyle: {
      ...(sectionType === "image" && sectionImage
        ? {
            backgroundImage: `url(${sectionImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }
        : {}),
      ...(sectionType === "color" && sectionColor
        ? { backgroundColor: getColor(sectionColor), backgroundImage: "none" }
        : {}),
      paddingTop: pixelStyle(settings[`${prefix}SectionPaddingTop`]),
      paddingBottom: pixelStyle(settings[`${prefix}SectionPaddingBottom`]),
      marginTop: pixelStyle(settings[`${prefix}SectionMarginTop`]),
      marginBottom: pixelStyle(settings[`${prefix}SectionMarginBottom`]),
    },
    pageContainerBgStyle: {
      ...(pageType === "image" && pageImage
        ? {
            backgroundImage: `url(${pageImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }
        : {}),
      ...(pageType === "color" && pageColor
        ? { backgroundColor: getColor(pageColor), backgroundImage: "none" }
        : {}),
     
    },
  };
}

export default function VolunteerMesco(props) {
  const settings = { ...VOLUNTEER_MESCO_DEFAULT_PROPS, ...(props || {}) };
  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = wrapperProps(settings);
  const chips = Array.isArray(settings.volunteerMescoChips)
    ? settings.volunteerMescoChips.map(clean).filter(Boolean)
    : [];
  const primaryTarget = target(settings.volunteerMescoPrimaryButtonTarget);
  const secondaryTarget = target(settings.volunteerMescoSecondaryButtonTarget);
  const image = clean(settings.volunteerMescoImage);
  const showPrimary = settings.volunteerMescoPrimaryButtonVisible === true && clean(settings.volunteerMescoPrimaryButtonText) && clean(settings.volunteerMescoPrimaryButtonLink);
  const showSecondary = settings.volunteerMescoSecondaryButtonVisible === true && clean(settings.volunteerMescoSecondaryButtonText) && clean(settings.volunteerMescoSecondaryButtonLink);
  const variables = {
    "--volunteer-mesco-subtitle": resolveColor(settings.volunteerMescoSubTitleColorKey, "primary"),
    "--volunteer-mesco-title": resolveColor(settings.volunteerMescoTitleColorKey, "black"),
    "--volunteer-mesco-description": resolveColor(settings.volunteerMescoDescriptionColorKey, "blackLight"),
    "--volunteer-mesco-chip-text": resolveColor(settings.volunteerMescoChipTextColorKey, "black"),
    "--volunteer-mesco-chip-bg": resolveColor(settings.volunteerMescoChipBgColorKey, "surface"),
    "--volunteer-mesco-chip-border": resolveColor(settings.volunteerMescoChipBorderColorKey, "border"),
    "--volunteer-mesco-primary-bg": resolveColor(settings.volunteerMescoPrimaryButtonBgColorKey, "primary"),
    "--volunteer-mesco-primary-text": resolveColor(settings.volunteerMescoPrimaryButtonTextColorKey, "white"),
    "--volunteer-mesco-primary-hover-bg": resolveColor(settings.volunteerMescoPrimaryButtonHoverBgColorKey, "primaryDark"),
    "--volunteer-mesco-secondary-text": resolveColor(settings.volunteerMescoSecondaryButtonTextColorKey, "black"),
    "--volunteer-mesco-secondary-border": resolveColor(settings.volunteerMescoSecondaryButtonBorderColorKey, "border"),
    "--volunteer-mesco-secondary-hover-border": resolveColor(settings.volunteerMescoSecondaryButtonHoverBorderColorKey, "black"),
    "--volunteer-mesco-image-bg": resolveColor(settings.volunteerMescoImageBgColorKey, "surface"),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <VolunteerMescoSection style={variables}>
          <div className="volunteer-mesco__inner">
            <div className="volunteer-mesco__grid">
              <div className="volunteer-mesco__content">
                {settings.volunteerMescoSubTitleVisible !== false && clean(settings.volunteerMescoSubTitle) ? (
                  <p className="volunteer-mesco__eyebrow">{clean(settings.volunteerMescoSubTitle)}</p>
                ) : null}
                {settings.volunteerMescoTitleVisible !== false && clean(settings.volunteerMescoTitle) ? (
                  <h2 className="volunteer-mesco__title">{renderHighlightedTitle(clean(settings.volunteerMescoTitle), settings)}</h2>
                ) : null}
                {settings.volunteerMescoDescriptionVisible !== false && clean(settings.volunteerMescoDescription) ? (
                  <div className="volunteer-mesco__description"><SafeHtml html={settings.volunteerMescoDescription} /></div>
                ) : null}
                {settings.volunteerMescoChipsVisible !== false && chips.length > 0 ? (
                  <div className="volunteer-mesco__chips">{chips.map((chip, index) => <span className="volunteer-mesco__chip" key={`${chip}-${index}`}>{chip}</span>)}</div>
                ) : null}
                {showPrimary || showSecondary ? (
                  <div className="volunteer-mesco__actions">
                    {showPrimary ? <a className="volunteer-mesco__button volunteer-mesco__button--primary" href={clean(settings.volunteerMescoPrimaryButtonLink)} target={primaryTarget} rel={primaryTarget === "_blank" ? "noopener noreferrer" : undefined}>{clean(settings.volunteerMescoPrimaryButtonText)}</a> : null}
                    {showSecondary ? <a className="volunteer-mesco__button volunteer-mesco__button--secondary" href={clean(settings.volunteerMescoSecondaryButtonLink)} target={secondaryTarget} rel={secondaryTarget === "_blank" ? "noopener noreferrer" : undefined}>{clean(settings.volunteerMescoSecondaryButtonText)}</a> : null}
                  </div>
                ) : null}
              </div>
              {settings.volunteerMescoImageVisible !== false ? (
                <div className="volunteer-mesco__media">
                  {image ? <Image src={image} alt={clean(settings.volunteerMescoImageAlt)} fill sizes="(max-width: 1023px) calc(100vw - 40px), 50vw" unoptimized /> : null}
                </div>
              ) : null}
            </div>
          </div>
        </VolunteerMescoSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
