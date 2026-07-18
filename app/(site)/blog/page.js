import Link from "next/link";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogCategory from "@/models/BlogCategory";
import ThemeConfig from "@/models/ThemeConfig";
import { getPageSeoMetadata } from "@/lib/seo";
import { FullWidthBackground, MainTitle, PageContainer } from "@/styles/Theme";
import BlogSidebarFull from "@/components/blog/BlogSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import { getBlogImageSources } from "@/components/blog/blogDisplay";

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

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getBlogListingData = unstable_cache(
  async (page, categorySlug, searchQuery) => {
    await connectDB();
    const [themeDoc, categories] = await Promise.all([
      ThemeConfig.findOne({
        $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
      })
        .sort({ updatedAt: -1 })
        .select("blogCommentsEnabled")
        .lean(),
      BlogCategory.find().sort({ order: 1 }).lean(),
    ]);

    const filter = { status: "published" };
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) filter.category = cat._id;
    }
    if (searchQuery) {
      const q = escapeRegex(searchQuery);
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
      ];
    }

    const [total, items] = await Promise.all([
      Blog.countDocuments(filter),
      Blog.find(filter)
        .populate("category")
        .sort({ publishedAt: -1, updatedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    return {
      items,
      categories,
      total,
      commentsEnabled:
        typeof themeDoc?.blogCommentsEnabled === "boolean"
          ? themeDoc.blogCommentsEnabled
          : true,
    };
  },
  ["blog-listing-page-data"],
  { revalidate: 60 },
);

export default async function BlogListPage({ searchParams }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const categorySlug = searchParams?.category || "";
  const searchQuery = (searchParams?.q || "").trim();

  let items = [];
  let categories = [];
  let total = 0;
  let commentsEnabled = true;

  try {
    const data = await getBlogListingData(page, categorySlug, searchQuery);
    items = data.items || [];
    categories = data.categories || [];
    total = data.total || 0;
    commentsEnabled = data.commentsEnabled !== false;
  } catch {
    // leave items empty
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <FullWidthBackground className="customInnerHero" suppressHydrationWarning>
      <PageContainer className="pt-0" suppressHydrationWarning>
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
                color: !categorySlug ? "#fff" : "#2A283E",
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
                  color: categorySlug === cat.slug ? "#fff" : "#2A283E",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )} */}

        {/* Two-column layout */}
        <div className="blog-layout" style={{ display: "flex", gap: 40 }}>
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
              (() => {
                const { desktop, mobile } = getBlogImageSources(post);
                return (
              <article
                key={post._id.toString()}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 32,
                  marginBottom: 24,
                  padding: 24,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  background: "#fff",
                }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  style={{
                    flexShrink: 0,
                    width: 380,
                    borderRadius: 10,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: desktop
                      ? "rgba(0,0,0,0.02)"
                      : "rgba(0,0,0,0.04)",
                  }}
                >
                  {desktop ? (
                    <MediaImage
                      src={desktop}
                      mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                      alt={post.title}
                      width={1200}
                      height={675}
                      sizes="(max-width: 768px) 100vw, 380px"
                      imgStyle={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        minHeight: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(0,0,0,0.15)",
                        fontSize: 14,
                      }}
                    >
                      No Image
                    </div>
                  )}
                </Link>
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

                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <MainTitle
                      fontSize={24}
                      fontWeight={600}
                      lineHeight={30}
                      className="mb-3"
                    >
                      {post.title}
                    </MainTitle>
                  </Link>

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
                      justifyContent: commentsEnabled
                        ? "space-between"
                        : "flex-end",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.35)",
                      marginTop: "auto",
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      paddingTop: 14,
                    }}
                  >
                    {commentsEnabled && (
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
                        Leave a Comment
                      </Link>
                    )}
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
                );
              })()
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
          <div style={{ width: 320, flexShrink: 0 }} className="blog-sidebar">
            <BlogSidebarFull
              searchQuery={searchQuery}
              categorySlug={categorySlug}
              categories={JSON.parse(JSON.stringify(categories))}
              commentsEnabled={commentsEnabled}
            />
          </div>
        </div>

        <style>{`
        @media (max-width: 992px) {
          .blog-layout { flex-direction: column !important; gap: 0 !important; }
          .blog-sidebar { width: 100% !important; margin-top: 40px; }
        }
        @media (max-width: 768px) {
          article { flex-direction: column !important; gap: 16px !important; padding: 16px !important; }
          article > a { width: 100% !important; }
          article img { min-height: 180px !important; max-height: 220px !important; }
          article h2 { font-size: 18px !important; }
          article p { font-size: 14px !important; }
        }
        @media (max-width: 480px) {
          article { padding: 12px !important; margin-bottom: 16px !important; }
          article img { min-height: 150px !important; max-height: 180px !important; }
          article h2 { font-size: 16px !important; margin-bottom: 8px !important; }
        }
      `}</style>
      </PageContainer>
    </FullWidthBackground>
  );
}

