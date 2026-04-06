import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogCategory from "@/models/BlogCategory";
import { getPageSeoMetadata } from "@/lib/seo";

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

const PAGE_SIZE = 12;

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
    <main>
      <h1>Blog</h1>

      {categories.length > 0 && (
        <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "1rem 0 1.5rem" }}>
          <Link
            href="/blog"
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: 4,
              background: !categorySlug ? "var(--primary-color, #1890ff)" : "#f0f0f0",
              color: !categorySlug ? "#fff" : "inherit",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/blog?category=${cat.slug}`}
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: 4,
                background: categorySlug === cat.slug ? "var(--primary-color, #1890ff)" : "#f0f0f0",
                color: categorySlug === cat.slug ? "#fff" : "inherit",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((post) => (
          <li key={post._id} style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #eee", display: "flex", gap: "1rem" }}>
            {post.featuredImage && (
              <Link href={`/blog/${post.slug}`} style={{ flexShrink: 0 }}>
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  width={160}
                  height={100}
                  sizes="160px"
                  style={{ borderRadius: 6, objectFit: "cover", width: 160, height: 100 }}
                />
              </Link>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/blog/${post.slug}`} style={{ fontSize: "1.25rem", fontWeight: 600, textDecoration: "none" }}>
                {post.title}
              </Link>
              <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#999" }}>
                {post.category?.name && <span>{post.category.name}</span>}
                {post.publishedAt && (
                  <span style={{ marginInlineStart: post.category?.name ? "0.75rem" : 0 }}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {post.excerpt && <p style={{ marginTop: "0.5rem", color: "#666" }}>{post.excerpt}</p>}
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 && <p style={{ color: "#666" }}>No posts yet.</p>}

      {totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "2rem" }}>
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
              style={{ padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none" }}
            >
              Previous
            </Link>
          )}
          <span style={{ padding: "0.5rem 1rem", color: "#666" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
              style={{ padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none" }}
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
