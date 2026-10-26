import { cache } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import {
  buildCanonicalUrl,
  getGlobalFallbackImageFromTheme,
  resolveShareMetadata,
  toAbsoluteUrl,
} from "@/helpers/socialShare";
import Blog from "@/models/Blog";
import ThemeConfig from "@/models/ThemeConfig";
import { extractGlobalSeoFromTheme, parseMetaKeywords } from "@/lib/seo";
import { getBlogImageSources } from "@/components/blog/blogDisplay";
import PageBuilderPage from "@/components/cms/PageBuilderPage";
import { serializeJsonLd } from "@/lib/security/jsonLd";

export const revalidate = 60;

const BLOG_DETAILS_PAGE_ID = "6a632522bdd91c81b0d3c960";

const getPublishedPostBySlug = cache(async (slug) => {
  await connectDB();
  return Blog.findOne({ slug, status: "published" }).populate("category").lean();
});

const getThemeForBlogDetail = cache(async () => {
  await connectDB();
  return ThemeConfig.findOne({
    $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
  })
    .sort({ updatedAt: -1 })
    .select(
      "logoLightUrl logoImageUrl logoMobileUrl logoDarkUrl faviconUrl seoImage ogImage socialShareImage defaultMetaTitle defaultMetaDescription defaultMetaKeywords defaultMetaImage",
    )
    .lean();
});

function getBlogShareMeta(post, themeDoc, slug) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = buildCanonicalUrl(siteUrl, `/blog/${slug}`);
  const globalSeo = extractGlobalSeoFromTheme(themeDoc);
  const globalFallbackImage = toAbsoluteUrl(getGlobalFallbackImageFromTheme(themeDoc), siteUrl);
  const metaTitle = String(post?.meta?.metaTitle || "").trim();
  const metaDescription = String(post?.meta?.metaDescription || "").trim();
  const title = String(post?.title || "").trim();
  const { desktop, mobile } = getBlogImageSources(post || {});
  const resolved = resolveShareMetadata({
    canonicalUrl,
    title,
    metaTitle,
    description: post?.description,
    metaDescription,
    shortDescription: post?.shortDescription,
    excerpt: post?.excerpt,
    featuredImageDesktop: desktop,
    featuredImage: desktop,
    featuredImageMobile: mobile,
    seoImage: post?.seoImage,
    globalFallbackImage,
  });
  return {
    canonicalUrl,
    title: metaTitle || globalSeo.title || resolved.title || title,
    description: metaDescription || globalSeo.description || resolved.description || "",
    image: toAbsoluteUrl(resolved.image || globalSeo.image, siteUrl),
    keywords: parseMetaKeywords(post?.meta?.metaKeywords) || globalSeo.keywords,
  };
}

export async function generateMetadata({ params }) {
  try {
    const [post, themeDoc] = await Promise.all([
      getPublishedPostBySlug(params.slug),
      getThemeForBlogDetail(),
    ]);
    if (!post) return {};
    const share = getBlogShareMeta(post, themeDoc, params.slug);
    return {
      title: share.title,
      description: share.description,
      ...(share.keywords?.length ? { keywords: share.keywords } : {}),
      alternates: { canonical: `/blog/${params.slug}` },
      openGraph: {
        title: share.title,
        description: share.description,
        url: share.canonicalUrl,
        type: "article",
        ...(post.publishedAt ? { publishedTime: new Date(post.publishedAt).toISOString() } : {}),
        ...(post.author ? { authors: [post.author] } : {}),
        ...(share.image ? { images: [{ url: share.image, alt: share.title }] } : {}),
      },
      twitter: {
        card: share.image ? "summary_large_image" : "summary",
        title: share.title,
        description: share.description,
        ...(share.image ? { images: [share.image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

/** /blog/[slug] uses the Blog Details Page Builder page as its template. */
export default async function BlogPostPage({ params }) {
  const post = await getPublishedPostBySlug(params.slug).catch(() => null);
  if (!post) notFound();

  const themeDoc = await getThemeForBlogDetail().catch(() => null);
  const share = getBlogShareMeta(post, themeDoc, params.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(share.description ? { description: share.description } : {}),
    url: share.canonicalUrl,
    ...(share.image ? { image: share.image } : {}),
    ...(post.publishedAt ? { datePublished: new Date(post.publishedAt).toISOString() } : {}),
    dateModified: new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString(),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
    ...(post.category?.name ? { articleSection: post.category.name } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <main>
        <PageBuilderPage
          pageId={BLOG_DETAILS_PAGE_ID}
          pathname={`/blog/${params.slug}`}
          emitBreadcrumbs={false}
        />
      </main>
    </>
  );
}
