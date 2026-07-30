"use client";

import { useState, useMemo } from "react";
import { Row, Col } from "antd";
import {
  CaretRightOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import Link from "next/link";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
  ThemeModal,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

const GalleryTabs = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: flex-start;
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

const ModalNavButton = styled.button`
  position: absolute;
  top: 50%;
  ${(p) => (p.$position === "left" ? "left: -50px;" : "right: -50px;")}
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${(p) => p.$color || getColor("primary")};
  color: #fff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }

  @media (max-width: 992px) {
    ${(p) => (p.$position === "left" ? "left: 10px;" : "right: 10px;")}
    background: rgba(0, 0, 0, 0.6);
  }
`;

const VideoLightbox = styled(ThemeModal)`
  .ant-modal-content {
    aspect-ratio: unset !important;
    filter: none !important;
    overflow: visible !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .ant-modal-body {
    position: relative;
  }
  .ant-modal-close {
    display: none !important;
  }
`;

const ModalVideoWrapper = styled.div`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: #000;
  aspect-ratio: 16 / 9;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
`;

const ModalVideoTitle = styled.div`
  padding: 16px 20px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 0 0 16px 16px;
  margin-top: -8px;

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 12px 14px;
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
        <GalleryTabs className="fable-filters">
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

      <VideoLightbox
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        width={900}
        destroyOnClose
        closable={false}
        styles={{
          mask: {
            backdropFilter: "blur(3px)",
            background: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        {currentItem && (
          <>
            <ModalNavButton
              $position="left"
              $color={accentColor}
              onClick={goToPrev}
            >
              <LeftOutlined />
            </ModalNavButton>
            <ModalVideoWrapper>
              <iframe
                src={`https://www.youtube.com/embed/${currentItem.videoId}?autoplay=1`}
                title={currentItem.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </ModalVideoWrapper>
            <ModalVideoTitle>{currentItem.title}</ModalVideoTitle>
            <ModalNavButton
              $position="right"
              $color={accentColor}
              onClick={goToNext}
            >
              <RightOutlined />
            </ModalNavButton>
          </>
        )}
      </VideoLightbox>
    </FullWidthBackground>
  );
}
