import { Suspense } from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    await connectDB();
    const page = await Page.findOne({ slug: "home", status: "published" }).lean();
    if (!page) return {};
    const title = page.meta?.metaTitle || page.title || undefined;
    const description = page.meta?.metaDescription || undefined;
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

async function HomeContent() {
  let page = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "home", status: "published" }).populate("layout.componentId").lean();
  } catch {
    // leave page null
  }

  if (page) {
    const layout = (page.layout || []).map((block) => ({
      ...block,
      baseComponent: block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph"),
    }));
    return (
      <>
        <h1>{page.title}</h1>
        <ComponentRenderer layout={layout} />
      </>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome</h1>
      <p style={{ marginBottom: "1.5rem" }}>Create a page with slug &quot;home&quot; in the admin to customize this page.</p>
      <Link href="/blog" style={{ color: "var(--primary-color, #1890ff)" }}>
        View blog
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main style={{ maxWidth: "var(--layout-width, 800px)", margin: "0 auto", padding: "2rem 1rem" }}>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
