import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import {
  buildCanonicalUrl,
  getGlobalFallbackImageFromTheme,
  resolveShareMetadata,
  toAbsoluteUrl,
} from "@/helpers/socialShare";
import Event from "@/models/Event";
import ThemeConfig from "@/models/ThemeConfig";
import { extractGlobalSeoFromTheme, parseMetaKeywords } from "@/lib/seo";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventContent from "@/components/events/EventContent";
import {
  formatEventDayDate,
  formatEventDateRange,
  getEventStartTimeText,
  getEventImageSources,
  isEventPast,
  isEventStarted,
} from "@/components/events/eventDisplay";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import SocialShare from "@/components/common/SocialShare";

export const revalidate = 60;

const getPublishedEventBySlug = cache(async (slug) => {
  await connectDB();
  return Event.findOne({ slug, status: "published" }).lean();
});

const getThemeForEventDetail = cache(async () => {
  await connectDB();
  return ThemeConfig.findOne({
    $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
  })
    .sort({ updatedAt: -1 })
    .select(
      "logoLightUrl logoImageUrl logoMobileUrl logoDarkUrl faviconUrl seoImage ogImage socialShareImage defaultMetaTitle defaultMetaDescription defaultMetaKeywords defaultMetaImage",
    )
    .lean();
});

function getEventShareMeta(event, themeDoc, slug) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = buildCanonicalUrl(siteUrl, `/events/${slug}`);
  const globalSeo = extractGlobalSeoFromTheme(themeDoc);
  const globalFallbackImage = toAbsoluteUrl(
    getGlobalFallbackImageFromTheme(themeDoc),
    siteUrl,
  );
  const metaTitle = String(event?.meta?.metaTitle || "").trim();
  const metaDescription = String(event?.meta?.metaDescription || "").trim();
  const titleFromContent = String(event?.title || "").trim();
  const { desktop, mobile } = getEventImageSources(event || {});

  const shareMeta = resolveShareMetadata({
    canonicalUrl,
    title: titleFromContent,
    metaTitle,
    description: event?.description,
    metaDescription,
    shortDescription: event?.shortDescription,
    excerpt: event?.excerpt,
    featuredImageDesktop: event?.featuredImageDesktop || desktop,
    featuredImage: event?.featuredImage,
    featuredImageMobile: event?.featuredImageMobile || mobile,
    seoImage: event?.seoImage,
    globalFallbackImage,
  });

  return {
    canonicalUrl,
    title: metaTitle || globalSeo.title || shareMeta.title || titleFromContent,
    description: metaDescription || globalSeo.description || shareMeta.description || "",
    image: toAbsoluteUrl(shareMeta.image || globalSeo.image, siteUrl),
    keywords: parseMetaKeywords(event?.meta?.metaKeywords) || globalSeo.keywords,
  };
}

export async function generateMetadata({ params }) {
  const slug = params.slug;

  try {
    const [event, themeDoc] = await Promise.all([
      getPublishedEventBySlug(slug),
      getThemeForEventDetail(),
    ]);

    if (!event) return {};

    const shareMeta = getEventShareMeta(event, themeDoc, slug);

    const openGraph = {
      title: shareMeta.title,
      description: shareMeta.description,
      url: shareMeta.canonicalUrl,
      type: "website",
      ...(shareMeta.image
        ? {
            images: [
              {
                url: shareMeta.image,
                alt: shareMeta.title,
              },
            ],
          }
        : {}),
    };

    return {
      title: shareMeta.title,
      description: shareMeta.description,
      ...(shareMeta.keywords?.length ? { keywords: shareMeta.keywords } : {}),
      alternates: { canonical: `/events/${slug}` },
      openGraph,
      twitter: {
        card: shareMeta.image ? "summary_large_image" : "summary",
        title: shareMeta.title,
        description: shareMeta.description,
        ...(shareMeta.image ? { images: [shareMeta.image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

async function EventDetail({ slug }) {
  let event;
  let themeDoc;

  try {
    const [eventDoc, themeConfigDoc] = await Promise.all([
      getPublishedEventBySlug(slug),
      getThemeForEventDetail(),
    ]);
    event = eventDoc;
    themeDoc = themeConfigDoc;
  } catch {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <h2>Service temporarily unavailable</h2>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
      </div>
    );
  }

  if (!event) notFound();

  const { desktop, mobile } = getEventImageSources(event);
  const shareMeta = getEventShareMeta(event, themeDoc, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    ...(shareMeta.description && { description: shareMeta.description }),
    url: shareMeta.canonicalUrl,
    ...(shareMeta.image && { image: shareMeta.image }),
    ...(event.startDate && {
      startDate: new Date(event.startDate).toISOString(),
    }),
    ...(event.endDate && { endDate: new Date(event.endDate).toISOString() }),
    eventAttendanceMode: event.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(event.isOnline
      ? {
          location: {
            "@type": "VirtualLocation",
            url: event.eventLink || shareMeta.canonicalUrl,
          },
        }
      : event.location
        ? {
            location: {
              "@type": "Place",
              name: event.location,
            },
          }
        : {}),
  };

  const regLink = (event.eventLink || "").trim();
  const isPastEvent = isEventPast(event);
  const hasEventStarted = isEventStarted(event);
  const isRegistrationOpen =
    Boolean(regLink) && hasEventStarted && !isPastEvent;
  const eventTime = (event.time || "").trim();
  const eventStartTime = getEventStartTimeText(eventTime);
  const registrationOpenDate = formatEventDayDate(event.startDate);
  const registrationOpenLabel = registrationOpenDate
    ? eventStartTime
      ? `${registrationOpenDate} at ${eventStartTime}`
      : registrationOpenDate
    : "the start date";
  const shortDescription = (event.description || "").trim();
  const fullDescription = (event.content || "").trim();
  const eventDateRange = formatEventDateRange(event.startDate, event.endDate);
  const eventMode = event.isOnline ? "Online" : "In-person";
  const venue = event.isOnline
    ? "Online event"
    : (event.location || "").trim() || "Venue to be announced";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
        <PageContainer className="pt-0" suppressHydrationWarning>
          <div
            className="events-detail-layout"
            style={{ display: "flex", gap: 40 }}
            suppressHydrationWarning
          >
            <article
              className="events-detail-article"
              style={{ flex: 1, minWidth: 0 }}
            >
              <h1
                className="events-detail-title"
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                {event.title}
              </h1>

              <div
                className="events-detail-meta-row"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                <SocialShare
                  canonicalUrl={shareMeta.canonicalUrl}
                  title={shareMeta.title}
                  description={shareMeta.description}
                  image={shareMeta.image}
                />
              </div>

              {desktop ? (
                <figure
                  className="events-detail-banner"
                  style={{
                    margin: "0 0 28px",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <MediaImage
                    src={desktop}
                    mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                    alt={event.title}
                    imgClassName="events-detail-banner-img"
                    width={800}
                    height={400}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 860px"
                    priority
                    imgStyle={{
                      width: "auto",
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 12,
                      display: "block",
                      margin: 0,
                    }}
                  />
                </figure>
              ) : null}

              <section
                style={{
                  marginBottom: 26,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.015)",
                  padding: 18,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 14px 0",
                    fontSize: 18,
                    lineHeight: 1.3,
                    fontWeight: 700,
                  }}
                >
                  Event Information
                </h2>
                <dl
                  className="events-detail-info-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(120px, 180px) 1fr",
                    rowGap: 10,
                    columnGap: 14,
                    margin: 0,
                  }}
                >
                  <dt style={{ color: "rgba(0,0,0,0.6)", fontWeight: 600 }}>
                    Date
                  </dt>
                  <dd style={{ margin: 0, color: "rgba(0,0,0,0.82)" }}>
                    {eventDateRange || "To be announced"}
                  </dd>

                  <dt style={{ color: "rgba(0,0,0,0.6)", fontWeight: 600 }}>
                    Time
                  </dt>
                  <dd style={{ margin: 0, color: "rgba(0,0,0,0.82)" }}>
                    {eventTime || "To be announced"}
                  </dd>

                  <dt style={{ color: "rgba(0,0,0,0.6)", fontWeight: 600 }}>
                    Mode
                  </dt>
                  <dd style={{ margin: 0, color: "rgba(0,0,0,0.82)" }}>
                    {eventMode}
                  </dd>

                  <dt style={{ color: "rgba(0,0,0,0.6)", fontWeight: 600 }}>
                    Venue
                  </dt>
                  <dd style={{ margin: 0, color: "rgba(0,0,0,0.82)" }}>
                    {venue}
                  </dd>

                  <dt style={{ color: "rgba(0,0,0,0.6)", fontWeight: 600 }}>
                    Registration
                  </dt>
                  <dd style={{ margin: 0, color: "rgba(0,0,0,0.82)" }}>
                    {isRegistrationOpen ? (
                      <a
                        href={regLink}
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--primary-color, #8b1a1a)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Open registration form
                      </a>
                    ) : regLink ? (
                      hasEventStarted
                        ? "Registration closed"
                        : `Registration opens on ${registrationOpenLabel}`
                    ) : (
                      "Not available"
                    )}
                  </dd>
                </dl>
              </section>

              {shortDescription ? (
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.65,
                    color: "rgba(0,0,0,0.66)",
                    margin: "0 0 20px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {shortDescription}
                </p>
              ) : null}

              <h2
                style={{
                  margin: "0 0 14px",
                  fontSize: 22,
                  lineHeight: 1.3,
                  fontWeight: 700,
                }}
              >
                Description
              </h2>

              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "rgba(0,0,0,0.75)",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                {fullDescription ? (
                  <EventContent html={fullDescription} />
                ) : shortDescription ? (
                  <p style={{ margin: 0, whiteSpace: "pre-line" }}>
                    {shortDescription}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: "rgba(0,0,0,0.55)" }}>
                    Description will be updated soon.
                  </p>
                )}
              </div>

              {event.tags?.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 14px",
                        borderRadius: 20,
                        background: "rgba(0,0,0,0.04)",
                        fontSize: 13,
                        color: "rgba(0,0,0,0.55)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <p style={{ marginTop: 40 }}>
                <Link
                  href="/events"
                  style={{
                    color: "var(--primary-color, #8b1a1a)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {"<-"} All events
                </Link>
              </p>
            </article>

            <div
              style={{ width: 320, flexShrink: 0 }}
              className="events-detail-sidebar"
            >
              <EventsSidebarFull currentSlug={slug} />
            </div>
          </div>
        </PageContainer>
      </FullWidthBackground>

      <style>{`
        @media (max-width: 1200px) {
          .events-detail-layout { gap: 28px !important; }
        }
        @media (max-width: 992px) {
          .events-detail-layout { gap: 24px !important; flex-direction: column !important; }
          .events-detail-sidebar { width: 100% !important; margin-top: 40px; }
        }
        @media (max-width: 768px) {
          .events-detail-title { font-size: 24px !important; line-height: 1.3 !important; }
          .events-detail-meta-row { align-items: stretch !important; }
          .events-detail-banner {
            margin-bottom: 20px !important;
            border-radius: 10px !important;
          }
          .events-detail-banner-img {
            width: auto !important;
            max-width: 100% !important;
            height: auto !important;
          }
          .events-detail-sidebar { margin-top: 28px !important; }
        }
        @media (max-width: 640px) {
          .events-detail-info-grid {
            grid-template-columns: 1fr !important;
            row-gap: 4px !important;
          }
        }
        @media (max-width: 480px) {
          .events-detail-title { font-size: 20px !important; }
          .events-detail-article { font-size: 15px; }
        }
      `}</style>
    </>
  );
}

export default function EventDetailPage({ params }) {
  return <EventDetail slug={params.slug} />;
}
