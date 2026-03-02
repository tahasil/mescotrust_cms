import SearchClient from "@/components/search/SearchClient";

export const metadata = {
  title: "Search",
  description: "Search pages and posts",
};

export default function SearchPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Search</h1>
      <SearchClient />
    </main>
  );
}
