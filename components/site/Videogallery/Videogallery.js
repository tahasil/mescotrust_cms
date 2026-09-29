"use client";

import { useState, useMemo, useEffect } from "react";
import { Row, Col } from "antd";
import {
  CaretRightOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import Link from "next/link";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

const GalleryTabs = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$alignment === "left"
      ? "flex-start"
      : props.$alignment === "right"
        ? "flex-end"
        : "center"};
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 46px;
`;

const GalleryTab = styled.button`
  padding: 8px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid
    ${(p) =>
      p.$active
        ? p.$tabBgColor || p.$tabBorderColor || getColor("primary")
        : p.$tabBorderColor || "rgba(0, 0, 0, 0.12)"};
  background: ${(p) =>
    p.$active ? p.$tabBgColor || getColor("gradient") : "transparent"};
  color: ${(p) =>
    p.$active
      ? p.$tabTextColor || "#fff"
      : p.$tabInactiveTextColor || "#2A283E"};

  &:hover {
    border-color: ${(p) =>
      p.$tabHoverBorderColor || p.$tabBgColor || getColor("primary")};
    color: ${(p) =>
      p.$active
        ? p.$tabTextColor || "#fff"
        : p.$tabHoverTextColor || getColor("primary")};
  }
`;

const GalleryCard = styled.div`
  width: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 16 / 9.6;
  background: ${() => getColor("dark")};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(42, 40, 62, 0) 0%, #2A283E 100%);
    pointer-events: none;
  }
`;

const GalleryCardTitle = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 60px;
  padding: 16px 20px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  z-index: 1;
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 12px 16px;
  }
`;

const GalleryCardArrow = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  bottom: auto;
  right: auto;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${(p) => p.$color || getColor("primary")};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #fff;
  font-size: 16px;
  opacity: 1;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;

  ${GalleryCard}:hover & {
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const VideoLightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(10, 9, 15, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  animation: videoFadeIn 0.25s ease-out;

  @keyframes videoFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const LightboxTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  pointer-events: none;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const LightboxCounter = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.04em;
  font-family: inherit;
  pointer-events: auto;
`;

const LightboxCloseButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.06);
  }

  @media (max-width: 768px) {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
`;

const LightboxNavButton = styled.button`
  position: absolute;
  top: 50%;
  ${(p) => (p.$position === "left" ? "left: 24px;" : "right: 24px;")}
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

  &:hover {
    background: ${(p) => p.$accentColor || getColor("primary")};
    border-color: transparent;
    transform: translateY(-50%) scale(1.1);
    color: #ffffff;
  }

  @media (max-width: 991px) {
    width: 44px;
    height: 44px;
    font-size: 18px;
    ${(p) => (p.$position === "left" ? "left: 12px;" : "right: 12px;")}
  }

  @media (max-width: 576px) {
    width: 38px;
    height: 38px;
    font-size: 16px;
    ${(p) => (p.$position === "left" ? "left: 8px;" : "right: 8px;")}
  }
`;

const LightboxDialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  z-index: 10;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  animation: videoScaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes videoScaleIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (max-width: 1100px) {
    max-width: 82vw;
  }

  @media (max-width: 768px) {
    max-width: 94vw;
  }
`;

const LightboxVideoFrame = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000000;
  position: relative;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
`;

const LightboxTitleBar = styled.div`
  width: 100%;
  padding: 16px 22px;
  background: rgba(18, 16, 24, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;

  .title-text {
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  .cat-tag {
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    .title-text {
      font-size: 14px;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
`;

function normalizeItem(it) {
  const cats = Array.isArray(it?.categories)
    ? it.categories
    : it?.category
      ? [String(it.category).trim()]
      : [];
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    videoId: it?.videoId != null ? String(it.videoId).trim() : "",
    categories: cats.filter((c) => c !== "All"),
  };
}

const DEFAULT_TABS = ["All", "Education", "Medical", "Events", "Community"];

export default function Videogallery(props) {
  const subTitle = (props?.videogallerySubTitle ?? "").toString().trim();
  const mainTitle = (props?.videogalleryMainTitle ?? "").toString().trim();
  const subTitleColorKey = (props?.videogallerySubTitleColorKey ?? "").toString().trim();
  const titleColorKey = (props?.videogalleryTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("black");
  const rawItems =
    Array.isArray(props?.videogalleryItems) &&
    props.videogalleryItems.length > 0
      ? props.videogalleryItems
      : [];
  const items = rawItems.map(normalizeItem).filter((it) => it.videoId);
  const tabs =
    Array.isArray(props?.videogalleryTabs) && props.videogalleryTabs.length > 0
      ? props.videogalleryTabs
          .map((t) => (typeof t === "string" ? t : t?.label || "").trim())
          .filter(Boolean)
      : DEFAULT_TABS;
  const tabAlignment = ["left", "center", "right"].includes(
    props?.videogalleryTabAlignment,
  )
    ? props.videogalleryTabAlignment
    : "center";

  const accentColorKey = (props?.videogalleryAccentColorKey ?? "")
    .toString()
    .trim();
  const accentColor = accentColorKey
    ? getColor(accentColorKey)
    : getColor("primary");

  const tabBgKey = (props?.videogalleryTabBgColorKey ?? "").toString().trim();
  const tabBgColor = tabBgKey ? getColor(tabBgKey) : undefined;
  const tabTextKey = (props?.videogalleryTabTextColorKey ?? "")
    .toString()
    .trim();
  const tabTextColor = tabTextKey ? getColor(tabTextKey) : undefined;
  const tabBorderKey = (props?.videogalleryTabBorderColorKey ?? "")
    .toString()
    .trim();
  const tabBorderColor = tabBorderKey ? getColor(tabBorderKey) : undefined;
  const tabInactiveTextKey = (props?.videogalleryTabInactiveTextColorKey ?? "")
    .toString()
    .trim();
  const tabInactiveTextColor = tabInactiveTextKey
    ? getColor(tabInactiveTextKey)
    : undefined;
  const tabHoverBorderKey = (props?.videogalleryTabHoverBorderColorKey ?? "")
    .toString()
    .trim();
  const tabHoverBorderColor = tabHoverBorderKey
    ? getColor(tabHoverBorderKey)
    : undefined;
  const tabHoverTextKey = (props?.videogalleryTabHoverTextColorKey ?? "")
    .toString()
    .trim();
  const tabHoverTextColor = tabHoverTextKey
    ? getColor(tabHoverTextKey)
    : undefined;

  const limitEnabled = props?.videogalleryLimitEnabled === true || props?.videogalleryLimitEnabled === "true";
  const limitCount = props?.videogalleryLimitCount != null ? Number(props.videogalleryLimitCount) : 6;
  const viewMoreText = (props?.videogalleryViewMoreText ?? "View More").toString().trim();
  const viewMoreLink = (props?.videogalleryViewMoreLink ?? "").toString().trim();

  const [activeTab, setActiveTab] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allFilteredItems =
    activeTab === "All"
      ? items
      : items.filter(
          (item) =>
            Array.isArray(item.categories) &&
            item.categories.includes(activeTab),
        );
  const filteredItems = limitEnabled ? allFilteredItems.slice(0, limitCount) : allFilteredItems;

  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === filteredItems.length - 1 ? 0 : prev + 1,
    );
  };

  const currentItem = filteredItems[currentIndex];

  useEffect(() => {
    if (!modalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === filteredItems.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen, filteredItems.length]);

  const PREFIX = "videogallery";

  const sectionBgType = (
    props?.[PREFIX + "SectionBgType"] ?? "default"
  ).toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "")
    .toString()
    .trim();
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
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.[PREFIX + "SectionPaddingTop"] != null
      ? Number(props[PREFIX + "SectionPaddingTop"])
      : null;
  const sectionPaddingBottom =
    props?.[PREFIX + "SectionPaddingBottom"] != null
      ? Number(props[PREFIX + "SectionPaddingBottom"])
      : null;
  const sectionMarginTop =
    props?.[PREFIX + "SectionMarginTop"] != null
      ? Number(props[PREFIX + "SectionMarginTop"])
      : null;
  const sectionMarginBottom =
    props?.[PREFIX + "SectionMarginBottom"] != null
      ? Number(props[PREFIX + "SectionMarginBottom"])
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

  const pageContainerBgType = (
    props?.[PREFIX + "PageContainerBgType"] ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.[PREFIX + "PageContainerBgColorKey"] ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.[PREFIX + "PageContainerPaddingTop"] != null
      ? Number(props[PREFIX + "PageContainerPaddingTop"])
      : null;
  const containerPaddingRight =
    props?.[PREFIX + "PageContainerPaddingRight"] != null
      ? Number(props[PREFIX + "PageContainerPaddingRight"])
      : null;
  const containerPaddingBottom =
    props?.[PREFIX + "PageContainerPaddingBottom"] != null
      ? Number(props[PREFIX + "PageContainerPaddingBottom"])
      : null;
  const containerPaddingLeft =
    props?.[PREFIX + "PageContainerPaddingLeft"] != null
      ? Number(props[PREFIX + "PageContainerPaddingLeft"])
      : null;
  const containerMarginTop =
    props?.[PREFIX + "PageContainerMarginTop"] != null
      ? Number(props[PREFIX + "PageContainerMarginTop"])
      : null;
  const containerMarginBottom =
    props?.[PREFIX + "PageContainerMarginBottom"] != null
      ? Number(props[PREFIX + "PageContainerMarginBottom"])
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

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        {(subTitle || mainTitle) ? (
          <header className="fable-section-heading">
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p> : null}
            {mainTitle ? <h2 className="fable-heading" style={{ color: titleColor }}>{renderHighlightedTitle(mainTitle, props, { legacyColorKey: props?.videogalleryAccentColorKey })}</h2> : null}
          </header>
        ) : null}
        <GalleryTabs className="fable-filters" $alignment={tabAlignment}>
          {tabs.map((tab) => (
            <GalleryTab
              className={`fable-filter${activeTab === tab ? " is-active" : ""}`}
              key={tab}
              $active={activeTab === tab}
              $tabBgColor={tabBgColor}
              $tabTextColor={tabTextColor}
              $tabBorderColor={tabBorderColor}
              $tabInactiveTextColor={tabInactiveTextColor}
              $tabHoverBorderColor={tabHoverBorderColor}
              $tabHoverTextColor={tabHoverTextColor}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </GalleryTab>
          ))}
        </GalleryTabs>

        <Row gutter={[24, 24]}>
          {filteredItems.map((item, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={8}>
              <GalleryCard className="fable-video" onClick={() => openModal(index)}>
                <img loading="lazy"
                  src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                  alt={item.title}
                />
                <GalleryCardTitle>{item.title}</GalleryCardTitle>
                <GalleryCardArrow className="fable-video__play" $color={accentColor}>
                  <CaretRightOutlined />
                </GalleryCardArrow>
              </GalleryCard>
            </Col>
          ))}
        </Row>

        {limitEnabled && viewMoreLink && allFilteredItems.length > limitCount && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href={viewMoreLink}>
              <ThemeButton type="button" size="large">
                {viewMoreText}
              </ThemeButton>
            </Link>
          </div>
        )}
        </div>
      </PageContainer>

      {modalOpen && currentItem && (
        <VideoLightboxOverlay onClick={closeModal}>
          <LightboxTopBar>
            <LightboxCounter>
              {currentIndex + 1} / {filteredItems.length}
            </LightboxCounter>
            <LightboxCloseButton onClick={closeModal} title="Close (Esc)">
              <CloseOutlined />
            </LightboxCloseButton>
          </LightboxTopBar>

          {filteredItems.length > 1 && (
            <>
              <LightboxNavButton
                $position="left"
                $accentColor={accentColor}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                title="Previous video"
              >
                <LeftOutlined />
              </LightboxNavButton>
              <LightboxNavButton
                $position="right"
                $accentColor={accentColor}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                title="Next video"
              >
                <RightOutlined />
              </LightboxNavButton>
            </>
          )}

          <LightboxDialog onClick={(e) => e.stopPropagation()}>
            <LightboxVideoFrame>
              <iframe
                src={`https://www.youtube.com/embed/${currentItem.videoId}?autoplay=1&rel=0`}
                title={currentItem.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </LightboxVideoFrame>
            <LightboxTitleBar>
              <div className="title-text" title={currentItem.title}>
                {currentItem.title}
              </div>
              {Array.isArray(currentItem.categories) && currentItem.categories.length > 0 && (
                <div className="cat-tag">
                  {currentItem.categories.join(", ")}
                </div>
              )}
            </LightboxTitleBar>
          </LightboxDialog>
        </VideoLightboxOverlay>
      )}
    </FullWidthBackground>
  );
}
