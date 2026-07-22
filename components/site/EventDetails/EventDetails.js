"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  PageContainer,
  getColor,
} from "@/styles/Theme";
import EventContent from "@/components/events/EventContent";
import MediaImage from "@/components/shared/MediaImage";
import SocialShare from "@/components/common/SocialShare";
import {
  formatEventDateRange,
  formatLocationLine,
  getEventImageSources,
  getEventStartTimeText,
  isEventPast,
  isEventStarted,
} from "@/components/events/eventDisplay";
import { buildEventRegistrationHref } from "@/components/events/eventRegistration";

const EventDetailsRoot = styled.div`
  --event-detail-ink: #2a283e;
  --event-detail-muted: rgba(42, 40, 62, 0.66);
  --event-detail-accent: #e03c33;
  --event-detail-card: #ffffff;
  --event-detail-surface: #f2f0ea;
  --event-detail-border: rgba(42, 40, 62, 0.14);
  --event-detail-button-bg: #2a283e;
  --event-detail-button-text: #ffffff;
  --event-detail-button-hover-bg: #e03c33;
  --event-detail-button-hover-text: #ffffff;
  --event-detail-radius: 18px;
  color: var(--event-detail-ink);
  padding: 0;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .event-detail-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.72fr) minmax(290px, 0.72fr);
    gap: clamp(34px, 5.5vw, 78px);
    align-items: start;
  }

  .event-detail-title {
    max-width: 980px;
    margin: 0 0 20px;
    color: var(--event-detail-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(36px, 5vw, 68px);
    font-weight: 500;
    letter-spacing: -0.045em;
    line-height: 0.98;
  }

  .event-detail-lead {
    max-width: 800px;
    margin: 0 0 28px;
    color: var(--event-detail-muted);
    font-size: clamp(16px, 1.5vw, 19px);
    line-height: 1.65;
  }

  .event-detail-media {
    width: 100%;
    aspect-ratio: 16 / 8.5;
    margin: 0 0 clamp(30px, 4vw, 48px);
    border: 1px solid var(--event-detail-border);
    border-radius: var(--event-detail-radius);
    background: var(--event-detail-surface);
    overflow: hidden;
  }

  .event-detail-media picture,
  .event-detail-media img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .event-detail-media img {
    object-fit: cover;
  }

  .event-detail-section {
    margin-top: clamp(34px, 5vw, 58px);
  }

  .event-detail-section-title {
    margin: 0 0 18px;
    color: var(--event-detail-ink);
    font-family: var(--font-display, inherit);
    font-size: clamp(25px, 3vw, 36px);
    font-weight: 520;
    letter-spacing: -0.025em;
    line-height: 1.15;
  }

  .event-detail-content {
    color: var(--event-detail-muted) !important;
    font-size: 16px !important;
    line-height: 1.82 !important;
  }

  .event-detail-content :is(h1, h2, h3, h4, h5, h6) {
    color: var(--event-detail-ink);
    font-family: var(--font-display, inherit);
  }

  .event-detail-content a {
    color: var(--event-detail-accent);
  }

  .event-detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--event-detail-border);
  }

  .event-detail-tags span {
    padding: 7px 13px;
    border-radius: 999px;
    color: var(--event-detail-ink);
    background: var(--event-detail-surface);
    font-size: 13px;
    font-weight: 650;
  }

  .event-detail-gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .event-detail-gallery-item {
    aspect-ratio: 4 / 3;
    border-radius: calc(var(--event-detail-radius) * 0.72);
    background: var(--event-detail-surface);
    overflow: hidden;
  }

  .event-detail-gallery-item picture,
  .event-detail-gallery-item img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .event-detail-gallery-item img {
    object-fit: cover;
  }

  .event-detail-attachments {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .event-detail-attachment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 15px 18px;
    border: 1px solid var(--event-detail-border);
    border-radius: 12px;
    color: var(--event-detail-ink);
    background: var(--event-detail-card);
    font-weight: 650;
    text-decoration: none;
  }

  .event-detail-attachment:hover {
    border-color: var(--event-detail-accent);
    color: var(--event-detail-accent);
  }

  .event-detail-sidebar {
    position: sticky;
    top: 118px;
  }

  .event-detail-card {
    padding: clamp(22px, 2.8vw, 30px);
    border: 1px solid var(--event-detail-border);
    border-radius: var(--event-detail-radius);
    background: var(--event-detail-card);
  }

  .event-detail-card + .event-detail-card {
    margin-top: 22px;
  }

  .event-detail-card-title {
    margin: 0 0 18px;
    color: var(--event-detail-accent);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .event-detail-info {
    display: grid;
    gap: 17px;
    margin: 0;
  }

  .event-detail-info div {
    display: grid;
    gap: 4px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--event-detail-border);
  }

  .event-detail-info div:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .event-detail-info dt {
    color: var(--event-detail-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .event-detail-info dd {
    margin: 0;
    color: var(--event-detail-ink);
    font-size: 15px;
    font-weight: 620;
    line-height: 1.5;
  }

  .event-detail-action {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 22px;
    padding: 12px 17px;
    border: 1px solid var(--event-detail-button-bg);
    border-radius: 999px;
    color: var(--event-detail-button-text);
    background: var(--event-detail-button-bg);
    font-size: 14px;
    font-weight: 750;
    text-align: center;
    text-decoration: none;
    transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
  }

  .event-detail-action:hover {
    border-color: var(--event-detail-button-hover-bg);
    color: var(--event-detail-button-hover-text);
    background: var(--event-detail-button-hover-bg);
  }

  .event-detail-registration-note {
    margin: 16px 0 0;
    color: var(--event-detail-muted);
    font-size: 13px;
    line-height: 1.55;
  }

  .event-detail-share {
    margin-top: 20px;
  }

  .event-detail-share .social-share-trigger {
    color: var(--event-detail-ink);
    background: var(--event-detail-card);
    border-color: var(--event-detail-border);
  }

  .event-detail-related {
    display: grid;
    gap: 15px;
  }

  .event-detail-related-item {
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 13px;
    align-items: center;
  }

  .event-detail-related-image {
    width: 78px;
    aspect-ratio: 1.45 / 1;
    display: block;
    border-radius: 9px;
    background: var(--event-detail-surface);
    overflow: hidden;
  }

  .event-detail-related-image picture,
  .event-detail-related-image img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .event-detail-related-image img {
    object-fit: cover;
  }

  .event-detail-related-title {
    display: -webkit-box;
    overflow: hidden;
    color: var(--event-detail-ink);
    font-size: 14px;
    font-weight: 670;
    line-height: 1.35;
    text-decoration: none;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .event-detail-related-title:hover {
    color: var(--event-detail-accent);
  }

  .event-detail-related-date {
    display: block;
    margin-top: 5px;
    color: var(--event-detail-muted);
    font-size: 11px;
    text-transform: uppercase;
  }

  .event-detail-back {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 42px;
    color: var(--event-detail-accent);
    font-weight: 750;
    text-decoration: none;
  }

  .event-detail-state {
    padding: 60px 20px;
    border: 1px dashed var(--event-detail-border);
    border-radius: var(--event-detail-radius);
    color: var(--event-detail-muted);
    background: var(--event-detail-surface);
    text-align: center;
  }

  .event-detail-state--error {
    color: var(--event-detail-accent);
  }

  @media (max-width: 980px) {
    .event-detail-layout {
      grid-template-columns: 1fr;
    }
    .event-detail-sidebar {
      position: static;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .event-detail-card + .event-detail-card {
      margin-top: 0;
    }
  }

  @media (max-width: 680px) {
    .event-detail-sidebar,
    .event-detail-gallery {
      grid-template-columns: 1fr;
    }
    .event-detail-title {
      font-size: clamp(34px, 11vw, 48px);
    }
    .event-detail-media {
      aspect-ratio: 4 / 3;
    }
  }
`;

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function themedColor(value, fallback) {
  return getColor(text(value) || fallback);
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function normalizeGallery(event) {
  const source = Array.isArray(event?.galleryImages)
    ? event.galleryImages
    : Array.isArray(event?.gallery)
      ? event.gallery
      : [];
  return source
    .map((item) => {
      if (typeof item === "string") return { src: item, alt: event?.title || "Event" };
      return {
        src: text(item?.image || item?.src || item?.url),
        mobileSrc: text(item?.mobileImage || item?.mobileSrc),
        alt: text(item?.alt || item?.title, event?.title || "Event"),
      };
    })
    .filter((item) => item.src);
}

function normalizeAttachments(event) {
  const source = Array.isArray(event?.attachments) ? event.attachments : [];
  const items = source.map((item, index) => {
    if (typeof item === "string") return { url: item, label: `Download ${index + 1}` };
    return {
      url: text(item?.url || item?.file || item?.href),
      label: text(item?.label || item?.title || item?.name, `Download ${index + 1}`),
    };
  });
  const singleUrl = text(event?.attachmentUrl || event?.downloadUrl);
  if (singleUrl) {
    items.unshift({
      url: singleUrl,
      label: text(event?.attachmentLabel || event?.downloadLabel, "Download attachment"),
    });
  }
  return items.filter((item) => item.url);
}

function buildSectionStyles(props) {
  const prefix = "eventDetails";
  const type = text(props?.[`${prefix}SectionBgType`], "default");
  const image = text(props?.[`${prefix}SectionBgImage`]);
  const color = text(props?.[`${prefix}SectionBgColorKey`]);
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
  [
    ["SectionPaddingTop", "paddingTop"],
    ["SectionPaddingBottom", "paddingBottom"],
    ["SectionMarginTop", "marginTop"],
    ["SectionMarginBottom", "marginBottom"],
  ].forEach(([key, cssKey]) => {
    const value = numberStyle(key);
    if (value) sectionBgStyle[cssKey] = value;
  });

  const containerType = text(props?.[`${prefix}PageContainerBgType`], "default");
  const containerImage = text(props?.[`${prefix}PageContainerBgImage`]);
  const containerColor = text(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = containerType === "image" && containerImage
    ? { backgroundImage: `url(${containerImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : containerType === "color" && containerColor
      ? { backgroundColor: getColor(containerColor), backgroundImage: "none" }
      : {};
  [
    ["PageContainerPaddingTop", "paddingTop"],
    ["PageContainerPaddingRight", "paddingRight"],
    ["PageContainerPaddingBottom", "paddingBottom"],
    ["PageContainerPaddingLeft", "paddingLeft"],
    ["PageContainerMarginTop", "marginTop"],
    ["PageContainerMarginBottom", "marginBottom"],
  ].forEach(([key, cssKey]) => {
    const value = numberStyle(key);
    if (value) pageContainerBgStyle[cssKey] = value;
  });
  // Preserve PageContainer's horizontal responsive gutter while removing its
  // shared 80px/40px vertical padding for the dedicated detail template.
  pageContainerBgStyle.paddingTop = 0;
  pageContainerBgStyle.paddingBottom = 0;
  return {
    sectionBgClassName,
    sectionBgStyle: Object.keys(sectionBgStyle).length ? sectionBgStyle : undefined,
    pageContainerBgStyle,
  };
}

function RelatedEvent({ event }) {
  const href = `/events/${event.slug}`;
  const { desktop, mobile } = getEventImageSources(event);
  return (
    <div className="event-detail-related-item">
      <Link href={href} className="event-detail-related-image" aria-label={event.title}>
        {desktop || mobile ? (
          <MediaImage
            src={desktop || mobile}
            mobileSrc={mobile && mobile !== desktop ? mobile : ""}
            alt={event.title || "Event"}
            width={156}
            height={108}
            sizes="78px"
            imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </Link>
      <div>
        <Link href={href} className="event-detail-related-title">{event.title}</Link>
        <span className="event-detail-related-date">
          {formatEventDateRange(event.startDate, event.endDate)}
        </span>
      </div>
    </div>
  );
}

export default function EventDetails(props) {
  const params = useParams();
  const routeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  const relatedLimit = clamp(props?.eventDetailsRelatedLimit, 1, 8, 4);
  const showImage = props?.eventDetailsShowImage !== false;
  const showInformation = props?.eventDetailsShowInformation !== false;
  const showDescription = props?.eventDetailsShowDescription !== false;
  const showRegistration = props?.eventDetailsShowRegistration !== false;
  const showShare = props?.eventDetailsShowShare !== false;
  const showTags = props?.eventDetailsShowTags !== false;
  const showGallery = props?.eventDetailsShowGallery !== false;
  const showAttachments = props?.eventDetailsShowAttachments !== false;
  const showRelated = props?.eventDetailsShowRelated !== false;

  const labels = useMemo(() => ({
    information: text(props?.eventDetailsInformationTitle, "Event Information"),
    date: text(props?.eventDetailsDateLabel, "Date"),
    time: text(props?.eventDetailsTimeLabel, "Time"),
    mode: text(props?.eventDetailsModeLabel, "Mode"),
    venue: text(props?.eventDetailsVenueLabel, "Venue"),
    description: text(props?.eventDetailsDescriptionTitle, "Description"),
    gallery: text(props?.eventDetailsGalleryTitle, "Event Gallery"),
    downloads: text(props?.eventDetailsDownloadsTitle, "Downloads"),
    registration: text(props?.eventDetailsRegistrationButtonLabel, "Register for this event"),
    share: text(props?.eventDetailsShareLabel, "Share"),
    related: text(props?.eventDetailsRelatedTitle, "Related Events"),
    allEvents: text(props?.eventDetailsAllEventsLabel, "All events"),
    unavailable: text(props?.eventDetailsUnavailableLabel, "To be announced"),
    noDescription: text(props?.eventDetailsNoDescriptionLabel, "Description will be updated soon."),
  }), [props]);

  useEffect(() => {
    setCanonicalUrl(typeof window !== "undefined" ? window.location.href.split(/[?#]/)[0] : "");
  }, [routeSlug]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const eventRequest = routeSlug
      ? fetch(`/api/events?slug=${encodeURIComponent(routeSlug)}`, {
          cache: "no-store",
          signal: controller.signal,
        }).then(async (response) => {
          if (response.status === 404) throw new Error("Event not found.");
          if (!response.ok) throw new Error("Event details could not be loaded.");
          return response.json();
        })
      : fetch("/api/events?visibility=all&page=1&limit=1&sort=recent", {
          cache: "no-store",
          signal: controller.signal,
        })
          .then((response) => response.ok ? response.json() : { items: [] })
          .then((data) => data?.items?.[0] || null);

    eventRequest
      .then((selectedEvent) => {
        if (!selectedEvent) throw new Error(routeSlug ? "Event not found." : "Add an event to preview this component.");
        setEvent(selectedEvent);
        return Promise.all([
          selectedEvent,
          fetch(`/api/events?visibility=all&page=1&limit=${relatedLimit + 1}&sort=recent&fields=sidebar`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
      })
      .then(async ([selectedEvent, response]) => [
        selectedEvent,
        response.ok ? await response.json() : { items: [] },
      ])
      .then(([selectedEvent, data]) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        setRelated(
          items
            .filter((item) => item?.slug && item.slug !== selectedEvent.slug)
            .slice(0, relatedLimit),
        );
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message || "Event details could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [routeSlug, relatedLimit]);

  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = buildSectionStyles(props);
  const style = {
    "--event-detail-ink": themedColor(props?.eventDetailsTextColorKey, "Black"),
    "--event-detail-muted": themedColor(props?.eventDetailsMutedTextColorKey, "Black Light"),
    "--event-detail-accent": themedColor(props?.eventDetailsAccentColorKey, "Primary"),
    "--event-detail-card": themedColor(props?.eventDetailsCardBgColorKey, "White"),
    "--event-detail-surface": themedColor(props?.eventDetailsSurfaceColorKey, "Surface"),
    "--event-detail-border": themedColor(props?.eventDetailsBorderColorKey, "Border"),
    "--event-detail-button-bg": themedColor(props?.eventDetailsButtonBgColorKey, "Black"),
    "--event-detail-button-text": themedColor(props?.eventDetailsButtonTextColorKey, "White"),
    "--event-detail-button-hover-bg": themedColor(props?.eventDetailsButtonHoverBgColorKey, "Primary"),
    "--event-detail-button-hover-text": themedColor(props?.eventDetailsButtonHoverTextColorKey, "White"),
    "--event-detail-radius": `${clamp(props?.eventDetailsCardRadius, 0, 40, 18)}px`,
    "--primary-color": themedColor(props?.eventDetailsAccentColorKey, "Primary"),
  };

  if (loading || error || !event) {
    return (
      <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
        <PageContainer style={pageContainerBgStyle}>
          <EventDetailsRoot style={style}>
            <div className={`event-detail-state${error ? " event-detail-state--error" : ""}`}>
              {error || "Loading event details..."}
            </div>
          </EventDetailsRoot>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  const { desktop, mobile } = getEventImageSources(event);
  const dateRange = formatEventDateRange(event.startDate, event.endDate);
  const eventTime = text(event.time);
  const location = formatLocationLine(event) || labels.unavailable;
  const eventMode = event.isOnline ? "Online" : "In-person";
  const registrationLink = text(event.eventLink);
  const eventPast = isEventPast(event);
  const eventStarted = isEventStarted(event);
  const registrationOpen = Boolean(registrationLink) && eventStarted && !eventPast;
  const registrationHref = buildEventRegistrationHref(registrationLink, event, dateRange);
  const registrationNote = registrationLink
    ? eventPast
      ? `This event closed on ${formatEventDateRange(event.endDate || event.startDate, null) || "its end date"}.`
      : !eventStarted
        ? `Registration opens when the event begins${getEventStartTimeText(event.time) ? ` at ${getEventStartTimeText(event.time)}` : ""}.`
        : "Registration is currently available."
    : "Registration is not available for this event.";
  const gallery = normalizeGallery(event);
  const attachments = normalizeAttachments(event);
  const descriptionHtml = text(event.content) || text(event.description);
  const shareImage = desktop || mobile;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <EventDetailsRoot style={style} className="my-5">
          <div className="event-detail-layout">
            <article>
              <h1 className="event-detail-title">{event.title}</h1>

              {showImage && (desktop || mobile) ? (
                <figure className="event-detail-media">
                  <MediaImage
                    src={desktop || mobile}
                    mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                    alt={event.title || "Event"}
                    width={1400}
                    height={744}
                    sizes="(max-width: 980px) 100vw, 850px"
                    priority
                    imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </figure>
              ) : null}

              {event.description ? <p className="event-detail-lead">{event.description}</p> : null}

              {showDescription ? (
                <section className="event-detail-section">
                  <h2 className="event-detail-section-title">{labels.description}</h2>
                  {descriptionHtml ? (
                    <EventContent html={descriptionHtml} className="event-detail-content" style={{ color: "var(--event-detail-muted)" }} />
                  ) : <p className="event-detail-lead">{labels.noDescription}</p>}
                </section>
              ) : null}

              {showGallery && gallery.length ? (
                <section className="event-detail-section">
                  <h2 className="event-detail-section-title">{labels.gallery}</h2>
                  <div className="event-detail-gallery">
                    {gallery.map((item, index) => (
                      <div className="event-detail-gallery-item" key={`${item.src}-${index}`}>
                        <MediaImage
                          src={item.src}
                          mobileSrc={item.mobileSrc}
                          alt={item.alt}
                          width={900}
                          height={675}
                          sizes="(max-width: 680px) 100vw, 420px"
                          imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {showAttachments && attachments.length ? (
                <section className="event-detail-section">
                  <h2 className="event-detail-section-title">{labels.downloads}</h2>
                  <div className="event-detail-attachments">
                    {attachments.map((attachment, index) => (
                      <a
                        className="event-detail-attachment"
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={`${attachment.url}-${index}`}
                      >
                        <span>{attachment.label}</span><DownloadOutlined />
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {showTags && Array.isArray(event.tags) && event.tags.length ? (
                <div className="event-detail-tags">
                  {event.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              ) : null}

              <Link href="/events" className="event-detail-back">
                <ArrowLeftOutlined />{labels.allEvents}
              </Link>
            </article>

            <aside className="event-detail-sidebar">
              {showInformation ? (
                <div className="event-detail-card">
                  <h2 className="event-detail-card-title">{labels.information}</h2>
                  <dl className="event-detail-info">
                    <div><dt>{labels.date}</dt><dd>{dateRange || labels.unavailable}</dd></div>
                    <div><dt>{labels.time}</dt><dd>{eventTime || labels.unavailable}</dd></div>
                    <div><dt>{labels.mode}</dt><dd>{eventMode}</dd></div>
                    <div><dt>{labels.venue}</dt><dd>{location}</dd></div>
                  </dl>
                  {showRegistration && registrationOpen ? (
                    <a
                      className="event-detail-action"
                      href={registrationHref}
                      target={registrationHref.startsWith("/") ? undefined : "_blank"}
                      rel={registrationHref.startsWith("/") ? undefined : "noopener noreferrer"}
                    >
                      {labels.registration}
                    </a>
                  ) : null}
                  {showRegistration ? <p className="event-detail-registration-note">{registrationNote}</p> : null}
                  {showShare ? (
                    <div className="event-detail-share">
                      <SocialShare
                        canonicalUrl={canonicalUrl || `/events/${event.slug}`}
                        title={event.title || "Event"}
                        description={event.description || ""}
                        image={shareImage}
                        buttonLabel={labels.share}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showRelated && related.length ? (
                <div className="event-detail-card">
                  <h2 className="event-detail-card-title">{labels.related}</h2>
                  <div className="event-detail-related">
                    {related.map((relatedEvent) => <RelatedEvent key={relatedEvent._id || relatedEvent.slug} event={relatedEvent} />)}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </EventDetailsRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
