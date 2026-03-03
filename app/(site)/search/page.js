import SearchClient from "@/components/search/SearchClient";

export const metadata = {
  title: "Search",
  description: "Search pages and posts",
};

export default function SearchPage() {
  return (
    <main>
      <h1>Search</h1>
      <SearchClient />
    </main>
  );
}
