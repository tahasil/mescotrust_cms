"use client";

import { useState, useCallback, useRef } from "react";
import { Row, Col } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import styled, { createGlobalStyle } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
} from "@/styles/Theme";

/* ── lightGallery (dynamic import to avoid SSR issues) ── */
import LightGallery from "lightgallery/react";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import lgFullscreen from "lightgallery/plugins/fullscreen";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-fullscreen.css";

/* ── Styled Components ── */
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

const GalleryCardCount = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  z-index: 1;
`;

const GalleryCardArrow = styled.span`
  position: absolute;
  bottom: 28px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) => p.$bgColor || getColor("primary")};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: ${(p) => p.$iconColor || "#fff"};
  font-size: 16px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  ${GalleryCard}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* Hidden container for lightGallery items */
const HiddenGallery = styled.div`
  display: none;
`;

const GalleryLightboxNavStyle = createGlobalStyle`
  .lg-prev,
  .lg-next {
    ${(p) =>
      p.$bgColor
        ? `background-color: ${p.$bgColor} !important;`
        : ""}
    ${(p) => (p.$iconColor ? `color: ${p.$iconColor} !important;` : "")}
    border-radius: 999px;
  }

  .lg-prev:hover:not(.disabled),
  .lg-next:hover:not(.disabled) {
    ${(p) => (p.$iconColor ? `color: ${p.$iconColor} !important;` : "")}
  }
`;

function normalizeGalleryImage(img) {
  if (typeof img === "string") {
    const desktop = img.trim();
    return {
      urlDesktop: desktop,
      url: desktop,
    };
  }
  const desktop =
    img?.urlDesktop != null
      ? String(img.urlDesktop).trim()
      : img?.url != null
        ? String(img.url).trim()
        : img?.src != null
          ? String(img.src).trim()
          : img?.urlMobile != null
            ? String(img.urlMobile).trim()
          : "";
  return {
    urlDesktop: desktop,
    url: desktop,
  };
}

function normalizeItem(it) {
  const cats = Array.isArray(it?.categories)
    ? it.categories
    : it?.category
      ? [String(it.category).trim()]
      : [];
  const normalizedImages = Array.isArray(it?.images)
    ? it.images
        .map(normalizeGalleryImage)
        .filter((img) => img.urlDesktop)
    : [];
  const coverDesktop =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : it?.imageMobile != null
          ? String(it.imageMobile).trim()
        : normalizedImages[0]?.urlDesktop || "";
  const itemType = it?.type === "link" ? "link" : "album";
  const linkType = it?.linkType === "external" ? "external" : "internal";
  const linkUrl = it?.linkUrl != null ? String(it.linkUrl).trim() : "";
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    imageDesktop: coverDesktop,
    image: coverDesktop,
    images:
      normalizedImages.length > 0
        ? normalizedImages
        : coverDesktop
          ? [{ urlDesktop: coverDesktop, url: coverDesktop }]
          : [],
    categories: cats.filter((c) => c !== "All"),
    type: itemType,
    linkType,
    linkUrl,
  };
}

const DEFAULT_TABS = ["All", "Education", "Medical", "Events", "Community"];

export default function PhotoGallery(props) {
  const router = useRouter();
  const rawItems =
    Array.isArray(props?.photoGalleryItems) &&
    props.photoGalleryItems.length > 0
      ? props.photoGalleryItems
      : [];
  const items = rawItems
    .map(normalizeItem)
    .filter((it) => it.imageDesktop);
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
  const navButtonBgKey = (props?.photoGalleryNavButtonBgColorKey ?? "")
    .toString()
    .trim();
  const navButtonBgColor = navButtonBgKey
    ? getColor(navButtonBgKey)
    : accentColor;
  const navArrowKey = (props?.photoGalleryNavArrowColorKey ?? "")
    .toString()
    .trim();
  const navArrowColor = navArrowKey ? getColor(navArrowKey) : "#fff";
  const hasLightboxNavOverride = Boolean(navButtonBgKey || navArrowKey);
  const tabBgKey = (props?.photoGalleryTabBgColorKey ?? "").toString().trim();
  const tabBgColor = tabBgKey ? getColor(tabBgKey) : undefined;
  const tabTextKey = (props?.photoGalleryTabTextColorKey ?? "")
    .toString()
    .trim();
  const tabTextColor = tabTextKey ? getColor(tabTextKey) : undefined;
  const tabBorderKey = (props?.photoGalleryTabBorderColorKey ?? "")
    .toString()
    .trim();
  const tabBorderColor = tabBorderKey ? getColor(tabBorderKey) : undefined;
  const tabInactiveTextKey = (props?.photoGalleryTabInactiveTextColorKey ?? "")
    .toString()
    .trim();
  const tabInactiveTextColor = tabInactiveTextKey
    ? getColor(tabInactiveTextKey)
    : undefined;
  const tabHoverBorderKey = (props?.photoGalleryTabHoverBorderColorKey ?? "")
    .toString()
    .trim();
  const tabHoverBorderColor = tabHoverBorderKey
    ? getColor(tabHoverBorderKey)
    : undefined;
  const tabHoverTextKey = (props?.photoGalleryTabHoverTextColorKey ?? "")
    .toString()
    .trim();
  const tabHoverTextColor = tabHoverTextKey
    ? getColor(tabHoverTextKey)
    : undefined;

  const limitEnabled =
    props?.photoGalleryLimitEnabled === true ||
    props?.photoGalleryLimitEnabled === "true";
  const limitCount =
    props?.photoGalleryLimitCount != null
      ? Number(props.photoGalleryLimitCount)
      : 6;
  const viewMoreText = (props?.photoGalleryViewMoreText ?? "View More")
    .toString()
    .trim();
  const viewMoreLink = (props?.photoGalleryViewMoreLink ?? "")
    .toString()
    .trim();
  const viewMoreButtonBgKey = (
    props?.photoGalleryViewMoreButtonBgColorKey ?? ""
  )
    .toString()
    .trim();
  const viewMoreButtonTextKey = (
    props?.photoGalleryViewMoreButtonTextColorKey ?? ""
  )
    .toString()
    .trim();
  const viewMoreButtonStyle =
    viewMoreButtonBgKey || viewMoreButtonTextKey
      ? {
          ...(viewMoreButtonBgKey
            ? { background: getColor(viewMoreButtonBgKey) }
            : {}),
          ...(viewMoreButtonTextKey
            ? { color: getColor(viewMoreButtonTextKey) }
            : {}),
        }
      : undefined;

  const [activeTab, setActiveTab] = useState("All");
  /* Store lightGallery instances per album */
  const lgInstances = useRef({});

  const allFilteredItems =
    activeTab === "All"
      ? items
      : items.filter(
          (item) =>
            Array.isArray(item.categories) &&
            item.categories.includes(activeTab),
        );
  const filteredItems = limitEnabled
    ? allFilteredItems.slice(0, limitCount)
    : allFilteredItems;

  const openAlbum = (albumIndex) => {
    const lgInstance = lgInstances.current[albumIndex];
    if (lgInstance) {
      lgInstance.openGallery(0);
    }
  };

  const handleItemClick = useCallback(
    (item, itemIndex) => {
      if (item?.type === "link") {
        const href = item?.linkUrl != null ? String(item.linkUrl).trim() : "";
        if (!href) return;
        if (item.linkType === "external") {
          const resolved = /^https?:\/\//i.test(href)
            ? href
            : `https://${href}`;
          window.open(resolved, "_blank", "noopener,noreferrer");
          return;
        }
        router.push(href);
        return;
      }
      openAlbum(itemIndex);
    },
    [router],
  );

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
      {hasLightboxNavOverride ? (
        <GalleryLightboxNavStyle
          $bgColor={navButtonBgKey ? navButtonBgColor : ""}
          $iconColor={navArrowKey ? navArrowColor : ""}
        />
      ) : null}
      <PageContainer style={pageContainerBgStyle}>
        <GalleryTabs>
          {tabs.map((tab) => (
            <GalleryTab
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

        <Row gutter={[16, 16]}>
          {filteredItems.map((item, index) => (
            <Col key={index} xs={24} sm={12} md={12} lg={8}>
              <GalleryCard onClick={() => handleItemClick(item, index)}>
                <img loading="lazy" src={item.imageDesktop} alt={item.title} />
                <GalleryCardTitle>{item.title}</GalleryCardTitle>
                {item.type === "album" && item.images.length > 1 && (
                  <GalleryCardCount>
                    {item.images.length} photos
                  </GalleryCardCount>
                )}
                <GalleryCardArrow
                  $bgColor={navButtonBgColor}
                  $iconColor={navArrowColor}
                >
                  <ArrowRightOutlined />
                </GalleryCardArrow>
              </GalleryCard>
            </Col>
          ))}
        </Row>

        {limitEnabled &&
          viewMoreLink &&
          allFilteredItems.length > limitCount && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link href={viewMoreLink}>
                {viewMoreButtonStyle ? (
                  <ThemeButton
                    type="button"
                    size="large"
                    style={viewMoreButtonStyle}
                  >
                    {viewMoreText}
                  </ThemeButton>
                ) : (
                  <ThemeButton type="button" size="large">
                    {viewMoreText}
                  </ThemeButton>
                )}
              </Link>
            </div>
          )}
      </PageContainer>

      {/* Hidden lightGallery instances — one per album */}
      {filteredItems.map((item, index) => (
        <HiddenGallery key={`lg-${index}`}>
          {item.type === "album" && item.images.length > 0 ? (
            <LightGallery
              onInit={(ref) => {
                lgInstances.current[index] = ref.instance;
              }}
              speed={500}
              plugins={[lgThumbnail, lgZoom, lgFullscreen]}
              download={false}
              counter={true}
              thumbnail={true}
              exThumbImage="data-thumb"
            >
              {item.images.map((img, imgIdx) => {
                const desktop = img?.urlDesktop || img?.url || "";
                if (!desktop) return null;
                return (
                  <a
                    key={imgIdx}
                    href={desktop}
                    data-thumb={desktop}
                    data-sub-html={`<h4>${item.title}</h4>${item.images.length > 1 ? `<p>${imgIdx + 1} / ${item.images.length}</p>` : ""}`}
                  >
                    <img src={desktop} alt={item.title} />
                  </a>
                );
              })}
            </LightGallery>
          ) : null}
        </HiddenGallery>
      ))}
    </FullWidthBackground>
  );
}
