"use client";

import Link from "next/link";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

function cleanText(value) {
  return value != null ? String(value).trim() : "";
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeItem(item, index) {
  const iconDesktop = cleanText(
    item?.iconDesktop ?? item?.imageDesktop ?? item?.image ?? item?.icon,
  );
  const iconMobile = cleanText(item?.iconMobile ?? item?.imageMobile);
  const sortOrderRaw = Number(item?.sortOrder);
  return {
    iconDesktop,
    iconMobile,
    title: cleanText(item?.title),
    description: cleanText(item?.description ?? item?.text),
    buttonText: cleanText(item?.buttonText ?? item?.linkText),
    buttonLink: cleanText(item?.buttonLink ?? item?.link ?? item?.url),
    hoverTitle: cleanText(item?.hoverTitle),
    hoverDescription: cleanText(item?.hoverDescription),
    hoverButtonText: cleanText(item?.hoverButtonText),
    hoverButtonLink: cleanText(item?.hoverButtonLink),
    bgColorKey: cleanText(item?.bgColorKey ?? item?.cardBgColorKey),
    hoverBgColorKey: cleanText(
      item?.hoverBgColorKey ?? item?.cardHoverBgColorKey,
    ),
    visible: item?.visible !== false && item?.isVisible !== false,
    sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : index,
  };
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

function ActionLink({ href, text, className }) {
  if (!href || !text) return null;
  if (isExternalUrl(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {text}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}

/**
 * Site component: Cards1.
 * Figma-aligned cards layout with white default state and dark hover state.
 * All content comes from DB-driven cards1Items configured in the drawer.
 */
export default function Cards1(props) {
  const mainTitle = cleanText(props?.mainTitle);
  const subTitle = cleanText(props?.subTitle);

  const titleEnabled = props?.cards1TitleEnabled !== false;
  const subTitleEnabled = props?.cards1SubTitleEnabled !== false;

  const subTitleColorKey = cleanText(props?.cards1SubTitleColorKey);
  const mainTitleColorKey = cleanText(
    props?.cards1MainTitleColorKey ?? props?.titleColorKey,
  );

  const cardBgColorKey = cleanText(props?.cards1CardBgColorKey);
  const cardBorderColorKey = cleanText(props?.cards1CardBorderColorKey);
  const cardTitleColorKey = cleanText(props?.cards1CardTitleColorKey);
  const cardDescriptionColorKey = cleanText(props?.cards1CardDescriptionColorKey);
  const cardHoverBgColorKey = cleanText(props?.cards1CardHoverBgColorKey);
  const cardHoverTitleColorKey = cleanText(props?.cards1CardHoverTitleColorKey);
  const cardHoverDescriptionColorKey = cleanText(
    props?.cards1CardHoverDescriptionColorKey,
  );
  const cardIconBgColorKey = cleanText(props?.cards1CardIconBgColorKey);
  const cardButtonBgColorKey = cleanText(props?.cards1CardButtonBgColorKey);
  const cardButtonTextColorKey = cleanText(props?.cards1CardButtonTextColorKey);
  const cardHoverButtonBgColorKey = cleanText(
    props?.cards1CardHoverButtonBgColorKey,
  );
  const cardHoverButtonTextColorKey = cleanText(
    props?.cards1CardHoverButtonTextColorKey,
  );

  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : getColor("primary");

  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#ffffff";
  const cardBorderColor = cardBorderColorKey
    ? getColor(cardBorderColorKey)
    : "#e8edf4";
  const cardTitleColor = cardTitleColorKey ? getColor(cardTitleColorKey) : "#111111";
  const cardDescriptionColor = cardDescriptionColorKey
    ? getColor(cardDescriptionColorKey)
    : "#42526f";
  const cardHoverBgColor = cardHoverBgColorKey
    ? getColor(cardHoverBgColorKey)
    : "#060708";
  const cardHoverTitleColor = cardHoverTitleColorKey
    ? getColor(cardHoverTitleColorKey)
    : "#ffffff";
  const cardHoverDescriptionColor = cardHoverDescriptionColorKey
    ? getColor(cardHoverDescriptionColorKey)
    : "#f3f5f8";
  const cardIconBgColor = cardIconBgColorKey
    ? getColor(cardIconBgColorKey)
    : "#a6211c";
  const cardButtonBgColor = cardButtonBgColorKey
    ? getColor(cardButtonBgColorKey)
    : "transparent";
  const cardButtonTextColor = cardButtonTextColorKey
    ? getColor(cardButtonTextColorKey)
    : "#a6211c";
  const cardHoverButtonBgColor = cardHoverButtonBgColorKey
    ? getColor(cardHoverButtonBgColorKey)
    : "rgba(255,255,255,0.16)";
  const cardHoverButtonTextColor = cardHoverButtonTextColorKey
    ? getColor(cardHoverButtonTextColorKey)
    : "#ffffff";

  const columnsDesktop = clamp(props?.cards1ColumnsDesktop, 1, 6, 5);
  const columnsLaptop = clamp(props?.cards1ColumnsLaptop, 1, 6, 4);
  const columnsTablet = clamp(props?.cards1ColumnsTablet, 1, 4, 3);
  const columnsMobileLandscape = clamp(
    props?.cards1ColumnsMobileLandscape,
    1,
    3,
    2,
  );
  const columnsMobile = clamp(props?.cards1ColumnsMobile, 1, 2, 1);
  const columnGap = clamp(props?.cards1ColumnGap, 0, 80, 18);
  const rowGap = clamp(props?.cards1RowGap, 0, 80, 22);

  const cardRadius = clamp(props?.cards1CardRadius, 0, 48, 14);
  const cardBorderWidth = clamp(props?.cards1CardBorderWidth, 0, 8, 1);
  const cardMinHeight = clamp(props?.cards1CardMinHeight, 120, 500, 182);
  const cardPaddingTop = clamp(props?.cards1CardPaddingTop, 0, 120, 18);
  const cardPaddingBottom = clamp(props?.cards1CardPaddingBottom, 0, 120, 18);
  const cardPaddingX = clamp(props?.cards1CardPaddingX, 0, 120, 20);

  const iconWrapSize = clamp(props?.cards1CardIconWrapSize, 16, 120, 56);
  const iconSize = clamp(props?.cards1CardIconSize, 10, 80, 24);

  const titleSize = clamp(props?.cards1CardTitleFontSize, 10, 48, 34);
  const titleLineHeight = clamp(props?.cards1CardTitleLineHeight, 1, 2.4, 1.3);
  const descriptionSize = clamp(props?.cards1CardDescriptionFontSize, 10, 32, 14);
  const descriptionLineHeight = clamp(
    props?.cards1CardDescriptionLineHeight,
    1,
    2.6,
    1.5,
  );
  const buttonSize = clamp(props?.cards1CardButtonFontSize, 10, 24, 13);
  const buttonRadius = clamp(props?.cards1CardButtonRadius, 0, 48, 8);
  const hoverLift = clamp(props?.cards1CardHoverLift, 0, 24, 3);
  const hoverTransitionMs = clamp(props?.cards1CardHoverTransitionMs, 100, 900, 260);

  const rawItems = Array.isArray(props?.cards1Items) ? props.cards1Items : [];
  const cards = rawItems
    .map((item, index) => ({ ...normalizeItem(item, index), _index: index }))
    .sort((a, b) => {
      if (a.sortOrder === b.sortOrder) return a._index - b._index;
      return a.sortOrder - b.sortOrder;
    })
    .filter((card) => card.visible);

  const sectionBgType = (props?.cards1SectionBgType ?? "default").toString();
  const sectionBgImage = (props?.cards1SectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.cards1SectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop = props?.cards1SectionPaddingTop != null ? Number(props.cards1SectionPaddingTop) : null;
  const sectionPaddingBottom = props?.cards1SectionPaddingBottom != null ? Number(props.cards1SectionPaddingBottom) : null;
  const sectionMarginTop = props?.cards1SectionMarginTop != null ? Number(props.cards1SectionMarginTop) : null;
  const sectionMarginBottom = props?.cards1SectionMarginBottom != null ? Number(props.cards1SectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.cards1PageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.cards1PageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.cards1PageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop = props?.cards1PageContainerPaddingTop != null ? Number(props.cards1PageContainerPaddingTop) : null;
  const containerPaddingRight = props?.cards1PageContainerPaddingRight != null ? Number(props.cards1PageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.cards1PageContainerPaddingBottom != null ? Number(props.cards1PageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.cards1PageContainerPaddingLeft != null ? Number(props.cards1PageContainerPaddingLeft) : null;
  const containerMarginTop = props?.cards1PageContainerMarginTop != null ? Number(props.cards1PageContainerMarginTop) : null;
  const containerMarginBottom = props?.cards1PageContainerMarginBottom != null ? Number(props.cards1PageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
          <div style={{ marginBottom: 28 }}>
            {subTitleEnabled && subTitle ? (
              <SubTitle color={subTitleColor}>{subTitle}</SubTitle>
            ) : null}
            {titleEnabled && mainTitle ? (
              <MainTitle color={mainTitleColor}>{mainTitle}</MainTitle>
            ) : null}
          </div>
        ) : null}

        <div
          className="cards1-grid"
          style={{
            "--cards1-cols-desktop": columnsDesktop,
            "--cards1-cols-laptop": columnsLaptop,
            "--cards1-cols-tablet": columnsTablet,
            "--cards1-cols-mobile-landscape": columnsMobileLandscape,
            "--cards1-cols-mobile": columnsMobile,
            "--cards1-col-gap": `${columnGap}px`,
            "--cards1-row-gap": `${rowGap}px`,
            "--cards1-card-bg": cardBgColor,
            "--cards1-card-border": cardBorderColor,
            "--cards1-card-border-width": `${cardBorderWidth}px`,
            "--cards1-card-radius": `${cardRadius}px`,
            "--cards1-card-min-height": `${cardMinHeight}px`,
            "--cards1-card-padding-top": `${cardPaddingTop}px`,
            "--cards1-card-padding-bottom": `${cardPaddingBottom}px`,
            "--cards1-card-padding-x": `${cardPaddingX}px`,
            "--cards1-icon-wrap-size": `${iconWrapSize}px`,
            "--cards1-icon-size": `${iconSize}px`,
            "--cards1-title-size": `${titleSize}px`,
            "--cards1-title-line-height": titleLineHeight,
            "--cards1-description-size": `${descriptionSize}px`,
            "--cards1-description-line-height": descriptionLineHeight,
            "--cards1-button-size": `${buttonSize}px`,
            "--cards1-button-radius": `${buttonRadius}px`,
            "--cards1-card-title-color": cardTitleColor,
            "--cards1-card-description-color": cardDescriptionColor,
            "--cards1-card-hover-bg": cardHoverBgColor,
            "--cards1-card-hover-title-color": cardHoverTitleColor,
            "--cards1-card-hover-description-color": cardHoverDescriptionColor,
            "--cards1-icon-bg": cardIconBgColor,
            "--cards1-button-bg": cardButtonBgColor,
            "--cards1-button-color": cardButtonTextColor,
            "--cards1-button-hover-bg": cardHoverButtonBgColor,
            "--cards1-button-hover-color": cardHoverButtonTextColor,
            "--cards1-hover-lift": `${hoverLift}px`,
            "--cards1-hover-transition": `${hoverTransitionMs}ms`,
          }}
        >
          {cards.map((card, index) => {
            const hoverTitle = card.hoverTitle || card.title;
            const hoverDescription = card.hoverDescription || card.description;
            const hoverButtonText = card.hoverButtonText || card.buttonText;
            const hoverButtonLink = card.hoverButtonLink || card.buttonLink;
            const hasHoverOverride =
              Boolean(card.hoverTitle) ||
              Boolean(card.hoverDescription) ||
              Boolean(card.hoverButtonText) ||
              Boolean(card.hoverButtonLink);
            const perCardStyle = {
              "--cards1-item-bg": card.bgColorKey ? getColor(card.bgColorKey) : cardBgColor,
              "--cards1-item-hover-bg": card.hoverBgColorKey
                ? getColor(card.hoverBgColorKey)
                : cardHoverBgColor,
            };

            return (
              <article
                key={`${card.title || "card"}-${card.sortOrder}-${index}`}
                className={`cards1-item${hasHoverOverride ? " cards1-item--swap" : ""}`}
                style={perCardStyle}
              >
                <div className="cards1-item-icon-wrap">
                  {card.iconDesktop || card.iconMobile ? (
                    <picture>
                      {card.iconMobile ? (
                        <source media="(max-width: 767px)" srcSet={card.iconMobile} />
                      ) : null}
                      <img
                        src={card.iconDesktop || card.iconMobile}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    </picture>
                  ) : (
                    <span className="cards1-item-icon-placeholder" aria-hidden="true">
                      •
                    </span>
                  )}
                </div>

                <div className="cards1-item-content">
                  <div className="cards1-item-state cards1-item-state--default">
                    {card.title ? <h3 className="cards1-item-title">{card.title}</h3> : null}
                    {card.description ? (
                      <p className="cards1-item-description">{card.description}</p>
                    ) : null}
                    <ActionLink
                      text={card.buttonText}
                      href={card.buttonLink}
                      className="cards1-item-button"
                    />
                  </div>

                  {hasHoverOverride ? (
                    <div className="cards1-item-state cards1-item-state--hover">
                      {hoverTitle ? <h3 className="cards1-item-title">{hoverTitle}</h3> : null}
                      {hoverDescription ? (
                        <p className="cards1-item-description">{hoverDescription}</p>
                      ) : null}
                      <ActionLink
                        text={hoverButtonText}
                        href={hoverButtonLink}
                        className="cards1-item-button"
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {cards.length === 0 ? (
          <div className="cards1-empty-state">
            No cards configured yet. Add cards from the Cards1 drawer.
          </div>
        ) : null}

        <style>{`
          .cards1-grid {
            display: grid;
            grid-template-columns: repeat(var(--cards1-cols-desktop, 5), minmax(0, 1fr));
            column-gap: var(--cards1-col-gap, 18px);
            row-gap: var(--cards1-row-gap, 22px);
          }

          .cards1-item {
            position: relative;
            min-width: 0;
            min-height: var(--cards1-card-min-height, 182px);
            display: flex;
            flex-direction: column;
            background: var(--cards1-item-bg, var(--cards1-card-bg, #ffffff));
            border: var(--cards1-card-border-width, 1px) solid
              var(--cards1-card-border, #e8edf4);
            border-radius: var(--cards1-card-radius, 14px);
            padding: var(--cards1-card-padding-top, 18px) var(--cards1-card-padding-x, 20px)
              var(--cards1-card-padding-bottom, 18px);
            box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
            transition:
              transform var(--cards1-hover-transition, 260ms) ease,
              background-color var(--cards1-hover-transition, 260ms) ease,
              box-shadow var(--cards1-hover-transition, 260ms) ease,
              border-color var(--cards1-hover-transition, 260ms) ease;
          }

          .cards1-item::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            opacity: 0;
            background:
              radial-gradient(circle at 18% 8%, rgba(255, 255, 255, 0.14), transparent 45%),
              linear-gradient(155deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0) 50%);
            transition: opacity var(--cards1-hover-transition, 260ms) ease;
          }

          .cards1-item:hover {
            transform: translateY(calc(-1 * var(--cards1-hover-lift, 3px)));
            background: var(--cards1-item-hover-bg, var(--cards1-card-hover-bg, #060708));
            box-shadow: 0 16px 30px rgba(4, 12, 24, 0.26);
            border-color: transparent;
          }

          .cards1-item:hover::before {
            opacity: 1;
          }

          .cards1-item-icon-wrap {
            width: var(--cards1-icon-wrap-size, 56px);
            height: var(--cards1-icon-wrap-size, 56px);
            border-radius: 999px;
            background: var(--cards1-icon-bg, #a6211c);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            overflow: hidden;
            transition: transform var(--cards1-hover-transition, 260ms) ease;
          }

          .cards1-item:hover .cards1-item-icon-wrap {
            transform: translateY(-1px);
          }

          .cards1-item-icon-wrap picture,
          .cards1-item-icon-wrap img {
            width: var(--cards1-icon-size, 24px);
            height: var(--cards1-icon-size, 24px);
            display: block;
          }

          .cards1-item-icon-wrap img {
            object-fit: contain;
            filter: brightness(0) invert(1);
          }

          .cards1-item-icon-placeholder {
            color: #ffffff;
            line-height: 1;
            font-size: calc(var(--cards1-icon-size, 24px) * 0.9);
          }

          .cards1-item-content {
            position: relative;
            display: flex;
            flex: 1;
            min-width: 0;
          }

          .cards1-item-state {
            width: 100%;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition:
              opacity var(--cards1-hover-transition, 260ms) ease,
              transform var(--cards1-hover-transition, 260ms) ease;
          }

          .cards1-item-title {
            margin: 0;
            color: var(--cards1-card-title-color, #111111);
            font-size: var(--cards1-title-size, 16px);
            line-height: var(--cards1-title-line-height, 1.3);
            font-weight: 600;
            letter-spacing: 0;
            word-break: break-word;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .cards1-item-description {
            margin: 0;
            color: var(--cards1-card-description-color, #42526f);
            font-size: var(--cards1-description-size, 14px);
            line-height: var(--cards1-description-line-height, 1.5);
            font-weight: 400;
            word-break: break-word;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .cards1-item-button {
            margin-top: 4px;
            width: fit-content;
            max-width: 100%;
            text-decoration: none;
            color: var(--cards1-button-color, #a6211c);
            background: var(--cards1-button-bg, transparent);
            border: 1px solid
              color-mix(in srgb, var(--cards1-button-color, #a6211c) 22%, transparent);
            border-radius: var(--cards1-button-radius, 8px);
            padding: 6px 12px;
            font-size: var(--cards1-button-size, 13px);
            line-height: 1.2;
            font-weight: 600;
            transition:
              color var(--cards1-hover-transition, 260ms) ease,
              background-color var(--cards1-hover-transition, 260ms) ease,
              border-color var(--cards1-hover-transition, 260ms) ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .cards1-item--swap .cards1-item-state--hover {
            position: absolute;
            inset: 0;
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
          }

          .cards1-item--swap:hover .cards1-item-state--default {
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
          }

          .cards1-item--swap:hover .cards1-item-state--hover {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
          }

          .cards1-item:hover .cards1-item-state--default .cards1-item-title,
          .cards1-item:hover .cards1-item-state--hover .cards1-item-title {
            color: var(--cards1-card-hover-title-color, #ffffff);
          }

          .cards1-item:hover .cards1-item-state--default .cards1-item-description,
          .cards1-item:hover .cards1-item-state--hover .cards1-item-description {
            color: var(--cards1-card-hover-description-color, #f3f5f8);
          }

          .cards1-item:hover .cards1-item-state--default .cards1-item-button,
          .cards1-item:hover .cards1-item-state--hover .cards1-item-button {
            color: var(--cards1-button-hover-color, #ffffff);
            background: var(--cards1-button-hover-bg, rgba(255, 255, 255, 0.16));
            border-color: color-mix(
              in srgb,
              var(--cards1-button-hover-color, #ffffff) 38%,
              transparent
            );
          }

          .cards1-empty-state {
            margin-top: 14px;
            padding: 16px;
            border: 1px dashed rgba(17, 17, 17, 0.25);
            border-radius: 10px;
            color: rgba(17, 17, 17, 0.7);
            font-size: 13px;
          }

          @media (max-width: 1399px) {
            .cards1-grid {
              grid-template-columns: repeat(var(--cards1-cols-laptop, 4), minmax(0, 1fr));
            }
          }

          @media (max-width: 991px) {
            .cards1-grid {
              grid-template-columns: repeat(var(--cards1-cols-tablet, 3), minmax(0, 1fr));
            }

            .cards1-item {
              padding:
                max(0px, calc(var(--cards1-card-padding-top, 18px) - 2px))
                max(0px, calc(var(--cards1-card-padding-x, 20px) - 2px))
                max(0px, calc(var(--cards1-card-padding-bottom, 18px) - 2px));
              min-height: calc(var(--cards1-card-min-height, 182px) - 4px);
            }

            .cards1-item-icon-wrap {
              width: calc(var(--cards1-icon-wrap-size, 56px) - 4px);
              height: calc(var(--cards1-icon-wrap-size, 56px) - 4px);
            }

            .cards1-item-icon-wrap picture,
            .cards1-item-icon-wrap img {
              width: calc(var(--cards1-icon-size, 24px) - 2px);
              height: calc(var(--cards1-icon-size, 24px) - 2px);
            }

            .cards1-item-title {
              font-size: calc(var(--cards1-title-size, 16px) * 0.86);
            }

            .cards1-item-description {
              font-size: calc(var(--cards1-description-size, 14px) * 0.95);
            }
          }

          @media (max-width: 767px) and (orientation: landscape) {
            .cards1-grid {
              grid-template-columns: repeat(
                var(--cards1-cols-mobile-landscape, 2),
                minmax(0, 1fr)
              );
            }
          }

          @media (max-width: 575px) {
            .cards1-grid {
              grid-template-columns: repeat(var(--cards1-cols-mobile, 1), minmax(0, 1fr));
            }

            .cards1-item {
              min-height: calc(var(--cards1-card-min-height, 182px) - 10px);
              padding:
                max(0px, calc(var(--cards1-card-padding-top, 18px) - 4px))
                max(0px, calc(var(--cards1-card-padding-x, 20px) - 4px))
                max(0px, calc(var(--cards1-card-padding-bottom, 18px) - 4px));
            }

            .cards1-item-icon-wrap {
              width: calc(var(--cards1-icon-wrap-size, 56px) - 8px);
              height: calc(var(--cards1-icon-wrap-size, 56px) - 8px);
              margin-bottom: 14px;
            }

            .cards1-item-icon-wrap picture,
            .cards1-item-icon-wrap img {
              width: calc(var(--cards1-icon-size, 24px) - 4px);
              height: calc(var(--cards1-icon-size, 24px) - 4px);
            }

            .cards1-item-title {
              font-size: calc(var(--cards1-title-size, 16px) * 0.76);
            }

            .cards1-item-description {
              font-size: calc(var(--cards1-description-size, 14px) * 0.92);
            }

            .cards1-item-button {
              font-size: calc(var(--cards1-button-size, 13px) * 0.95);
              max-width: 100%;
            }
          }
        `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}
