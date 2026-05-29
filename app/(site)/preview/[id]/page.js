import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Component from "@/models/Component";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import SafeHtml from "@/components/cms/SafeHtml";
import { verifyPreviewToken } from "@/lib/previewToken";

export async function generateMetadata({ params }) {
  return { title: "Preview", robots: { index: false, follow: false } };
}

export default async function PreviewPage({ params, searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const id = params.id;
  const type = searchParams?.type || "page";
  const token = searchParams?.token || "";

  try {
    await connectDB();

    if (type === "blog") {
      const post = await Blog.findById(id).populate("category").lean();
      if (!post) notFound();

      return (
        <main>
          <div style={{ background: "#fff3cd", padding: "0.5rem 1rem", borderRadius: 4, marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Draft preview — this content is not published.
          </div>
          <article>
            <h1>{post.title}</h1>
            {post.excerpt && <p style={{ fontSize: "1.1em", color: "#444", marginBottom: "1.5rem" }}>{post.excerpt}</p>}
            <SafeHtml html={post.content} />
          </article>
        </main>
      );
    }

    if (type === "event") {
      const eventDoc = await Event.findById(id).lean();
      if (!eventDoc) notFound();

      return (
        <main>
          <div style={{ background: "#fff3cd", padding: "0.5rem 1rem", borderRadius: 4, marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Draft preview — this content is not published.
          </div>
          <article>
            <h1>{eventDoc.title}</h1>
            {eventDoc.description ? (
              <p style={{ fontSize: "1.05em", color: "#444", marginBottom: "1.5rem", whiteSpace: "pre-line" }}>
                {eventDoc.description}
              </p>
            ) : null}
            <SafeHtml html={eventDoc.content} />
          </article>
        </main>
      );
    }

    // Page preview is gated by a signed preview token (from the admin editor's
    // preview-token route) in addition to the admin session above.
    const parsedToken = verifyPreviewToken(token);
    if (!parsedToken || parsedToken.kind !== "page-preview" || parsedToken.pageId !== String(id)) {
      notFound();
    }
    const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
    const tokenEmail = String(parsedToken?.email || "").trim().toLowerCase();
    if (tokenEmail && sessionEmail && tokenEmail !== sessionEmail) {
      notFound();
    }

    const page = await Page.findOne({ _id: id, isDeleted: { $ne: 1 } })
      .populate("layout.componentId")
      .lean();
    if (!page) notFound();

    const layoutBlocks = page.layout || [];
    const baseComponents = [...new Set(layoutBlocks.map((b) => b.baseComponent || (b.componentId?.baseComponent ?? "Paragraph")))].filter(Boolean);
    const componentDocs = await Component.find({ baseComponent: { $in: baseComponents } }).lean();
    const defaultPropsByBase = {};
    for (const doc of componentDocs || []) {
      if (doc.baseComponent && doc.defaultProps && typeof doc.defaultProps === "object") {
        defaultPropsByBase[doc.baseComponent] = doc.defaultProps;
      }
    }
    const layout = layoutBlocks.map((block) => {
      const base = block.baseComponent || (block.componentId?.baseComponent ?? "Paragraph");
      const defaultProps = defaultPropsByBase[base] || {};
      const mergedProps = { ...defaultProps, ...(block.props || {}) };
      return { ...block, baseComponent: base, props: mergedProps };
    });

    return (
      <main>
        <div style={{ background: "#fff3cd", padding: "0.5rem 1rem", borderRadius: 4, marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          Draft preview — this content is not published.
        </div>
        <h1>{page.title}</h1>
        <ComponentRenderer layout={layout} />
      </main>
    );
  } catch {
    notFound();
  }
}
