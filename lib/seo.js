import { connectDB } from "@/lib/db";
import Page from "@/models/Page";

/**
 * Build SEO metadata for a page slug from CMS data with safe fallback defaults.
 */
export async function getPageSeoMetadata({
  slug,
  fallbackTitle,
  fallbackDescription,
  fallbackCanonical,
  fallbackOpenGraphUrl,
}) {
  const fallback = {
    title: fallbackTitle,
    description: fallbackDescription,
    alternates: { canonical: fallbackCanonical },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      url: fallbackOpenGraphUrl,
      type: "website",
    },
  };

  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" }).lean();
    if (!page) return fallback;

    const title = page.meta?.metaTitle || page.title || fallbackTitle;
    const description = page.meta?.metaDescription || fallbackDescription;
    return {
      title,
      description,
      alternates: { canonical: fallbackCanonical },
      openGraph: {
        title,
        description,
        url: fallbackOpenGraphUrl,
        type: "website",
      },
    };
  } catch {
    return fallback;
  }
}
