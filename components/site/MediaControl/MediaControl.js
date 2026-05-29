"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { Col, Row } from "antd";

const VIDEO_EXTENSIONS = Object.freeze([
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".m4v",
  ".m3u8",
]);

const AUDIO_EXTENSIONS = Object.freeze([
  ".mp3",
  ".wav",
  ".ogg",
  ".oga",
  ".m4a",
  ".aac",
  ".acc",
  ".flac",
  ".opus",
]);

function isDirectCssColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawKey, fallbackKey) {
  const key = String(rawKey || "").trim();
  if (!key) return fallbackKey ? getColor(fallbackKey) : undefined;
  if (isDirectCssColor(key)) return key;
  return getColor(key) || key;
}

function isGradientColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("gradient") ||
    raw.startsWith("var(--theme-primary-gradient") ||
    raw.startsWith("var(--theme-secondary-gradient")
  );
}

function getTextPaintStyle(colorValue) {
  const value = String(colorValue || "").trim();
  if (!value) return undefined;
  if (!isGradientColor(value)) return { color: value };
  return {
    color: "transparent",
    background: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline-block",
  };
}

function getBackgroundStyleFromThemeColor(rawKey) {
  const value = resolveThemeColorValue(rawKey);
  if (!value) return undefined;
  return { background: value };
}

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function toPositiveNumber(
  value,
  fallback,
  min = 1,
  max = Number.POSITIVE_INFINITY,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const bounded = Math.max(min, Math.min(max, numeric));
  return bounded;
}

function toNonNegativeNumber(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return numeric;
}

function toBoundedVolume(value, fallback = 80) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeAlign(value, fallback = "left") {
  const normalized = String(value ?? fallback)
    .trim()
    .toLowerCase();
  if (
    normalized === "left" ||
    normalized === "center" ||
    normalized === "right"
  ) {
    return normalized;
  }
  return fallback;
}

function normalizeMediaType(value, fallback = "video") {
  const normalized = String(value ?? fallback)
    .trim()
    .toLowerCase();
  return normalized === "audio" ? "audio" : "video";
}

function normalizePreload(value, fallback = "metadata") {
  const normalized = String(value ?? fallback)
    .trim()
    .toLowerCase();
  if (
    normalized === "none" ||
    normalized === "metadata" ||
    normalized === "auto"
  ) {
    return normalized;
  }
  return fallback;
}

function parseUrl(value) {
  const raw = toText(value, "");
  if (!raw) return null;
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function extractYouTubeId(url) {
  const value = toText(url, "");
  if (!value) return "";

  const directMatch = value.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?.*v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
  );
  if (directMatch?.[1]) return directMatch[1];

  const parsed = parseUrl(value);
  if (!parsed) return "";

  const host = parsed.hostname.toLowerCase();
  if (!host.includes("youtube.com") && !host.includes("youtu.be")) return "";

  const v = parsed.searchParams.get("v");
  if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

  const segments = parsed.pathname.split("/").filter(Boolean);
  const maybeId = segments[segments.length - 1] || "";
  return /^[a-zA-Z0-9_-]{11}$/.test(maybeId) ? maybeId : "";
}

function hasKnownExtension(url, extensions) {
  const value = toText(url, "").toLowerCase();
  if (!value) return false;
  return extensions.some((ext) => value.includes(ext));
}

function normalizeMediaSource({
  mediaType,
  youtubeUrl,
  uploadedMediaUrl,
  externalMediaUrl,
}) {
  const uploaded = toText(uploadedMediaUrl, "");
  const external = toHttpsUrlIfNeeded(toText(externalMediaUrl, ""));
  const yt = toHttpsUrlIfNeeded(toText(youtubeUrl, ""));

  if (yt) {
    const youtubeId = extractYouTubeId(yt);
    if (youtubeId) {
      if (mediaType === "audio") {
        return {
          kind: "unsupported",
          src: yt,
          youtubeId: "",
          reason: "youtube_audio_not_supported",
        };
      }
      return { kind: "youtube", src: yt, youtubeId, reason: "" };
    }
  }

  const candidate = uploaded || external;
  if (!candidate) return { kind: "none", src: "", youtubeId: "", reason: "" };

  if (/youtube\.com|youtu\.be/i.test(candidate)) {
    const youtubeId = extractYouTubeId(candidate);
    if (youtubeId) {
      if (mediaType === "audio") {
        return {
          kind: "unsupported",
          src: candidate,
          youtubeId: "",
          reason: "youtube_audio_not_supported",
        };
      }
      return { kind: "youtube", src: candidate, youtubeId, reason: "" };
    }
  }

  const isVideoLike =
    mediaType === "video"
      ? true
      : hasKnownExtension(candidate, VIDEO_EXTENSIONS) &&
        !hasKnownExtension(candidate, AUDIO_EXTENSIONS);
  const isAudioLike =
    mediaType === "audio" ||
    hasKnownExtension(candidate, AUDIO_EXTENSIONS) ||
    candidate.startsWith("/media/");

  if (isVideoLike || isAudioLike) {
    return {
      kind: "html5",
      src: candidate,
      youtubeId: "",
      html5Type: mediaType === "audio" ? "audio" : "video",
      reason: "",
    };
  }

  return {
    kind: "unsupported",
    src: candidate,
    youtubeId: "",
    reason: "",
  };
}

function useInViewOnce() {
  const targetRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = targetRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [targetRef, inView];
}

function buildYouTubeSrc({
  youtubeId,
  autoplay,
  loop,
  muted,
  controls,
  startTime,
  endTime,
}) {
  if (!youtubeId) return "";
  const params = new URLSearchParams();
  params.set("autoplay", autoplay ? "1" : "0");
  params.set("mute", muted ? "1" : "0");
  params.set("controls", controls ? "1" : "0");
  params.set("playsinline", "1");
  params.set("rel", "0");
  params.set("modestbranding", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", youtubeId);
  }
  if (startTime > 0) params.set("start", String(Math.floor(startTime)));
  if (endTime > 0 && endTime > startTime) {
    params.set("end", String(Math.floor(endTime)));
  }
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

function toHttpsUrlIfNeeded(url) {
  const value = toText(url, "");
  if (!value.startsWith("http://")) return value;
  return `https://${value.slice("http://".length)}`;
}

function PlayGlyph() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M9 7.5L16.25 12L9 16.5V7.5Z" fill="currentColor" />
    </svg>
  );
}

const MediaControlShell = styled.div`
  --mc-player-height-desktop: 340px;
  --mc-player-height-mobile: 230px;
  --mc-player-radius: 18px;
  --mc-player-bg: linear-gradient(
    140deg,
    #05070a 0%,
    #0a0f17 55%,
    #02040a 100%
  );
  --mc-player-border: rgba(255, 255, 255, 0.14);
  --mc-placeholder-title: #ffffff;
  --mc-placeholder-subtitle: rgba(255, 255, 255, 0.62);
  --mc-play-bg: #f8b737;
  --mc-play-icon: #0f2236;
  --mc-play-size: 54px;
  --mc-play-icon-size: 18px;

  .mc-root {
    width: 100%;
  }

  .mc-head {
    display: grid;
    gap: 8px;
    margin-bottom: 20px;
  }

  .mc-player {
    position: relative;
    width: 100%;
    height: var(--mc-player-height-desktop);
    border-radius: var(--mc-player-radius);
    overflow: hidden;
    background: var(--mc-player-bg);
    border: 1px solid var(--mc-player-border);
    /* box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.02),
      0 16px 34px rgba(0, 0, 0, 0.3); */
  }

  .mc-player::before {
    content: "";
    position: absolute;
    inset: -20% -10%;
    background:
      radial-gradient(
        circle at 14% 24%,
        rgba(255, 255, 255, 0.08),
        transparent 48%
      ),
      radial-gradient(
        circle at 86% 78%,
        rgba(255, 255, 255, 0.06),
        transparent 45%
      );
    pointer-events: none;
  }

  .mc-player::after {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      112deg,
      rgba(255, 255, 255, 0.02) 0,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 1px,
      transparent 16px
    );
    opacity: 0.35;
    pointer-events: none;
  }

  .mc-poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .mc-content-layer {
    position: relative;
    z-index: 1;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 28px 24px;
  }

  .mc-player-frame {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }

  .mc-player-frame iframe,
  .mc-player-frame video,
  .mc-player-frame audio {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
    background: transparent;
  }

  .mc-player-frame.audio-active {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 24px;
    background: rgba(2, 7, 14, 0.58);
    backdrop-filter: blur(4px);
  }

  .mc-player-frame.audio-active audio {
    height: auto;
    max-width: 760px;
  }

  .mc-copy {
    max-width: min(740px, 100%);
    display: grid;
    gap: 8px;
    justify-items: center;
  }

  .mc-title {
    margin: 0;
    color: var(--mc-placeholder-title);
    font-size: clamp(22px, 2.2vw, 30px);
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.15;
  }

  .mc-subtitle {
    margin: 0;
    color: var(--mc-placeholder-subtitle);
    font-size: clamp(14px, 1.05vw, 16px);
    line-height: 1.45;
    max-width: 640px;
  }

  .mc-play-btn {
    border: 0;
    width: var(--mc-play-size);
    height: var(--mc-play-size);
    min-width: var(--mc-play-size);
    border-radius: 999px;
    color: var(--mc-play-icon);
    background: var(--mc-play-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.42);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      opacity 0.18s ease;
    position: relative;
    overflow: hidden;
    margin-bottom: 18px;
  }

  .mc-play-btn:hover {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  }

  .mc-play-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .mc-play-btn-icon {
    width: var(--mc-play-icon-size);
    height: var(--mc-play-icon-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mc-play-btn-icon.custom img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  @media (max-width: 991.98px) {
    .mc-head {
      margin-bottom: 16px;
    }
  }

  @media (max-width: 767.98px) {
    .mc-player {
      height: var(--mc-player-height-mobile);
    }

    .mc-content-layer {
      padding: 20px 16px;
    }

    .mc-player-frame.audio-active {
      padding: 16px;
    }
  }
`;

/**
 * Site component: MediaControl.
 * Reusable, CMS-driven media section that supports video/audio and placeholders.
 */
export default function MediaControl(props) {
  const mediaType = normalizeMediaType(props?.mediaControlMediaType, "video");
  const startTime = toNonNegativeNumber(props?.mediaControlStartTime, 0);
  const endTime = toNonNegativeNumber(props?.mediaControlEndTime, 0);
  const autoplay = toBoolean(props?.mediaControlAutoplay, false);
  const loop = toBoolean(props?.mediaControlLoop, false);
  const muted = toBoolean(props?.mediaControlMuted, false);
  const controlsVisible = toBoolean(props?.mediaControlShowControls, true);
  const fullscreenEnabled = toBoolean(
    props?.mediaControlEnableFullscreen,
    true,
  );
  const downloadEnabled = toBoolean(props?.mediaControlEnableDownload, true);
  const volume = toBoundedVolume(props?.mediaControlVolume, 80);
  const preload = normalizePreload(props?.mediaControlPreload, "metadata");

  const mainTitle = toText(props?.mainTitle, "");
  const subTitle = toText(props?.subTitle, "");
  const titleAlign = normalizeAlign(props?.titleAlign, "left");
  const titleColor = resolveThemeColorValue(props?.titleColorKey, "primary");
  const subTitleColor = resolveThemeColorValue(
    props?.subTitleColorKey,
    "black",
  );

  const placeholderTitle = toText(
    props?.mediaControlPlaceholderTitle,
    mediaType === "audio"
      ? "Audio Content Coming Soon"
      : "Video Content Coming Soon",
  );
  const placeholderSubTitle = toText(
    props?.mediaControlPlaceholderSubTitle,
    mediaType === "audio"
      ? "Conversations with the executive team, coaches, and successful founders."
      : "Events, programme highlights, and community stories.",
  );
  const unsupportedTitle = toText(
    props?.mediaControlUnsupportedTitle,
    "Unsupported Media Source",
  );
  const unsupportedSubTitle = toText(
    props?.mediaControlUnsupportedSubTitle,
    "Please provide a supported media URL or upload a media file.",
  );

  const mediaSource = useMemo(
    () =>
      normalizeMediaSource({
        mediaType,
        youtubeUrl: props?.mediaControlYouTubeUrl,
        uploadedMediaUrl: props?.mediaControlUploadedMediaUrl,
        externalMediaUrl:
          props?.mediaControlExternalMediaUrl ?? props?.mediaControlMediaUrl,
      }),
    [
      mediaType,
      props?.mediaControlYouTubeUrl,
      props?.mediaControlUploadedMediaUrl,
      props?.mediaControlExternalMediaUrl,
      props?.mediaControlMediaUrl,
    ],
  );

  const hasSource = mediaSource.kind !== "none";
  const hasPlayableSource =
    mediaSource.kind === "youtube" || mediaSource.kind === "html5";
  const isUnsupported = mediaSource.kind === "unsupported";
  const unsupportedSubTitleResolved =
    mediaSource?.reason === "youtube_audio_not_supported"
      ? "YouTube links are not supported in audio mode. Use an MP3/WAV URL or an uploaded audio file."
      : unsupportedSubTitle;

  const [containerRef, inView] = useInViewOnce();
  const [isActivated, setIsActivated] = useState(autoplay && hasPlayableSource);
  const html5Ref = useRef(null);
  const [html5Src, setHtml5Src] = useState(mediaSource.src || "");
  const [hasTriedHttpsFallback, setHasTriedHttpsFallback] = useState(false);
  const [html5Failed, setHtml5Failed] = useState(false);

  useEffect(() => {
    setIsActivated(autoplay && hasPlayableSource);
  }, [
    autoplay,
    hasPlayableSource,
    mediaSource.src,
    mediaSource.kind,
    mediaType,
  ]);

  useEffect(() => {
    setHtml5Src(mediaSource.src || "");
    setHasTriedHttpsFallback(false);
    setHtml5Failed(false);
  }, [mediaSource.src, mediaSource.kind]);

  useEffect(() => {
    const node = html5Ref.current;
    if (!node) return;
    if (node.volume !== volume / 100) {
      node.volume = volume / 100;
    }
  }, [volume, isActivated, mediaSource.src]);

  useEffect(() => {
    const node = html5Ref.current;
    if (!node || mediaSource.kind !== "html5") return;

    const onLoadedMetadata = () => {
      if (startTime > 0) {
        try {
          node.currentTime = startTime;
        } catch {
          return;
        }
      }
    };

    const onTimeUpdate = () => {
      if (endTime <= 0 || endTime <= startTime) return;
      if (node.currentTime < endTime) return;

      if (loop) {
        node.currentTime = startTime > 0 ? startTime : 0;
        const playback = node.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(() => {});
        }
        return;
      }

      node.pause();
    };

    node.addEventListener("loadedmetadata", onLoadedMetadata);
    node.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      node.removeEventListener("loadedmetadata", onLoadedMetadata);
      node.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [endTime, loop, mediaSource.kind, startTime, mediaSource.src]);

  const hasPlayableSourceEffective = hasPlayableSource && !html5Failed;
  const isRuntimeUnsupported = isUnsupported || html5Failed;
  const runtimeUnsupportedSubTitle = html5Failed
    ? "The media URL could not be loaded. Verify the URL with HTTPS or use an uploaded local file."
    : unsupportedSubTitleResolved;
  const requiresAudioActivation =
    mediaType === "audio" && !controlsVisible && !autoplay;
  const canRenderPlayer =
    inView &&
    hasPlayableSourceEffective &&
    (mediaType === "audio"
      ? requiresAudioActivation
        ? isActivated
        : true
      : isActivated || autoplay);
  const posterImageUrl = toText(props?.mediaControlPosterImageUrl, "");
  const customPlayIconUrl = toText(props?.mediaControlPlayIconUrl, "");

  const playerHeightDesktop = toPositiveNumber(
    props?.mediaControlPlayerHeightDesktop,
    340,
    180,
    1200,
  );
  const playerHeightMobile = toPositiveNumber(
    props?.mediaControlPlayerHeightMobile,
    230,
    140,
    800,
  );
  const playerRadius = toPositiveNumber(
    props?.mediaControlPlayerRadius,
    18,
    0,
    60,
  );
  const playButtonSize = toPositiveNumber(
    props?.mediaControlPlayButtonSize,
    54,
    28,
    180,
  );
  const playIconSize = toPositiveNumber(
    props?.mediaControlPlayIconSize,
    18,
    10,
    100,
  );

  const containerBgColor =
    resolveThemeColorValue(props?.mediaControlContainerBgColorKey, "") ||
    "linear-gradient(140deg, #05070a 0%, #0a0f17 55%, #02040a 100%)";
  const containerBorderColor =
    resolveThemeColorValue(props?.mediaControlContainerBorderColorKey, "") ||
    "rgba(255, 255, 255, 0.14)";
  const placeholderTitleColor =
    resolveThemeColorValue(props?.mediaControlPlaceholderTitleColorKey, "") ||
    "#ffffff";
  const placeholderSubTitleColor =
    resolveThemeColorValue(
      props?.mediaControlPlaceholderSubTitleColorKey,
      "",
    ) || "rgba(255, 255, 255, 0.62)";
  const playIconBgColor =
    resolveThemeColorValue(props?.mediaControlPlayIconBgColorKey, "") ||
    "#f8b737";
  const playIconColor =
    resolveThemeColorValue(props?.mediaControlPlayIconColorKey, "") ||
    "#0f2236";

  const rootStyle = {
    "--mc-player-height-desktop": `${playerHeightDesktop}px`,
    "--mc-player-height-mobile": `${playerHeightMobile}px`,
    "--mc-player-radius": `${playerRadius}px`,
    "--mc-player-bg": containerBgColor,
    "--mc-player-border": containerBorderColor,
    "--mc-placeholder-title": placeholderTitleColor,
    "--mc-placeholder-subtitle": placeholderSubTitleColor,
    "--mc-play-bg": playIconBgColor,
    "--mc-play-icon": playIconColor,
    "--mc-play-size": `${playButtonSize}px`,
    "--mc-play-icon-size": `${playIconSize}px`,
  };

  const sectionBgType = toText(props?.mediaControlSectionBgType, "default");
  const sectionBgImage = toText(props?.mediaControlSectionBgImage, "");
  const sectionBgColorKey = toText(props?.mediaControlSectionBgColorKey, "");
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? getBackgroundStyleFromThemeColor(sectionBgColorKey)
        : undefined;
  const sectionPaddingTop =
    props?.mediaControlSectionPaddingTop != null
      ? Number(props.mediaControlSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.mediaControlSectionPaddingBottom != null
      ? Number(props.mediaControlSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.mediaControlSectionMarginTop != null
      ? Number(props.mediaControlSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.mediaControlSectionMarginBottom != null
      ? Number(props.mediaControlSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = toText(
    props?.mediaControlPageContainerBgType,
    "default",
  );
  const pageContainerBgImage = toText(
    props?.mediaControlPageContainerBgImage,
    "",
  );
  const pageContainerBgColorKey = toText(
    props?.mediaControlPageContainerBgColorKey,
    "",
  );
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? getBackgroundStyleFromThemeColor(pageContainerBgColorKey)
        : undefined;
  const containerPaddingTop =
    props?.mediaControlPageContainerPaddingTop != null
      ? Number(props.mediaControlPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.mediaControlPageContainerPaddingRight != null
      ? Number(props.mediaControlPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.mediaControlPageContainerPaddingBottom != null
      ? Number(props.mediaControlPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.mediaControlPageContainerPaddingLeft != null
      ? Number(props.mediaControlPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.mediaControlPageContainerMarginTop != null
      ? Number(props.mediaControlPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.mediaControlPageContainerMarginBottom != null
      ? Number(props.mediaControlPageContainerMarginBottom)
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  const youtubeEmbedSrc =
    mediaSource.kind === "youtube"
      ? buildYouTubeSrc({
          youtubeId: mediaSource.youtubeId,
          autoplay: autoplay || isActivated,
          loop,
          muted,
          controls: controlsVisible,
          startTime,
          endTime,
        })
      : "";

  const controlsList = [
    !downloadEnabled ? "nodownload" : "",
    !fullscreenEnabled ? "nofullscreen" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headingVisible = Boolean(mainTitle || subTitle);
  const showPoster =
    Boolean(posterImageUrl) && (!canRenderPlayer || mediaType === "audio");

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <MediaControlShell style={rootStyle}>
          <section className="mc-root" ref={containerRef}>
            {headingVisible ? (
              <header className="mc-head" style={{ textAlign: titleAlign }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={16}>
                    {mainTitle ? (
                      <MainTitle style={{ textAlign: titleAlign }}>
                        <span style={getTextPaintStyle(titleColor)}>
                          {mainTitle}
                        </span>
                      </MainTitle>
                    ) : null}
                    {subTitle ? (
                      <SubTitle style={{ textAlign: titleAlign }}>
                        <span style={getTextPaintStyle(subTitleColor)}>
                          {subTitle}
                        </span>
                      </SubTitle>
                    ) : null}
                  </Col>
                </Row>
              </header>
            ) : null}

            <div className="mc-player">
              {showPoster ? (
                <img
                  className="mc-poster"
                  src={posterImageUrl}
                  alt=""
                  loading="lazy"
                />
              ) : null}

              {canRenderPlayer && mediaSource.kind === "youtube" ? (
                <div className="mc-player-frame">
                  <iframe
                    src={youtubeEmbedSrc}
                    title={
                      mediaType === "audio" ? "Audio player" : "Video player"
                    }
                    allow={
                      fullscreenEnabled
                        ? "autoplay; encrypted-media; picture-in-picture; fullscreen"
                        : "autoplay; encrypted-media; picture-in-picture"
                    }
                    allowFullScreen={fullscreenEnabled}
                    loading="lazy"
                  />
                </div>
              ) : null}

              {canRenderPlayer &&
              mediaSource.kind === "html5" &&
              mediaSource.html5Type === "video" ? (
                <div className="mc-player-frame">
                    <video
                      ref={html5Ref}
                      src={html5Src}
                      autoPlay={autoplay || isActivated}
                    loop={loop && !(endTime > 0 && endTime > startTime)}
                    muted={muted}
                    controls={controlsVisible}
                    preload={preload}
                    playsInline
                    poster={posterImageUrl || undefined}
                    controlsList={controlsList || undefined}
                      disablePictureInPicture={!fullscreenEnabled}
                      onError={() => {
                        if (hasTriedHttpsFallback) return;
                        const upgraded = toHttpsUrlIfNeeded(html5Src);
                        if (!upgraded || upgraded === html5Src) {
                          setHtml5Failed(true);
                          return;
                        }
                        setHasTriedHttpsFallback(true);
                        setHtml5Src(upgraded);
                      }}
                    />
                </div>
              ) : null}

              {canRenderPlayer &&
              mediaSource.kind === "html5" &&
              mediaSource.html5Type === "audio" ? (
                <div className="mc-player-frame audio-active">
                  <audio
                    ref={html5Ref}
                    src={html5Src}
                    autoPlay={autoplay}
                    loop={loop && !(endTime > 0 && endTime > startTime)}
                    muted={muted}
                    controls={controlsVisible}
                    preload={preload}
                    controlsList={!downloadEnabled ? "nodownload" : undefined}
                    onError={() => {
                      if (hasTriedHttpsFallback) return;
                      const upgraded = toHttpsUrlIfNeeded(html5Src);
                      if (!upgraded || upgraded === html5Src) {
                        setHtml5Failed(true);
                        return;
                      }
                      setHasTriedHttpsFallback(true);
                      setHtml5Src(upgraded);
                    }}
                  />
                </div>
              ) : null}

              {!canRenderPlayer || !hasPlayableSource ? (
                <div className="mc-content-layer">
                  <div className="mc-copy">
                    <button
                      type="button"
                      className="mc-play-btn"
                      onClick={() => {
                        if (!hasPlayableSource) return;
                        setIsActivated(true);
                      }}
                      disabled={!hasPlayableSource}
                      aria-label={
                        mediaType === "audio" ? "Play audio" : "Play video"
                      }
                    >
                      <span
                        className={`mc-play-btn-icon${customPlayIconUrl ? " custom" : ""}`}
                      >
                        {customPlayIconUrl ? (
                          <img src={customPlayIconUrl} alt="" loading="lazy" />
                        ) : (
                          <PlayGlyph />
                        )}
                      </span>
                    </button>

                    {isRuntimeUnsupported ? (
                      <>
                        <p className="mc-title">{unsupportedTitle}</p>
                        {runtimeUnsupportedSubTitle ? (
                          <p className="mc-subtitle">{runtimeUnsupportedSubTitle}</p>
                        ) : null}
                      </>
                    ) : !hasSource ? (
                      <>
                        <p className="mc-title">{placeholderTitle}</p>
                        {placeholderSubTitle ? (
                          <p className="mc-subtitle">{placeholderSubTitle}</p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </MediaControlShell>
      </PageContainer>
    </FullWidthBackground>
  );
}
