"use client";

import styled, { css } from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";

/**
 * Site component: TimelineTrack (display name "Timeline Track").
 * Vertical timeline with alternating (or single-side) cards, a centre rail with
 * dot indicators + connectors, date pills, optional badge / image / link.
 * All content comes from props (merged from theme by getLayoutData()).
 */

const PREFIX = "timelineTrack";

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function normalizeItem(item) {
  return {
    date: text(item?.date),
    title: text(item?.title),
    badge: text(item?.badge),
    description: text(item?.description),
    image: text(item?.image),
    imageAlt: text(item?.imageAlt),
    linkText: text(item?.linkText),
    linkUrl: text(item?.linkUrl),
  };
}

const DEFAULT_ITEMS = [
  {
    date: "January 2019",
    title: "Journey Start",
    badge: "Delhi",
    description:
      "The idea that began as a small group of volunteers organising education support has grown into a movement that touches thousands of families every year.",
    linkText: "Visit",
    linkUrl: "#",
  },
  {
    date: "February 2019",
    title: "First Learning Centre",
    badge: "Lucknow",
    description:
      "Our first centre opened with evening tuition batches, a small library, and a volunteer network that still supports every centre we run today.",
    linkText: "Visit",
    linkUrl: "#",
  },
  {
    date: "March 2019",
    title: "Devotional Place",
    badge: "Prayagraj",
    description:
      "Community halls, medical camps and disaster relief programmes expanded the work beyond education into health, livelihood and relief.",
    linkText: "Visit",
    linkUrl: "#",
  },
];

const Section = styled.div`
  width: 100%;
  min-width: 0;
`;


const Intro = styled.p`
  margin: 14px 0 0;
  font-size: clamp(15px, 1.4vw, 17px);
  line-height: 1.7;
  max-width: 62ch;
`;

const ROW_PADDING = "clamp(14px, 1.8vw, 26px)";
const RAIL_WIDTH = "clamp(56px, 6vw, 88px)";

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const Row = styled.li`
  display: grid;
  align-items: stretch;
  gap: clamp(12px, 2vw, 28px);
  grid-template-columns: minmax(0, 1fr) ${RAIL_WIDTH} minmax(0, 1fr);
  min-width: 0;
  /* Vertical rhythm lives on the row (not a list gap) so the rail stays unbroken. */
  padding-block: ${ROW_PADDING};

  ${({ $layout }) =>
    $layout === "single" &&
    css`
      grid-template-columns: ${RAIL_WIDTH} minmax(0, 1fr);
    `}

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }

  @media (max-width: 900px) {
    grid-template-columns: clamp(40px, 10vw, 56px) minmax(0, 1fr);
  }
`;

const RailCell = styled.div`
  grid-column: ${({ $layout }) => ($layout === "single" ? 1 : 2)};
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  /* The dot sits at the top of the row, level with the entry card. */
  padding-top: 2px;

  @media (max-width: 900px) {
    grid-column: 1;
  }
`;

/** Accent colour with alpha (theme aware; falls back to the plain border colour where color-mix is unsupported). */
function accent(alphaPercent) {
  return `color-mix(in srgb, ${getColor("primary")} ${alphaPercent}%, transparent)`;
}

const Connector = styled.span`
  flex: 1 1 auto;
  width: 2px;
  min-height: 10px;
  background: ${getColor("border")};
  background: linear-gradient(180deg, ${accent(35)}, ${accent(6)});
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity 0.3s ease;
`;

const Dot = styled.span`
  position: relative;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${getColor("primary")};
  border: 3px solid ${getColor("white")};
  box-shadow: 0 0 0 2px ${getColor("primaryLight")},
    0 8px 18px -10px ${getColor("primary")};
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &::after {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1px solid ${getColor("primaryLight")};
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  ${Row}:hover & {
    transform: scale(1.12);
  }

  ${Row}:hover &::after {
    opacity: 1;
    transform: scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CardCell = styled.div`
  grid-column: ${({ $layout, $side }) =>
    $layout === "single" ? 2 : $side === "right" ? 3 : 1};
  grid-row: 1;
  display: flex;
  min-width: 0;

  @media (max-width: 900px) {
    grid-column: 2;
  }
`;

const Card = styled.article`
  position: relative;
  min-width: 0;
  width: 100%;
  padding: clamp(18px, 2.2vw, 28px);
  border-radius: 18px;
  background: ${({ $plain }) => ($plain ? "transparent" : getColor("white"))};
  border: 1px solid
    ${({ $plain }) => ($plain ? "transparent" : getColor("border"))};
  box-shadow: ${({ $plain }) =>
    $plain ? "none" : "0 22px 48px -32px rgba(33, 30, 48, 0.55)"};
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ $plain }) => ($plain ? "transparent" : getColor("primary"))};
    border-color: ${({ $plain }) => ($plain ? "transparent" : accent(40))};
    box-shadow: ${({ $plain }) =>
      $plain ? "none" : "0 28px 56px -30px rgba(33, 30, 48, 0.6)"};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const CardMedia = styled.div`
  margin: 0 0 16px;
  border-radius: 14px;
  overflow: hidden;
  background: ${getColor("surface")};
  aspect-ratio: 16 / 9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const DatePill = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 6px 14px;
  margin-bottom: 12px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.5;
  color: ${({ $color }) => $color};
  background: ${getColor("primaryLight")};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: clamp(17px, 1.7vw, 21px);
  line-height: 1.35;
  font-weight: 700;
  color: ${({ $color }) => $color};
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
`;

const Badge = styled.span`
  font-size: 0.78em;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const CardText = styled.p`
  margin: 10px 0 0;
  font-size: 15.5px;
  line-height: 1.75;
  color: ${({ $color }) => $color};
  overflow-wrap: anywhere;
`;

const CardLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: ${({ $color }) => $color};
  transition: transform 0.25s ease, opacity 0.25s ease;

  &::after {
    content: "›";
    font-size: 1.2em;
    line-height: 1;
    transition: transform 0.25s ease;
  }

  &:hover {
    opacity: 0.85;
  }

  &:hover::after {
    transform: translateX(3px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover::after {
      transform: none;
    }
  }
`;

const EmptyState = styled.div`
  border: 1px dashed ${getColor("border")};
  border-radius: 18px;
  padding: clamp(28px, 4vw, 48px) 24px;
  text-align: center;
  color: ${getColor("blackMuted")};
  font-size: 15.5px;
  line-height: 1.7;
`;

const MANAGED_STYLE_KEYS = {
  section: [
    ["SectionPaddingTop", "paddingTop"],
    ["SectionPaddingBottom", "paddingBottom"],
    ["SectionMarginTop", "marginTop"],
    ["SectionMarginBottom", "marginBottom"],
  ],
  container: [
    ["PageContainerPaddingTop", "paddingTop"],
    ["PageContainerPaddingRight", "paddingRight"],
    ["PageContainerPaddingBottom", "paddingBottom"],
    ["PageContainerPaddingLeft", "paddingLeft"],
    ["PageContainerMarginTop", "marginTop"],
    ["PageContainerMarginBottom", "marginBottom"],
  ],
};

/** Managed style for the fluid section wrapper or the page container wrapper. */
function managedStyle(props, prefix, scope) {
  const isContainer = scope === "container";
  const bgType = text(props[`${prefix}${isContainer ? "PageContainer" : "Section"}BgType`], "default");
  const bgImage = text(props[`${prefix}${isContainer ? "PageContainer" : "Section"}BgImage`]);
  const bgColorKey = text(props[`${prefix}${isContainer ? "PageContainer" : "Section"}BgColorKey`]);
  const style = {
    ...(bgType === "image" && bgImage
      ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : bgType === "color" && bgColorKey
        ? { backgroundColor: getColor(bgColorKey), backgroundImage: "none" }
        : {}),
  };

  MANAGED_STYLE_KEYS[scope].forEach(([key, cssProp]) => {
    const raw = props[`${prefix}${key}`];
    if (raw == null) return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    style[cssProp] = `${value}px`;
  });

  return Object.keys(style).length > 0 ? style : undefined;
}

export default function TimelineTrack(props) {
  const data = props || {};

  const subTitle = text(data.timelineTrackSubTitle, "Our Journey");
  const mainTitle = text(
    data.timelineTrackHeading,
    "Milestones that *shaped* us.",
  );
  const intro = text(data.timelineTrackIntro);
  const titleAlign = getTitleAlign(data, "center", "timelineTrack");

  const rawItems = data.timelineTrackItems;
  const hasSavedItems = Array.isArray(rawItems);
  const items = hasSavedItems
    ? rawItems.map(normalizeItem).filter((item) => item.date || item.title)
    : DEFAULT_ITEMS.map(normalizeItem);

  const layout =
    text(data.timelineTrackLayout, "alternating") === "single"
      ? "single"
      : "alternating";
  const cardStyle =
    text(data.timelineTrackCardStyle, "card") === "plain" ? "plain" : "card";
  const showConnector = data.timelineTrackShowConnector !== false;

  const color = (key, fallback) => {
    const value = text(data[key]);
    return value ? getColor(value) : fallback;
  };

  const subTitleColor = color("timelineTrackSubTitleColorKey", getColor("primary"));
  const headingColor = color("timelineTrackHeadingColorKey", getColor("black"));
  const introColor = color("timelineTrackIntroColorKey", getColor("blackMuted"));
  const dateColor = color("timelineTrackDateColorKey", getColor("primary"));
  const itemTitleColor = color("timelineTrackItemTitleColorKey", getColor("black"));
  const badgeColor = color("timelineTrackBadgeColorKey", getColor("primary"));
  const bodyColor = color("timelineTrackTextColorKey", getColor("blackLight"));
  const linkColor = color("timelineTrackLinkColorKey", getColor("primary"));

  const sectionBgType = text(data[`${PREFIX}SectionBgType`], "default");
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;

  return (
    <FullWidthBackground
      className={sectionBgClassName}
      $managedStyle={managedStyle(data, PREFIX, "section")}
    >
      <PageContainer $managedStyle={managedStyle(data, PREFIX, "container")}>
        <Section
          className="fable-section"
          aria-label={mainTitle ? text(mainTitle).replace(/\*/g, "") : "Timeline"}
        >
          {subTitle || mainTitle || intro ? (
            <header
              className="fable-section-heading"
              style={{ marginBottom: 32, ...getHeaderAlignStyles(titleAlign) }}
            >
              {subTitle ? (
                <p
                  className="fable-eyebrow"
                  style={{ ...(subTitleColor ? { color: subTitleColor } : {}), ...getSubtitleAlignStyles(titleAlign) }}
                >
                  {subTitle}
                </p>
              ) : null}
              {mainTitle ? (
                <h2
                  className="fable-heading"
                  style={{
                    color: headingColor,
                    ...getTitleAlignStyles(titleAlign),
                  }}
                >
                  {renderHighlightedTitle(mainTitle, data)}
                </h2>
              ) : null}
              {intro ? (
                <Intro
                  style={{
                    color: introColor,
                    ...getSubtitleAlignStyles(titleAlign),
                  }}
                >
                  {intro}
                </Intro>
              ) : null}
            </header>
          ) : null}

          {items.length === 0 ? (
            <EmptyState>
              No timeline entries yet. Add entries from the component edit drawer to
              build the timeline.
            </EmptyState>
          ) : (
            <List $layout={layout}>
              {items.map((item, index) => {
                const side = layout === "single" ? "left" : index % 2 === 0 ? "left" : "right";
                const isLast = index === items.length - 1;
                return (
                  <Row key={`${item.date}-${item.title}-${index}`} $layout={layout}>
                    <CardCell $layout={layout} $side={side}>
                      <Card $plain={cardStyle === "plain"}>
                        {item.image ? (
                          <CardMedia>
                            <img
                              src={item.image}
                              alt={item.imageAlt || item.title}
                              loading="lazy"
                            />
                          </CardMedia>
                        ) : null}
                        {item.date ? (
                          <DatePill $color={dateColor}>{item.date}</DatePill>
                        ) : null}
                        {item.title ? (
                          <CardTitle $color={itemTitleColor}>
                            <span>{item.title}</span>
                            {item.badge ? <Badge $color={badgeColor}>{item.badge}</Badge> : null}
                          </CardTitle>
                        ) : null}
                        {item.description ? (
                          <CardText $color={bodyColor}>{item.description}</CardText>
                        ) : null}
                        {item.linkUrl ? (
                          <CardLink
                            $color={linkColor}
                            href={item.linkUrl}
                            target={/^https?:\/\//i.test(item.linkUrl) ? "_blank" : undefined}
                            rel={/^https?:\/\//i.test(item.linkUrl) ? "noopener noreferrer" : undefined}
                          >
                            {item.linkText || "Learn more"}
                          </CardLink>
                        ) : null}
                      </Card>
                    </CardCell>

                    <RailCell $layout={layout} aria-hidden="true">
                      <Dot />
                      <Connector $hidden={!showConnector || isLast} />
                    </RailCell>
                  </Row>
                );
              })}
            </List>
          )}
        </Section>
      </PageContainer>
    </FullWidthBackground>
  );
}
