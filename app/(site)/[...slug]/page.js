import { notFound, permanentRedirect } from "next/navigation";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";
import Page from "@/models/Page";
import Component from "@/models/Component";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { filterLayoutBlocksForPath } from "@/lib/routeComponentRules";
import { getPageSeoMetadata } from "@/lib/seo";
import { normalizeAboutPageDesign } from "@/lib/aboutPageDesign";
import { attachShortcodeModuleProps } from "@/lib/shortcodeServerProps";
import { resolveRedirect } from "@/lib/menuPageSync";

const RESERVED = ["admin", "blog", "contact", "search", "api", "preview"];

function isReservedSlug(slug) {
  return RESERVED.includes(String(slug || "").split("/")[0]);
}

function titleizeSlug(slug) {
  return String(slug || "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Load the published page document for a slug.
 * Returns `{ page: null, unavailable: false }` when the page does not exist,
 * and `{ page: null, unavailable: true }` when the database itself failed.
 *
 * When the slug no longer resolves but has a recorded redirect (it was moved
 * in the Menu editor or its Parent Menu changed in the Page Builder), the
 * destination slug is returned so the request can be answered with a 308
 * instead of a 404.
 */
async function loadPublishedPage(slug) {
  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" })
      .populate("layout.componentId")
      .lean();
    if (page) return { page, unavailable: false, redirectTo: null };

    const target = await resolveRedirect(slug);
    if (target) {
      const redirected = await Page.findOne({ slug: target, status: "published" })
        .populate("layout.componentId")
        .lean();
      if (redirected) {
        return { page: null, unavailable: false, redirectTo: target };
      }
    }
    return { page: null, unavailable: false, redirectTo: null };
  } catch (error) {
    console.error("[cms-page] page lookup failed:", error);
    return { page: null, unavailable: true, redirectTo: null };
  }
}

export async function generateMetadata({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  if (isReservedSlug(slug)) return {};

  // Unknown slugs must not produce an indexable title or canonical URL —
  // otherwise every junk URL becomes a self-referencing indexable page.
  const { page, unavailable, redirectTo } = await loadPublishedPage(slug);
  if (redirectTo) {
    // Canonicalise the new address — never index the stale URL.
    return getPageSeoMetadata({
      slug: redirectTo,
      fallbackTitle: titleizeSlug(redirectTo),
      fallbackDescription: "",
      fallbackCanonical: `/${redirectTo}`,
      fallbackOpenGraphUrl: `/${redirectTo}`,
    });
  }
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

/** Build the block list for a page document (layout + merged component defaults). */
async function buildLayout(page, slug) {
  const normalizedLayout = normalizeAboutPageDesign(slug, page.layout || []);
  const layoutBlocks = filterLayoutBlocksForPath(normalizedLayout, `/${slug}`);
  const baseComponents = [
    ...new Set(
      layoutBlocks.map(
        (b) =>
          b.baseComponent ||
          (typeof b.componentId === "object" && b.componentId?.baseComponent) ||
          (typeof b.componentId === "string" ? b.componentId : null) ||
          "Paragraph"
      )
    ),
  ].filter(Boolean);
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
  return attachShortcodeModuleProps(layout);
}

/**
 * Page content is loaded in the page component itself (not in a nested async
 * child) so that `notFound()` runs before React starts streaming. When the
 * lookup happens inside a streamed child the HTTP 200 status is already
 * flushed and the response stays a 200 "soft 404" — search engines then treat
 * every unknown URL as a real page.
 */
export default async function DynamicPage({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  if (isReservedSlug(slug)) notFound();

  const { page, unavailable, redirectTo } = await loadPublishedPage(slug);

  // A moved page answers with a permanent redirect instead of a 404, so old
  // bookmarks, search results and external links keep working.
  if (redirectTo) permanentRedirect(`/${redirectTo}`);

  if (unavailable) {
    return (
      <main>
        <Unavailable />
      </main>
    );
  }

  // Thrown before any markup is produced → Next.js responds with a real 404.
  if (!page) notFound();

  const layoutWithShortcodeProps = await buildLayout(page, slug);
  return (
    <main>
      <ComponentRenderer layout={layoutWithShortcodeProps} />
    </main>
  );
}
