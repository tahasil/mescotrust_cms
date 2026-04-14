import Link from "next/link";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { getPageSeoMetadata } from "@/lib/seo";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventList from "@/components/events/EventList";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

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
    await connectDB();
    const filter = { status: "published" };
    if (q) {
      filter.$or = [
        {
          title: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        {
          description: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
      ];
    }
    const sort =
      sortMode === "recent"
        ? { updatedAt: -1, startDate: -1 }
        : { startDate: 1, updatedAt: -1 };

    total = await Event.countDocuments(filter);
    items = await Event.find(filter)
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();
  } catch {
    // leave empty
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const list = JSON.parse(JSON.stringify(items));

  const sortLink = (nextSort) => {
    const params = new URLSearchParams();
    if (nextSort !== "upcoming") params.set("sort", nextSort);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/events?${qs}` : "/events";
  };

  return (
    <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
      <PageContainer className="pt-0" suppressHydrationWarning>
        <div style={{ display: "flex", gap: 40 }}>
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

          <div
            style={{ width: 320, flexShrink: 0 }}
            className="events-sidebar-desktop"
          >
            <EventsSidebarFull searchQuery={q} />
          </div>
        </div>

        <div className="events-sidebar-mobile" style={{ display: "none" }}>
          <EventsSidebarFull searchQuery={q} />
        </div>

        <style>{`
          @media (max-width: 992px) {
            .events-sidebar-desktop { display: none !important; }
            .events-sidebar-mobile { display: block !important; margin-top: 40px; }
          }
        `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}
