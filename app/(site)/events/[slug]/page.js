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
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventMeta from "@/components/events/EventMeta";
import EventContent from "@/components/events/EventContent";
import { getEventImageSources } from "@/components/events/eventDisplay";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import SocialShare from "@/components/common/SocialShare";
import { normalizeTargetFromItem } from "@/lib/linkUtils";

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
      "logoLightUrl logoImageUrl logoMobileUrl logoDarkUrl faviconUrl seoImage ogImage socialShareImage",
    )
    .lean();
});

function getEventShareMeta(event, themeDoc, slug) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = buildCanonicalUrl(siteUrl, `/events/${slug}`);
  const globalFallbackImage = toAbsoluteUrl(
    getGlobalFallbackImageFromTheme(themeDoc),
    siteUrl,
  );
  const { desktop, mobile } = getEventImageSources(event || {});

  const shareMeta = resolveShareMetadata({
    canonicalUrl,
    title: event?.title,
    metaTitle: event?.meta?.metaTitle,
    description: event?.description,
    metaDescription: event?.meta?.metaDescription,
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
    title: shareMeta.title || String(event?.title || ""),
    description: shareMeta.description || "",
    image: toAbsoluteUrl(shareMeta.image, siteUrl),
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
            images: [{
              url: shareMeta.image,
              alt: shareMeta.title,
            }],
          }
        : {}),
    };

    return {
      title: shareMeta.title,
      description: shareMeta.description,
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
  // Phase 10: honor the event link-target fields (eventLinkTarget / openInNewTab).
  const regTarget = normalizeTargetFromItem(event, {
    targetKeys: ["eventLinkTarget"],
    boolKeys: ["eventLinkOpenInNewTab"],
    fallback: "_self",
  });

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
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                <EventMeta
                  event={event}
                  showIcons
                  style={{
                    marginBottom: 0,
                    fontSize: 15,
                    color: "rgba(0,0,0,0.45)",
                  }}
                />
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
                    maxHeight: 400,
                  }}
                >
                  <MediaImage
                    src={desktop}
                    mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                    variant="desktop"
                    mobileVariant="mobile"
                    alt={event.title}
                    imgClassName="events-detail-banner-img"
                    width={1440}
                    height={810}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 860px"
                    priority
                    imgStyle={{
                      width: "auto",
                      maxWidth: "100%",
                      height: "auto",
                      maxHeight: 400,
                      objectFit: "contain",
                      objectPosition: "left top",
                      display: "block",
                      margin: 0,
                    }}
                  />
                </figure>
              ) : null}

              {regLink ? (
                <p style={{ margin: "0 0 24px 0" }}>
                  <a
                    href={regLink}
                    target={regTarget}
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      borderRadius: 999,
                      background:
                        "var(--gradient-color, linear-gradient(90deg, #CF372F 0%, #691C18 100%))",
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Register Now
                  </a>
                </p>
              ) : null}

              {event.description?.trim() ? (
                <p
                  style={{
                    fontSize: 18,
                    lineHeight: 1.6,
                    color: "rgba(0,0,0,0.6)",
                    marginBottom: 24,
                    whiteSpace: "pre-line",
                    fontStyle: "italic",
                  }}
                >
                  {event.description.trim()}
                </p>
              ) : null}

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
                <EventContent html={event.content} />
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

            <div style={{ width: 320, flexShrink: 0 }} className="events-detail-sidebar">
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
          .events-detail-banner { margin-bottom: 20px !important; max-height: none !important; border-radius: 10px !important; }
          .events-detail-banner-img {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 320px !important;
            object-fit: cover !important;
            object-position: center center !important;
          }
          .events-detail-sidebar { margin-top: 28px !important; }
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

