import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Component from "@/models/Component";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { getPageSeoMetadata } from "@/lib/seo";
import { attachShortcodeModuleProps } from "@/lib/shortcodeServerProps";

export const dynamic = "force-dynamic";

/**
 * CMS pages under /media/* (e.g. /media/in-media, /media/newsletter) are
 * rewritten here by middleware so that /media/<ObjectId> stays reserved for
 * media-file delivery.
 *
 * This route therefore needs the same SEO metadata as the main CMS route —
 * without it every /media/* page fell back to the site name for its title,
 * the "Content management system" placeholder description, and emitted no
 * canonical URL at all.
 */

function titleizeSlug(slug) {
  return String(slug || "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadPublishedPage(slug) {
  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" })
      .populate("layout.componentId")
      .lean();
    return { page, unavailable: false };
  } catch (error) {
    console.error("[cms-media-page] page lookup failed:", error);
    return { page: null, unavailable: true };
  }
}

export async function generateMetadata({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const { page, unavailable } = await loadPublishedPage(slug);

  if (!page && !unavailable) {
    return { title: "Page not found", robots: { index: false, follow: false } };
  }

  return getPageSeoMetadata({
    slug,
    fallbackTitle: titleizeSlug(slug),
    fallbackDescription: "",
    fallbackCanonical: `/${slug}`,
    fallbackOpenGraphUrl: `/${slug}`,
  });
}

function Unavailable() {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0" }}>
      <h2>Service temporarily unavailable</h2>
      <p style={{ color: "#666" }}>Please try again in a moment.</p>
    </div>
  );
}

async function buildLayout(page, slug) {
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

  return attachShortcodeModuleProps(layout);
}

export default async function ResolvedSlugPage({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const { page, unavailable } = await loadPublishedPage(slug);

  if (unavailable) {
    return (
      <main>
        <Unavailable />
      </main>
    );
  }

  if (!page) notFound();

  const layoutWithShortcodeProps = await buildLayout(page, slug);
  return (
    <main>
      <ComponentRenderer layout={layoutWithShortcodeProps} />
    </main>
  );
}
