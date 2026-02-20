import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Page, PageContent } from "@/models";
import { PageEditor } from "./PageEditor";

export default async function AdminPageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const page = await Page.findById(id).lean();
  if (!page) notFound();
  const content = await PageContent.findOne({ pageId: id }).lean();
  const pageWithContent = {
    ...(page as Record<string, unknown>),
    id: String((page as { _id?: unknown })._id),
    content: content ? { contentJSON: (content as unknown as { contentJSON: string }).contentJSON } : null,
  };
  return <PageEditor page={pageWithContent as Parameters<typeof PageEditor>[0]["page"]} />;
}
