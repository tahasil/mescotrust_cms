import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";
import Page from "@/models/Page";
import Component from "@/models/Component";
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

/** Page content (layout + block props) is loaded only from the pages collection. */
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

  const layoutBlocks = page.layout || [];
  const baseComponents = [...new Set(layoutBlocks.map((b) => b.baseComponent || (typeof b.componentId === "object" && b.componentId?.baseComponent) || (typeof b.componentId === "string" ? b.componentId : null) || "Paragraph"))].filter(Boolean);
  const componentDocs = await Component.find({ baseComponent: { $in: baseComponents } }).lean();
  const defaultPropsByBase = {};
  for (const doc of componentDocs || []) {
    if (doc.baseComponent && doc.defaultProps && typeof doc.defaultProps === "object") {
      defaultPropsByBase[doc.baseComponent] = doc.defaultProps;
    }
  }
  const layout = layoutBlocks.map((block) => {
    const base =
      block.baseComponent ||
      (typeof block.componentId === "object" && block.componentId?.baseComponent) ||
      (typeof block.componentId === "string" ? block.componentId : null) ||
      "Paragraph";
    const defaultProps = defaultPropsByBase[base] || {};
    const mergedProps = { ...defaultProps, ...(block.props || {}) };
    return { ...block, baseComponent: base, props: mergedProps };
  });

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
