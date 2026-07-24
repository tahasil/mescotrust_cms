"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import styled, { keyframes } from "styled-components";
import SafeHtml from "@/components/cms/SafeHtml";
import { FullWidthBackground, getColor, MainTitle, PageContainer } from "@/styles/Theme";
import BlogSidebarFull from "@/components/blog/BlogSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import SocialShare from "@/components/common/SocialShare";
import { getBlogImageSources } from "@/components/blog/blogDisplay";
import { getBlogSectionStyles } from "@/components/blog/blogSectionStyles";

const BlogComments = dynamic(() => import("@/components/blog/BlogComments"), {
  ssr: false,
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const revealBlogDetail = keyframes`
  from {
    opacity: 0;
    transform: translateY(22px);
  }
`;

const revealBlogDetailSidebar = keyframes`
  from {
    opacity: 0;
    transform: translateX(18px);
  }
`;

const revealBlogBanner = keyframes`
  from {
    opacity: 0;
    transform: scale(.975);
  }
`;

const DetailRoot = styled.div`
  color: var(--blog-detail-text);

  .blog-detail-layout { display: flex; gap: var(--blog-detail-gap); }
  .blog-detail-article {
    flex: 1; min-width: 0;
    animation: ${revealBlogDetail} 620ms cubic-bezier(.22, 1, .36, 1) backwards;
  }
  .blog-detail-sidebar {
    width: 320px; flex-shrink: 0;
    animation: ${revealBlogDetailSidebar} 620ms 140ms cubic-bezier(.22, 1, .36, 1) backwards;
  }
  .blog-detail-state {
    padding: 60px 0; color: var(--blog-detail-muted); text-align: center;
    animation: ${revealBlogDetail} 420ms ease-out backwards;
  }
  .blog-detail-state--error { color: var(--blog-detail-accent); }
  .blog-detail-category {
    margin-bottom: 8px; color: var(--blog-detail-accent); font-size: 13px;
    font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
  }
  .blog-detail-title { color: var(--blog-detail-title); }
  .blog-detail-meta-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
  }
  .blog-detail-meta { display: flex; align-items: center; gap: 16px; color: var(--blog-detail-meta); font-size: 14px; flex-wrap: wrap; }
  .blog-detail-banner {
    margin: 0 0 28px; border-radius: var(--blog-detail-radius); overflow: hidden; max-height: 400px;
    animation: ${revealBlogBanner} 700ms 120ms cubic-bezier(.22, 1, .36, 1) backwards;
  }
  .blog-detail-banner img {
    width: auto; max-width: 100%; height: auto; max-height: 400px;
    object-fit: contain; object-position: left top; display: block; margin: 0;
  }
  .blog-detail-excerpt {
    margin-bottom: 24px; color: var(--blog-detail-muted); font-size: 18px;
    font-style: italic; line-height: 1.6;
  }
  .blog-detail-content {
    max-width: 100%; overflow: hidden; color: var(--blog-detail-content);
    font-size: 16px; line-height: 1.8; overflow-wrap: break-word; word-break: break-word;
  }
  .blog-detail-tags {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; padding-top: 20px;
    border-top: 1px solid var(--blog-detail-border);
  }
  .blog-detail-tag {
    padding: 4px 14px; border-radius: 20px; background: var(--blog-detail-surface);
    color: var(--blog-detail-muted); font-size: 13px;
    transition: transform 180ms ease, color 180ms ease, background-color 180ms ease;
  }
  .blog-detail-tag:hover { transform: translateY(-2px); color: var(--blog-detail-accent); }

  @media (max-width: 1200px) { .blog-detail-layout { gap: 28px; } }
  @media (max-width: 992px) {
    .blog-detail-layout { gap: 24px; flex-direction: column; }
    .blog-detail-sidebar { width: 100%; margin-top: 40px; }
  }
  @media (max-width: 768px) {
    .blog-detail-title { font-size: 24px !important; line-height: 1.3 !important; }
    .blog-detail-meta-row { align-items: stretch; }
    .blog-detail-banner { margin-bottom: 20px; max-height: none; border-radius: 10px; }
    .blog-detail-banner img {
      width: 100%; max-width: 100%; max-height: 320px; object-fit: cover;
      object-position: center; border-radius: 8px;
    }
    .blog-detail-sidebar { margin-top: 28px; }
  }
  @media (max-width: 480px) {
    .blog-detail-title { font-size: 20px !important; }
    .blog-detail-article { font-size: 15px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .blog-detail-article,
    .blog-detail-sidebar,
    .blog-detail-state,
    .blog-detail-banner { animation: none; }
    .blog-detail-tag { transition: none; }
    .blog-detail-tag:hover { transform: none; }
  }
`;

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function color(value, fallback) {
  const key = text(value);
  return key ? getColor(key) : fallback;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function BlogDetails(props) {
  const params = useParams();
  const routeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [post, setPost] = useState(null);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showImage = props?.blogDetailsShowImage !== false;
  const showCategory = props?.blogDetailsShowCategory !== false;
  const showMeta = props?.blogDetailsShowMeta !== false;
  const showShare = props?.blogDetailsShowShare !== false;
  const showExcerpt = props?.blogDetailsShowExcerpt !== false;
  const showContent = props?.blogDetailsShowContent !== false;
  const showTags = props?.blogDetailsShowTags !== false;
  const showComments = props?.blogDetailsShowComments !== false;
  const showSidebar = props?.blogDetailsShowSidebar !== false;

  useEffect(() => {
    setCanonicalUrl(typeof window !== "undefined" ? window.location.href.split(/[?#]/)[0] : "");
  }, [routeSlug]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const postRequest = routeSlug
      ? fetch(`/api/public/blogs/${encodeURIComponent(routeSlug)}`, { cache: "no-store", signal: controller.signal })
          .then(async (response) => {
            if (response.status === 404) throw new Error("Blog post not found.");
            if (!response.ok) throw new Error("Blog details could not be loaded.");
            return response.json();
          })
      : fetch("/api/public/blogs?page=1&limit=1", { cache: "no-store", signal: controller.signal })
          .then((response) => response.ok ? response.json() : { items: [] })
          .then((data) => data?.items?.[0]?.slug
            ? fetch(`/api/public/blogs/${encodeURIComponent(data.items[0].slug)}`, { cache: "no-store", signal: controller.signal })
                .then((response) => response.ok ? response.json() : null)
            : null);

    Promise.all([
      postRequest,
      fetch("/api/theme", { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() : {}),
    ])
      .then(([selectedPost, theme]) => {
        if (!selectedPost) throw new Error(routeSlug ? "Blog post not found." : "Add a published blog to preview this component.");
        setPost(selectedPost);
        if (typeof theme?.blogCommentsEnabled === "boolean") {
          setCommentsEnabled(theme.blogCommentsEnabled);
        }
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message || "Blog details could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [routeSlug]);

  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } =
    getBlogSectionStyles(props, "blogDetails", "customInnerHero");
  const style = {
    "--blog-detail-text": color(props?.blogDetailsTextColorKey, "#2a283e"),
    "--blog-detail-title": color(props?.blogDetailsTitleColorKey, "#2a283e"),
    "--blog-detail-content": color(props?.blogDetailsContentColorKey, "rgba(0,0,0,0.75)"),
    "--blog-detail-muted": color(props?.blogDetailsMutedColorKey, "rgba(0,0,0,0.6)"),
    "--blog-detail-meta": color(props?.blogDetailsMetaColorKey, "rgba(0,0,0,0.45)"),
    "--blog-detail-accent": color(props?.blogDetailsAccentColorKey, "var(--primary-color, #8b1a1a)"),
    "--blog-sidebar-search-button": color(props?.blogDetailsSearchButtonColorKey, "var(--blog-detail-accent)"),
    "--blog-sidebar-link": color(props?.blogDetailsSidebarLinkColorKey, "var(--blog-detail-text)"),
    "--blog-post-button-bg": color(props?.blogDetailsPostButtonBgColorKey, "var(--blog-detail-accent)"),
    "--blog-post-button-text": color(props?.blogDetailsPostButtonTextColorKey, "#fff"),
    "--blog-detail-surface": color(props?.blogDetailsSurfaceColorKey, "rgba(0,0,0,0.04)"),
    "--blog-detail-border": color(props?.blogDetailsBorderColorKey, "rgba(0,0,0,0.06)"),
    "--blog-detail-radius": `${clamp(props?.blogDetailsImageRadius, 0, 40, 12)}px`,
    "--blog-detail-gap": `${clamp(props?.blogDetailsColumnGap, 16, 80, 40)}px`,
    ...(text(props?.blogDetailsAccentColorKey)
      ? { "--primary-color": getColor(text(props.blogDetailsAccentColorKey)) }
      : {}),
  };

  if (loading || error || !post) {
    return (
      <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
        <PageContainer className="pt-0" $managedStyle={pageContainerBgStyle}>
          <DetailRoot style={style}>
            <div className={`blog-detail-state${error ? " blog-detail-state--error" : ""}`}>
              {error || text(props?.blogDetailsLoadingLabel, "Loading blog details...")}
            </div>
          </DetailRoot>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  const { desktop, mobile } = getBlogImageSources(post);
  const shareTitle = text(post?.meta?.metaTitle) || text(post.title);
  const shareDescription = text(post?.meta?.metaDescription) || text(post.excerpt);

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer className="pt-0" $managedStyle={pageContainerBgStyle}>
        <DetailRoot style={style}>
          <div className="blog-detail-layout">
            <article className="blog-detail-article">
              {showCategory && post.category?.name ? <div className="blog-detail-category">{post.category.name}</div> : null}
              <MainTitle className="blog-detail-title" fontSize={24} fontWeight={600} lineHeight={30}>{post.title}</MainTitle>
              {(showMeta || showShare) ? (
                <div className="blog-detail-meta-row">
                  {showMeta ? (
                    <div className="blog-detail-meta">
                      {post.publishedAt ? <span>Published: {formatDate(post.publishedAt)}</span> : null}
                      {post.author ? <span>By {post.author}</span> : null}
                    </div>
                  ) : <span />}
                  {showShare ? (
                    <SocialShare
                      canonicalUrl={canonicalUrl || `/blog/${post.slug}`}
                      title={shareTitle}
                      description={shareDescription}
                      image={desktop || mobile}
                      buttonLabel={text(props?.blogDetailsShareLabel, "Share")}
                    />
                  ) : null}
                </div>
              ) : null}
              {showImage && desktop ? (
                <figure className="blog-detail-banner">
                  <MediaImage
                    src={desktop}
                    mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                    alt={post.title}
                    imgClassName="blog-detail-banner-img"
                    width={1440}
                    height={810}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 860px"
                    imgStyle={{ width: "auto", maxWidth: "100%", height: "auto", maxHeight: 400, objectFit: "contain", objectPosition: "left top", display: "block", margin: 0 }}
                  />
                </figure>
              ) : null}
              {showExcerpt && post.excerpt ? <p className="blog-detail-excerpt">{post.excerpt}</p> : null}
              {showContent ? <SafeHtml html={post.content} className="blog-detail-content" /> : null}
              {showTags && Array.isArray(post.tags) && post.tags.length ? (
                <div className="blog-detail-tags">
                  {post.tags.map((tag) => <span className="blog-detail-tag" key={tag}>{tag}</span>)}
                </div>
              ) : null}
              {showComments && commentsEnabled ? <BlogComments slug={post.slug} /> : null}
            </article>
            {showSidebar ? (
              <aside className="blog-detail-sidebar">
                <BlogSidebarFull currentSlug={post.slug} commentsEnabled={commentsEnabled} />
              </aside>
            ) : null}
          </div>
        </DetailRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
