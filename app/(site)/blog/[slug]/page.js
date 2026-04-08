import { Suspense } from "react";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
import Blog from "@/models/Blog";
import SafeHtml from "@/components/cms/SafeHtml";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";

const BlogSidebarFull = nextDynamic(() => import("@/components/blog/BlogSidebarFull"), { ssr: false });
const BlogComments = nextDynamic(
  () => import("@/components/blog/BlogComments"),
  { ssr: false },
);

export async function generateMetadata({ params }) {
  const slug = params.slug;
  try {
    await connectDB();
    const post = await Blog.findOne({ slug, status: "published" }).lean();
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

function PostSkeleton() {
  return (
    <div
      style={{
        maxWidth: "var(--layout-width, 1400px)",
        width: "90%",
        margin: "0 auto",
        padding: "40px 0",
      }}
    >
      <div
        style={{
          height: 14,
          width: "15%",
          background: "#f0f0f0",
          marginBottom: 12,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 36,
          width: "70%",
          background: "#f0f0f0",
          marginBottom: 16,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 14,
          width: "25%",
          background: "#f0f0f0",
          marginBottom: 28,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 300,
          width: "100%",
          background: "#f0f0f0",
          marginBottom: 28,
          borderRadius: 12,
        }}
      />
      <div
        style={{
          height: 16,
          width: "100%",
          background: "#f0f0f0",
          marginBottom: 10,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 16,
          width: "95%",
          background: "#f0f0f0",
          marginBottom: 10,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: 16,
          width: "85%",
          background: "#f0f0f0",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

async function PostContent({ slug }) {
  let post;
  try {
    await connectDB();
    post = await Blog.findOne({ slug, status: "published" })
      .populate("category")
      .lean();
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

      <FullWidthBackground className="customInnerHero">
        <PageContainer className="pt-0">
          <div style={{ display: "flex", gap: 40 }}>
            {/* Left: Article */}
            <article style={{ flex: 1, minWidth: 0 }}>
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

              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                {post.title}
              </h1>

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
                  style={{
                    margin: "0 0 28px",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <picture>
                    {post.featuredImageMobile && (
                      <source media="(max-width: 768px)" srcSet={post.featuredImageMobile} />
                    )}
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      style={{ width: "100%", height: "auto", display: "block" }}
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

              <BlogComments slug={slug} />
            </article>

            {/* Right: Sidebar (desktop) */}
            <div
              style={{ width: 320, flexShrink: 0 }}
              className="blog-detail-sidebar-desktop"
            >
              <BlogSidebarFull currentSlug={slug} />
            </div>
          </div>

          {/* Mobile sidebar */}
          <div
            className="blog-detail-sidebar-mobile"
            style={{ display: "none" }}
          >
            <BlogSidebarFull currentSlug={slug} />
          </div>
        </PageContainer>
      </FullWidthBackground>

      <style>{`
        @media (max-width: 992px) {
          .blog-detail-sidebar-desktop { display: none !important; }
          .blog-detail-sidebar-mobile { display: block !important; margin-top: 40px; }
        }
        @media (max-width: 768px) {
          article h1 { font-size: 22px !important; }
          article figure { margin-bottom: 20px !important; }
          article figure img { border-radius: 8px !important; }
        }
        @media (max-width: 480px) {
          article h1 { font-size: 20px !important; }
          article > div { font-size: 15px !important; }
        }
      `}</style>
    </>
  );
}

export default function BlogPostPage({ params }) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent slug={params.slug} />
    </Suspense>
  );
}
