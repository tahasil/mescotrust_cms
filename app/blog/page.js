import Link from "next/link";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  let items = [];
  try {
    await connectDB();
    const result = await Blog.find({ status: "published" })
      .populate("category")
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(50)
      .lean();
    items = result;
  } catch {
    // leave items empty
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Blog</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((post) => (
          <li key={post._id} style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #eee" }}>
            <Link href={`/blog/${post.slug}`} style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {post.title}
            </Link>
            {post.excerpt && <p style={{ marginTop: "0.5rem", color: "#666" }}>{post.excerpt}</p>}
          </li>
        ))}
      </ul>
      {items.length === 0 && <p>No posts yet.</p>}
    </main>
  );
}
