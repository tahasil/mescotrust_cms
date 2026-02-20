import { notFound, redirect as nextRedirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Page, PageContent, Redirect } from "@/models";
import { DynamicRenderer } from "@/components/renderer/DynamicRenderer";
import { RESERVED_SLUGS } from "@/utils/slug";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
    notFound();
  }
  await connectDB();
  const redirectRule = await Redirect.findOne({ fromPath: slug }).lean() as { toPath: string } | null;
  if (redirectRule) {
    nextRedirect(redirectRule.toPath.startsWith("/") ? redirectRule.toPath : `/${redirectRule.toPath}`);
  }
  const page = await Page.findOne({ slug, status: "published" }).lean() as { _id: unknown; title: string } | null;
  if (!page) notFound();
  const content = await PageContent.findOne({ pageId: page._id }).lean() as { contentJSON?: string } | null;
  return (
    <main className="min-h-screen p-8">
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
