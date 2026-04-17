"use client";

import { useState, useEffect } from "react";
import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  ThemeModal,
} from "@/styles/Theme";

/* ── Platform config ── */
const PLATFORM_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  twitter: "X (Twitter)",
  googlemaps: "Google Maps",
};

const PLATFORM_COLORS = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  twitter: "#000000",
  googlemaps: "#4285F4",
};

const MAX_POSTS = 20;

function getPostImageSources(post) {
  const desktop =
    post?.imageDesktop != null
      ? String(post.imageDesktop).trim()
      : post?.image != null
        ? String(post.image).trim()
        : "";
  const mobile =
    post?.imageMobile != null ? String(post.imageMobile).trim() : "";
  return {
    desktop,
    mobile,
    image: desktop || mobile,
  };
}

/* ── Platform SVG Icons ── */
function PlatformIcon({ platform, size = 24, color }) {
  const fill = color || PLATFORM_COLORS[platform] || "#666";
  const s = Number(size) || 24;
  switch (platform) {
    case "instagram":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke={fill} strokeWidth="2" />
          <circle cx="12" cy="12" r="5" stroke={fill} strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" fill={fill} />
        </svg>
      );
    case "facebook":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitter":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
  }
}

/* ── Styled Components ── */

/* Masonry grid using CSS columns */
const MasonryGrid = styled.div`
  column-count: 5;
  column-gap: 16px;
  @media (max-width: 1200px) {
    column-count: 4;
  }
  @media (max-width: 992px) {
    column-count: 3;
  }
  @media (max-width: 768px) {
    column-count: 2;
  }
  @media (max-width: 480px) {
    column-count: 1;
  }
`;

const PostCard = styled.div`
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
`;

const PostImage = styled.div`
  width: 100%;
  overflow: hidden;
  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.4s ease;
  }
  ${PostCard}:hover & img {
    transform: scale(1.03);
  }
`;

const PostBody = styled.div`
  padding: 14px;
  text-align: center;
`;

const PlatformIconWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
`;

const PostUsername = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
`;

const PostCaption = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.65);
  margin: 0 0 12px 0;
  text-align: left;
  word-break: break-word;
`;

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const PlatformBadge = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$bgColor || "#f5f5f5"};
  flex-shrink: 0;
`;

const FooterMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  .footer-name {
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.65);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .footer-sep {
    color: rgba(0, 0, 0, 0.25);
    font-size: 10px;
  }
  .footer-date {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.4);
    white-space: nowrap;
  }
`;

const LiveBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: #ff4d4f;
  color: #fff;
  z-index: 1;
`;

/* Modal styles */
const ModalScrollBody = styled(ThemeModal)`
  .ant-modal-body {
    max-height: 80vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 10px;
    }
  }
  .ant-modal-close {
    background: #dbdbdb !important;
    top: 6px !important;
    right: 6px !important;
    border-radius: 50% !important;
    z-index: 99 !important;
    svg {
      font-size: 14px !important;
      color: rgba(0, 0, 0, 0.85) !important;
      opacity: 0.7 !important;
    }
  }
`;

const ModalImage = styled.div`
  width: 100%;
  overflow: hidden;
  background: #f0f0f0;
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalMeta = styled.div`
  flex: 1;
  .modal-username {
    font-size: 15px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }
  .modal-date {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }
`;

const ModalPlatformTag = styled.span`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => props.$color || "#666"};
  background: ${(props) => (props.$color ? `${props.$color}14` : "#f5f5f5")};
`;

const ModalCaption = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.75);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 20px 0;
`;

const ViewOriginalBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 30px;
  border: 2px solid var(--primary-color, #1677ff);
  background: var(--primary-color, #1677ff);
  color: #fff;
  text-decoration: none;
  transition: all 0.25s ease;
  &:hover {
    background: #fff;
    color: var(--primary-color, #1677ff);
  }
`;

/**
 * Site component: SocialMediaWall.
 * Masonry card-based social media post feed with click-to-modal.
 */
export default function SocialMediaWall(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [livePosts, setLivePosts] = useState([]);

  /* ── Fetch live posts on mount ── */
  useEffect(() => {
    fetch("/api/public/social-wall")
      .then((res) => (res.ok ? res.json() : { livePosts: [] }))
      .then((data) => {
        if (Array.isArray(data.livePosts)) setLivePosts(data.livePosts);
      })
      .catch(() => {});
  }, []);

  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "Social Media Wall").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.socialMediaWallTitleEnabled !== false;
  const subTitleEnabled = props?.socialMediaWallSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColorKey = (props?.socialMediaWallSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;

  /* ── Merge manual + live posts ── */
  const manualPosts = Array.isArray(props?.socialMediaWallPosts) ? props.socialMediaWallPosts : [];
  const enabledManual = manualPosts
    .filter((p) => p?.enabled !== false)
    .map((p) => ({ ...p, ...getPostImageSources(p), source: "manual" }));
  const allPosts = [...enabledManual, ...livePosts].slice(0, MAX_POSTS);

  /* ── Section bg ── */
  const sectionBgType = (props?.socialMediaWallSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.socialMediaWallSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.socialMediaWallSectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.socialMediaWallSectionPaddingTop != null ? Number(props.socialMediaWallSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.socialMediaWallSectionPaddingBottom != null ? Number(props.socialMediaWallSectionPaddingBottom) : null;
  const sectionMarginTop = props?.socialMediaWallSectionMarginTop != null ? Number(props.socialMediaWallSectionMarginTop) : null;
  const sectionMarginBottom = props?.socialMediaWallSectionMarginBottom != null ? Number(props.socialMediaWallSectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  /* ── Page container bg ── */
  const pageContainerBgType = (props?.socialMediaWallPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.socialMediaWallPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.socialMediaWallPageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.socialMediaWallPageContainerPaddingTop != null ? Number(props.socialMediaWallPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.socialMediaWallPageContainerPaddingRight != null ? Number(props.socialMediaWallPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.socialMediaWallPageContainerPaddingBottom != null ? Number(props.socialMediaWallPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.socialMediaWallPageContainerPaddingLeft != null ? Number(props.socialMediaWallPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.socialMediaWallPageContainerMarginTop != null ? Number(props.socialMediaWallPageContainerMarginTop) : null;
  const containerMarginBottom = props?.socialMediaWallPageContainerMarginBottom != null ? Number(props.socialMediaWallPageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  return (
    <>
      <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
        <PageContainer style={pageContainerBgStyle}>
          {/* Title */}
          {(titleEnabled || subTitleEnabled) && (
            <Row gutter={[16, 16]}>
              <Col span={24} className="mb-4">
                {subTitleEnabled && subTitle && (
                  <SubTitle style={subTitleColor ? { color: subTitleColor } : undefined}>
                    {subTitle}
                  </SubTitle>
                )}
                {titleEnabled && <MainTitle color={titleColor}>{mainTitle}</MainTitle>}
              </Col>
            </Row>
          )}

          {/* Masonry Posts grid */}
          {allPosts.length > 0 && (
            <MasonryGrid>
              {allPosts.map((post, idx) => {
                const platform = (post?.platform ?? "").toString().trim().toLowerCase();
                const username = (post?.username ?? "").toString().trim();
                const caption = (post?.caption ?? "").toString().trim();
                const imageSources = getPostImageSources(post);
                const image = imageSources.image;
                const date = (post?.date ?? "").toString().trim();
                const platformLabel = PLATFORM_LABELS[platform] || platform;
                const platformColor = PLATFORM_COLORS[platform] || "#666";

                const isLive = post?.source === "live";

                return (
                  <PostCard
                    key={idx}
                    onClick={() => {
                      setSelectedPost(post);
                      setModalOpen(true);
                    }}
                  >
                    {isLive && <LiveBadge>LIVE</LiveBadge>}

                    {/* Post image (natural height) */}
                    {image && (
                      <PostImage>
                        <picture>
                          {imageSources.mobile ? (
                            <source
                              media="(max-width: 767px)"
                              srcSet={imageSources.mobile}
                            />
                          ) : null}
                          <img
                            loading="lazy"
                            src={image}
                            alt={caption || username || platformLabel}
                          />
                        </picture>
                      </PostImage>
                    )}

                    <PostBody>
                      {/* Centered platform icon */}
                      <PlatformIconWrap>
                        <PlatformIcon platform={platform} size={28} color={platformColor} />
                      </PlatformIconWrap>

                      {/* Username */}
                      {username && <PostUsername>{username}</PostUsername>}

                      {/* Caption */}
                      {caption && <PostCaption>{caption}</PostCaption>}

                      {/* Footer: small icon + name + date */}
                      <PostFooter>
                        <PlatformBadge $bgColor={`${platformColor}14`}>
                          <PlatformIcon platform={platform} size={14} color={platformColor} />
                        </PlatformBadge>
                        <FooterMeta>
                          {username && <span className="footer-name">{username}</span>}
                          {username && date && <span className="footer-sep">|</span>}
                          {date && <span className="footer-date">{date}</span>}
                        </FooterMeta>
                      </PostFooter>
                    </PostBody>
                  </PostCard>
                );
              })}
            </MasonryGrid>
          )}
        </PageContainer>
      </FullWidthBackground>

      {/* Post detail modal */}
      <ModalScrollBody
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        centered
        footer={null}
        width={600}
        destroyOnClose
        data-lenis-prevent
      >
        {selectedPost && (() => {
          const platform = (selectedPost.platform ?? "").toString().trim().toLowerCase();
          const username = (selectedPost.username ?? "").toString().trim();
          const caption = (selectedPost.caption ?? "").toString().trim();
          const imageSources = getPostImageSources(selectedPost);
          const image = imageSources.image;
          const date = (selectedPost.date ?? "").toString().trim();
          const postUrl = (selectedPost.postUrl ?? "").toString().trim();
          const platformLabel = PLATFORM_LABELS[platform] || platform;
          const platformColor = PLATFORM_COLORS[platform] || "#666";

          return (
            <div data-lenis-prevent>
              {image && (
                <ModalImage>
                  <picture>
                    {imageSources.mobile ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={imageSources.mobile}
                      />
                    ) : null}
                    <img src={image} alt={caption || username || platformLabel} />
                  </picture>
                </ModalImage>
              )}
              <ModalContent>
                <ModalHeader>
                  <PlatformBadge $bgColor={`${platformColor}14`} style={{ width: 36, height: 36 }}>
                    <PlatformIcon platform={platform} size={20} color={platformColor} />
                  </PlatformBadge>
                  <ModalMeta>
                    {username && <div className="modal-username">{username}</div>}
                    {date && <div className="modal-date">{date}</div>}
                  </ModalMeta>
                  {platformLabel && (
                    <ModalPlatformTag $color={platformColor}>{platformLabel}</ModalPlatformTag>
                  )}
                </ModalHeader>
                {caption && <ModalCaption>{caption}</ModalCaption>}
                {postUrl && (
                  <ViewOriginalBtn href={postUrl} target="_blank" rel="noopener noreferrer">
                    <PlatformIcon platform={platform} size={16} color="#fff" />
                    View on {platformLabel}
                  </ViewOriginalBtn>
                )}
              </ModalContent>
            </div>
          );
        })()}
      </ModalScrollBody>
    </>
  );
}
