import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { cache } from "react";
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
import SafeHtml from "@/components/cms/SafeHtml";
import { FullWidthBackground, MainTitle, PageContainer } from "@/styles/Theme";
import BlogSidebarFull from "@/components/blog/BlogSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import SocialShare from "@/components/common/SocialShare";
import { getBlogImageSources } from "@/components/blog/blogDisplay";

export const revalidate = 60;

const BlogComments = nextDynamic(
  () => import("@/components/blog/BlogComments"),
  { ssr: false },
);

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
      "blogCommentsEnabled logoLightUrl logoImageUrl logoMobileUrl logoDarkUrl faviconUrl seoImage ogImage socialShareImage defaultMetaTitle defaultMetaDescription defaultMetaKeywords defaultMetaImage",
    )
    .lean();
});

function getBlogShareMeta(post, themeDoc, slug) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = buildCanonicalUrl(siteUrl, `/blog/${slug}`);
  const globalSeo = extractGlobalSeoFromTheme(themeDoc);
  const globalFallbackImage = toAbsoluteUrl(
    getGlobalFallbackImageFromTheme(themeDoc),
    siteUrl,
  );
  const metaTitle = String(post?.meta?.metaTitle || "").trim();
  const metaDescription = String(post?.meta?.metaDescription || "").trim();
  const titleFromContent = String(post?.title || "").trim();
  const { desktop, mobile } = getBlogImageSources(post || {});

  const shareMeta = resolveShareMetadata({
    canonicalUrl,
    title: titleFromContent,
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
    title: metaTitle || globalSeo.title || shareMeta.title || titleFromContent,
    description: metaDescription || globalSeo.description || shareMeta.description || "",
    image: toAbsoluteUrl(shareMeta.image || globalSeo.image, siteUrl),
    keywords: parseMetaKeywords(post?.meta?.metaKeywords) || globalSeo.keywords,
  };
}

export async function generateMetadata({ params }) {
  const slug = params.slug;

  try {
    const [post, themeDoc] = await Promise.all([
      getPublishedPostBySlug(slug),
      getThemeForBlogDetail(),
    ]);

    if (!post) return {};

    const shareMeta = getBlogShareMeta(post, themeDoc, slug);

    const openGraph = {
      title: shareMeta.title,
      description: shareMeta.description,
      url: shareMeta.canonicalUrl,
      type: "article",
      ...(post.publishedAt && {
        publishedTime: new Date(post.publishedAt).toISOString(),
      }),
      ...(post.author ? { authors: [post.author] } : {}),
      ...(shareMeta.image
        ? {
            images: [{
              url: shareMeta.image,
              alt: shareMeta.title,
            }],
          }
        : {}),
    };

    return {
      title: shareMeta.title,
      description: shareMeta.description,
      ...(shareMeta.keywords?.length ? { keywords: shareMeta.keywords } : {}),
      alternates: { canonical: `/blog/${slug}` },
      openGraph,
      twitter: {
        card: shareMeta.image ? "summary_large_image" : "summary",
        title: shareMeta.title,
        description: shareMeta.description,
        ...(shareMeta.image ? { images: [shareMeta.image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

async function PostContent({ slug }) {
  let post;
  let commentsEnabled = true;
  let themeDoc;

  try {
    const [postDoc, themeConfigDoc] = await Promise.all([
      getPublishedPostBySlug(slug),
      getThemeForBlogDetail(),
    ]);

    post = postDoc;
    themeDoc = themeConfigDoc;

    if (themeDoc && typeof themeDoc.blogCommentsEnabled === "boolean") {
      commentsEnabled = themeDoc.blogCommentsEnabled;
    }
  } catch {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <h2>Service temporarily unavailable</h2>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
      </div>
    );
  }

  if (!post) notFound();

  const { desktop, mobile } = getBlogImageSources(post);
  const shareMeta = getBlogShareMeta(post, themeDoc, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(shareMeta.description && { description: shareMeta.description }),
    url: shareMeta.canonicalUrl,
    ...(shareMeta.image && { image: shareMeta.image }),
    ...(post.publishedAt && {
      datePublished: new Date(post.publishedAt).toISOString(),
    }),
    dateModified: new Date(
      post.updatedAt || post.publishedAt || Date.now(),
    ).toISOString(),
    ...(post.author && { author: { "@type": "Person", name: post.author } }),
    ...(post.category?.name && { articleSection: post.category.name }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
        <PageContainer className="pt-0" suppressHydrationWarning>
          <div
            className="blog-detail-layout"
            style={{ display: "flex", gap: 40 }}
            suppressHydrationWarning
          >
            <article className="blog-detail-article" style={{ flex: 1, minWidth: 0 }}>
              {post.category?.name && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                    color: "var(--primary-color, #8b1a1a)",
                  }}
                >
                  {post.category.name}
                </div>
              )}

              <MainTitle className="blog-detail-title" fontSize={24} fontWeight={600} lineHeight={30}>
                {post.title}
              </MainTitle>

              <div
                className="blog-detail-meta-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    fontSize: 14,
                    color: "rgba(0,0,0,0.45)",
                    flexWrap: "wrap",
                  }}
                >
                  {post.publishedAt && (
                    <span>Published: {formatDate(post.publishedAt)}</span>
                  )}
                  {post.author && <span>By {post.author}</span>}
                </div>

                <SocialShare
                  canonicalUrl={shareMeta.canonicalUrl}
                  title={shareMeta.title}
                  description={shareMeta.description}
                  image={shareMeta.image}
                />
              </div>

              {desktop && (
                <figure
                  className="blog-detail-banner"
                  style={{
                    margin: "0 0 28px",
                    borderRadius: 12,
                    overflow: "hidden",
                    maxHeight: 400,
                  }}
                >
                  <MediaImage
                    src={desktop}
                    mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                    alt={post.title}
                    imgClassName="blog-detail-banner-img"
                    width={1440}
                    height={810}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 860px"
                    imgStyle={{
                      width: "auto",
                      maxWidth: "100%",
                      height: "auto",
                      maxHeight: 400,
                      objectFit: "contain",
                      objectPosition: "left top",
                      display: "block",
                      margin: 0,
                    }}
                  />
                </figure>
              )}

              {post.excerpt && (
                <p
                  style={{
                    fontSize: 18,
                    lineHeight: 1.6,
                    color: "rgba(0,0,0,0.6)",
                    marginBottom: 24,
                    fontStyle: "italic",
                  }}
                >
                  {post.excerpt}
                </p>
              )}

              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "rgba(0,0,0,0.75)",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <SafeHtml html={post.content} />
              </div>

              {post.tags?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 14px",
                        borderRadius: 20,
                        background: "rgba(0,0,0,0.04)",
                        fontSize: 13,
                        color: "rgba(0,0,0,0.55)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {commentsEnabled && <BlogComments slug={slug} />}
            </article>

            <div style={{ width: 320, flexShrink: 0 }} className="blog-detail-sidebar">
              <BlogSidebarFull currentSlug={slug} commentsEnabled={commentsEnabled} />
            </div>
          </div>
        </PageContainer>
      </FullWidthBackground>

      <style>{`
        @media (max-width: 1200px) {
          .blog-detail-layout { gap: 28px !important; }
        }
        @media (max-width: 992px) {
          .blog-detail-layout { gap: 24px !important; flex-direction: column !important; }
          .blog-detail-sidebar { width: 100% !important; margin-top: 40px; }
        }
        @media (max-width: 768px) {
          .blog-detail-title { font-size: 24px !important; line-height: 1.3 !important; }
          .blog-detail-meta-row { align-items: stretch !important; }
          .blog-detail-banner { margin-bottom: 20px !important; max-height: none !important; border-radius: 10px !important; }
          .blog-detail-banner-img {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 320px !important;
            object-fit: cover !important;
            object-position: center center !important;
            border-radius: 8px !important;
          }
          .blog-detail-sidebar { margin-top: 28px !important; }
        }
        @media (max-width: 480px) {
          .blog-detail-title { font-size: 20px !important; }
          .blog-detail-article { font-size: 15px; }
        }
      `}</style>
    </>
  );
}

export default function BlogPostPage({ params }) {
  return <PostContent slug={params.slug} />;
}

