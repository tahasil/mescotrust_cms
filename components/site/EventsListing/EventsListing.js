"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";
import {
  formatEventDateRange,
  formatLocationLine,
  getEventDateStatus,
  getEventImageSources,
} from "@/components/events/eventDisplay";

const FILTERS = ["all", "live", "past"];

const ListingRoot = styled.div`
  --events-ink: #2a283e;
  --events-muted: rgba(42, 40, 62, 0.62);
  --events-accent: #e03c33;
  --events-card-bg: #ffffff;
  --events-surface: #f2f0ea;
  --events-border: rgba(42, 40, 62, 0.14);
  --events-control-bg: #ffffff;
  --events-control-text: #2a283e;
  --events-button-bg: #e03c33;
  --events-button-text: #ffffff;
  --events-button-hover-bg: #b92e27;
  --events-button-hover-text: #ffffff;
  --events-columns: 4;
  --events-gap: 22px;
  --events-radius: 14px;
  color: var(--events-ink);
  padding: 0;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .events-controls {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) auto;
    align-items: end;
    gap: 18px;
    padding: clamp(18px, 2.2vw, 28px);
    margin-bottom: clamp(30px, 4vw, 52px);
    border: 1px solid var(--events-border);
    border-radius: var(--events-radius);
    background: var(--events-card-bg);
  }

  .events-control-label {
    display: block;
    margin-bottom: 8px;
    color: var(--events-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .events-search {
    display: flex;
    min-width: 0;
    height: 48px;
    overflow: hidden;
    border: 1px solid var(--events-border);
    border-radius: 999px;
    background: var(--events-control-bg);
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }

  .events-search:focus-within {
    border-color: var(--events-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--events-accent) 15%, transparent);
  }

  .events-search input {
    width: 100%;
    min-width: 0;
    padding: 0 8px 0 18px;
    border: 0;
    outline: 0;
    color: var(--events-control-text);
    background: transparent;
    font: inherit;
  }

  .events-search input::placeholder {
    color: var(--events-muted);
  }

  .events-search button {
    width: 48px;
    flex: 0 0 48px;
    border: 0;
    color: var(--events-button-text);
    background: var(--events-button-bg);
    cursor: pointer;
    transition: color 180ms ease, background 180ms ease;
  }

  .events-search button:hover {
    color: var(--events-button-hover-text);
    background: var(--events-button-hover-bg);
  }

  .events-filter-tabs {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--events-border);
    border-radius: 999px;
    background: var(--events-surface);
  }

  .events-filter-tabs button {
    min-width: 68px;
    min-height: 38px;
    padding: 7px 15px;
    border: 0;
    border-radius: 999px;
    color: var(--events-muted);
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: color 180ms ease, background 180ms ease;
  }

  .events-filter-tabs button[aria-selected="true"] {
    color: var(--events-button-text);
    background: var(--events-button-bg);
  }

  .events-heading-row {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: clamp(22px, 3vw, 34px);
  }

  .events-subtitle {
    margin: 0 0 8px;
    color: var(--events-accent);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .events-title {
    margin: 0;
    color: var(--events-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(32px, 4vw, 54px);
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 1.04;
  }

  .events-title em {
    color: var(--events-accent);
    font-style: normal;
  }

  .events-count {
    flex: 0 0 auto;
    color: var(--events-muted);
    font-size: 14px;
  }

  .events-grid {
    display: grid;
    grid-template-columns: repeat(var(--events-columns), minmax(0, 1fr));
    gap: var(--events-gap);
  }

  .event-card {
    display: flex;
    min-width: 0;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--events-border);
    border-radius: var(--events-radius);
    background: var(--events-card-bg);
    box-shadow: none;
    transition:
      transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
      border-color 300ms ease,
      box-shadow 300ms ease;
  }

  .event-card:hover {
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--events-accent) 42%, var(--events-border));
    box-shadow: 0 22px 44px color-mix(in srgb, var(--events-ink) 10%, transparent);
  }

  .event-card__image-wrap {
    display: block;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
  }

  .event-card__image {
    width: 100%;
    aspect-ratio: 16 / 9;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-bottom: 1px solid var(--events-border);
    color: var(--events-muted);
    background: var(--events-surface);
    font-size: 13px;
  }

  .event-card__image picture,
  .event-card__image img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .event-card__image img {
    object-fit: cover;
    transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .event-card:hover .event-card__image img {
    transform: scale(1.05);
  }

  .event-card__body {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    padding: clamp(16px, 1.7vw, 22px);
  }

  .event-card__status {
    margin: 0 0 9px;
    color: var(--events-accent);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.09em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .event-card__title {
    margin: 0 0 8px;
    color: var(--events-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(16px, 1.35vw, 19px);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.22;
  }

  .event-card__title a {
    color: inherit;
    text-decoration: none;
  }

  .event-card__title a:focus-visible,
  .event-card__image-wrap:focus-visible,
  .event-card__button:focus-visible {
    outline: 2px solid var(--events-accent);
    outline-offset: 3px;
  }

  .event-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 13px;
    margin-bottom: 0;
    color: var(--events-muted);
    font-size: 11px;
    line-height: 1.4;
  }

  .event-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .event-card__meta svg {
    color: var(--events-accent);
    font-size: 10px;
  }

  .event-card__description {
    display: -webkit-box;
    margin: 13px 0 0;
    overflow: hidden;
    color: var(--events-muted);
    font-size: 12px;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .event-card__button,
  .events-page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--events-button-bg);
    border-radius: 999px;
    color: var(--events-button-text);
    background: var(--events-button-bg);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
  }

  .event-card__button {
    width: fit-content;
    min-height: auto;
    justify-content: flex-start;
    margin-top: auto;
    padding: 14px 0 3px;
    border: 0;
    border-bottom: 1px solid currentColor;
    border-radius: 0;
    color: var(--events-ink);
    background: transparent;
    font-size: 12px;
  }

  .event-card__button:hover {
    border-color: var(--events-accent);
    color: var(--events-accent);
    background: transparent;
  }

  .events-page-button:hover:not(:disabled) {
    border-color: var(--events-button-hover-bg);
    color: var(--events-button-hover-text);
    background: var(--events-button-hover-bg);
  }

  .events-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
  }

  .events-page-button {
    min-width: 100px;
    padding: 9px 14px;
    cursor: pointer;
  }

  .events-page-button:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .events-page-status {
    color: var(--events-muted);
    font-size: 13px;
  }

  .events-state {
    grid-column: 1 / -1;
    padding: 46px 20px;
    border: 1px dashed var(--events-border);
    border-radius: var(--events-radius);
    color: var(--events-muted);
    background: var(--events-surface);
    text-align: center;
  }

  .events-state--error {
    color: var(--events-accent);
  }

  @media (max-width: 1199px) {
    .events-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .events-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .events-controls {
      grid-template-columns: 1fr;
    }
    .events-filter-tabs {
      width: 100%;
    }
    .events-filter-tabs button {
      min-width: 0;
      flex: 1;
    }
    .events-heading-row {
      align-items: start;
      flex-direction: column;
    }
    .events-grid {
      grid-template-columns: 1fr;
    }
    .event-card__body {
      padding: 16px;
    }
    .event-card__title {
      font-size: 18px;
    }
    .events-pagination {
      flex-wrap: wrap;
    }
  }
`;

function safeText(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function stripMarkup(value) {
  return safeText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function themeColor(key, fallback) {
  return getColor(safeText(key) || fallback);
}

function initialQuery() {
  if (typeof window === "undefined") return { q: "", page: 1, view: "all" };
  const params = new URLSearchParams(window.location.search);
  const view = FILTERS.includes(params.get("view")) ? params.get("view") : "all";
  return {
    q: safeText(params.get("q")),
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
    view,
  };
}

function EventCard({ event, buttonLabel, showDescription }) {
  const href = event?.slug ? `/events/${event.slug}` : "/events";
  const { desktop, mobile } = getEventImageSources(event);
  const date = formatEventDateRange(event?.startDate, event?.endDate);
  const status = getEventDateStatus(event);
  const dateLabel = date
    ? `${status === "live" ? "Live · " : status === "upcoming" ? "Upcoming · " : ""}${date}`
    : "";
  const time = safeText(event?.time);
  const location = formatLocationLine(event);
  const description = stripMarkup(event?.description || event?.content);

  return (
    <article className="event-card">
      <Link href={href} className="event-card__image-wrap" aria-label={event?.title || "Event"}>
        <div className="event-card__image">
          {desktop || mobile ? (
            <MediaImage
              src={desktop || mobile}
              mobileSrc={mobile && mobile !== desktop ? mobile : ""}
              alt={event?.title || "Event"}
              width={800}
              height={400}
              sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw"
              imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : "No image"}
        </div>
      </Link>
      <div className="event-card__body">
        {dateLabel ? <p className="event-card__status">{dateLabel}</p> : null}
        <h3 className="event-card__title"><Link href={href}>{event?.title}</Link></h3>
        {time || location ? <div className="event-card__meta">
          {time ? <span><ClockCircleOutlined />{time}</span> : null}
          {location ? <span><EnvironmentOutlined />{location}</span> : null}
        </div> : null}
        {showDescription && description ? <p className="event-card__description">{description}</p> : null}
        <Link className="event-card__button" href={href}>{buttonLabel}</Link>
      </div>
    </article>
  );
}

function buildSectionStyles(props) {
  const prefix = "eventsListing";
  const type = safeText(props?.[`${prefix}SectionBgType`], "default");
  const image = safeText(props?.[`${prefix}SectionBgImage`]);
  const color = safeText(props?.[`${prefix}SectionBgColorKey`]);
  const sectionBgClassName = type === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = type === "image" && image
    ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : type === "color" && color
      ? { backgroundColor: getColor(color), backgroundImage: "none" }
      : {};
  const numberStyle = (key) => {
    const value = Number(props?.[`${prefix}${key}`]);
    return Number.isFinite(value) && value >= 0 ? `${value}px` : undefined;
  };
  [["SectionPaddingTop", "paddingTop"], ["SectionPaddingBottom", "paddingBottom"], ["SectionMarginTop", "marginTop"], ["SectionMarginBottom", "marginBottom"]].forEach(([key, cssKey]) => {
    const value = numberStyle(key);
    if (value) sectionBgStyle[cssKey] = value;
  });
  const containerType = safeText(props?.[`${prefix}PageContainerBgType`], "default");
  const containerImage = safeText(props?.[`${prefix}PageContainerBgImage`]);
  const containerColor = safeText(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = containerType === "image" && containerImage
    ? { backgroundImage: `url(${containerImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : containerType === "color" && containerColor
      ? { backgroundColor: getColor(containerColor), backgroundImage: "none" }
      : {};
  [["PageContainerPaddingRight", "paddingRight"], ["PageContainerPaddingLeft", "paddingLeft"], ["PageContainerMarginTop", "marginTop"], ["PageContainerMarginBottom", "marginBottom"]].forEach(([key, cssKey]) => {
    const value = numberStyle(key);
    if (value) pageContainerBgStyle[cssKey] = value;
  });
  pageContainerBgStyle.paddingTop = 0;
  pageContainerBgStyle.paddingBottom = 0;
  return {
    sectionBgClassName,
    sectionBgStyle: Object.keys(sectionBgStyle).length ? sectionBgStyle : undefined,
    pageContainerBgStyle,
  };
}

export default function EventsListing(props) {
  const pathname = usePathname() || "/events";
  const router = useRouter();
  const [query, setQuery] = useState({ q: "", page: 1, view: "all" });
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = clamp(props?.eventsListingActivePageSize, 1, 24, 9);
  const columns = clamp(props?.eventsListingActiveColumns, 1, 3, 3);
  const gap = clamp(props?.eventsListingCardGap, 8, 64, 22);
  const radius = clamp(props?.eventsListingCardRadius, 0, 40, 14);
  const showSearch = props?.eventsListingShowSearch !== false;
  const showFilters = props?.eventsListingShowFilters !== false;
  const showDescriptions = props?.eventsListingShowDescriptions !== false;

  const labels = useMemo(() => ({
    search: safeText(props?.eventsListingSearchLabel, "Search events"),
    placeholder: safeText(props?.eventsListingSearchPlaceholder, "Search events..."),
    all: safeText(props?.eventsListingAllLabel, "All"),
    live: safeText(props?.eventsListingUpcomingFilterLabel, "Live"),
    past: safeText(props?.eventsListingPastFilterLabel, "Past"),
    subtitle: safeText(props?.eventsListingUpcomingEyebrow, "Events"),
    title: safeText(props?.eventsListingUpcomingTitle, "Explore our *events.*"),
    pastSubtitle: safeText(props?.eventsListingPastEyebrow, "Past Events"),
    pastTitle: safeText(props?.eventsListingPastTitle, "Recently *celebrated.*"),
    button: safeText(props?.eventsListingButtonLabel, "View Details"),
    empty: safeText(props?.eventsListingEmptyLabel, "No events found."),
    previous: safeText(props?.eventsListingPreviousLabel, "Previous"),
    next: safeText(props?.eventsListingNextLabel, "Next"),
  }), [props]);

  useEffect(() => {
    const sync = () => {
      const next = initialQuery();
      setQuery(next);
      setSearchText(next.q);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const updateQuery = (patch) => {
    const next = { ...query, ...patch };
    next.page = Math.max(1, Number(next.page) || 1);
    next.view = FILTERS.includes(next.view) ? next.view : "live";
    setQuery(next);
    if (pathname === "/events") {
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.page > 1) params.set("page", String(next.page));
      if (next.view !== "all") params.set("view", next.view);
      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      visibility: query.view,
      page: String(query.page),
      limit: String(pageSize),
      sort: query.view === "all" ? "grouped" : query.view === "live" ? "upcoming" : "recent",
    });
    if (query.q) params.set("search", query.q);
    setLoading(true);
    setError("");
    fetch(`/api/events?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Events could not be loaded.");
        return response.json();
      })
      .then((response) => setData({
        items: Array.isArray(response?.items) ? response.items : [],
        total: Number(response?.total) || 0,
        totalPages: Math.max(1, Number(response?.totalPages) || 1),
      }))
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message || "Events could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query.q, query.page, query.view, pageSize]);

  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = buildSectionStyles(props);
  const style = {
    "--events-ink": themeColor(props?.eventsListingTextColorKey, "Black"),
    "--events-muted": themeColor(props?.eventsListingMutedTextColorKey, "Black Light"),
    "--events-accent": themeColor(props?.eventsListingAccentColorKey, "Primary"),
    "--events-card-bg": themeColor(props?.eventsListingCardBgColorKey, "White"),
    "--events-surface": themeColor(props?.eventsListingSurfaceColorKey, "Surface"),
    "--events-border": themeColor(props?.eventsListingBorderColorKey, "Border"),
    "--events-control-bg": themeColor(props?.eventsListingControlBgColorKey, "White"),
    "--events-control-text": themeColor(props?.eventsListingControlTextColorKey, "Black"),
    "--events-button-bg": themeColor(props?.eventsListingButtonBgColorKey, "Primary"),
    "--events-button-text": themeColor(props?.eventsListingButtonTextColorKey, "White"),
    "--events-button-hover-bg": themeColor(props?.eventsListingButtonHoverBgColorKey, "Primary Dark"),
    "--events-button-hover-text": themeColor(props?.eventsListingButtonHoverTextColorKey, "White"),
    "--events-columns": columns,
    "--events-gap": `${gap}px`,
    "--events-radius": `${radius}px`,
  };
  const isPast = query.view === "past";
  const titleAlign = getTitleAlign(props, "left", "eventsListing");

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <ListingRoot style={style} className="my-md-5">
          {(showSearch || showFilters) ? (
            <div className="events-controls" aria-label="Event search and filters">
              {showSearch ? (
                <div>
                  <label className="events-control-label" htmlFor="events-search-input">{labels.search}</label>
                  <form className="events-search" onSubmit={(event) => { event.preventDefault(); updateQuery({ q: searchText.trim(), page: 1 }); }}>
                    <input id="events-search-input" type="search" value={searchText} placeholder={labels.placeholder} onChange={(event) => setSearchText(event.target.value)} />
                    <button type="submit" aria-label={labels.search}><SearchOutlined /></button>
                  </form>
                </div>
              ) : <div />}
              {showFilters ? (
                <div>
                  <span className="events-control-label">Filter</span>
                  <div className="events-filter-tabs" role="tablist" aria-label="Event status">
                    {[["all", labels.all], ["live", labels.live], ["past", labels.past]].map(([value, label]) => (
                      <button key={value} type="button" role="tab" aria-selected={query.view === value} onClick={() => updateQuery({ view: value, page: 1 })}>{label}</button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="events-heading-row" style={getHeaderAlignStyles(titleAlign)}>
            <div style={getHeaderAlignStyles(titleAlign)}>
              <p className="events-subtitle" style={getSubtitleAlignStyles(titleAlign)}>{isPast ? labels.pastSubtitle : labels.subtitle}</p>
              <h2 className="events-title" style={getTitleAlignStyles(titleAlign)}>{renderHighlightedTitle(isPast ? labels.pastTitle : labels.title, props, { legacyColorKey: props?.eventsListingAccentColorKey })}</h2>
            </div>
            {!loading ? <span className="events-count">{data.total} events</span> : null}
          </div>

          <div className="events-grid" aria-live="polite" aria-busy={loading}>
            {loading ? <div className="events-state">Loading events...</div> : null}
            {error ? <div className="events-state events-state--error" role="alert">{error}</div> : null}
            {!loading && !error && !data.items.length ? <div className="events-state">{labels.empty}</div> : null}
            {!loading && !error ? data.items.map((event) => (
              <EventCard key={event?._id || event?.slug} event={event} buttonLabel={labels.button} showDescription={showDescriptions} />
            )) : null}
          </div>

          {data.totalPages > 1 ? (
            <nav className="events-pagination" aria-label="Events pagination">
              <button className="events-page-button" type="button" disabled={query.page <= 1} onClick={() => updateQuery({ page: query.page - 1 })}>{labels.previous}</button>
              <span className="events-page-status">Page {query.page} of {data.totalPages}</span>
              <button className="events-page-button" type="button" disabled={query.page >= data.totalPages} onClick={() => updateQuery({ page: query.page + 1 })}>{labels.next}</button>
            </nav>
          ) : null}
        </ListingRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
