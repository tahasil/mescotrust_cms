import Link from "next/link";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { getPageSeoMetadata } from "@/lib/seo";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";
import EventList from "@/components/events/EventList";
import EventsSidebarFull from "@/components/events/EventsSidebarFull";

export const dynamic = "force-dynamic";

const ACTIVE_PAGE_SIZE = 9;
const PAST_PAGE_SIZE = 6;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStartOfTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function buildSearchCondition(q) {
  if (!q) return null;
  const query = escapeRegex(q);
  return {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  };
}

function buildActiveDateCondition(todayStart) {
  return {
    $or: [
      { endDate: { $gte: todayStart } },
      { endDate: null, startDate: { $gte: todayStart } },
      { endDate: null, startDate: null },
    ],
  };
}

function buildPastDateCondition(todayStart) {
  return {
    $or: [
      { endDate: { $lt: todayStart } },
      { endDate: null, startDate: { $lt: todayStart } },
    ],
  };
}

function buildFilter({ q, todayStart, visibility }) {
  const andConditions = [{ status: "published" }];
  const searchCondition = buildSearchCondition(q);
  if (searchCondition) andConditions.push(searchCondition);
  if (visibility === "active") {
    andConditions.push(buildActiveDateCondition(todayStart));
  } else if (visibility === "past") {
    andConditions.push(buildPastDateCondition(todayStart));
  }
  return andConditions.length === 1
    ? andConditions[0]
    : { $and: andConditions };
}

function buildEventsHref({ page, pastPage, sortMode, q }) {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, page || 1)));
  params.set("pastPage", String(Math.max(1, pastPage || 1)));
  params.set("sort", sortMode === "recent" ? "recent" : "upcoming");
  if (q) params.set("q", q);
  return `/events?${params.toString()}`;
}

const getEventsListingData = unstable_cache(
  async (activePage, pastPage, sortMode, q) => {
    await connectDB();
    const todayStart = getStartOfTodayUtc();
    const activeFilter = buildFilter({ q, todayStart, visibility: "active" });
    const pastFilter = buildFilter({ q, todayStart, visibility: "past" });
    const activeSort =
      sortMode === "recent"
        ? { updatedAt: -1, startDate: -1 }
        : { startDate: 1, endDate: 1, updatedAt: -1 };
    const pastSort = { endDate: -1, startDate: -1, updatedAt: -1 };

    const [activeTotal, activeItems, pastTotal, pastItems] = await Promise.all([
      Event.countDocuments(activeFilter),
      Event.find(activeFilter)
        .sort(activeSort)
        .skip((activePage - 1) * ACTIVE_PAGE_SIZE)
        .limit(ACTIVE_PAGE_SIZE)
        .lean(),
      Event.countDocuments(pastFilter),
      Event.find(pastFilter)
        .sort(pastSort)
        .skip((pastPage - 1) * PAST_PAGE_SIZE)
        .limit(PAST_PAGE_SIZE)
        .lean(),
    ]);

    return {
      activeTotal,
      activeItems,
      pastTotal,
      pastItems,
    };
  },
  ["events-listing-page-data"],
  { revalidate: 60 },
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
  const pastPage = Math.max(1, Number(searchParams?.pastPage) || 1);
  const sortMode = searchParams?.sort === "recent" ? "recent" : "upcoming";
  const q = (searchParams?.q || "").trim();

  let activeItems = [];
  let activeTotal = 0;
  let pastItems = [];
  let pastTotal = 0;

  try {
    const data = await getEventsListingData(page, pastPage, sortMode, q);
    activeItems = data.activeItems || [];
    activeTotal = data.activeTotal || 0;
    pastItems = data.pastItems || [];
    pastTotal = data.pastTotal || 0;
  } catch {
    // leave empty
  }

  const activeTotalPages = Math.ceil(activeTotal / ACTIVE_PAGE_SIZE);
  const pastTotalPages = Math.ceil(pastTotal / PAST_PAGE_SIZE);
  const activeList = JSON.parse(JSON.stringify(activeItems));
  const pastList = JSON.parse(JSON.stringify(pastItems));

  return (
    <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
      <PageContainer className="pt-0" suppressHydrationWarning>
        <div className="events-layout" style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <EventList items={activeList} />
            {activeTotalPages > 1 && (
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
                    href={buildEventsHref({
                      page: page - 1,
                      pastPage,
                      sortMode,
                      q,
                    })}
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
                  Page {page} of {activeTotalPages}
                </span>
                {page < activeTotalPages && (
                  <Link
                    href={buildEventsHref({
                      page: page + 1,
                      pastPage,
                      sortMode,
                      q,
                    })}
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

            <section
              style={{
                marginTop: 64,
                paddingTop: 36,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 22,
                  lineHeight: 1.25,
                  fontWeight: 700,
                }}
              >
                Past Events
              </h3>
              <p
                style={{
                  margin: "0 0 18px 0",
                  color: "rgba(0,0,0,0.55)",
                  fontSize: 14,
                }}
              >
                Recently concluded events are available below.
              </p>
              {pastList.length > 0 ? (
                <EventList items={pastList} />
              ) : (
                <p
                  style={{
                    color: "rgba(0,0,0,0.35)",
                    textAlign: "center",
                    padding: "30px 0",
                  }}
                >
                  No past events found.
                </p>
              )}

              {pastTotalPages > 1 && (
                <nav
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginTop: 24,
                    flexWrap: "wrap",
                  }}
                >
                  {pastPage > 1 && (
                    <Link
                      href={buildEventsHref({
                        page,
                        pastPage: pastPage - 1,
                        sortMode,
                        q,
                      })}
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
                    Page {pastPage} of {pastTotalPages}
                  </span>
                  {pastPage < pastTotalPages && (
                    <Link
                      href={buildEventsHref({
                        page,
                        pastPage: pastPage + 1,
                        sortMode,
                        q,
                      })}
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
            </section>
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
