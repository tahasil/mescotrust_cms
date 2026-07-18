import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Component from "@/models/Component";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

export const dynamic = "force-dynamic";

async function PageContent({ slug }) {
  let page;
  try {
    await connectDB();
    page = await Page.findOne({ slug, status: "published" })
      .populate("layout.componentId")
      .lean();
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
  const baseComponents = [
    ...new Set(
      layoutBlocks
        .map(
          (b) =>
            b.baseComponent ||
            (typeof b.componentId === "object" && b.componentId?.baseComponent) ||
            (typeof b.componentId === "string" ? b.componentId : null) ||
            "Paragraph",
        )
        .filter(Boolean),
    ),
  ];

  const componentDocs = await Component.find({
    baseComponent: { $in: baseComponents },
  }).lean();

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
    return { ...block, baseComponent: base, props: { ...defaultProps, ...(block.props || {}) } };
  });

  return <ComponentRenderer layout={layout} />;
}

export default function ResolvedSlugPage({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  return (
    <main>
      <PageContent slug={slug} />
    </main>
  );
}
