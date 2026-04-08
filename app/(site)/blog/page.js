import Link from "next/link";
import nextDynamic from "next/dynamic";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogCategory from "@/models/BlogCategory";
import { getPageSeoMetadata } from "@/lib/seo";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";

const BlogSidebar = nextDynamic(() => import("@/components/blog/BlogSidebar"), {
  ssr: false,
});

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "blog",
    fallbackTitle: "Blog",
    fallbackDescription: "Latest blog posts",
    fallbackCanonical: "/blog",
    fallbackOpenGraphUrl: "/blog",
  });
}

const PAGE_SIZE = 6;

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month.toUpperCase()} ${day}, ${year}`;
}

export default async function BlogListPage({ searchParams }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const categorySlug = searchParams?.category || "";

  let items = [];
  let categories = [];
  let total = 0;

  try {
    await connectDB();
    categories = await BlogCategory.find().sort({ order: 1 }).lean();
    const filter = { status: "published" };
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) filter.category = cat._id;
    }
    total = await Blog.countDocuments(filter);
    items = await Blog.find(filter)
      .populate("category")
      .sort({ publishedAt: -1, updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();
  } catch {
    // leave items empty
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <FullWidthBackground className="customInnerHero">
      <PageContainer className="pt-0">
        {/* Category Tabs */}
        {/* {categories.length > 0 && (
          <nav
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <Link
              href="/blog"
              style={{
                padding: "8px 22px",
                borderRadius: 30,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                border: !categorySlug
                  ? "1px solid transparent"
                  : "1px solid rgba(0,0,0,0.12)",
                background: !categorySlug
                  ? "var(--primary-color, #8b1a1a)"
                  : "transparent",
                color: !categorySlug ? "#fff" : "#050505",
              }}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`/blog?category=${cat.slug}`}
                style={{
                  padding: "8px 22px",
                  borderRadius: 30,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  border:
                    categorySlug === cat.slug
                      ? "1px solid transparent"
                      : "1px solid rgba(0,0,0,0.12)",
                  background:
                    categorySlug === cat.slug
                      ? "var(--primary-color, #8b1a1a)"
                      : "transparent",
                  color: categorySlug === cat.slug ? "#fff" : "#050505",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )} */}

        {/* Two-column layout */}
        <div style={{ display: "flex", gap: 40 }}>
          {/* Left: Blog Posts */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {items.length === 0 && (
              <p
                style={{
                  color: "rgba(0,0,0,0.35)",
                  textAlign: "center",
                  padding: "60px 0",
                }}
              >
                No posts found.
              </p>
            )}

            {items.map((post) => (
              <article
                key={post._id.toString()}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 32,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {post.featuredImage && (
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      flexShrink: 0,
                      width: 380,
                      borderRadius: 10,
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    <img
                      loading="lazy"
                      src={post.featuredImage}
                      alt={post.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 240,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Link>
                )}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minWidth: 0,
                  }}
                >
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
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1.25,
                      marginBottom: 14,
                      margin: 0,
                    }}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: "rgba(0,0,0,0.55)",
                        marginBottom: 20,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.35)",
                      marginTop: "auto",
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      paddingTop: 14,
                    }}
                  >
                    <Link
                      href={`/blog/${post.slug}#comments`}
                      style={{
                        color: "rgba(0,0,0,0.35)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      💬 Leave a Comment
                    </Link>
                    <span
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      {post.publishedAt ? formatDate(post.publishedAt) : ""}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 40,
                }}
              >
                {page > 1 && (
                  <Link
                    href={`/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    Previous
                  </Link>
                )}
                <span
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    color: "rgba(0,0,0,0.45)",
                  }}
                >
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Right: Sidebar */}
          <div
            style={{ width: 320, flexShrink: 0 }}
            className="blog-sidebar-desktop"
          >
            <BlogSidebar />
          </div>
        </div>

        {/* Mobile sidebar (below content) */}
        <div className="blog-sidebar-mobile" style={{ display: "none" }}>
          <BlogSidebar />
        </div>

        <style>{`
        @media (max-width: 992px) {
          .blog-sidebar-desktop { display: none !important; }
          .blog-sidebar-mobile { display: block !important; margin-top: 40px; }
          article { flex-direction: column !important; gap: 20px !important; padding: 24px 0 !important; }
          article > a:first-child { width: 100% !important; }
          article img { min-height: 200px !important; max-height: 260px !important; }
          h2 { font-size: 20px !important; }
        }
      `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}
