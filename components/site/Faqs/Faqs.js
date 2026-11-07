"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { PlusOutlined, SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";
import { serializeJsonLd } from "@/lib/security/jsonLd";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  getTitleAlign,
  getTitleAlignStyles,
  getSubtitleAlignStyles,
  getHeaderAlignStyles,
} from "@/components/site/titleUtils";

/* ── Styled Components for FAQs ── */
const FaqWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 640px;
  margin: 0 auto 32px auto;

  .faq-search-input {
    width: 100%;
    height: 52px;
    padding: 12px 48px 12px 48px;
    font-size: 16px;
    border-radius: 30px;
    border: 2px solid #e5e7eb;
    background: #ffffff;
    color: #1f2937;
    outline: none;
    transition: all 0.25s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);

    &:focus {
      border-color: ${(props) => props.$primaryColor || "#104037"};
      box-shadow: 0 4px 16px rgba(16, 64, 55, 0.12);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  .faq-search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 18px;
    pointer-events: none;
  }

  .faq-clear-icon {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 16px;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #4b5563;
    }
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 36px;
`;

const CategoryTabButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  color: ${(props) =>
    props.$active
      ? props.$activeTextColor || "#ffffff"
      : props.$btnTextColor || props.$primaryColor || "#104037"};
  background: ${(props) =>
    props.$active
      ? props.$activeBgColor || props.$primaryColor || "#104037"
      : props.$btnBgColor || "rgba(16, 64, 55, 0.06)"};
  border: 1px solid
    ${(props) =>
      props.$active
        ? props.$activeBgColor || props.$primaryColor || "#104037"
        : props.$btnBorderColor || "rgba(16, 64, 55, 0.12)"};
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active
        ? props.$activeBgColor || props.$primaryColor || "#104037"
        : props.$btnBgColor || "rgba(16, 64, 55, 0.12)"};
    transform: translateY(-1px);
  }

  .faq-badge {
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 12px;
    background: ${(props) =>
      props.$active ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.08)"};
    color: ${(props) => (props.$active ? props.$activeTextColor || "#ffffff" : props.$btnTextColor || "#4b5563")};
  }
`;

const AccordionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 920px;
  margin: 0 auto;
`;

const FaqItemCard = styled.div`
  background: ${(props) => props.$cardBg || "#ffffff"};
  border: 1px solid ${(props) => props.$borderColor || "#e5e7eb"};
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: ${(props) =>
    props.$isOpen
      ? "0 4px 16px rgba(0, 0, 0, 0.06)"
      : "0 1px 3px rgba(0, 0, 0, 0.02)"};

  &:hover {
    border-color: ${(props) => props.$hoverBorder || props.$primaryColor || "#104037"};
  }

  .faq-question-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 24px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    outline: none;

    &:focus-visible {
      outline: 2px solid ${(props) => props.$primaryColor || "#104037"};
      outline-offset: -2px;
    }
  }

  .faq-question-text {
    font-size: 16px;
    font-weight: 600;
    color: ${(props) =>
      props.$isOpen
        ? props.$activeQuestionColor || props.$primaryColor || "#104037"
        : props.$questionColor || "#1f2937"};
    line-height: 1.5;
    margin: 0;
    flex: 1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .faq-cat-tag {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(16, 64, 55, 0.08);
    color: ${(props) => props.$primaryColor || "#104037"};
  }

  .faq-toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${(props) =>
      props.$isOpen
        ? props.$activeIconBg || props.$primaryColor || "#104037"
        : "rgba(0, 0, 0, 0.04)"};
    color: ${(props) =>
      props.$isOpen
        ? props.$activeIconColor || "#ffffff"
        : "#4b5563"};
    font-size: 14px;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.25s ease;
    transform: ${(props) => (props.$isOpen ? "rotate(45deg)" : "rotate(0deg)")};
    flex-shrink: 0;
  }

  .faq-answer-collapse {
    max-height: ${(props) => (props.$isOpen ? "1200px" : "0")};
    overflow: hidden;
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .faq-answer-inner {
    padding: 0 24px 20px 24px;
    color: ${(props) => props.$answerColor || "#4b5563"};
    font-size: 15px;
    line-height: 1.7;
    border-top: 1px dashed #f3f4f6;
    margin-top: 2px;
    padding-top: 16px;

    p {
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }

    ul, ol {
      margin: 8px 0 12px 20px;
      padding-left: 8px;
    }

    li {
      margin-bottom: 6px;
    }

    strong {
      color: #111827;
      font-weight: 600;
    }

    blockquote {
      border-left: 3px solid ${(props) => props.$primaryColor || "#104037"};
      padding-left: 12px;
      margin: 12px 0;
      color: #6b7280;
      font-style: italic;
    }

    a {
      color: ${(props) => props.$primaryColor || "#104037"};
      text-decoration: underline;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 14px;
    max-width: 460px;
    margin: 0 auto 16px auto;
  }

  .contact-link-btn {
    display: inline-block;
    padding: 8px 20px;
    background: ${(props) => props.$primaryColor || "#104037"};
    color: #ffffff;
    border-radius: 20px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.9;
    }
  }
`;

export default function Faqs(props) {
  const [themeProps, setThemeProps] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/theme/Faqs", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          setThemeProps(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = { ...themeProps, ...props };

  // Title & Section Settings
  const mainTitle = (props?.mainTitle ?? merged?.mainTitle ?? "Frequently Asked Questions").toString().trim();
  const subTitle = (props?.subTitle ?? merged?.subTitle ?? "Got Questions? We Have Answers").toString().trim();
  const titleAlign = getTitleAlign(props, "center", "faqs");

  // Strict enablement logic: if explicitly disabled by ANY flag, disable it
  const titleEnabled =
    props?.faqsTitleEnabled !== false &&
    props?.faqsTitleEnabled !== "false" &&
    props?.shortCodeTitleEnabled !== false &&
    props?.shortCodeTitleEnabled !== "false" &&
    props?.titleEnabled !== false &&
    props?.titleEnabled !== "false";

  const subTitleEnabled =
    props?.faqsSubTitleEnabled !== false &&
    props?.faqsSubTitleEnabled !== "false" &&
    props?.shortCodeSubTitleEnabled !== false &&
    props?.shortCodeSubTitleEnabled !== "false" &&
    props?.subTitleEnabled !== false &&
    props?.subTitleEnabled !== "false";

  const primaryColor = getColor("primary") || "#104037";
  const mainTitleColorKey = (merged?.faqsMainTitleColorKey ?? merged?.titleColorKey ?? "").toString().trim();
  const subTitleColorKey = (merged?.faqsSubTitleColorKey ?? "").toString().trim();
  const mainTitleColor = mainTitleColorKey ? getColor(mainTitleColorKey) : primaryColor;
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;

  // Frontend color options configured in FAQs Management Edit Colors drawer
  const categoryBtnBgColor = merged?.faqsCategoryBtnBgColorKey ? getColor(merged.faqsCategoryBtnBgColorKey) : undefined;
  const categoryBtnTextColor = merged?.faqsCategoryBtnTextColorKey ? getColor(merged.faqsCategoryBtnTextColorKey) : undefined;
  const categoryActiveBtnBgColor = merged?.faqsCategoryActiveBtnBgColorKey ? getColor(merged.faqsCategoryActiveBtnBgColorKey) : undefined;
  const categoryActiveBtnTextColor = merged?.faqsCategoryActiveBtnTextColorKey ? getColor(merged.faqsCategoryActiveBtnTextColorKey) : undefined;
  const questionTextColor = merged?.faqsQuestionTextColorKey ? getColor(merged.faqsQuestionTextColorKey) : undefined;
  const answerTextColor = merged?.faqsAnswerTextColorKey ? getColor(merged.faqsAnswerTextColorKey) : undefined;
  const cardBgColor = merged?.faqsCardBgColorKey ? getColor(merged.faqsCardBgColorKey) : undefined;
  const cardBorderColor = merged?.faqsCardBorderColorKey ? getColor(merged.faqsCardBorderColorKey) : undefined;
  const cardHoverBorderColor = merged?.faqsCardHoverBorderColorKey ? getColor(merged.faqsCardHoverBorderColorKey) : undefined;
  const activeQuestionTextColor = merged?.faqsActiveQuestionTextColorKey ? getColor(merged.faqsActiveQuestionTextColorKey) : undefined;
  const activeIconBgColor = merged?.faqsActiveIconBgColorKey ? getColor(merged.faqsActiveIconBgColorKey) : undefined;
  const activeIconTextColor = merged?.faqsActiveIconTextColorKey ? getColor(merged.faqsActiveIconTextColorKey) : undefined;

  // Managed Section styles
  const sectionBgType = (props?.faqsSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.faqsSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.faqsSectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
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

  const sectionPaddingTop = props?.faqsSectionPaddingTop != null ? Number(props.faqsSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.faqsSectionPaddingBottom != null ? Number(props.faqsSectionPaddingBottom) : null;
  const sectionMarginTop = props?.faqsSectionMarginTop != null ? Number(props.faqsSectionMarginTop) : null;
  const sectionMarginBottom = props?.faqsSectionMarginBottom != null ? Number(props.faqsSectionMarginBottom) : null;

  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.faqsPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.faqsPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.faqsPageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyle =
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

  // Component Props & Filtering
  const lockedCategory = (props?.categoryFilter || props?.category || props?.faqsDefaultCategory || "").toString().trim();
  const showSearchBar = props?.faqsShowSearch !== false;
  const showCategoryTabs = !lockedCategory && props?.faqsShowTabs !== false;

  const [items, setItems] = useState(props?.initialFaqs || []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!props?.initialFaqs?.length);
  const [selectedCategory, setSelectedCategory] = useState(lockedCategory || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState(new Set());

  // Fetch published FAQs
  useEffect(() => {
    let cancelled = false;
    const fetchUrl = lockedCategory
      ? `/api/public/faqs?category=${encodeURIComponent(lockedCategory)}`
      : "/api/public/faqs";

    fetch(fetchUrl, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data?.faqs) ? data.faqs : [];
          setItems(list);
          if (Array.isArray(data?.categories)) setCategories(data.categories);
          // By default, open the first item for immediate helpful context
          if (list.length > 0) {
            setOpenIds(new Set([list[0]._id]));
          }
        }
      })
      .catch((e) => console.error("[Faqs] fetch error:", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lockedCategory]);

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered list
  const filteredFaqs = useMemo(() => {
    return items.filter((faq) => {
      // Category check
      if (selectedCategory && selectedCategory !== "all") {
        if (faq.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = (faq.question || "").toLowerCase().includes(q);
        const matchesA = (faq.answer || "").toLowerCase().includes(q);
        const matchesTags = Array.isArray(faq.tags) && faq.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesQ && !matchesA && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    items.forEach((item) => {
      const cat = item.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Schema.org FAQPage structured data
  const jsonLdData = useMemo(() => {
    if (!filteredFaqs.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: filteredFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: (faq.answer || "").replace(/<[^>]+>/g, " ").trim(),
        },
      })),
    };
  }, [filteredFaqs]);

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        {/* Injected Schema.org FAQPage structured data */}
        {jsonLdData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdData) }}
          />
        )}

        <FaqWrapper>
          {/* Header */}
          {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
            <div style={{ marginBottom: 32, ...getHeaderAlignStyles(titleAlign) }}>
              {subTitleEnabled && subTitle ? (
                <SubTitle color={subTitleColor} style={getSubtitleAlignStyles(titleAlign)}>
                  {subTitle}
                </SubTitle>
              ) : null}
              {titleEnabled && mainTitle ? (
                <MainTitle color={mainTitleColor} style={getTitleAlignStyles(titleAlign)}>
                  {renderHighlightedTitle(mainTitle, props)}
                </MainTitle>
              ) : null}
            </div>
          ) : null}

          {/* Search Bar */}
          {showSearchBar && (
            <SearchContainer $primaryColor={primaryColor}>
              <SearchOutlined className="faq-search-icon" />
              <input
                type="text"
                className="faq-search-input"
                placeholder={
                  lockedCategory
                    ? `Search ${lockedCategory} questions...`
                    : "Search frequently asked questions..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search FAQs"
              />
              {searchQuery && (
                <CloseCircleOutlined
                  className="faq-clear-icon"
                  onClick={() => setSearchQuery("")}
                />
              )}
            </SearchContainer>
          )}

          {/* Category Tabs (shown when viewing all categories) */}
          {showCategoryTabs && categories.length > 0 && (
            <CategoryTabs>
              <CategoryTabButton
                $primaryColor={primaryColor}
                $active={selectedCategory === "all"}
                $btnBgColor={categoryBtnBgColor}
                $btnTextColor={categoryBtnTextColor}
                $activeBgColor={categoryActiveBtnBgColor}
                $activeTextColor={categoryActiveBtnTextColor}
                onClick={() => setSelectedCategory("all")}
              >
                All Questions
                <span className="faq-badge">{categoryCounts.all || 0}</span>
              </CategoryTabButton>
              {categories.map((cat) => (
                <CategoryTabButton
                  key={cat}
                  $primaryColor={primaryColor}
                  $active={selectedCategory === cat}
                  $btnBgColor={categoryBtnBgColor}
                  $btnTextColor={categoryBtnTextColor}
                  $activeBgColor={categoryActiveBtnBgColor}
                  $activeTextColor={categoryActiveBtnTextColor}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {categoryCounts[cat] != null && (
                    <span className="faq-badge">{categoryCounts[cat]}</span>
                  )}
                </CategoryTabButton>
              ))}
            </CategoryTabs>
          )}

          {/* FAQs Accordion List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
              Loading FAQs...
            </div>
          ) : filteredFaqs.length > 0 ? (
            <AccordionList>
              {filteredFaqs.map((faq) => {
                const isOpen = openIds.has(faq._id);
                return (
                  <FaqItemCard
                    key={faq._id}
                    $isOpen={isOpen}
                    $primaryColor={primaryColor}
                    $hoverBorder={cardHoverBorderColor}
                    $cardBg={cardBgColor}
                    $borderColor={cardBorderColor}
                    $questionColor={questionTextColor}
                    $activeQuestionColor={activeQuestionTextColor}
                    $activeIconBg={activeIconBgColor}
                    $activeIconColor={activeIconTextColor}
                    $answerColor={answerTextColor}
                  >
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleItem(faq._id)}
                      aria-expanded={isOpen}
                    >
                      <h3 className="faq-question-text">
                        <span>{faq.question}</span>
                        {!lockedCategory && faq.category && (
                          <span className="faq-cat-tag">{faq.category}</span>
                        )}
                      </h3>
                      <span className="faq-toggle-icon" aria-hidden="true">
                        <PlusOutlined />
                      </span>
                    </button>

                    <div className="faq-answer-collapse">
                      <div className="faq-answer-inner">
                        <SafeHtml html={faq.answer} />
                      </div>
                    </div>
                  </FaqItemCard>
                );
              })}
            </AccordionList>
          ) : (
            <EmptyState $primaryColor={primaryColor}>
              <div className="empty-title">No questions found</div>
              <p className="empty-desc">
                {searchQuery
                  ? `No FAQs matched "${searchQuery}". Try different keywords or browse all categories.`
                  : "No FAQs are available for this section yet."}
              </p>
              <a href="/contact" className="contact-link-btn">
                Contact MESCO Team
              </a>
            </EmptyState>
          )}
        </FaqWrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
