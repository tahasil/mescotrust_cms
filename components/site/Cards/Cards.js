"use client";

import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

const DEFAULT_ITEMS = [
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
];

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeItem(it) {
  const desktopImage =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : "";
  const mobileImage =
    it?.imageMobile != null ? String(it.imageMobile).trim() : "";
  return {
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    title: it?.title != null ? String(it.title).trim() : "",
  };
}

/**
 * Cards component (Figma-style certification cards grid).
 * Fully controlled via drawer (EditForm): cards list, colors, spacing, columns, image/text sizes.
 */
export default function Cards(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();

  const titleEnabled = props?.cardsTitleEnabled !== false;
  const subTitleEnabled = props?.cardsSubTitleEnabled !== false;

  const subTitleColorKey = (props?.cardsSubTitleColorKey ?? "")
    .toString()
    .trim();
  const mainTitleColorKey = (
    props?.cardsMainTitleColorKey ??
    props?.titleColorKey ??
    ""
  )
    .toString()
    .trim();
  const cardBgColorKey = (props?.cardsCardBgColorKey ?? "").toString().trim();
  const cardTitleColorKey = (props?.cardsCardTitleColorKey ?? "")
    .toString()
    .trim();
  const cardBorderColorKey = (props?.cardsCardBorderColorKey ?? "")
    .toString()
    .trim();

  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : getColor("primary");
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#fff";
  const cardTitleColor = cardTitleColorKey
    ? getColor(cardTitleColorKey)
    : "#262A2C";
  const cardBorderColor = cardBorderColorKey
    ? getColor(cardBorderColorKey)
    : "rgba(0,0,0,0.08)";

  const columnsDesktop = clamp(props?.cardsColumnsDesktop, 1, 6, 3);
  const columnsTablet = clamp(props?.cardsColumnsTablet, 1, 4, 2);
  const columnsMobile = clamp(props?.cardsColumnsMobile, 1, 2, 1);
  const colGap = clamp(props?.cardsColumnGap, 0, 64, 16);
  const rowGap = clamp(props?.cardsRowGap, 0, 64, 16);

  const cardRadius = clamp(props?.cardsCardRadius, 0, 40, 14);
  const cardBorderWidth = clamp(props?.cardsCardBorderWidth, 0, 8, 1);
  const imageAreaHeight = clamp(props?.cardsCardImageAreaHeight, 80, 320, 160);
  const imageMaxHeight = clamp(props?.cardsCardImageMaxHeight, 40, 280, 110);
  const contentPaddingY = clamp(props?.cardsCardContentPaddingY, 0, 48, 14);
  const cardTextSize = clamp(props?.cardsCardTitleFontSize, 10, 32, 14);
  const cardTextLineHeight = clamp(
    props?.cardsCardTitleLineHeight,
    1,
    2.4,
    1.35,
  );

  const rawItems = Array.isArray(props?.cardsItems) ? props.cardsItems : [];
  const cards = (rawItems.length > 0 ? rawItems : DEFAULT_ITEMS).map(
    normalizeItem,
  );

  const sectionBgType = (props?.cardsSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.cardsSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.cardsSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
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

  const sectionPaddingTop =
    props?.cardsSectionPaddingTop != null
      ? Number(props.cardsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.cardsSectionPaddingBottom != null
      ? Number(props.cardsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.cardsSectionMarginTop != null
      ? Number(props.cardsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.cardsSectionMarginBottom != null
      ? Number(props.cardsSectionMarginBottom)
      : null;

  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = (
    props?.cardsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.cardsPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.cardsPageContainerBgColorKey ?? "")
    .toString()
    .trim();
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

  const containerPaddingTop =
    props?.cardsPageContainerPaddingTop != null
      ? Number(props.cardsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.cardsPageContainerPaddingRight != null
      ? Number(props.cardsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.cardsPageContainerPaddingBottom != null
      ? Number(props.cardsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.cardsPageContainerPaddingLeft != null
      ? Number(props.cardsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.cardsPageContainerMarginTop != null
      ? Number(props.cardsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.cardsPageContainerMarginBottom != null
      ? Number(props.cardsPageContainerMarginBottom)
      : null;

  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
          <div style={{ marginBottom: 24 }}>
            {subTitleEnabled && subTitle ? (
              <SubTitle color={subTitleColor}>{subTitle}</SubTitle>
            ) : null}
            {titleEnabled && mainTitle ? (
              <MainTitle color={mainTitleColor}>{mainTitle}</MainTitle>
            ) : null}
          </div>
        ) : null}

        <div
          className="cards-grid"
          style={{
            "--cards-cols-desktop": columnsDesktop,
            "--cards-cols-tablet": columnsTablet,
            "--cards-cols-mobile": columnsMobile,
            "--cards-col-gap": `${colGap}px`,
            "--cards-row-gap": `${rowGap}px`,
            "--cards-card-radius": `${cardRadius}px`,
            "--cards-card-border-width": `${cardBorderWidth}px`,
            "--cards-card-bg": cardBgColor,
            "--cards-card-border": cardBorderColor,
            "--cards-card-title-color": cardTitleColor,
            "--cards-image-area-height": `${imageAreaHeight}px`,
            "--cards-image-max-height": `${imageMaxHeight}px`,
            "--cards-content-padding-y": `${contentPaddingY}px`,
            "--cards-card-title-size": `${cardTextSize}px`,
            "--cards-card-title-line-height": cardTextLineHeight,
          }}
        >
          {cards.map((card, idx) => (
            <article className="cards-item" key={`${card.title}-${idx}`}>
              <div className="cards-item-image-wrap">
                {card.imageDesktop || card.imageMobile ? (
                  <picture>
                    {card.imageMobile ? (
                      <source media="(max-width: 767px)" srcSet={card.imageMobile} />
                    ) : null}
                    <img
                      src={card.imageDesktop || card.imageMobile}
                      alt={card.title || `Card ${idx + 1}`}
                      loading="lazy"
                    />
                  </picture>
                ) : (
                  <div className="cards-placeholder">No Image</div>
                )}
              </div>
              <div className="cards-item-content">
                <p>{card.title}</p>
              </div>
            </article>
          ))}
        </div>

        <style>{`
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(var(--cards-cols-desktop, 3), minmax(0, 1fr));
            column-gap: var(--cards-col-gap, 16px);
            row-gap: var(--cards-row-gap, 16px);
          }

          .cards-item {
            background: var(--cards-card-bg, #fff);
            border: var(--cards-card-border-width, 1px) solid var(--cards-card-border, rgba(0,0,0,0.08));
            border-radius: var(--cards-card-radius, 14px);
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.04);
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .cards-item-image-wrap {
            height: var(--cards-image-area-height, 160px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            background: #fff;
          }

          .cards-item-image-wrap img {
            max-width: 100%;
            max-height: var(--cards-image-max-height, 110px);
            object-fit: contain;
            display: block;
          }

          .cards-item-image-wrap picture {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cards-item-content {
            border-top: 1px solid rgba(0,0,0,0.06);
            padding: var(--cards-content-padding-y, 16px) 16px;
            background: #F3F3F3;
            min-height: calc(
              (var(--cards-card-title-size, 14px) * var(--cards-card-title-line-height, 1.35) * 2)
              + (var(--cards-content-padding-y, 16px) * 2)
            );
            flex: 1;
            display: flex;
            align-items: flex-start;
            justify-content: center;
          }

          .cards-item-content p {
            margin: 0;
            text-align: center;
            color: var(--cards-card-title-color, #262A2C);
            font-weight: 500;
            font-size: var(--cards-card-title-size, 14px);
            line-height: var(--cards-card-title-line-height, 1.35);
            white-space: normal;
            overflow: visible;
            word-break: break-word;
          }

          .cards-placeholder {
            color: rgba(0,0,0,0.3);
            font-size: 13px;
            font-weight: 600;
          }

          @media (max-width: 992px) {
            .cards-grid {
              grid-template-columns: repeat(var(--cards-cols-tablet, 2), minmax(0, 1fr));
            }
          }

          @media (max-width: 576px) {
            .cards-grid {
              grid-template-columns: repeat(var(--cards-cols-mobile, 1), minmax(0, 1fr));
            }
          }
        `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}
