import { Suspense } from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Component from "@/models/Component";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { buildPublishedSlugFilter, toPublishedPageShape } from "@/lib/pagePublication";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    await connectDB();
    const page = await Page.findOne(buildPublishedSlugFilter("home")).lean();
    if (!page) return {};
    const livePage = toPublishedPageShape(page);
    const title = livePage.meta?.metaTitle || livePage.title || undefined;
    const description = livePage.meta?.metaDescription || undefined;
    return {
      ...(title && { title }),
      ...(description && { description }),
      alternates: { canonical: "/" },
      openGraph: { title, description, type: "website", url: "/" },
    };
  } catch {
    return {};
  }
}

function HomeSkeleton() {
  return (
    <div>
      <div style={{ height: 32, width: "40%", background: "#f0f0f0", marginBottom: 16, borderRadius: 4 }} />
      <div style={{ height: 16, width: "100%", background: "#f0f0f0", marginBottom: 8, borderRadius: 4 }} />
      <div style={{ height: 16, width: "90%", background: "#f0f0f0", borderRadius: 4 }} />
    </div>
  );
}

/** Home content (layout + block props) is loaded only from the pages collection. */
async function HomeContent() {
  let page = null;
  try {
    await connectDB();
    page = await Page.findOne(buildPublishedSlugFilter("home"))
      .populate("layout.componentId")
      .populate("publishedLayout.componentId")
      .lean();
  } catch {
    // leave page null
  }

  if (page) {
    const livePage = toPublishedPageShape(page);
    const layoutBlocks = livePage.layout || [];
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

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome</h1>
      <p style={{ marginBottom: "1.5rem" }}>Create a page with slug &quot;home&quot; in the admin to customize this page.</p>
      <Link href="/blogs" style={{ color: "var(--primary-color, #1890ff)" }}>
        View blog
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
