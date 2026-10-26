import { cache } from "react";
import { notFound } from "next/navigation";
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
import {
  extractGlobalSeoFromTheme,
  parseMetaKeywords,
} from "@/lib/seo";
import { getEventImageSources } from "@/components/events/eventDisplay";
import PageBuilderPage from "@/components/cms/PageBuilderPage";
import { serializeJsonLd } from "@/lib/security/jsonLd";

export const revalidate = 60;

const EVENT_DETAILS_PAGE_ID = "6a607fd6c6f74b41ae902782";

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
  const title = String(event?.title || "").trim();
  const { desktop, mobile } = getEventImageSources(event || {});
  const resolved = resolveShareMetadata({
    canonicalUrl,
    title,
    metaTitle,
    description: event?.description,
    metaDescription,
    featuredImageDesktop: event?.featuredImageDesktop || desktop,
    featuredImageMobile: event?.featuredImageMobile || mobile,
    globalFallbackImage,
  });

  return {
    canonicalUrl,
    title: metaTitle || globalSeo.title || resolved.title || title,
    description:
      metaDescription || globalSeo.description || resolved.description || "",
    image: toAbsoluteUrl(resolved.image || globalSeo.image, siteUrl),
    keywords:
      parseMetaKeywords(event?.meta?.metaKeywords) || globalSeo.keywords,
  };
}

export async function generateMetadata({ params }) {
  try {
    const [event, themeDoc] = await Promise.all([
      getPublishedEventBySlug(params.slug),
      getThemeForEventDetail(),
    ]);
    if (!event) return {};
    const share = getEventShareMeta(event, themeDoc, params.slug);
    return {
      title: share.title,
      description: share.description,
      ...(share.keywords?.length ? { keywords: share.keywords } : {}),
      alternates: { canonical: `/events/${params.slug}` },
      openGraph: {
        title: share.title,
        description: share.description,
        url: share.canonicalUrl,
        type: "website",
        ...(share.image ? { images: [{ url: share.image, alt: share.title }] } : {}),
      },
      twitter: {
        card: share.image ? "summary_large_image" : "summary",
        title: share.title,
        description: share.description,
        ...(share.image ? { images: [share.image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

/** /events/[slug] uses the Event Details Page Builder page as its template. */
export default async function EventDetailPage({ params }) {
  const event = await getPublishedEventBySlug(params.slug).catch(() => null);
  if (!event) notFound();

  const themeDoc = await getThemeForEventDetail().catch(() => null);
  const share = getEventShareMeta(event, themeDoc, params.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    ...(share.description ? { description: share.description } : {}),
    url: share.canonicalUrl,
    ...(share.image ? { image: share.image } : {}),
    ...(event.startDate
      ? { startDate: new Date(event.startDate).toISOString() }
      : {}),
    ...(event.endDate
      ? { endDate: new Date(event.endDate).toISOString() }
      : {}),
    eventAttendanceMode: event.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(event.isOnline
      ? {
          location: {
            "@type": "VirtualLocation",
            url: event.eventLink || share.canonicalUrl,
          },
        }
      : event.location
        ? { location: { "@type": "Place", name: event.location } }
        : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main>
        <PageBuilderPage
          pageId={EVENT_DETAILS_PAGE_ID}
          pathname={`/events/${params.slug}`}
          emitBreadcrumbs={false}
        />
      </main>
    </>
  );
}
