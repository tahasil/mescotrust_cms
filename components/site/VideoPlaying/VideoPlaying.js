"use client";

import { useState } from "react";
import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";

const HomeVideoWrapper = styled.div`
  width: 90%;
  position: relative;
  margin: 0 auto;
  border: none;
  background: ${() => getColor("black")};
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 16/9;
  img,
  iframe {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    border: none;
  }
`;

const VideoCover = styled.div`
  position: absolute;
  inset: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }

  .play-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    padding: 0;
    cursor: pointer;
  }

  .play-btn svg {
    width: 32px;
    height: 32px;
    margin-left: 4px;
    color: #2c2c2c;
  }

  &:hover .play-btn {
    transform: scale(1.05);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.35);
  }

  &:hover .play-btn svg {
    color: #1a1a1a;
  }
`;

/**
 * Site component: VideoPlaying.
 * YouTube video player with cover image and play button.
 * All elements are editable via EditForm.
 */
export default function VideoPlaying(props) {
  const [videoPlaying, setVideoPlaying] = useState(false);

  /* ── Content ── */
  const youtubeVideoId = (props?.youtubeVideoId ?? "dQw4w9WgXcQ").toString().trim();
  const coverImage = (props?.coverImage ?? "/images/player-cover.png").toString().trim();
  const coverAlt = (props?.coverAlt ?? "Video cover").toString().trim();

  /* ── Section background ── */
  const sectionBgType = (props?.videoPlayingSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.videoPlayingSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.videoPlayingSectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.videoPlayingSectionPaddingTop != null ? Number(props.videoPlayingSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.videoPlayingSectionPaddingBottom != null ? Number(props.videoPlayingSectionPaddingBottom) : null;
  const sectionMarginTop = props?.videoPlayingSectionMarginTop != null ? Number(props.videoPlayingSectionMarginTop) : null;
  const sectionMarginBottom = props?.videoPlayingSectionMarginBottom != null ? Number(props.videoPlayingSectionMarginBottom) : null;
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

  /* ── Page container background ── */
  const pageContainerBgType = (props?.videoPlayingPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.videoPlayingPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.videoPlayingPageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.videoPlayingPageContainerPaddingTop != null ? Number(props.videoPlayingPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.videoPlayingPageContainerPaddingRight != null ? Number(props.videoPlayingPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.videoPlayingPageContainerPaddingBottom != null ? Number(props.videoPlayingPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.videoPlayingPageContainerPaddingLeft != null ? Number(props.videoPlayingPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.videoPlayingPageContainerMarginTop != null ? Number(props.videoPlayingPageContainerMarginTop) : null;
  const containerMarginBottom = props?.videoPlayingPageContainerMarginBottom != null ? Number(props.videoPlayingPageContainerMarginBottom) : null;
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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]}>
          <Col
            span={{ span: 24, offset: 0 }}
            sm={{ span: 24, offset: 0 }}
            md={{ span: 20, offset: 2 }}
            lg={{ span: 20, offset: 2 }}
          >
            <HomeVideoWrapper>
              {videoPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img loading="lazy" src={coverImage} alt={coverAlt} />
                  <VideoCover
                    onClick={() => setVideoPlaying(true)}
                    role="button"
                    aria-label="Play video"
                  >
                    <button
                      type="button"
                      className="play-btn"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7L8 5z" />
                      </svg>
                    </button>
                  </VideoCover>
                </>
              )}
            </HomeVideoWrapper>
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
