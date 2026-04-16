import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 60;
import Blog from "@/models/Blog";
import ThemeConfig from "@/models/ThemeConfig";
import SafeHtml from "@/components/cms/SafeHtml";
import { FullWidthBackground, MainTitle, PageContainer } from "@/styles/Theme";

import BlogSidebarFull from "@/components/blog/BlogSidebarFull";
const BlogComments = nextDynamic(
  () => import("@/components/blog/BlogComments"),
  { ssr: false },
);

const getPublishedPostBySlug = cache(async (slug) => {
  await connectDB();
  return Blog.findOne({ slug, status: "published" }).populate("category").lean();
});

export async function generateMetadata({ params }) {
  const slug = params.slug;
  try {
    const post = await getPublishedPostBySlug(slug);
    if (!post) return {};
    const title = post.meta?.metaTitle || post.title;
    const description = post.meta?.metaDescription || post.excerpt || undefined;
    const og = {
      title,
      description,
      url: `/blog/${slug}`,
      type: "article",
      ...(post.publishedAt && {
        publishedTime: new Date(post.publishedAt).toISOString(),
      }),
      ...(post.author && { authors: [post.author] }),
    };
    if (post.featuredImage) {
      og.images = [{ url: post.featuredImage, alt: title }];
    }
    return {
      title,
      description,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: og,
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
  try {
    await connectDB();
    const [postDoc, themeDoc] = await Promise.all([
      getPublishedPostBySlug(slug),
      ThemeConfig.findOne({
        $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
      })
        .sort({ updatedAt: -1 })
        .select("blogCommentsEnabled")
        .lean(),
    ]);
    post = postDoc;
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

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    url: `${siteUrl}/blog/${slug}`,
    ...(post.featuredImage && {
      image: post.featuredImage.startsWith("http")
        ? post.featuredImage
        : `${siteUrl}${post.featuredImage}`,
    }),
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
            {/* Left: Article */}
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                  fontSize: 14,
                  color: "rgba(0,0,0,0.45)",
                }}
              >
                {post.publishedAt && (
                  <span>📅 {formatDate(post.publishedAt)}</span>
                )}
                {post.author && <span>By {post.author}</span>}
              </div>

              {post.featuredImage && (
                <figure
                  className="blog-detail-banner"
                  style={{
                    margin: "0 0 28px",
                    borderRadius: 12,
                    overflow: "hidden",
                    maxHeight: 400,
                  }}
                >
                  <picture style={{ display: "block", textAlign: "left" }}>
                    {post.featuredImageMobile && (
                      <source
                        media="(max-width: 768px)"
                        srcSet={post.featuredImageMobile}
                      />
                    )}
                    <img
                      className="blog-detail-banner-img"
                      src={post.featuredImage}
                      alt={post.title}
                      style={{
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: 400,
                        objectFit: "contain",
                        objectPosition: "left top",
                        display: "block",
                        margin: 0,
                      }}
                      loading="lazy"
                    />
                  </picture>
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

            {/* Right: Sidebar (desktop) */}
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
