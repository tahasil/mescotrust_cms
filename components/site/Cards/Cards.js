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
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : getColor("white");
  const cardTitleColor = cardTitleColorKey
    ? getColor(cardTitleColorKey)
    : getColor("black");
  const cardBorderColor = cardBorderColorKey
    ? getColor(cardBorderColorKey)
    : getColor("border");

  const columnsDesktop = clamp(props?.cardsColumnsDesktop, 1, 6, 3);
  const columnsTablet = clamp(props?.cardsColumnsTablet, 1, 4, 2);
  const columnsMobile = clamp(props?.cardsColumnsMobile, 1, 2, 1);
  const colGap = clamp(props?.cardsColumnGap, 0, 64, 16);
  const rowGap = clamp(props?.cardsRowGap, 0, 64, 16);

  const cardRadius = clamp(props?.cardsCardRadius, 0, 40, 14);
  const cardBorderWidth = clamp(props?.cardsCardBorderWidth, 0, 8, 1);
  const imageAreaHeight = clamp(
    props?.cardsCardImageAreaHeight,
    80,
    320,
    160,
  );
  const imageMaxHeight = Math.min(
    imageAreaHeight,
    clamp(props?.cardsCardImageMaxHeight, 40, 280, 110),
  );
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
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
          {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
          <header>
            {subTitleEnabled && subTitle ? (
              <p className="fable-eyebrow" style={subTitleColor ? { color: subTitleColor } : undefined}>{subTitle}</p>
            ) : null}
            {titleEnabled && mainTitle ? (
              <h2 className="fable-heading" style={mainTitleColor ? { color: mainTitleColor } : undefined}>{mainTitle}</h2>
            ) : null}
          </header>
        ) : null}

        <div
          className="fable-card-grid cards-component-grid"
          style={{
            gridTemplateColumns: `repeat(${columnsDesktop}, minmax(0, 1fr))`,
            columnGap: colGap,
            rowGap,
          }}
        >
          {cards.map((card, idx) => (
            <article
              className="fable-card fable-card--contained-media"
              key={`${card.title}-${idx}`}
              style={{
                background: cardBgColor,
                borderColor: cardBorderColor,
                borderWidth: cardBorderWidth,
                borderRadius: cardRadius,
              }}
            >
              <div
                className="fable-card__media is-contained"
                style={{
                  "--cards-image-area-height": `${imageAreaHeight}px`,
                  "--cards-image-max-height": `${imageMaxHeight}px`,
                }}
              >
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
                  <span aria-hidden="true" />
                )}
              </div>
              <div className="fable-card__body" style={{ paddingBlock: contentPaddingY }}>
                <h3 style={{ color: cardTitleColor, fontSize: cardTextSize, lineHeight: cardTextLineHeight }}>{card.title}</h3>
              </div>
            </article>
          ))}
        </div>
        <style>{`
          @media (max-width: 1023px) { .cards-component-grid { grid-template-columns: repeat(${columnsTablet}, minmax(0, 1fr)) !important; } }
          @media (max-width: 767px) { .cards-component-grid { grid-template-columns: repeat(${columnsMobile}, minmax(0, 1fr)) !important; } }
        `}</style>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
