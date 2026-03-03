import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";
import Page from "@/models/Page";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

const RESERVED = ["admin", "blog", "contact", "search", "api", "preview"];

export async function generateMetadata({ params }) {
  const slug = params.slug;
  if (RESERVED.includes(slug)) return {};
  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" }).lean();
    if (!page) return {};
    const title = page.meta?.metaTitle || page.title;
    const description = page.meta?.metaDescription || undefined;
    return {
      title,
      description,
      alternates: { canonical: `/${slug}` },
      openGraph: { title, description, url: `/${slug}`, type: "website" },
    };
  } catch {
    return {};
  }
}

function ContentSkeleton() {
  return (
    <div>
      <div style={{ height: 20, width: "100%", background: "#f0f0f0", marginBottom: 12, borderRadius: 4 }} />
      <div style={{ height: 20, width: "90%", background: "#f0f0f0", marginBottom: 12, borderRadius: 4 }} />
      <div style={{ height: 20, width: "75%", background: "#f0f0f0", borderRadius: 4 }} />
    </div>
  );
}

async function PageContent({ slug }) {
  let page;
  try {
    await connectDB();
    page = await Page.findOne({ slug, status: "published" }).populate("layout.componentId").lean();
  } catch {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <h2>Service temporarily unavailable</h2>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
      </div>
    );
  }

  if (!page) notFound();

  const layout = (page.layout || []).map((block) => ({
    ...block,
    baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
  }));

  return <ComponentRenderer layout={layout} />;
}

export default function DynamicPage({ params }) {
  const slug = params.slug;
  if (RESERVED.includes(slug)) notFound();

  return (
    <main>
      <Suspense fallback={<ContentSkeleton />}>
        <PageContent slug={slug} />
      </Suspense>
    </main>
  );
}
