import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  try {
    await connectDB();
    const post = await Blog.findOne({ slug, status: "published" }).lean();
    if (!post) return { title: "Blog" };
    const baseUrl = getBaseUrl();
    const title = post.meta?.metaTitle || post.title;
    const description = post.meta?.metaDescription || post.excerpt || undefined;
    const url = `${baseUrl}/blog/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url },
    };
  } catch {
    return { title: "Blog" };
  }
}

export default async function BlogPostPage({ params }) {
  const slug = params.slug;
  try {
    await connectDB();
    const post = await Blog.findOne({ slug, status: "published" }).populate("category").lean();
    if (!post) notFound();

    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <article>
          <h1>{post.title}</h1>
          {(post.category?.name || post.publishedAt) && (
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              {post.category?.name && <span>{post.category.name}</span>}
              {post.publishedAt && (
                <span style={{ marginLeft: post.category?.name ? "1rem" : 0 }}>
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          )}
          {post.excerpt && <p style={{ fontSize: "1.1em", color: "#444", marginBottom: "1.5rem" }}>{post.excerpt}</p>}
          <div style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post.content || ""}</div>
        </article>
      </main>
    );
  } catch {
    notFound();
  }
}
