import Link from "next/link";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";

export default async function BlogListPage() {
  await connectDB();
  const posts = await BlogPost.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(50)
    .select("slug title excerpt publishedAt categoryId")
    .populate("categoryId", "name slug")
    .lean() as Array<{ _id: unknown; slug?: string; title?: string; excerpt?: string; publishedAt?: Date; categoryId?: { name?: string } | null }>;
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Blog</h1>
      <ul className="mt-6 space-y-4">
        {posts.map((p) => (
          <li key={String(p._id)} className="rounded border p-4">
            <Link href={`/blog/${p.slug}`} className="text-xl font-medium hover:underline">
              {p.title}
            </Link>
            {p.excerpt && <p className="mt-1 text-gray-600">{p.excerpt}</p>}
            <p className="mt-2 text-sm text-gray-500">
              {p.publishedAt && new Date(p.publishedAt).toLocaleDateString()}
              {p.categoryId && typeof p.categoryId === "object" && "name" in p.categoryId && ` · ${(p.categoryId as { name: string }).name}`}
            </p>
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="mt-4 text-gray-500">No posts yet.</p>}
    </main>
  );
}
