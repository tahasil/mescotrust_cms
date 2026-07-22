import PageBuilderPage from "@/components/cms/PageBuilderPage";
import { getPageSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const EVENTS_LISTING_PAGE_ID = "6a607b24c6f74b41ae90195d";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "event-list",
    fallbackTitle: "Events",
    fallbackDescription: "Upcoming and recent events",
    fallbackCanonical: "/events",
    fallbackOpenGraphUrl: "/events",
  });
}

/** /events is a dedicated route backed by the Events Listing Page Builder page. */
export default function EventsPage() {
  return (
    <main>
      <PageBuilderPage
        pageId={EVENTS_LISTING_PAGE_ID}
        pathname="/events"
      />
    </main>
  );
}
