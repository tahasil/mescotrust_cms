import Link from "next/link";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>{page.title}</h1>
        <ComponentRenderer layout={layout} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
      <h1>Welcome</h1>
      <p style={{ marginBottom: "1.5rem" }}>Create a page with slug &quot;home&quot; in the admin to customize this page.</p>
      <Link href="/blog" style={{ color: "#1890ff" }}>
        View blog
      </Link>
    </main>
  );
}
