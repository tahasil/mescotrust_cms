import { performUnifiedSearch } from "@/lib/search/unifiedSearch";
import SearchResultsClient from "@/components/search/SearchResultsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const query = searchParams?.q ? String(searchParams.q).trim() : "";
  return {
    title: query ? `Search: "${query}" | MESCO Trust` : "Site Search | MESCO Trust",
    description:
      "Search across all MESCO Trust pages, events, blogs, news, and annual reports.",
  };
}

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q ? String(searchParams.q).trim() : "";
  const type = searchParams?.type ? String(searchParams.type).trim() : "all";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  let initialData = {
    items: [],
    total: 0,
    page: 1,
    totalPages: 0,
    counts: { all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 },
    query: q,
  };

  if (q.length >= 2) {
    try {
      initialData = await performUnifiedSearch({
        query: q,
        type,
        page,
        limit: 20,
      });
    } catch (err) {
      console.error("[search-page] initial search failed:", err);
    }
  }

  return (
    <main>
      <SearchResultsClient
        initialData={initialData}
        initialQuery={q}
        initialType={type}
      />
    </main>
  );
}
