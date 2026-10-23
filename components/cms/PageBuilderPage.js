import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Component from "@/models/Component";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { normalizeAboutPageDesign } from "@/lib/aboutPageDesign";
import { filterLayoutBlocksForPath } from "@/lib/routeComponentRules";
import BreadcrumbJsonLd from "@/components/common/BreadcrumbJsonLd";
import { resolveBreadcrumbsForPage } from "@/lib/breadcrumbSchema";

function getBaseComponent(block) {
  return (
    block?.baseComponent ||
    (typeof block?.componentId === "object" && block.componentId?.baseComponent) ||
    (typeof block?.componentId === "string" ? block.componentId : null) ||
    "Paragraph"
  );
}

/** Load one published Page Builder document and merge component defaults. */
export async function loadPageBuilderDocument({ pageId, slug, pathname }) {
  await connectDB();
  const query = pageId ? { _id: pageId, status: "published" } : { slug, status: "published" };
  const page = await Page.findOne(query).populate("layout.componentId").lean();
  if (!page) return null;

  const normalized = normalizeAboutPageDesign(page.slug, page.layout || []);
  const blocks = filterLayoutBlocksForPath(normalized, pathname || `/${page.slug}`);
  const baseComponents = [...new Set(blocks.map(getBaseComponent))].filter(Boolean);
  const componentDocs = await Component.find({
    baseComponent: { $in: baseComponents },
  })
    .select("baseComponent defaultProps")
    .lean();
  const defaultsByBase = Object.fromEntries(
    componentDocs
      .filter((component) => component?.baseComponent)
      .map((component) => [component.baseComponent, component.defaultProps || {}]),
  );

  return {
    page,
    layout: blocks.map((block) => {
      const baseComponent = getBaseComponent(block);
      return {
        ...block,
        baseComponent,
        props: {
          ...(defaultsByBase[baseComponent] || {}),
          ...(block.props || {}),
        },
      };
    }),
  };
}

/** Shared renderer for dedicated routes backed by Page Builder templates. */
export default async function PageBuilderPage({ pageId, slug, pathname, emitBreadcrumbs = false }) {
  let document;
  try {
    document = await loadPageBuilderDocument({ pageId, slug, pathname });
  } catch {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <h2>Service temporarily unavailable</h2>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
      </div>
    );
  }
  if (!document) notFound();

  const effectivePath = pathname || (document.page?.slug ? `/${document.page.slug}` : "");
  const breadcrumbItems = emitBreadcrumbs && effectivePath
    ? resolveBreadcrumbsForPage(effectivePath, document.page?.title)
    : [];

  return (
    <>
      {breadcrumbItems.length > 0 ? (
        <BreadcrumbJsonLd items={breadcrumbItems} currentUrl={effectivePath} />
      ) : null}
      <ComponentRenderer layout={document.layout} />
    </>
  );
}
