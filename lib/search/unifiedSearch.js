const { connectDB } = require("../db");
const Page = require("../../models/Page");
const Blog = require("../../models/Blog");
const BlogCategory = require("../../models/BlogCategory");
const Event = require("../../models/Event");
const PdfSearchIndex = require("../../models/PdfSearchIndex");
const { extractSnippet } = require("../pdf/extractor");

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
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
 * Recursively collects all searchable strings from a page layout block's props.
 */
function extractStringsFromProps(obj, strings = []) {
  if (!obj) return strings;
  if (typeof obj === "string") {
    const clean = stripHtml(obj);
    if (clean.length > 1) strings.push(clean);
    return strings;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractStringsFromProps(item, strings);
    }
    return strings;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      // Skip styling, color keys, css classes, and id fields
      if (
        key.toLowerCase().includes("color") ||
        key.toLowerCase().includes("bg") ||
        key.toLowerCase().includes("class") ||
        key.toLowerCase().includes("padding") ||
        key.toLowerCase().includes("margin") ||
        key.toLowerCase().includes("target") ||
        key === "_id" ||
        key === "id"
      ) {
        continue;
      }
      extractStringsFromProps(value, strings);
    }
  }
  return strings;
}

/**
 * Calculates a search relevance score.
 */
function computeScore({
  title = "",
  content = "",
  tags = [],
  exactQuery = "",
  tokens = [],
}) {
  let score = 0;
  const titleLower = title.toLowerCase();
  const queryLower = exactQuery.toLowerCase();

  // Exact title match
  if (titleLower === queryLower) {
    score += 100;
  } else if (titleLower.startsWith(queryLower)) {
    score += 85;
  } else if (titleLower.includes(queryLower)) {
    score += 70;
  }

  // Token matches in title
  let tokenTitleMatches = 0;
  for (const token of tokens) {
    if (titleLower.includes(token)) tokenTitleMatches++;
  }
  if (tokenTitleMatches === tokens.length && tokens.length > 1) {
    score += 60;
  } else if (tokenTitleMatches > 0) {
    score += tokenTitleMatches * 15;
  }

  // Tag matches
  for (const tag of tags) {
    const tLower = String(tag).toLowerCase();
    if (tLower === queryLower) score += 50;
    else if (tLower.includes(queryLower)) score += 30;
  }

  // Content matches
  const contentLower = content.toLowerCase();
  if (contentLower.includes(queryLower)) {
    score += 40;
  } else {
    let tokenContentMatches = 0;
    for (const token of tokens) {
      if (contentLower.includes(token)) tokenContentMatches++;
    }
    score += tokenContentMatches * 10;
  }

  return score;
}

/**
 * Search Pages
 */
async function searchPages({ query, tokens, regex }) {
  const pages = await Page.find({ status: "published" }).lean();
  const results = [];

  for (const page of pages) {
    const title = page.title || "";
    const metaDesc = page.meta?.metaDescription || "";
    const metaKeywords = page.meta?.metaKeywords || "";

    // Extract all text content from page blocks
    const blockStrings = [];
    let firstImage = "";
    if (Array.isArray(page.layout)) {
      for (const block of page.layout) {
        if (!block || !block.props) continue;
        extractStringsFromProps(block.props, blockStrings);
        if (!firstImage) {
          const img =
            block.props.imageDesktop ||
            block.props.image ||
            block.props.bgImage ||
            block.props.featuredImage;
          if (img && typeof img === "string" && !img.endsWith(".pdf")) {
            firstImage = img;
          }
        }
      }
    }

    const fullContent = [metaDesc, metaKeywords, ...blockStrings].join(" ");
    const matchesTitle = regex.test(title);
    const matchesContent = regex.test(fullContent);

    if (matchesTitle || matchesContent) {
      const score = computeScore({
        title,
        content: fullContent,
        exactQuery: query,
        tokens,
      });

      // Best excerpt
      let excerpt = "";
      if (matchesContent) {
        excerpt = extractSnippet(fullContent, query, 170);
      } else if (metaDesc) {
        excerpt = metaDesc.slice(0, 170);
      } else if (blockStrings.length > 0) {
        excerpt = blockStrings[0].slice(0, 170);
      }

      results.push({
        id: `page-${page._id}`,
        type: "page",
        typeLabel: "Page",
        title,
        slug: page.slug,
        url: `/${page.slug}`,
        excerpt: excerpt || title,
        image: firstImage,
        relevanceScore: score,
      });
    }
  }

  return results;
}

/**
 * Search Events
 */
async function searchEvents({ query, tokens, regex }) {
  const events = await Event.find({ status: "published" }).lean();
  const results = [];

  for (const ev of events) {
    const title = ev.title || "";
    const desc = stripHtml(ev.description || "");
    const content = stripHtml(ev.content || "");
    const tags = Array.isArray(ev.tags) ? ev.tags : [];
    const fullContent = `${desc} ${content} ${ev.location || ""}`;

    const matchesTitle = regex.test(title);
    const matchesContent = regex.test(fullContent);
    const matchesTags = tags.some((t) => regex.test(t));

    if (matchesTitle || matchesContent || matchesTags) {
      const score = computeScore({
        title,
        content: fullContent,
        tags,
        exactQuery: query,
        tokens,
      });

      const excerpt = matchesContent
        ? extractSnippet(fullContent, query, 170)
        : desc || content.slice(0, 170);

      const image = ev.featuredImageDesktop || ev.featuredImageMobile || "";

      results.push({
        id: `event-${ev._id}`,
        type: "event",
        typeLabel: "Event",
        title,
        slug: ev.slug,
        url: `/events/${ev.slug}`,
        excerpt: excerpt || title,
        image,
        date: ev.startDate,
        relevanceScore: score,
      });
    }
  }

  return results;
}

/**
 * Search Blogs
 */
async function searchBlogs({ query, tokens, regex }) {
  const blogs = await Blog.find({ status: "published" })
    .populate("category")
    .lean();
  const results = [];

  for (const b of blogs) {
    const title = b.title || "";
    const excerptRaw = stripHtml(b.excerpt || "");
    const content = stripHtml(b.content || "");
    const categoryName = b.category?.name || "";
    const tags = Array.isArray(b.tags) ? b.tags : [];
    const fullContent = `${excerptRaw} ${content} ${categoryName}`;

    const matchesTitle = regex.test(title);
    const matchesContent = regex.test(fullContent);
    const matchesTags = tags.some((t) => regex.test(t)) || regex.test(categoryName);

    if (matchesTitle || matchesContent || matchesTags) {
      const score = computeScore({
        title,
        content: fullContent,
        tags: [...tags, categoryName],
        exactQuery: query,
        tokens,
      });

      const excerpt = matchesContent
        ? extractSnippet(fullContent, query, 170)
        : excerptRaw || content.slice(0, 170);

      const image = b.featuredImage || b.featuredImageMobile || "";

      results.push({
        id: `blog-${b._id}`,
        type: "blog",
        typeLabel: "Blog",
        title,
        slug: b.slug,
        url: `/blog/${b.slug}`,
        excerpt: excerpt || title,
        image,
        date: b.publishedAt || b.createdAt,
        category: categoryName,
        relevanceScore: score,
      });
    }
  }

  return results;
}

/**
 * Search News (LatestNews items, InMedia clippings, Notices items, news blogs)
 */
async function searchNews({ query, tokens, regex }) {
  const results = [];
  const seenKeys = new Set();

  // 1. Scan published pages for LatestNews, InMedia, and Notices components
  const newsPages = await Page.find({
    status: "published",
    $or: [
      { "layout.baseComponent": "LatestNews" },
      { "layout.baseComponent": "InMedia" },
      { "layout.baseComponent": "Notices" },
    ],
  }).lean();

  for (const page of newsPages) {
    for (const block of page.layout || []) {
      const props = block.props || {};

      // A) LatestNews block
      if (block.baseComponent === "LatestNews") {
        const items = Array.isArray(props.latestEvents1Items)
          ? props.latestEvents1Items
          : [];
        for (const it of items) {
          const title = String(it.title || "").trim();
          const date = it.date || "";
          if (!title || seenKeys.has(title.toLowerCase())) continue;

          if (regex.test(title) || regex.test(date)) {
            seenKeys.add(title.toLowerCase());
            const score = computeScore({
              title,
              content: date,
              exactQuery: query,
              tokens,
            });

            results.push({
              id: `news-ln-${title.slice(0, 20)}`,
              type: "news",
              typeLabel: "News",
              title,
              url: it.buttonLink || `/${page.slug}`,
              excerpt: it.date ? `Latest News · ${it.date}` : "Latest News announcement",
              date: it.date,
              target: it.target || "_self",
              sourcePage: page.title,
              relevanceScore: score + 10,
            });
          }
        }
      }

      // B) InMedia block (Press Clippings / In the News)
      if (block.baseComponent === "InMedia") {
        const items = Array.isArray(props.inMediaItems) ? props.inMediaItems : [];
        for (const it of items) {
          const name = String(it.name || it.title || "").trim();
          const source = it.source || "";
          const date = it.date || "";
          if (!name || seenKeys.has(name.toLowerCase())) continue;

          if (regex.test(name) || regex.test(source) || regex.test(date)) {
            seenKeys.add(name.toLowerCase());
            const score = computeScore({
              title: name,
              content: `${source} ${date}`,
              exactQuery: query,
              tokens,
            });

            const image = it.imageDesktop || it.image || "";

            results.push({
              id: `news-im-${name.slice(0, 20)}`,
              type: "news",
              typeLabel: "News",
              title: name,
              url: `/media/in-media`,
              excerpt: [source, date].filter(Boolean).join(" · ") || "Press Coverage",
              image,
              date,
              source,
              relevanceScore: score + 10,
            });
          }
        }
      }

      // C) Notices block
      if (block.baseComponent === "Notices") {
        const items = Array.isArray(props.noticesItems) ? props.noticesItems : [];
        for (const it of items) {
          const label = String(it.label || "").trim();
          const subLabel = it.subLabel || "";
          if (!label || seenKeys.has(label.toLowerCase())) continue;

          if (regex.test(label) || regex.test(subLabel)) {
            seenKeys.add(label.toLowerCase());
            const score = computeScore({
              title: label,
              content: subLabel,
              exactQuery: query,
              tokens,
            });

            results.push({
              id: `news-notice-${label.slice(0, 20)}`,
              type: "news",
              typeLabel: "News",
              title: label,
              url: it.link || `/${page.slug}`,
              excerpt: subLabel ? `Notice · ${subLabel}` : "Official Notice",
              target: it.target || "_self",
              relevanceScore: score + 5,
            });
          }
        }
      }
    }
  }

  // 2. Also check if any Blog has "news" in category or tags
  const newsBlogs = await Blog.find({
    status: "published",
    $or: [{ tags: /news/i }],
  })
    .populate("category")
    .lean();

  for (const b of newsBlogs) {
    if (seenKeys.has(b.title.toLowerCase())) continue;
    if (regex.test(b.title) || regex.test(b.excerpt || "") || regex.test(b.content || "")) {
      seenKeys.add(b.title.toLowerCase());
      const score = computeScore({
        title: b.title,
        content: `${b.excerpt || ""} ${b.content || ""}`,
        exactQuery: query,
        tokens,
      });

      results.push({
        id: `news-blog-${b._id}`,
        type: "news",
        typeLabel: "News",
        title: b.title,
        slug: b.slug,
        url: `/blog/${b.slug}`,
        excerpt: extractSnippet(b.excerpt || b.content || "", query, 170) || b.title,
        image: b.featuredImage || "",
        date: b.publishedAt || b.createdAt,
        relevanceScore: score,
      });
    }
  }

  return results;
}

/**
 * Search Annual Reports (title, year, and extracted PDF text)
 */
async function searchAnnualReports({ query, tokens, regex }) {
  const results = [];
  const seenUrls = new Set();

  // Search indexed PDF search records
  const indexedPdfs = await PdfSearchIndex.find({
    $or: [
      { category: "annual-report" },
      { title: /annual/i },
      { title: /report/i },
      { filename: /annual/i },
      { filename: /report/i },
    ],
  }).lean();

  for (const doc of indexedPdfs) {
    const title = doc.title || doc.filename;
    const year = doc.year || "";
    const extractedText = doc.extractedText || "";

    const matchesTitle = regex.test(title);
    const matchesYear = year && regex.test(year);
    const matchesPdfText = extractedText && regex.test(extractedText);

    if (matchesTitle || matchesYear || matchesPdfText) {
      seenUrls.add(doc.url.toLowerCase());
      const score = computeScore({
        title,
        content: extractedText,
        tags: [year],
        exactQuery: query,
        tokens,
      });

      let excerpt = "";
      if (matchesPdfText) {
        excerpt = extractSnippet(extractedText, query, 170);
      } else if (year) {
        excerpt = `MESCO Annual Report for the financial year ${year}. Document available in PDF.`;
      } else {
        excerpt = "Official MESCO Annual Report document.";
      }

      results.push({
        id: `report-${doc._id}`,
        type: "report",
        typeLabel: "Annual Report",
        title,
        url: doc.url,
        pdfUrl: doc.url,
        year,
        excerpt,
        image: doc.coverImage || "",
        pageCount: doc.pageCount,
        isPdf: true,
        relevanceScore: matchesPdfText ? score + 35 : score,
      });
    }
  }

  // Also check Reports block on page `media/annual-reports` in case an item hasn't been indexed
  const arPage = await Page.findOne({
    slug: { $in: ["media/annual-reports", "annual-reports"] },
    status: "published",
  }).lean();

  if (arPage && Array.isArray(arPage.layout)) {
    for (const block of arPage.layout) {
      if (block.baseComponent === "Reports" && block.props) {
        const items = Array.isArray(block.props.reportsItems)
          ? block.props.reportsItems
          : [];

        for (const item of items) {
          const pdfUrl = item.pdfUrl || item.link;
          if (!pdfUrl || seenUrls.has(pdfUrl.toLowerCase())) continue;

          const title = item.name || item.title || "";
          const tag = item.tag || "";
          const desc = item.description || "";

          if (regex.test(title) || regex.test(tag) || regex.test(desc)) {
            seenUrls.add(pdfUrl.toLowerCase());
            const score = computeScore({
              title,
              content: `${tag} ${desc}`,
              exactQuery: query,
              tokens,
            });

            results.push({
              id: `report-page-${title.slice(0, 20)}`,
              type: "report",
              typeLabel: "Annual Report",
              title,
              url: pdfUrl,
              pdfUrl,
              year: tag,
              excerpt: desc || (tag ? `Annual Report · ${tag}` : "Annual Report PDF"),
              image: item.imageDesktop || item.image || "",
              isPdf: true,
              relevanceScore: score,
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Unified Search across all modules
 *
 * @param {Object} options
 * @param {string} options.query - Search term
 * @param {string} [options.type] - Filter by type ('all' | 'pages' | 'events' | 'blogs' | 'news' | 'reports')
 * @param {number} [options.page=1] - 1-based page
 * @param {number} [options.limit=20] - Page size
 */
async function performUnifiedSearch({
  query = "",
  type = "all",
  page = 1,
  limit = 20,
}) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 2) {
    return {
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
      counts: { all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 },
    };
  }

  await connectDB();

  // Create safe case-insensitive regex
  const safeQuery = escapeRegex(trimmed);
  const regex = new RegExp(safeQuery, "i");
  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const filterType = String(type || "all").toLowerCase();

  // Parallel search across all 5 modules
  const [pagesResults, eventsResults, blogsResults, newsResults, reportsResults] =
    await Promise.all([
      searchPages({ query: trimmed, tokens, regex }),
      searchEvents({ query: trimmed, tokens, regex }),
      searchBlogs({ query: trimmed, tokens, regex }),
      searchNews({ query: trimmed, tokens, regex }),
      searchAnnualReports({ query: trimmed, tokens, regex }),
    ]);

  const counts = {
    all:
      pagesResults.length +
      eventsResults.length +
      blogsResults.length +
      newsResults.length +
      reportsResults.length,
    pages: pagesResults.length,
    events: eventsResults.length,
    blogs: blogsResults.length,
    news: newsResults.length,
    reports: reportsResults.length,
  };

  // Determine active item set
  let pool = [];
  if (filterType === "pages" || filterType === "page") {
    pool = pagesResults;
  } else if (filterType === "events" || filterType === "event") {
    pool = eventsResults;
  } else if (filterType === "blogs" || filterType === "blog") {
    pool = blogsResults;
  } else if (filterType === "news") {
    pool = newsResults;
  } else if (filterType === "reports" || filterType === "report" || filterType === "annual-reports") {
    pool = reportsResults;
  } else {
    pool = [
      ...pagesResults,
      ...eventsResults,
      ...blogsResults,
      ...newsResults,
      ...reportsResults,
    ];
  }

  // Sort by relevance score descending, then by title
  pool.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return (a.title || "").localeCompare(b.title || "");
  });

  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const total = pool.length;
  const totalPages = Math.ceil(total / pageSize);
  const skip = (currentPage - 1) * pageSize;
  const paginatedItems = pool.slice(skip, skip + pageSize);

  return {
    items: paginatedItems,
    total,
    page: currentPage,
    totalPages,
    counts,
    query: trimmed,
  };
}

module.exports = {
  performUnifiedSearch,
  searchPages,
  searchEvents,
  searchBlogs,
  searchNews,
  searchAnnualReports,
};
