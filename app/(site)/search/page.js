import SearchClient from "@/components/search/SearchClient";
import { getPageSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "search",
    fallbackTitle: "Search",
    fallbackDescription: "Search pages and posts",
    fallbackCanonical: "/search",
    fallbackOpenGraphUrl: "/search",
  });
}

export default function SearchPage() {
  return (
    <main>
      <h1>Search</h1>
      <SearchClient />
    </main>
  );
}
