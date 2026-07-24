import PageBuilderPage from "@/components/cms/PageBuilderPage";
import { getPageSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const BLOG_LISTING_PAGE_ID = "6a632315bdd91c81b0d3c446";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "blogs",
    fallbackTitle: "Blog",
    fallbackDescription: "Latest blog posts",
    fallbackCanonical: "/blog",
    fallbackOpenGraphUrl: "/blog",
  });
}

/** /blog is a dedicated route backed by the Blog Listing Page Builder page. */
export default function BlogListPage() {
  return (
    <main>
      <PageBuilderPage pageId={BLOG_LISTING_PAGE_ID} pathname="/blog" />
    </main>
  );
}
