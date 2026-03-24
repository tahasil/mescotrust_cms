"use client";

import { useState } from "react";
import { Row, Col } from "antd";
import {
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeModal,
} from "@/styles/Theme";

const GalleryTabs = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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
        ? p.$activeColor || getColor("primary")
        : "rgba(0, 0, 0, 0.12)"};
  background: ${(p) =>
    p.$active ? p.$activeGradient || getColor("gradient") : "transparent"};
  color: ${(p) => (p.$active ? "#fff" : "#050505")};

  &:hover {
    border-color: ${(p) => p.$activeColor || getColor("primary")};
    color: ${(p) =>
      p.$active ? "#fff" : p.$activeColor || getColor("primary")};
  }
`;

const GalleryCard = styled.div`
  width: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
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
    background: linear-gradient(180deg, rgba(5, 5, 5, 0) 0%, #050505 100%);
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
  bottom: 28px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) => p.$color || getColor("primary")};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #fff;
  font-size: 16px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;

  ${GalleryCard}:hover & {
    opacity: 1;
    transform: translateY(0);
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

const ModalImageWrapper = styled.div`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    display: block;
    object-fit: cover;
    max-height: 80vh;
  }
`;

const GalleryLightbox = styled(ThemeModal)`
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

const ModalImageTitle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 16px 14px;
  }
`;

function normalizeItem(it) {
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    image: it?.image != null ? String(it.image).trim() : "",
    categories: Array.isArray(it?.categories)
      ? it.categories
      : it?.category
        ? [String(it.category).trim()]
        : [],
  };
}

const DEFAULT_TABS = ["All", "Education", "Medical", "Events", "Community"];

export default function PhotoGallery(props) {
  const rawItems =
    Array.isArray(props?.photoGalleryItems) &&
    props.photoGalleryItems.length > 0
      ? props.photoGalleryItems
      : [];
  const items = rawItems.map(normalizeItem).filter((it) => it.image);
  const tabs =
    Array.isArray(props?.photoGalleryTabs) && props.photoGalleryTabs.length > 0
      ? props.photoGalleryTabs
          .map((t) => (typeof t === "string" ? t : t?.label || "").trim())
          .filter(Boolean)
      : DEFAULT_TABS;

  const accentColorKey = (props?.photoGalleryAccentColorKey ?? "")
    .toString()
    .trim();
  const accentColor = accentColorKey
    ? getColor(accentColorKey)
    : getColor("primary");

  const [activeTab, setActiveTab] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredItems =
    activeTab === "All"
      ? items
      : items.filter(
          (item) =>
            Array.isArray(item.categories) &&
            item.categories.includes(activeTab),
        );

  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
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

  const PREFIX = "photoGallery";

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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <GalleryTabs>
          {tabs.map((tab) => (
            <GalleryTab
              key={tab}
              $active={activeTab === tab}
              $activeColor={accentColor}
              $activeGradient={getColor("gradient")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </GalleryTab>
          ))}
        </GalleryTabs>

        <Row gutter={[16, 16]}>
          {filteredItems.map((item, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={8} xl={6}>
              <GalleryCard onClick={() => openModal(index)}>
                <img src={item.image} alt={item.title} />
                <GalleryCardTitle>{item.title}</GalleryCardTitle>
                <GalleryCardArrow $color={accentColor}>
                  <ArrowRightOutlined />
                </GalleryCardArrow>
              </GalleryCard>
            </Col>
          ))}
        </Row>
      </PageContainer>

      <GalleryLightbox
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        width={900}
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
            <ModalImageWrapper>
              <img src={currentItem.image} alt={currentItem.title} />
              <ModalImageTitle>{currentItem.title}</ModalImageTitle>
            </ModalImageWrapper>
            <ModalNavButton
              $position="right"
              $color={accentColor}
              onClick={goToNext}
            >
              <RightOutlined />
            </ModalNavButton>
          </>
        )}
      </GalleryLightbox>
    </FullWidthBackground>
  );
}
