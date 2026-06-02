import Link from "next/link";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { getPageSeoMetadata } from "@/lib/seo";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventList from "@/components/events/EventList";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

const getEventsListingData = unstable_cache(
  async (page, sortMode, q) => {
    await connectDB();
    const filter = { status: "published" };
    if (q) {
      const query = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ];
    }
    const sort =
      sortMode === "recent"
        ? { updatedAt: -1, startDate: -1 }
        : { startDate: 1, updatedAt: -1 };

    const [total, items] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort(sort)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    return { total, items };
  },
  ["events-listing-page-data"],
  { revalidate: 60, tags: ["events"] },
);

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "events",
    fallbackTitle: "Events",
    fallbackDescription: "Upcoming and recent events",
    fallbackCanonical: "/events",
    fallbackOpenGraphUrl: "/events",
  });
}

export default async function EventsListPage({ searchParams }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const sortMode = searchParams?.sort === "recent" ? "recent" : "upcoming";
  const q = (searchParams?.q || "").trim();

  let items = [];
  let total = 0;

  try {
    const data = await getEventsListingData(page, sortMode, q);
    items = data.items || [];
    total = data.total || 0;
  } catch {
    // leave empty
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const list = JSON.parse(JSON.stringify(items));

  return (
    <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
      <PageContainer className="pt-0" suppressHydrationWarning>
        <div className="events-layout" style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <EventList items={list} />
            {totalPages > 1 && (
              <nav
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 32,
                  flexWrap: "wrap",
                }}
              >
                {page > 1 && (
                  <Link
                    href={`/events?page=${page - 1}&sort=${sortMode}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      color: "rgba(0,0,0,0.65)",
                      background: "#fff",
                    }}
                  >
                    Previous
                  </Link>
                )}
                <span
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    color: "rgba(0,0,0,0.45)",
                  }}
                >
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/events?page=${page + 1}&sort=${sortMode}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      color: "rgba(0,0,0,0.65)",
                      background: "#fff",
                    }}
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div style={{ width: 320, flexShrink: 0 }} className="events-sidebar">
            <EventsSidebarFull searchQuery={q} />
          </div>
        </div>

        <style>{`
          @media (max-width: 992px) {
            .events-layout { flex-direction: column !important; gap: 0 !important; }
            .events-sidebar { width: 100% !important; margin-top: 40px; }
          }
        `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}
