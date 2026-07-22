"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  PageContainer,
  getColor,
} from "@/styles/Theme";
import MediaImage from "@/components/shared/MediaImage";
import {
  formatEventDateRange,
  formatLocationLine,
  getEventImageSources,
} from "@/components/events/eventDisplay";

const DEFAULT_QUERY = {
  q: "",
  page: 1,
  pastPage: 1,
  sort: "upcoming",
  view: "all",
};

const EventsListingRoot = styled.div`
  --events-ink: #2a283e;
  --events-muted: rgba(42, 40, 62, 0.62);
  --events-accent: #e03c33;
  --events-card-bg: #ffffff;
  --events-surface: #f2f0ea;
  --events-border: rgba(42, 40, 62, 0.14);
  --events-control-bg: #ffffff;
  --events-control-text: #2a283e;
  --events-button-bg: #2a283e;
  --events-button-text: #ffffff;
  --events-button-hover-bg: #e03c33;
  --events-button-hover-text: #ffffff;
  --events-card-radius: 18px;
  --events-card-gap: 22px;
  color: var(--events-ink);
  padding-top: 40px;
  padding: 0;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .events-listing-controls {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) auto auto;
    align-items: end;
    gap: 18px;
    padding: clamp(20px, 2.4vw, 30px);
    margin-bottom: clamp(38px, 5vw, 66px);
    border: 1px solid var(--events-border);
    border-radius: var(--events-card-radius);
    background: var(--events-card-bg);
  }

  .events-listing-control-label {
    display: block;
    margin-bottom: 9px;
    color: var(--events-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .events-listing-search {
    display: flex;
    min-width: 0;
    border: 1px solid var(--events-border);
    border-radius: 999px;
    background: var(--events-control-bg);
    overflow: hidden;
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }

  .events-listing-search:focus-within {
    border-color: var(--events-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--events-accent) 16%, transparent);
  }

  .events-listing-search input,
  .events-listing-sort {
    color: var(--events-control-text);
    background: var(--events-control-bg);
    font: inherit;
  }

  .events-listing-search input {
    min-width: 0;
    width: 100%;
    padding: 13px 6px 13px 18px;
    border: 0;
    outline: 0;
  }

  .events-listing-search input::placeholder {
    color: var(--events-muted);
  }

  .events-listing-search button {
    width: 48px;
    flex: 0 0 48px;
    border: 0;
    color: var(--events-button-text);
    background: var(--events-button-bg);
    cursor: pointer;
    transition: color 180ms ease, background 180ms ease;
  }

  .events-listing-search button:hover {
    color: var(--events-button-hover-text);
    background: var(--events-button-hover-bg);
  }

  .events-listing-sort {
    min-width: 190px;
    height: 48px;
    padding: 0 40px 0 16px;
    border: 1px solid var(--events-border);
    border-radius: 999px;
    outline: 0;
    cursor: pointer;
  }

  .events-listing-tabs {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--events-border);
    border-radius: 999px;
    background: var(--events-surface);
  }

  .events-listing-tabs button {
    min-height: 38px;
    padding: 7px 15px;
    border: 0;
    border-radius: 999px;
    color: var(--events-muted);
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
    transition: color 180ms ease, background 180ms ease;
  }

  .events-listing-tabs button[aria-selected="true"] {
    color: var(--events-button-text);
    background: var(--events-button-bg);
  }

  .events-listing-stage {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(270px, 0.86fr);
    gap: clamp(34px, 5vw, 72px);
    align-items: start;
  }

  .events-listing-eyebrow {
    margin: 0 0 9px;
    color: var(--events-accent);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .events-listing-heading {
    margin: 0;
    color: var(--events-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(34px, 4.2vw, 58px);
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 1.02;
  }

  .events-listing-heading em {
    color: var(--events-accent);
    font-style: normal;
  }

  .events-listing-section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: clamp(24px, 3vw, 38px);
  }

  .events-listing-count {
    flex: 0 0 auto;
    color: var(--events-muted);
    font-size: 14px;
  }

  .events-listing-grid {
    display: grid;
    grid-template-columns: repeat(var(--events-active-columns, 2), minmax(0, 1fr));
    gap: var(--events-card-gap);
  }

  .events-listing-grid--past {
    grid-template-columns: repeat(var(--events-past-columns, 3), minmax(0, 1fr));
  }

  .event-listing-card {
    display: flex;
    min-width: 0;
    height: 100%;
    flex-direction: column;
    border: 1px solid var(--events-border);
    border-radius: var(--events-card-radius);
    background: var(--events-card-bg);
    overflow: hidden;
    transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
  }

  .event-listing-card:hover {
    transform: translateY(-5px);
    border-color: var(--events-accent);
    box-shadow: 0 18px 42px color-mix(in srgb, var(--events-ink) 11%, transparent);
  }

  .event-listing-card--featured {
    grid-column: 1 / -1;
  }

  .event-listing-card__media {
    display: block;
    aspect-ratio: 16 / 8.5;
    overflow: hidden;
    background: var(--events-surface);
  }

  .event-listing-card__media picture,
  .event-listing-card__media img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .event-listing-card__media img {
    object-fit: cover;
    transition: transform 420ms ease;
  }

  .event-listing-card:hover .event-listing-card__media img {
    transform: scale(1.035);
  }

  .event-listing-card__placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--events-muted);
    font-size: 14px;
  }

  .event-listing-card__body {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    padding: clamp(21px, 2.5vw, 34px);
  }

  .event-listing-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 9px 16px;
    margin-bottom: 13px;
    color: var(--events-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .event-listing-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .event-listing-card__title {
    margin: 0 0 12px;
    color: var(--events-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(21px, 2vw, 29px);
    font-weight: 520;
    letter-spacing: -0.02em;
    line-height: 1.16;
  }

  .event-listing-card:not(.event-listing-card--featured) .event-listing-card__title {
    font-size: clamp(19px, 1.55vw, 24px);
  }

  .event-listing-card__title a {
    color: inherit;
    text-decoration: none;
  }

  .event-listing-card__description {
    display: -webkit-box;
    margin: 0 0 22px;
    overflow: hidden;
    color: var(--events-muted);
    font-size: 15px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .event-listing-card__button,
  .events-listing-page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid var(--events-button-bg);
    border-radius: 999px;
    color: var(--events-button-text);
    background: var(--events-button-bg);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
  }

  .event-listing-card__button {
    width: fit-content;
    margin-top: auto;
    padding: 11px 18px;
  }

  .event-listing-card__button:hover,
  .events-listing-page-button:hover:not(:disabled) {
    border-color: var(--events-button-hover-bg);
    color: var(--events-button-hover-text);
    background: var(--events-button-hover-bg);
  }

  .events-listing-sidebar {
    position: sticky;
    top: 118px;
  }

  .events-listing-side-card {
    padding: 24px 0 0;
    border-top: 1px solid var(--events-border);
  }

  .events-listing-side-card + .events-listing-side-card {
    margin-top: 34px;
  }

  .events-listing-side-title {
    margin: 0 0 12px;
    color: var(--events-accent);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .events-listing-side-item {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 13px;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--events-border);
  }

  .events-listing-side-image {
    display: block;
    width: 76px;
    aspect-ratio: 1.45 / 1;
    border-radius: 9px;
    background: var(--events-surface);
    overflow: hidden;
  }

  .events-listing-side-image picture,
  .events-listing-side-image img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .events-listing-side-image img {
    object-fit: cover;
  }

  .events-listing-side-item a:not(.events-listing-side-image) {
    display: -webkit-box;
    overflow: hidden;
    color: var(--events-ink);
    font-size: 14px;
    font-weight: 650;
    line-height: 1.35;
    text-decoration: none;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .events-listing-side-item a:hover {
    color: var(--events-accent);
  }

  .events-listing-side-date {
    display: block;
    margin-top: 5px;
    color: var(--events-muted);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .events-listing-past {
    margin-top: clamp(64px, 9vw, 120px);
    padding-top: clamp(48px, 6vw, 78px);
    border-top: 1px solid var(--events-border);
  }

  .events-listing-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
  }

  .events-listing-page-button {
    min-width: 104px;
    padding: 9px 15px;
  }

  .events-listing-page-button:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .events-listing-page-status {
    color: var(--events-muted);
    font-size: 13px;
  }

  .events-listing-empty,
  .events-listing-error,
  .events-listing-loading {
    grid-column: 1 / -1;
    padding: 48px 20px;
    border: 1px dashed var(--events-border);
    border-radius: var(--events-card-radius);
    color: var(--events-muted);
    background: var(--events-surface);
    text-align: center;
  }

  .events-listing-error {
    color: var(--events-accent);
  }

  @media (max-width: 1050px) {
    .events-listing-controls {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .events-listing-filter-wrap {
      grid-column: 1 / -1;
    }
    .events-listing-stage {
      grid-template-columns: 1fr;
    }
    .events-listing-sidebar {
      position: static;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--events-card-gap);
    }
    .events-listing-side-card + .events-listing-side-card {
      margin-top: 0;
    }
    .events-listing-grid--past {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .events-listing-controls {
      grid-template-columns: 1fr;
      align-items: stretch;
    }
    .events-listing-filter-wrap {
      grid-column: auto;
    }
    .events-listing-sort {
      width: 100%;
    }
    .events-listing-tabs {
      width: 100%;
    }
    .events-listing-tabs button {
      flex: 1;
      padding-inline: 9px;
    }
    .events-listing-section-head {
      align-items: start;
      flex-direction: column;
    }
    .events-listing-grid,
    .events-listing-grid--past,
    .events-listing-sidebar {
      grid-template-columns: 1fr;
    }
    .event-listing-card--featured {
      grid-column: auto;
    }
    .events-listing-pagination {
      flex-wrap: wrap;
    }
  }
`;

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function positiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeText(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function stripMarkup(value) {
  return safeText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function themedColor(key, fallbackKey) {
  return getColor(safeText(key) || fallbackKey);
}

function renderAccentTitle(value) {
  const text = safeText(value);
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function readQuery(defaultSort) {
  if (typeof window === "undefined") {
    return { ...DEFAULT_QUERY, sort: defaultSort };
  }
  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort") === "recent" ? "recent" : defaultSort;
  const viewValue = params.get("view");
  const view = ["all", "upcoming", "past"].includes(viewValue)
    ? viewValue
    : "all";
  return {
    q: safeText(params.get("q")),
    page: positiveInt(params.get("page"), 1),
    pastPage: positiveInt(params.get("pastPage"), 1),
    sort,
    view,
  };
}

function serializeQuery(query) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pastPage > 1) params.set("pastPage", String(query.pastPage));
  if (query.sort === "recent") params.set("sort", "recent");
  if (query.view !== "all") params.set("view", query.view);
  return params.toString();
}

function eventKey(event) {
  return event?._id || event?.slug || event?.title;
}

function eventHref(event) {
  return event?.slug ? `/events/${event.slug}` : "/events";
}

function EventImage({ event, sizes, compact = false }) {
  const { desktop, mobile } = getEventImageSources(event);
  if (!desktop && !mobile) {
    return compact ? null : (
      <div className="event-listing-card__placeholder">No image available</div>
    );
  }
  return (
    <MediaImage
      src={desktop || mobile}
      mobileSrc={mobile && mobile !== desktop ? mobile : ""}
      alt={event?.title || "Event"}
      width={compact ? 320 : 1200}
      height={compact ? 220 : 638}
      sizes={sizes}
      imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function EventCard({ event, featured, label, buttonLabel, showDescription }) {
  const date = formatEventDateRange(event?.startDate, event?.endDate);
  const location = formatLocationLine(event);
  const time = safeText(event?.time);
  const description = stripMarkup(event?.description || event?.content);
  const href = eventHref(event);

  return (
    <article
      className={`event-listing-card${featured ? " event-listing-card--featured" : ""}`}
    >
      <Link className="event-listing-card__media" href={href} aria-label={event?.title || label}>
        <EventImage
          event={event}
          sizes={featured ? "(max-width: 1050px) 100vw, 780px" : "(max-width: 700px) 100vw, 390px"}
        />
      </Link>
      <div className="event-listing-card__body">
        <p className="events-listing-eyebrow">{safeText(event?.tags?.[0], label)}</p>
        <div className="event-listing-card__meta">
          {date ? <span><CalendarOutlined aria-hidden="true" />{date}</span> : null}
          {time ? <span><ClockCircleOutlined aria-hidden="true" />{time}</span> : null}
          {location ? <span><EnvironmentOutlined aria-hidden="true" />{location}</span> : null}
        </div>
        <h3 className="event-listing-card__title">
          <Link href={href}>{event?.title}</Link>
        </h3>
        {showDescription && description ? (
          <p className="event-listing-card__description">{description}</p>
        ) : null}
        <Link className="event-listing-card__button" href={href}>
          {buttonLabel}<ArrowRightOutlined aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function SideEvent({ event, updatedLabel }) {
  const href = eventHref(event);
  const dateValue = updatedLabel ? event?.updatedAt : event?.startDate;
  const date = formatEventDateRange(dateValue, null);
  return (
    <div className="events-listing-side-item">
      <Link className="events-listing-side-image" href={href} aria-label={event?.title || "Event"}>
        <EventImage event={event} compact sizes="76px" />
      </Link>
      <div>
        <Link href={href}>{event?.title}</Link>
        {date ? (
          <span className="events-listing-side-date">
            {updatedLabel ? `${updatedLabel} ${date}` : date}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange, previousLabel, nextLabel }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="events-listing-pagination" aria-label="Events pagination">
      <button
        type="button"
        className="events-listing-page-button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {previousLabel}
      </button>
      <span className="events-listing-page-status">Page {page} of {totalPages}</span>
      <button
        type="button"
        className="events-listing-page-button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {nextLabel}
      </button>
    </nav>
  );
}

function buildSectionStyles(props) {
  const prefix = "eventsListing";
  const sectionBgType = safeText(props?.[`${prefix}SectionBgType`], "default");
  const sectionBgImage = safeText(props?.[`${prefix}SectionBgImage`]);
  const sectionBgColorKey = safeText(props?.[`${prefix}SectionBgColorKey`]);
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : {}),
  };
  const styleNumber = (key) => {
    const number = Number(props?.[`${prefix}${key}`]);
    return Number.isFinite(number) && number >= 0 ? `${number}px` : undefined;
  };
  const paddingTop = styleNumber("SectionPaddingTop");
  const paddingBottom = styleNumber("SectionPaddingBottom");
  const marginTop = styleNumber("SectionMarginTop");
  const marginBottom = styleNumber("SectionMarginBottom");
  if (paddingTop) sectionStyle.paddingTop = paddingTop;
  if (paddingBottom) sectionStyle.paddingBottom = paddingBottom;
  if (marginTop) sectionStyle.marginTop = marginTop;
  if (marginBottom) sectionStyle.marginBottom = marginBottom;

  const containerBgType = safeText(props?.[`${prefix}PageContainerBgType`], "default");
  const containerBgImage = safeText(props?.[`${prefix}PageContainerBgImage`]);
  const containerBgColorKey = safeText(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = {
    ...(containerBgType === "image" && containerBgImage
      ? {
          backgroundImage: `url(${containerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : containerBgType === "color" && containerBgColorKey
        ? { backgroundColor: getColor(containerBgColorKey), backgroundImage: "none" }
        : {}),
  };
  const containerKeys = [
    ["PageContainerPaddingTop", "paddingTop"],
    ["PageContainerPaddingRight", "paddingRight"],
    ["PageContainerPaddingBottom", "paddingBottom"],
    ["PageContainerPaddingLeft", "paddingLeft"],
    ["PageContainerMarginTop", "marginTop"],
    ["PageContainerMarginBottom", "marginBottom"],
  ];
  containerKeys.forEach(([key, cssKey]) => {
    const value = styleNumber(key);
    if (value) pageContainerBgStyle[cssKey] = value;
  });
  // This page sits directly after the Page Builder hero. Keep the shared
  // PageContainer's responsive horizontal gutter, but remove its global
  // desktop/mobile vertical padding for this component only.
  pageContainerBgStyle.paddingTop = 0;
  pageContainerBgStyle.paddingBottom = 0;
  return {
    sectionBgClassName,
    sectionBgStyle: Object.keys(sectionStyle).length ? sectionStyle : undefined,
    pageContainerBgStyle,
  };
}

export default function EventsListing(props) {
  const router = useRouter();
  const pathname = usePathname() || "/events";
  const defaultSort = props?.eventsListingDefaultSort === "recent" ? "recent" : "upcoming";
  const [query, setQuery] = useState({ ...DEFAULT_QUERY, sort: defaultSort });
  const [searchText, setSearchText] = useState("");
  const [activeData, setActiveData] = useState({ items: [], total: 0, totalPages: 1 });
  const [pastData, setPastData] = useState({ items: [], total: 0, totalPages: 1 });
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeLimit = clamp(props?.eventsListingActivePageSize, 1, 18, 7);
  const pastLimit = clamp(props?.eventsListingPastPageSize, 1, 18, 6);
  const activeColumns = clamp(props?.eventsListingActiveColumns, 1, 3, 2);
  const pastColumns = clamp(props?.eventsListingPastColumns, 1, 4, 3);
  const cardGap = clamp(props?.eventsListingCardGap, 8, 64, 22);
  const cardRadius = clamp(props?.eventsListingCardRadius, 0, 40, 18);

  const showSearch = props?.eventsListingShowSearch !== false;
  const showFilters = props?.eventsListingShowFilters !== false;
  const showRecentlyUpdated = props?.eventsListingShowRecentlyUpdated !== false;
  const showPast = props?.eventsListingShowPast !== false;
  const showDescriptions = props?.eventsListingShowDescriptions !== false;

  const labels = useMemo(() => ({
    search: safeText(props?.eventsListingSearchLabel, "Search events"),
    searchPlaceholder: safeText(props?.eventsListingSearchPlaceholder, "Search by title or keyword..."),
    sort: safeText(props?.eventsListingSortLabel, "Sort events"),
    all: safeText(props?.eventsListingAllLabel, "All"),
    upcomingFilter: safeText(props?.eventsListingUpcomingFilterLabel, "Upcoming"),
    pastFilter: safeText(props?.eventsListingPastFilterLabel, "Past"),
    upcomingEyebrow: safeText(props?.eventsListingUpcomingEyebrow, "Upcoming Events"),
    upcomingTitle: safeText(props?.eventsListingUpcomingTitle, "Coming up next."),
    recent: safeText(props?.eventsListingRecentTitle, "Recently Updated"),
    pastEyebrow: safeText(props?.eventsListingPastEyebrow, "Past Events"),
    pastTitle: safeText(props?.eventsListingPastTitle, "Recently *celebrated.*"),
    viewDetails: safeText(props?.eventsListingButtonLabel, "View Details"),
    noEvents: safeText(props?.eventsListingEmptyLabel, "No events found."),
    previous: safeText(props?.eventsListingPreviousLabel, "Previous"),
    next: safeText(props?.eventsListingNextLabel, "Next"),
    updated: safeText(props?.eventsListingUpdatedLabel, "Updated"),
  }), [props]);

  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } =
    buildSectionStyles(props);

  useEffect(() => {
    const syncFromLocation = () => {
      const next = readQuery(defaultSort);
      setQuery(next);
      setSearchText(next.q);
    };
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [defaultSort]);

  const updateQuery = (patch) => {
    const next = { ...query, ...patch };
    next.page = positiveInt(next.page, 1);
    next.pastPage = positiveInt(next.pastPage, 1);
    next.sort = next.sort === "recent" ? "recent" : "upcoming";
    next.view = ["all", "upcoming", "past"].includes(next.view) ? next.view : "all";
    setQuery(next);
    const serialized = serializeQuery(next);
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const controller = new AbortController();
    const search = query.q ? `&search=${encodeURIComponent(query.q)}` : "";
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/events?visibility=active&page=${query.page}&limit=${activeLimit}&sort=${query.sort}${search}`, {
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch(`/api/events?visibility=past&page=${query.pastPage}&limit=${pastLimit}&sort=recent${search}`, {
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch("/api/events?visibility=active&page=1&limit=5&sort=upcoming&fields=sidebar", {
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch("/api/events?visibility=all&page=1&limit=5&sort=recent&fields=sidebar", {
        cache: "no-store",
        signal: controller.signal,
      }),
    ])
      .then(async (responses) => {
        if (responses.some((response) => !response.ok)) {
          throw new Error("Events could not be loaded.");
        }
        return Promise.all(responses.map((response) => response.json()));
      })
      .then(([active, past, upcomingResponse, recentResponse]) => {
        setActiveData({
          items: Array.isArray(active?.items) ? active.items : [],
          total: Number(active?.total) || 0,
          totalPages: Math.max(1, Number(active?.totalPages) || 1),
        });
        setPastData({
          items: Array.isArray(past?.items) ? past.items : [],
          total: Number(past?.total) || 0,
          totalPages: Math.max(1, Number(past?.totalPages) || 1),
        });
        setUpcoming(Array.isArray(upcomingResponse?.items) ? upcomingResponse.items : []);
        setRecent(Array.isArray(recentResponse?.items) ? recentResponse.items : []);
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") {
          setError(requestError?.message || "Events could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query.q, query.page, query.pastPage, query.sort, activeLimit, pastLimit]);

  const style = {
    "--events-ink": themedColor(props?.eventsListingTextColorKey, "Black"),
    "--events-muted": themedColor(props?.eventsListingMutedTextColorKey, "Black Light"),
    "--events-accent": themedColor(props?.eventsListingAccentColorKey, "Primary"),
    "--events-card-bg": themedColor(props?.eventsListingCardBgColorKey, "White"),
    "--events-surface": themedColor(props?.eventsListingSurfaceColorKey, "Surface"),
    "--events-border": themedColor(props?.eventsListingBorderColorKey, "Border"),
    "--events-control-bg": themedColor(props?.eventsListingControlBgColorKey, "White"),
    "--events-control-text": themedColor(props?.eventsListingControlTextColorKey, "Black"),
    "--events-button-bg": themedColor(props?.eventsListingButtonBgColorKey, "Black"),
    "--events-button-text": themedColor(props?.eventsListingButtonTextColorKey, "White"),
    "--events-button-hover-bg": themedColor(props?.eventsListingButtonHoverBgColorKey, "Primary"),
    "--events-button-hover-text": themedColor(props?.eventsListingButtonHoverTextColorKey, "White"),
    "--events-active-columns": activeColumns,
    "--events-past-columns": pastColumns,
    "--events-card-gap": `${cardGap}px`,
    "--events-card-radius": `${cardRadius}px`,
  };

  const showUpcomingSection = query.view !== "past";
  const showPastSection = showPast && query.view !== "upcoming";

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <EventsListingRoot style={style} className="my-5">
          {(showSearch || showFilters) && (
            <div className="events-listing-controls" aria-label="Event search and filters">
              {showSearch ? (
                <div>
                  <label className="events-listing-control-label" htmlFor="events-listing-search-input">
                    {labels.search}
                  </label>
                  <form
                    className="events-listing-search"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateQuery({ q: searchText.trim(), page: 1, pastPage: 1 });
                    }}
                  >
                    <input
                      id="events-listing-search-input"
                      type="search"
                      value={searchText}
                      placeholder={labels.searchPlaceholder}
                      onChange={(event) => setSearchText(event.target.value)}
                    />
                    <button type="submit" aria-label={labels.search}><SearchOutlined /></button>
                  </form>
                </div>
              ) : <div />}
              <div>
                <label className="events-listing-control-label" htmlFor="events-listing-sort">
                  {labels.sort}
                </label>
                <select
                  id="events-listing-sort"
                  className="events-listing-sort"
                  value={query.sort}
                  onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}
                >
                  <option value="upcoming">Soonest first</option>
                  <option value="recent">Recently updated</option>
                </select>
              </div>
              {showFilters ? (
                <div className="events-listing-filter-wrap">
                  <span className="events-listing-control-label">Filter</span>
                  <div className="events-listing-tabs" role="tablist" aria-label="Event type">
                    {[
                      ["all", labels.all],
                      ["upcoming", labels.upcomingFilter],
                      ["past", labels.pastFilter],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={query.view === value}
                        onClick={() => updateQuery({ view: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? <div className="events-listing-error" role="alert">{error}</div> : null}

          {showUpcomingSection ? (
            <div className="events-listing-stage">
              <section aria-labelledby="events-listing-upcoming-title">
                <div className="events-listing-section-head">
                  <div>
                    <p className="events-listing-eyebrow">{labels.upcomingEyebrow}</p>
                    <h2 id="events-listing-upcoming-title" className="events-listing-heading">
                      {renderAccentTitle(labels.upcomingTitle)}
                    </h2>
                  </div>
                  {!loading ? <span className="events-listing-count">{activeData.total} events</span> : null}
                </div>
                <div className="events-listing-grid" aria-live="polite" aria-busy={loading}>
                  {loading ? <div className="events-listing-loading">Loading events...</div> : null}
                  {!loading && !activeData.items.length ? (
                    <div className="events-listing-empty">{labels.noEvents}</div>
                  ) : null}
                  {!loading && activeData.items.map((event, index) => (
                    <EventCard
                      key={eventKey(event)}
                      event={event}
                      featured={index === 0}
                      label={labels.upcomingEyebrow}
                      buttonLabel={labels.viewDetails}
                      showDescription={showDescriptions}
                    />
                  ))}
                </div>
                <Pagination
                  page={query.page}
                  totalPages={activeData.totalPages}
                  previousLabel={labels.previous}
                  nextLabel={labels.next}
                  onChange={(page) => updateQuery({ page })}
                />
              </section>

              {showRecentlyUpdated ? (
                <aside className="events-listing-sidebar" aria-label="Event highlights">
                  <div className="events-listing-side-card">
                    <h3 className="events-listing-side-title">{labels.upcomingEyebrow}</h3>
                    {upcoming.length ? upcoming.map((event) => (
                      <SideEvent key={eventKey(event)} event={event} />
                    )) : <p className="events-listing-count">{labels.noEvents}</p>}
                  </div>
                  <div className="events-listing-side-card">
                    <h3 className="events-listing-side-title">{labels.recent}</h3>
                    {recent.length ? recent.map((event) => (
                      <SideEvent key={eventKey(event)} event={event} updatedLabel={labels.updated} />
                    )) : <p className="events-listing-count">{labels.noEvents}</p>}
                  </div>
                </aside>
              ) : null}
            </div>
          ) : null}

          {showPastSection ? (
            <section className="events-listing-past" aria-labelledby="events-listing-past-title">
              <div className="events-listing-section-head">
                <div>
                  <p className="events-listing-eyebrow">{labels.pastEyebrow}</p>
                  <h2 id="events-listing-past-title" className="events-listing-heading">
                    {renderAccentTitle(labels.pastTitle)}
                  </h2>
                </div>
                {!loading ? <span className="events-listing-count">{pastData.total} events</span> : null}
              </div>
              <div className="events-listing-grid events-listing-grid--past" aria-live="polite" aria-busy={loading}>
                {loading && !showUpcomingSection ? <div className="events-listing-loading">Loading events...</div> : null}
                {!loading && !pastData.items.length ? (
                  <div className="events-listing-empty">{labels.noEvents}</div>
                ) : null}
                {!loading && pastData.items.map((event) => (
                  <EventCard
                    key={eventKey(event)}
                    event={event}
                    label={labels.pastEyebrow}
                    buttonLabel={labels.viewDetails}
                    showDescription={showDescriptions}
                  />
                ))}
              </div>
              <Pagination
                page={query.pastPage}
                totalPages={pastData.totalPages}
                previousLabel={labels.previous}
                nextLabel={labels.next}
                onChange={(pastPage) => updateQuery({ pastPage })}
              />
            </section>
          ) : null}
        </EventsListingRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
