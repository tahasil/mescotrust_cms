import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
import Blog from "@/models/Blog";
import SafeHtml from "@/components/cms/SafeHtml";

export async function generateMetadata({ params }) {
  const slug = params.slug;
  try {
    await connectDB();
    const post = await Blog.findOne({ slug, status: "published" }).lean();
    if (!post) return {};
    const title = post.meta?.metaTitle || post.title;
    const description = post.meta?.metaDescription || post.excerpt || undefined;
    const og = {
      title,
      description,
      url: `/blog/${slug}`,
      type: "article",
      ...(post.publishedAt && { publishedTime: new Date(post.publishedAt).toISOString() }),
      ...(post.author && { authors: [post.author] }),
    };
    if (post.featuredImage) {
      og.images = [{ url: post.featuredImage, alt: title }];
    }
    return {
      title,
      description,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: og,
    };
  } catch {
    return {};
  }
}

function PostSkeleton() {
  return (
    <div>
      <div style={{ height: 36, width: "80%", background: "#f0f0f0", marginBottom: 16, borderRadius: 4 }} />
      <div style={{ height: 14, width: "30%", background: "#f0f0f0", marginBottom: 24, borderRadius: 4 }} />
      <div style={{ height: 16, width: "100%", background: "#f0f0f0", marginBottom: 10, borderRadius: 4 }} />
      <div style={{ height: 16, width: "95%", background: "#f0f0f0", marginBottom: 10, borderRadius: 4 }} />
      <div style={{ height: 16, width: "85%", background: "#f0f0f0", borderRadius: 4 }} />
    </div>
  );
}

async function PostContent({ slug }) {
  let post;
  try {
    await connectDB();
    post = await Blog.findOne({ slug, status: "published" }).populate("category").lean();
  } catch {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <h2>Service temporarily unavailable</h2>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
      </div>
    );
  }

  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    url: `${siteUrl}/blog/${slug}`,
    ...(post.featuredImage && { image: post.featuredImage.startsWith("http") ? post.featuredImage : `${siteUrl}${post.featuredImage}` }),
    ...(post.publishedAt && { datePublished: new Date(post.publishedAt).toISOString() }),
    dateModified: new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString(),
    ...(post.author && { author: { "@type": "Person", name: post.author } }),
    ...(post.category?.name && { articleSection: post.category.name }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <h1>{post.title}</h1>
      {(post.category?.name || post.publishedAt) && (
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          {post.category?.name && <span>{post.category.name}</span>}
          {post.publishedAt && (
            <span style={{ marginInlineStart: post.category?.name ? "1rem" : 0 }}>
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
          )}
        </p>
      )}
      {post.featuredImage && (
        <figure style={{ margin: "0 0 1.5rem" }}>
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={800}
            height={450}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
            style={{ width: "100%", height: "auto", borderRadius: 8 }}
            priority
          />
        </figure>
      )}
      {post.excerpt && <p style={{ fontSize: "1.1em", color: "#444", marginBottom: "1.5rem" }}>{post.excerpt}</p>}
      <SafeHtml html={post.content} />
      </article>
    </>
  );
}

export default function BlogPostPage({ params }) {
  return (
    <main style={{ maxWidth: "var(--layout-width, 800px)", margin: "0 auto", padding: "2rem 1rem" }}>
      <Suspense fallback={<PostSkeleton />}>
        <PostContent slug={params.slug} />
      </Suspense>
    </main>
  );
}
