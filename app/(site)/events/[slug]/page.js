import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { getSiteUrl } from "@/lib/env";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventMeta from "@/components/events/EventMeta";
import EventContent from "@/components/events/EventContent";
import { getEventImageSources } from "@/components/events/eventDisplay";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const slug = params.slug;
  try {
    await connectDB();
    const event = await Event.findOne({ slug, status: "published" }).lean();
    if (!event) return {};
    const title = event.meta?.metaTitle || event.title;
    const description =
      event.meta?.metaDescription || event.description || undefined;
    const og = {
      title,
      description,
      url: `/events/${slug}`,
      type: "website",
    };
    const { desktop } = getEventImageSources(event);
    if (desktop) {
      og.images = [{ url: desktop, alt: title }];
    }
    return {
      title,
      description,
      alternates: { canonical: `/events/${slug}` },
      openGraph: og,
    };
  } catch {
    return {};
  }
}

function DetailSkeleton() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px" }}>
      <div
        style={{
          height: 280,
          background: "#f0f0f0",
          borderRadius: 12,
          marginBottom: 24,
        }}
      />
      <div
        style={{
          height: 36,
          width: "75%",
          background: "#f0f0f0",
          borderRadius: 4,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 16,
          width: "40%",
          background: "#f0f0f0",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

async function EventDetail({ slug }) {
  let event;
  try {
    await connectDB();
    event = await Event.findOne({ slug, status: "published" }).lean();
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
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    ...(event.description && { description: event.description }),
    url: `${siteUrl}/events/${slug}`,
    ...(desktop && {
      image: desktop.startsWith("http") ? desktop : `${siteUrl}${desktop}`,
    }),
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
            url: event.eventLink || `${siteUrl}/events/${slug}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
        <PageContainer className="pt-0" suppressHydrationWarning>
          <div style={{ display: "flex", gap: 40 }} suppressHydrationWarning>
            <article style={{ flex: 1, minWidth: 0 }}>
              {desktop ? (
                <figure
                  style={{
                    margin: "0 0 28px",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <picture>
                    {mobile && mobile !== desktop ? (
                      <source media="(max-width: 768px)" srcSet={mobile} />
                    ) : null}
                    <img
                      src={desktop}
                      alt={event.title}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                      loading="eager"
                    />
                  </picture>
                </figure>
              ) : null}

              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  margin: "0 0 16px 0",
                }}
              >
                {event.title}
              </h1>

              <EventMeta
                event={event}
                style={{ marginBottom: 20, fontSize: 15 }}
              />

              {regLink ? (
                <p style={{ margin: "0 0 24px 0" }}>
                  <a
                    href={regLink}
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      borderRadius: 999,
                      background: "var(--primary-color, #8b1a1a)",
                      color: "#fff",
                      fontWeight: 700,
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
                    color: "rgba(0,0,0,0.65)",
                    marginBottom: 28,
                    whiteSpace: "pre-line",
                  }}
                >
                  {event.description.trim()}
                </p>
              ) : null}

              <EventContent html={event.content} />

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
                  ← All events
                </Link>
              </p>
            </article>

            <div
              style={{ width: 320, flexShrink: 0 }}
              className="events-detail-sidebar-desktop"
            >
              <EventsSidebarFull currentSlug={slug} />
            </div>
          </div>

          <div
            className="events-detail-sidebar-mobile"
            style={{ display: "none" }}
          >
            <EventsSidebarFull currentSlug={slug} />
          </div>
        </PageContainer>
      </FullWidthBackground>

      <style>{`
        @media (max-width: 992px) {
          .events-detail-sidebar-desktop { display: none !important; }
          .events-detail-sidebar-mobile { display: block !important; margin-top: 40px; }
        }
        @media (max-width: 768px) {
          article h1 { font-size: 22px !important; }
        }
      `}</style>
    </>
  );
}

export default function EventDetailPage({ params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EventDetail slug={params.slug} />
    </Suspense>
  );
}
