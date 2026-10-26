/**
 * Dynamic FAQ Schema Generator for MESCO Trust CMS
 *
 * Extracts FAQ questions and answers dynamically from Page Builder layout blocks
 * (Accordion components) and converts them into Schema.org FAQPage structured data:
 * https://developers.google.com/search/docs/appearance/structured-data/faqpage
 *
 * When an editor modifies questions, answers, or categories in /admin/pages,
 * this generator ensures that the frontend schema automatically reflects those
 * changes from MongoDB with zero static/hardcoded data.
 */

/**
 * Strips HTML tags and normalizes whitespace for clean Schema.org text.
 */
export function cleanHtmlText(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts Q&A pairs from any Accordion blocks present in a page's layout.
 *
 * @param {Array} layout - Array of layout blocks from MongoDB Page document
 * @returns {Array<{ question: string, answer: string, category: string }>}
 */
export function extractFaqItemsFromLayout(layout = []) {
  if (!Array.isArray(layout) || layout.length === 0) return [];

  const items = [];

  for (const block of layout) {
    if (!block) continue;

    const base =
      block.baseComponent ||
      block.componentId?.baseComponent ||
      (typeof block.componentId === "string" ? block.componentId : "");

    if (base !== "Accordion") continue;

    const props = block.props || {};
    const accordionItems = props.accordionItems || props.items || [];
    if (!Array.isArray(accordionItems)) continue;

    const categoryTitle = cleanHtmlText(
      String(props.accordionMainTitle || props.title || "").replace(/\*/g, "")
    );

    for (const item of accordionItems) {
      if (!item) continue;

      const question = cleanHtmlText(item.label || item.title || item.question || "");
      const answer = cleanHtmlText(item.content || item.children || item.answer || "");

      if (question && answer) {
        items.push({
          question,
          answer,
          category: categoryTitle,
        });
      }
    }
  }

  return items;
}

/**
 * Generates Schema.org compliant FAQPage JSON-LD from a page's layout blocks.
 *
 * @param {Array} layout - Page layout blocks
 * @param {string} [pageSlug] - Page slug (e.g. "faq")
 * @param {string} [pageTitle] - Page title (e.g. "FAQ")
 * @returns {Object|null} Schema.org FAQPage object or null if not applicable
 */
export function extractFaqSchemaFromLayout(layout = [], pageSlug = "", pageTitle = "") {
  const cleanSlug = String(pageSlug || "").toLowerCase().replace(/^\/+|\/+$/g, "");
  const cleanTitle = String(pageTitle || "").toLowerCase().trim();

  const isFaqPage =
    cleanSlug === "faq" ||
    cleanSlug.endsWith("/faq") ||
    cleanSlug.includes("faq") ||
    cleanTitle.includes("faq") ||
    cleanTitle.includes("frequently asked");

  const items = extractFaqItemsFromLayout(layout);
  if (items.length === 0) return null;

  // On non-FAQ pages, only emit FAQ schema if at least 2 items end with '?'
  if (!isFaqPage) {
    const questionCount = items.filter((it) => it.question.endsWith("?")).length;
    if (questionCount < 2) return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

import { serializeJsonLd } from "@/lib/security/jsonLd";

/**
 * XSS-safe serialization using centralized serializer
 */
export function serializeFaqJsonLd(data) {
  return serializeJsonLd(data);
}
