import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

const RESERVED = ["admin", "blog", "contact", "search", "api", "preview"];

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  if (RESERVED.includes(slug)) return { title: "Mesco Trust CMS" };
  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" }).lean();
    if (!page) return { title: "Mesco Trust CMS" };
    const baseUrl = getBaseUrl();
    const title = page.meta?.metaTitle || page.title;
    const description = page.meta?.metaDescription || undefined;
    const url = `${baseUrl}/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url },
    };
  } catch {
    return { title: "Mesco Trust CMS" };
  }
}

export default async function DynamicPage({ params }) {
  const slug = params.slug;
  if (RESERVED.includes(slug)) notFound();

  try {
    await connectDB();
    const page = await Page.findOne({ slug, status: "published" }).populate("layout.componentId").lean();
    if (!page) notFound();

    const layout = (page.layout || []).map((block) => ({
      ...block,
      baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
    }));

    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>{page.title}</h1>
        <ComponentRenderer layout={layout} />
      </main>
    );
  } catch {
    notFound();
  }
}
