import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Page, PageContent } from "@/models";
import { DynamicRenderer } from "@/components/renderer/DynamicRenderer";

export default async function DraftPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const { id } = await params;
  await connectDB();
  const page = await Page.findById(id).lean() as { title?: string } | null;
  if (!page) notFound();
  const content = await PageContent.findOne({ pageId: id }).lean() as { contentJSON?: string } | null;
  return (
    <main className="min-h-screen bg-amber-50/50 p-8">
      <div className="mb-4 rounded border border-amber-200 bg-amber-100 px-3 py-2 text-sm">
        Draft preview — not visible to public
      </div>
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {content?.contentJSON ? (
        <div className="mt-4">
          <DynamicRenderer contentJSON={content.contentJSON} />
        </div>
      ) : (
        <p className="mt-4 text-gray-600">No content yet.</p>
      )}
    </main>
  );
}
