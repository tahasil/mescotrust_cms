import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { BlogPost, BlogCategory } from "@/models";
import { BlogPostEditor } from "./BlogPostEditor";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const post = await BlogPost.findById(id).populate("categoryId").lean();
  if (!post) notFound();
  const categories = await BlogCategory.find().sort({ name: 1 }).lean();
  const postObj = post as Record<string, unknown>;
  const postWithId = { ...postObj, id: String(postObj._id) };
  const categoriesWithId = categories.map((c) => {
    const co = c as Record<string, unknown>;
    return { ...co, id: String(co._id) };
  });
  return <BlogPostEditor post={postWithId as Parameters<typeof BlogPostEditor>[0]["post"]} categories={categoriesWithId as Parameters<typeof BlogPostEditor>[0]["categories"]} />;
}
