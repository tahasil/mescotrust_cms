import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug, status: "published" }).populate("categoryId").lean() as {
    title?: string;
    content?: string;
    publishedAt?: Date;
    categoryId?: { name?: string } | null;
  } | null;
  if (!post) notFound();
  const category = post.categoryId as { name?: string } | null;
  return (
    <main className="min-h-screen p-8">
      <Link href="/blog" className="text-blue-600 hover:underline">← Blog</Link>
      <article className="mx-auto max-w-2xl pt-4">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="mt-2 text-gray-500">
          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString()}
          {category?.name && ` · ${category.name}`}
        </p>
        <div
          className="prose mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />
      </article>
    </main>
  );
}
