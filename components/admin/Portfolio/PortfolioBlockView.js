"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { DownOutlined } from "@ant-design/icons";
import { FullWidthBackground, PageContainer, getColor } from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

const PortfolioBlock = styled.section`
  width: 100%;
`;

const PortfolioToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
`;

const CategoryDropdownWrap = styled.div`
  position: relative;
  width: fit-content;
  max-width: 100%;
`;

const CategoryDropdownButton = styled.button`
  width: auto;
  min-width: 200px;
  max-width: min(100%, calc(100vw - 40px));
  height: 44px;
  border-radius: 22px;
  border: 1px solid ${(p) => p.$borderColor};
  background: ${(p) => p.$bgColor};
  color: ${(p) => p.$textColor};
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: ${(p) => p.$fontFamilyDesktop || "inherit"};
  font-size: ${(p) => p.$fontSizeDesktop}px;
  font-weight: ${(p) => p.$fontWeight};
  cursor: pointer;

  > span {
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    font-family: ${(p) =>
      p.$fontFamilyMobile || p.$fontFamilyDesktop || "inherit"};
    font-size: ${(p) => p.$fontSizeMobile}px;
    max-width: calc(100vw - 48px);
  }
`;

const DropdownChevron = styled(DownOutlined)`
  font-size: 11px;
`;

const CategoryDropdownMenu = styled.div`
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: 100%;
  border-radius: 14px;
  border: 1px solid ${(p) => p.$borderColor};
  background: ${(p) => p.$bgColor};
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  z-index: 20;
`;

const CategoryDropdownOption = styled.button`
  width: 100%;
  border: 0;
  text-align: left;
  padding: 10px 14px;
  font-family: ${(p) => p.$fontFamilyDesktop || "inherit"};
  font-size: ${(p) => p.$fontSizeDesktop}px;
  font-weight: ${(p) => p.$fontWeight};
  color: ${(p) => (p.$active ? p.$activeTextColor : p.$textColor)};
  background: ${(p) => (p.$active ? p.$activeBgColor : p.$bgColor)};
  cursor: pointer;
  transition: background 0.16s ease;

  &:hover {
    background: ${(p) => (p.$active ? p.$activeBgColor : p.$hoverBgColor)};
  }

  @media (max-width: 767px) {
    font-family: ${(p) =>
      p.$fontFamilyMobile || p.$fontFamilyDesktop || "inherit"};
    font-size: ${(p) => p.$fontSizeMobile}px;
  }
`;

const PortfolioCount = styled.p`
  margin: 0;
  color: ${(p) => p.$color};
  font-size: 14px;
  font-weight: 600;
`;

const PortfolioItems = styled.div`
  display: grid;
  gap: 22px;
  width: 100%;
  grid-template-columns: repeat(${(p) => p.$cardsDesktop}, minmax(0, 1fr));

  @media (max-width: 1200px) {
    grid-template-columns: repeat(${(p) => p.$cardsTablet}, minmax(0, 1fr));
    gap: 18px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(${(p) => p.$cardsMobile}, minmax(0, 1fr));
    gap: 14px;
  }
`;

const PortfolioCard = styled.article`
  border: 1px solid ${(p) => p.$borderColor};
  background: ${(p) => p.$bgColor};
  border-radius: 16px;
  overflow: hidden;
  transition: background 0.2s ease;
  padding: 12px;

  &:hover {
    background: ${(p) => p.$hoverBgColor};
  }

  @media (max-width: 767px) {
    padding: 10px;
  }
`;

const PortfolioImageWrap = styled.div`
  position: relative;
  width: 100%;
  background: transparent;
  border-radius: 16px;
  overflow: hidden;
  line-height: 0;
`;

const PortfolioImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  object-position: center center;
  border-radius: 16px;
  background: transparent;
`;

const PortfolioImageEmpty = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.35);
  font-size: 14px;
`;

const PortfolioImageEmptyIcon = styled.span`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: rgba(255, 255, 255, 0.8);
  color: rgba(0, 0, 0, 0.45);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
`;

const PortfolioLogoBadge = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  overflow: hidden;
  flex: 0 0 auto;

  @media (max-width: 767px) {
    width: 40px;
    height: 40px;
    border-radius: 9px;
  }
`;

const PortfolioLogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  display: block;
`;

const PortfolioCardBody = styled.div`
  padding: 12px 2px 2px;

  @media (max-width: 767px) {
    padding-top: 10px;
  }
`;

const PortfolioCardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  min-width: 0;

  @media (max-width: 767px) {
    gap: 10px;
    margin-bottom: 8px;
  }
`;

const PortfolioCardTitle = styled.h3`
  margin: 0;
  color: ${(p) => p.$color};
  font-family: ${(p) => p.$fontFamilyDesktop || "inherit"};
  font-size: ${(p) => p.$fontSizeDesktop}px;
  line-height: 1.3;
  font-weight: ${(p) => p.$fontWeight};
  min-width: 0;
  overflow-wrap: anywhere;

  @media (max-width: 767px) {
    font-family: ${(p) =>
      p.$fontFamilyMobile || p.$fontFamilyDesktop || "inherit"};
    font-size: ${(p) => p.$fontSizeMobile}px;
  }
`;

const PortfolioCardDescription = styled.p`
  margin: 10px 0 14px;
  color: ${(p) => p.$color};
  font-family: ${(p) => p.$fontFamilyDesktop || "inherit"};
  font-size: ${(p) => p.$fontSizeDesktop}px;
  line-height: 1.65;
  font-weight: ${(p) => p.$fontWeight};
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 767px) {
    font-family: ${(p) =>
      p.$fontFamilyMobile || p.$fontFamilyDesktop || "inherit"};
    font-size: ${(p) => p.$fontSizeMobile}px;
  }
`;

const KnowMoreLink = styled.a`
  color: ${(p) => p.$color};
  text-decoration: none;
  font-family: ${(p) => p.$fontFamilyDesktop || "inherit"};
  font-size: ${(p) => p.$fontSizeDesktop}px;
  font-weight: ${(p) => p.$fontWeight};
  display: inline-block;
  margin-top: 2px;

  @media (max-width: 767px) {
    font-family: ${(p) =>
      p.$fontFamilyMobile || p.$fontFamilyDesktop || "inherit"};
    font-size: ${(p) => p.$fontSizeMobile}px;
  }
`;

const EmptyState = styled.p`
  margin: 18px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 14px;
`;

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toPositiveNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function clampCardsCount(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(12, Math.max(1, Math.round(num)));
}

function clampFontWeight(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(900, Math.max(100, Math.round(num)));
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtmlToPlainText(value) {
  const raw = toText(value);
  if (!raw) return "";
  const noScripts = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ");
  const noTags = noScripts.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(noTags);
  return decoded.replace(/\s+/g, " ").trim();
}

function resolveThemeColor(key, fallback) {
  const safe = toText(key);
  return safe ? getColor(safe) : fallback;
}

function normalizePortfolioItem(item) {
  const source = item && typeof item === "object" ? item : {};
  return {
    _id: toText(source._id),
    slug: toText(source.slug),
    name: stripHtmlToPlainText(source.name),
    designation: stripHtmlToPlainText(source.designation),
    bio: stripHtmlToPlainText(source.bio),
    image: toText(source.image),
    logo: toText(source.logo),
    categoryId: toText(source.categoryId),
    status: source.status !== false,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 0,
    socialLinks: toArray(source.socialLinks)
      .map((entry) => {
        const target = normalizeTargetFromItem(entry, {
          targetKeys: ["target", "sourceTarget"],
          boolKeys: ["openInNewTab", "newTab"],
          fallback: "_self",
        });
        return {
          label: stripHtmlToPlainText(entry?.label || entry?.platform),
          url: ensureMailto(entry?.url),
          linkEnabled:
            entry?.linkEnabled == null ? false : entry?.linkEnabled === true,
          target,
          openInNewTab: target === "_blank",
        };
      })
      .filter((entry) => entry.url && entry.linkEnabled === true),
  };
}

function normalizePortfolioCategory(category) {
  const source = category && typeof category === "object" ? category : {};
  return {
    _id: toText(source._id),
    name: stripHtmlToPlainText(source.name),
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 0,
  };
}

function normalizeProps(props = {}) {
  const source = props && typeof props === "object" ? props : {};
  return {
    portfolioCategoryIds: toArray(source.portfolioCategoryIds).map((id) =>
      toText(id),
    ),
    portfolioShowAllCategories:
      source.portfolioShowAllCategories != null
        ? source.portfolioShowAllCategories !== false
        : true,
    cardsDesktop: clampCardsCount(source.cardsDesktop, 3),
    cardsTablet: clampCardsCount(source.cardsTablet, 2),
    cardsMobile: clampCardsCount(source.cardsMobile, 1),
    featuredOnly: source.featuredOnly === true,
    homepageOnly: source.homepageOnly === true,
    highlightOnly: source.highlightOnly === true,

    portfolioCardTitleColorKey: toText(
      source.portfolioCardTitleColorKey ||
        source.portfolioTextColorKey ||
        source.portfolioItemNameColorKey,
    ),
    portfolioButtonColorKey: toText(
      source.portfolioButtonColorKey || source.portfolioTabActiveBgColorKey,
    ),
    portfolioDescriptionColorKey: toText(
      source.portfolioDescriptionColorKey ||
        source.portfolioItemDesignationColorKey ||
        source.portfolioItemBioColorKey,
    ),
    portfolioSocialIconColorKey: toText(
      source.portfolioSocialIconColorKey || source.portfolioSocialLinkColorKey,
    ),
    portfolioLinkColorKey: toText(source.portfolioLinkColorKey),
    portfolioCountTextColorKey: toText(source.portfolioCountTextColorKey),
    portfolioCardBgColorKey: toText(source.portfolioCardBgColorKey),
    portfolioCardBorderColorKey: toText(source.portfolioCardBorderColorKey),
    portfolioCardHoverBgColorKey: toText(source.portfolioCardHoverBgColorKey),
    portfolioDropdownBgColorKey: toText(source.portfolioDropdownBgColorKey),
    portfolioDropdownTextColorKey: toText(source.portfolioDropdownTextColorKey),
    portfolioDropdownBorderColorKey: toText(
      source.portfolioDropdownBorderColorKey,
    ),
    portfolioDropdownHoverBgColorKey: toText(
      source.portfolioDropdownHoverBgColorKey,
    ),
    portfolioDropdownActiveTextColorKey: toText(
      source.portfolioDropdownActiveTextColorKey,
    ),

    portfolioCardTitleFontFamilyDesktop: toText(
      source.portfolioCardTitleFontFamilyDesktop ||
        source.portfolioCardTitleFontFamily,
    ),
    portfolioCardTitleFontFamilyMobile: toText(
      source.portfolioCardTitleFontFamilyMobile ||
        source.portfolioCardTitleFontFamily,
    ),
    portfolioCardTitleFontSizeDesktop: toPositiveNumberOrNull(
      source.portfolioCardTitleFontSizeDesktop,
    ),
    portfolioCardTitleFontSizeMobile: toPositiveNumberOrNull(
      source.portfolioCardTitleFontSizeMobile,
    ),
    portfolioCardTitleFontWeight: toPositiveNumberOrNull(
      source.portfolioCardTitleFontWeight,
    ),

    portfolioDescriptionFontFamilyDesktop: toText(
      source.portfolioDescriptionFontFamilyDesktop ||
        source.portfolioDescriptionFontFamily,
    ),
    portfolioDescriptionFontFamilyMobile: toText(
      source.portfolioDescriptionFontFamilyMobile ||
        source.portfolioDescriptionFontFamily,
    ),
    portfolioDescriptionFontSizeDesktop: toPositiveNumberOrNull(
      source.portfolioDescriptionFontSizeDesktop,
    ),
    portfolioDescriptionFontSizeMobile: toPositiveNumberOrNull(
      source.portfolioDescriptionFontSizeMobile,
    ),
    portfolioDescriptionFontWeight: toPositiveNumberOrNull(
      source.portfolioDescriptionFontWeight,
    ),

    portfolioKnowMoreFontFamilyDesktop: toText(
      source.portfolioKnowMoreFontFamilyDesktop ||
        source.portfolioKnowMoreFontFamily,
    ),
    portfolioKnowMoreFontFamilyMobile: toText(
      source.portfolioKnowMoreFontFamilyMobile ||
        source.portfolioKnowMoreFontFamily,
    ),
    portfolioKnowMoreFontSizeDesktop: toPositiveNumberOrNull(
      source.portfolioKnowMoreFontSizeDesktop,
    ),
    portfolioKnowMoreFontSizeMobile: toPositiveNumberOrNull(
      source.portfolioKnowMoreFontSizeMobile,
    ),
    portfolioKnowMoreFontWeight: toPositiveNumberOrNull(
      source.portfolioKnowMoreFontWeight,
    ),

    portfolioDropdownTextFontFamilyDesktop: toText(
      source.portfolioDropdownTextFontFamilyDesktop ||
        source.portfolioDropdownFontFamilyDesktop ||
        source.portfolioDropdownTextFontFamily,
    ),
    portfolioDropdownTextFontFamilyMobile: toText(
      source.portfolioDropdownTextFontFamilyMobile ||
        source.portfolioDropdownFontFamilyMobile ||
        source.portfolioDropdownTextFontFamily,
    ),
    portfolioDropdownTextFontSizeDesktop: toPositiveNumberOrNull(
      source.portfolioDropdownTextFontSizeDesktop ||
        source.portfolioDropdownFontSizeDesktop,
    ),
    portfolioDropdownTextFontSizeMobile: toPositiveNumberOrNull(
      source.portfolioDropdownTextFontSizeMobile ||
        source.portfolioDropdownFontSizeMobile,
    ),
    portfolioDropdownTextFontWeight: toPositiveNumberOrNull(
      source.portfolioDropdownTextFontWeight ||
        source.portfolioDropdownFontWeight,
    ),

    portfolioSectionBgType: toText(
      source.portfolioSectionBgType || "default",
    ).toLowerCase(),
    portfolioSectionBgImage: toText(source.portfolioSectionBgImage),
    portfolioSectionBgColorKey: toText(source.portfolioSectionBgColorKey),
    portfolioSectionPaddingTop: toNumberOrNull(
      source.portfolioSectionPaddingTop,
    ),
    portfolioSectionPaddingBottom: toNumberOrNull(
      source.portfolioSectionPaddingBottom,
    ),
    portfolioSectionMarginTop: toNumberOrNull(source.portfolioSectionMarginTop),
    portfolioSectionMarginBottom: toNumberOrNull(
      source.portfolioSectionMarginBottom,
    ),
    portfolioPageContainerBgType: toText(
      source.portfolioPageContainerBgType || "default",
    ).toLowerCase(),
    portfolioPageContainerBgImage: toText(source.portfolioPageContainerBgImage),
    portfolioPageContainerBgColorKey: toText(
      source.portfolioPageContainerBgColorKey,
    ),
    portfolioPageContainerPaddingTop: toNumberOrNull(
      source.portfolioPageContainerPaddingTop,
    ),
    portfolioPageContainerPaddingRight: toNumberOrNull(
      source.portfolioPageContainerPaddingRight,
    ),
    portfolioPageContainerPaddingBottom: toNumberOrNull(
      source.portfolioPageContainerPaddingBottom,
    ),
    portfolioPageContainerPaddingLeft: toNumberOrNull(
      source.portfolioPageContainerPaddingLeft,
    ),
    portfolioPageContainerMarginTop: toNumberOrNull(
      source.portfolioPageContainerMarginTop,
    ),
    portfolioPageContainerMarginBottom: toNumberOrNull(
      source.portfolioPageContainerMarginBottom,
    ),
  };
}

export default function PortfolioBlockView(props) {
  const config = useMemo(() => normalizeProps(props), [props]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [failedImageKeys, setFailedImageKeys] = useState(() => new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState("__all__");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("allCategories", config.portfolioShowAllCategories ? "1" : "0");
    if (
      !config.portfolioShowAllCategories &&
      config.portfolioCategoryIds.length > 0
    ) {
      params.set("categoryIds", config.portfolioCategoryIds.join(","));
    }
    if (config.featuredOnly) params.set("featured", "1");
    if (config.homepageOnly) params.set("homepage", "1");
    if (config.highlightOnly) params.set("highlight", "1");

    fetch(`/api/portfolio?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [], categories: [] }))
      .then((data) => {
        if (ignore) return;
        const nextCategories = toArray(data?.categories)
          .map(normalizePortfolioCategory)
          .sort((a, b) => a.order - b.order);
        const nextItems = toArray(data?.items)
          .map(normalizePortfolioItem)
          .filter((item) => item.status !== false)
          .sort((a, b) => a.order - b.order);
        setCategories(nextCategories);
        setItems(nextItems);
      })
      .catch(() => {
        if (ignore) return;
        setCategories([]);
        setItems([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [config]);

  useEffect(() => {
    if (selectedCategoryId === "__all__") return;
    if (categories.some((item) => item._id === selectedCategoryId)) return;
    setSelectedCategoryId("__all__");
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setFailedImageKeys(new Set());
  }, [items]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  const totalCount = items.length;
  const visibleItems = useMemo(() => {
    if (selectedCategoryId === "__all__") return items;
    return items.filter((item) => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);
  const showingCount = visibleItems.length;

  if (loading) return null;
  if (totalCount === 0) return null;

  const selectedCategoryLabel =
    selectedCategoryId === "__all__"
      ? "All"
      : categories.find((item) => item._id === selectedCategoryId)?.name ||
        "All";

  const dropdownBgColor = resolveThemeColor(
    config.portfolioDropdownBgColorKey,
    "#ffffff",
  );
  const dropdownTextColor = resolveThemeColor(
    config.portfolioDropdownTextColorKey,
    "#243746",
  );
  const dropdownBorderColor = resolveThemeColor(
    config.portfolioDropdownBorderColorKey,
    "rgba(0,0,0,0.12)",
  );
  const dropdownHoverBgColor = resolveThemeColor(
    config.portfolioDropdownHoverBgColorKey,
    "#f3f6f9",
  );
  const dropdownActiveBgColor = resolveThemeColor(
    config.portfolioButtonColorKey,
    "#dbeafe",
  );
  const dropdownActiveTextColor = resolveThemeColor(
    config.portfolioDropdownActiveTextColorKey,
    dropdownTextColor,
  );
  const countTextColor = resolveThemeColor(
    config.portfolioCountTextColorKey,
    "#0c6b8d",
  );
  const cardBgColor = resolveThemeColor(
    config.portfolioCardBgColorKey,
    "#ffffff",
  );
  const cardBorderColor = resolveThemeColor(
    config.portfolioCardBorderColorKey,
    "rgba(0,0,0,0.08)",
  );
  const cardHoverBgColor = resolveThemeColor(
    config.portfolioCardHoverBgColorKey,
    cardBgColor,
  );
  const cardTitleColor = resolveThemeColor(
    config.portfolioCardTitleColorKey,
    "#22323c",
  );
  const descriptionColor = resolveThemeColor(
    config.portfolioDescriptionColorKey,
    "rgba(0,0,0,0.68)",
  );
  const linkColor = resolveThemeColor(config.portfolioLinkColorKey, "#00516f");
  const cardTitleFontFamilyDesktop =
    config.portfolioCardTitleFontFamilyDesktop || undefined;
  const cardTitleFontFamilyMobile =
    config.portfolioCardTitleFontFamilyMobile || cardTitleFontFamilyDesktop;
  const cardTitleFontSizeDesktop =
    config.portfolioCardTitleFontSizeDesktop || 20;
  const cardTitleFontSizeMobile = config.portfolioCardTitleFontSizeMobile || 18;
  const cardTitleFontWeight = clampFontWeight(
    config.portfolioCardTitleFontWeight,
    700,
  );

  const descriptionFontFamilyDesktop =
    config.portfolioDescriptionFontFamilyDesktop || undefined;
  const descriptionFontFamilyMobile =
    config.portfolioDescriptionFontFamilyMobile || descriptionFontFamilyDesktop;
  const descriptionFontSizeDesktop =
    config.portfolioDescriptionFontSizeDesktop || 14;
  const descriptionFontSizeMobile =
    config.portfolioDescriptionFontSizeMobile || 14;
  const descriptionFontWeight = clampFontWeight(
    config.portfolioDescriptionFontWeight,
    400,
  );

  const knowMoreFontFamilyDesktop =
    config.portfolioKnowMoreFontFamilyDesktop || undefined;
  const knowMoreFontFamilyMobile =
    config.portfolioKnowMoreFontFamilyMobile || knowMoreFontFamilyDesktop;
  const knowMoreFontSizeDesktop = config.portfolioKnowMoreFontSizeDesktop || 14;
  const knowMoreFontSizeMobile = config.portfolioKnowMoreFontSizeMobile || 14;
  const knowMoreFontWeight = clampFontWeight(
    config.portfolioKnowMoreFontWeight,
    700,
  );

  const dropdownFontFamilyDesktop =
    config.portfolioDropdownTextFontFamilyDesktop || undefined;
  const dropdownFontFamilyMobile =
    config.portfolioDropdownTextFontFamilyMobile || dropdownFontFamilyDesktop;
  const dropdownFontSizeDesktop =
    config.portfolioDropdownTextFontSizeDesktop || 14;
  const dropdownFontSizeMobile =
    config.portfolioDropdownTextFontSizeMobile || 14;
  const dropdownFontWeight = clampFontWeight(
    config.portfolioDropdownTextFontWeight,
    600,
  );

  const sectionBgClassName =
    config.portfolioSectionBgType === "default"
      ? "defaultBackground"
      : undefined;
  const sectionBgStyleBase =
    config.portfolioSectionBgType === "image" && config.portfolioSectionBgImage
      ? {
          backgroundImage: `url(${config.portfolioSectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : config.portfolioSectionBgType === "color" &&
          config.portfolioSectionBgColorKey
        ? {
            backgroundColor: resolveThemeColor(
              config.portfolioSectionBgColorKey,
              "#ffffff",
            ),
            backgroundImage: "none",
          }
        : undefined;

  const sectionBgStyle =
    sectionBgStyleBase ||
    config.portfolioSectionPaddingTop != null ||
    config.portfolioSectionPaddingBottom != null ||
    config.portfolioSectionMarginTop != null ||
    config.portfolioSectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(config.portfolioSectionPaddingTop != null &&
          config.portfolioSectionPaddingTop >= 0
            ? { paddingTop: `${config.portfolioSectionPaddingTop}px` }
            : {}),
          ...(config.portfolioSectionPaddingBottom != null &&
          config.portfolioSectionPaddingBottom >= 0
            ? { paddingBottom: `${config.portfolioSectionPaddingBottom}px` }
            : {}),
          ...(config.portfolioSectionMarginTop != null &&
          config.portfolioSectionMarginTop >= 0
            ? { marginTop: `${config.portfolioSectionMarginTop}px` }
            : {}),
          ...(config.portfolioSectionMarginBottom != null &&
          config.portfolioSectionMarginBottom >= 0
            ? { marginBottom: `${config.portfolioSectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgStyleBase =
    config.portfolioPageContainerBgType === "image" &&
    config.portfolioPageContainerBgImage
      ? {
          backgroundImage: `url(${config.portfolioPageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : config.portfolioPageContainerBgType === "color" &&
          config.portfolioPageContainerBgColorKey
        ? {
            backgroundColor: resolveThemeColor(
              config.portfolioPageContainerBgColorKey,
              "#ffffff",
            ),
            backgroundImage: "none",
          }
        : undefined;

  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    config.portfolioPageContainerPaddingTop != null ||
    config.portfolioPageContainerPaddingRight != null ||
    config.portfolioPageContainerPaddingBottom != null ||
    config.portfolioPageContainerPaddingLeft != null ||
    config.portfolioPageContainerMarginTop != null ||
    config.portfolioPageContainerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(config.portfolioPageContainerPaddingTop != null &&
          config.portfolioPageContainerPaddingTop >= 0
            ? { paddingTop: `${config.portfolioPageContainerPaddingTop}px` }
            : {}),
          ...(config.portfolioPageContainerPaddingRight != null &&
          config.portfolioPageContainerPaddingRight >= 0
            ? { paddingRight: `${config.portfolioPageContainerPaddingRight}px` }
            : {}),
          ...(config.portfolioPageContainerPaddingBottom != null &&
          config.portfolioPageContainerPaddingBottom >= 0
            ? {
                paddingBottom: `${config.portfolioPageContainerPaddingBottom}px`,
              }
            : {}),
          ...(config.portfolioPageContainerPaddingLeft != null &&
          config.portfolioPageContainerPaddingLeft >= 0
            ? { paddingLeft: `${config.portfolioPageContainerPaddingLeft}px` }
            : {}),
          ...(config.portfolioPageContainerMarginTop != null &&
          config.portfolioPageContainerMarginTop >= 0
            ? { marginTop: `${config.portfolioPageContainerMarginTop}px` }
            : {}),
          ...(config.portfolioPageContainerMarginBottom != null &&
          config.portfolioPageContainerMarginBottom >= 0
            ? { marginBottom: `${config.portfolioPageContainerMarginBottom}px` }
            : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <PortfolioBlock>
          <PortfolioToolbar>
            <CategoryDropdownWrap ref={dropdownRef}>
              <CategoryDropdownButton
                type="button"
                $bgColor={dropdownBgColor}
                $textColor={dropdownTextColor}
                $borderColor={dropdownBorderColor}
                $fontFamilyDesktop={dropdownFontFamilyDesktop}
                $fontFamilyMobile={dropdownFontFamilyMobile}
                $fontSizeDesktop={dropdownFontSizeDesktop}
                $fontSizeMobile={dropdownFontSizeMobile}
                $fontWeight={dropdownFontWeight}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
              >
                <span>{selectedCategoryLabel}</span>
                <DropdownChevron />
              </CategoryDropdownButton>
              {dropdownOpen ? (
                <CategoryDropdownMenu
                  $bgColor={dropdownBgColor}
                  $borderColor={dropdownBorderColor}
                  role="listbox"
                >
                  <CategoryDropdownOption
                    type="button"
                    $active={selectedCategoryId === "__all__"}
                    $bgColor={dropdownBgColor}
                    $textColor={dropdownTextColor}
                    $hoverBgColor={dropdownHoverBgColor}
                    $activeBgColor={dropdownActiveBgColor}
                    $activeTextColor={dropdownActiveTextColor}
                    $fontFamilyDesktop={dropdownFontFamilyDesktop}
                    $fontFamilyMobile={dropdownFontFamilyMobile}
                    $fontSizeDesktop={dropdownFontSizeDesktop}
                    $fontSizeMobile={dropdownFontSizeMobile}
                    $fontWeight={dropdownFontWeight}
                    onClick={() => {
                      setSelectedCategoryId("__all__");
                      setDropdownOpen(false);
                    }}
                  >
                    All
                  </CategoryDropdownOption>
                  {categories.map((category) => (
                    <CategoryDropdownOption
                      key={category._id}
                      type="button"
                      $active={selectedCategoryId === category._id}
                      $bgColor={dropdownBgColor}
                      $textColor={dropdownTextColor}
                      $hoverBgColor={dropdownHoverBgColor}
                      $activeBgColor={dropdownActiveBgColor}
                      $activeTextColor={dropdownActiveTextColor}
                      $fontFamilyDesktop={dropdownFontFamilyDesktop}
                      $fontFamilyMobile={dropdownFontFamilyMobile}
                      $fontSizeDesktop={dropdownFontSizeDesktop}
                      $fontSizeMobile={dropdownFontSizeMobile}
                      $fontWeight={dropdownFontWeight}
                      onClick={() => {
                        setSelectedCategoryId(category._id);
                        setDropdownOpen(false);
                      }}
                    >
                      {category.name}
                    </CategoryDropdownOption>
                  ))}
                </CategoryDropdownMenu>
              ) : null}
            </CategoryDropdownWrap>

            <PortfolioCount $color={countTextColor}>
              Showing {showingCount} of {totalCount} items
            </PortfolioCount>
          </PortfolioToolbar>

          {visibleItems.length === 0 ? (
            <EmptyState>No portfolio items found for this category.</EmptyState>
          ) : (
            <PortfolioItems
              $cardsDesktop={config.cardsDesktop}
              $cardsTablet={config.cardsTablet}
              $cardsMobile={config.cardsMobile}
            >
              {visibleItems.map((item) => {
                const primaryLink =
                  Array.isArray(item.socialLinks) && item.socialLinks.length > 0
                    ? item.socialLinks[0]
                    : null;
                const hasEnabledExternalLink =
                  primaryLink?.linkEnabled === true &&
                  Boolean(toText(primaryLink?.url));
                const href = hasEnabledExternalLink
                  ? ensureMailto(primaryLink?.url)
                  : "";
                const target = hasEnabledExternalLink
                  ? normalizeTargetFromItem(primaryLink, {
                      targetKeys: ["target", "sourceTarget"],
                      boolKeys: ["openInNewTab", "newTab"],
                      fallback: "_self",
                    })
                  : "_self";
                const openInNewTab = hasEnabledExternalLink && target === "_blank";
                const linkLabel = toText(primaryLink?.label) || "Know More";
                const summary = item.bio || item.designation;

                const itemKey = item._id || item.slug || item.name;
                const hasImage =
                  Boolean(item.image) && !failedImageKeys.has(itemKey);

                return (
                  <PortfolioCard
                    key={itemKey}
                    $bgColor={cardBgColor}
                    $borderColor={cardBorderColor}
                    $hoverBgColor={cardHoverBgColor}
                  >
                    <PortfolioImageWrap>
                      {hasImage ? (
                        <PortfolioImage
                          src={item.image}
                          alt={item.name || "Portfolio item"}
                          loading="lazy"
                          onError={() =>
                            setFailedImageKeys((prev) => {
                              const next = new Set(prev);
                              next.add(itemKey);
                              return next;
                            })
                          }
                        />
                      ) : (
                        <PortfolioImageEmpty>
                          <PortfolioImageEmptyIcon aria-hidden>
                            IMG
                          </PortfolioImageEmptyIcon>
                          <span>Image not available</span>
                        </PortfolioImageEmpty>
                      )}
                    </PortfolioImageWrap>
                    <PortfolioCardBody>
                      <PortfolioCardHead>
                        {item.logo ? (
                          <PortfolioLogoBadge>
                            <PortfolioLogoImage
                              src={item.logo}
                              alt={`${item.name || "Portfolio item"} logo`}
                              loading="lazy"
                            />
                          </PortfolioLogoBadge>
                        ) : null}
                        <PortfolioCardTitle
                          $color={cardTitleColor}
                          $fontFamilyDesktop={cardTitleFontFamilyDesktop}
                          $fontFamilyMobile={cardTitleFontFamilyMobile}
                          $fontSizeDesktop={cardTitleFontSizeDesktop}
                          $fontSizeMobile={cardTitleFontSizeMobile}
                          $fontWeight={cardTitleFontWeight}
                        >
                          {item.name || "Portfolio Item"}
                        </PortfolioCardTitle>
                      </PortfolioCardHead>
                      {summary ? (
                        <PortfolioCardDescription
                          $color={descriptionColor}
                          $fontFamilyDesktop={descriptionFontFamilyDesktop}
                          $fontFamilyMobile={descriptionFontFamilyMobile}
                          $fontSizeDesktop={descriptionFontSizeDesktop}
                          $fontSizeMobile={descriptionFontSizeMobile}
                          $fontWeight={descriptionFontWeight}
                        >
                          {summary}
                        </PortfolioCardDescription>
                      ) : null}

                      {href ? (
                        <KnowMoreLink
                          href={href}
                          $color={linkColor}
                          $fontFamilyDesktop={knowMoreFontFamilyDesktop}
                          $fontFamilyMobile={knowMoreFontFamilyMobile}
                          $fontSizeDesktop={knowMoreFontSizeDesktop}
                          $fontSizeMobile={knowMoreFontSizeMobile}
                          $fontWeight={knowMoreFontWeight}
                          target={openInNewTab ? "_blank" : "_self"}
                          rel={openInNewTab ? "noopener noreferrer" : undefined}
                        >
                          {linkLabel}
                        </KnowMoreLink>
                      ) : null}
                    </PortfolioCardBody>
                  </PortfolioCard>
                );
              })}
            </PortfolioItems>
          )}
        </PortfolioBlock>
      </PageContainer>
    </FullWidthBackground>
  );
}
