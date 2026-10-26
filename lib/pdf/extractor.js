const path = require("path");
const fs = require("fs");
const { readFile } = require("fs/promises");
const mongoose = require("mongoose");
const { connectDB } = require("../db");
const { toAbsolutePath } = require("../storage/localStorage");
const PdfSearchIndex = require("../../models/PdfSearchIndex");
const Media = require("../../models/Media");
const Page = require("../../models/Page");

let pdfjsModule = null;

async function getPdfJs() {
  if (pdfjsModule) return pdfjsModule;
  try {
    // Dynamic import for pdfjs-dist in ESM / Next.js Node environment
    pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
    return pdfjsModule;
  } catch (err) {
    console.error("[pdf-extractor] Failed to load pdfjs-dist:", err.message);
    throw err;
  }
}

/**
 * Resolve local disk path for a given PDF URL or media reference.
 */
async function resolvePdfBuffer(pdfUrl) {
  if (!pdfUrl) return null;
  const cleanUrl = String(pdfUrl).trim().split("?")[0];

  // 1. Direct uploads file path
  if (cleanUrl.startsWith("/uploads/")) {
    const relKey = cleanUrl.replace(/^\/uploads\//, "uploads/");
    const absPath = toAbsolutePath(relKey);
    if (fs.existsSync(absPath)) {
      return await readFile(absPath);
    }
    const publicPath = path.join(process.cwd(), "public", cleanUrl.replace(/^\//, ""));
    if (fs.existsSync(publicPath)) {
      return await readFile(publicPath);
    }
  }

  // 2. Media ID route e.g. /media/6ad873d580db89a10e025897 or /api/media/...
  const mediaMatch = cleanUrl.match(/^\/(?:api\/)?media\/([0-9a-f]{24})\/?$/i);
  if (mediaMatch) {
    const mediaId = mediaMatch[1];
    await connectDB();
    const mediaDoc = await Media.findById(mediaId).lean();
    if (mediaDoc) {
      if (mediaDoc.storageKey) {
        const absPath = toAbsolutePath(mediaDoc.storageKey);
        if (fs.existsSync(absPath)) return await readFile(absPath);
      }
      if (mediaDoc.originalUrl || mediaDoc.url) {
        const candidate = mediaDoc.originalUrl || mediaDoc.url;
        const sub = candidate.replace(/^\/+/, "");
        const absPath = toAbsolutePath(sub);
        if (fs.existsSync(absPath)) return await readFile(absPath);
        const publicPath = path.join(process.cwd(), "public", sub);
        if (fs.existsSync(publicPath)) return await readFile(publicPath);
      }
    }
  }

  // 3. Fallback: try direct path under public/
  const genericPublic = path.join(process.cwd(), "public", cleanUrl.replace(/^\/+/, ""));
  if (fs.existsSync(genericPublic)) {
    return await readFile(genericPublic);
  }

  return null;
}

/**
 * Extract full text from PDF buffer using pdfjs-dist.
 */
async function extractTextFromPdfBuffer(buffer) {
  if (!buffer || !buffer.length) {
    return { text: "", pageCount: 0, status: "failed" };
  }

  try {
    const pdfjs = await getPdfJs();
    const data = new Uint8Array(buffer);
    const doc = await pdfjs.getDocument({ data }).promise;
    const pageCount = doc.numPages || 0;
    let fullText = "";

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += " " + pageText;
    }

    const trimmed = fullText.replace(/\s+/g, " ").trim();
    if (!trimmed || trimmed.length < 5) {
      return {
        text: "",
        pageCount,
        status: "no_text", // Scanned / image-only PDF
      };
    }

    return {
      text: trimmed,
      pageCount,
      status: "ready",
    };
  } catch (error) {
    console.error("[pdf-extractor] Text extraction failed:", error.message);
    return {
      text: "",
      pageCount: 0,
      status: "failed",
      error: error.message,
    };
  }
}

/**
 * Extracts a relevant contextual snippet around query keyword matches.
 */
function extractSnippet(fullText, query, maxLength = 160) {
  if (!fullText) return "";
  const text = String(fullText).trim();
  if (!query) return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");

  const words = String(query)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  // Find index of first matching word
  let bestIndex = -1;
  const lowerText = text.toLowerCase();
  for (const word of words) {
    const idx = lowerText.indexOf(word);
    if (idx !== -1) {
      bestIndex = idx;
      break;
    }
  }

  if (bestIndex === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  // Center the snippet around the matched word
  const half = Math.floor(maxLength / 2);
  let start = Math.max(0, bestIndex - half);
  let end = Math.min(text.length, start + maxLength);

  // Align to nearest word boundaries if possible
  if (start > 0) {
    const prevSpace = text.lastIndexOf(" ", start + 10);
    if (prevSpace > start - 15 && prevSpace < start + 10) {
      start = prevSpace + 1;
    }
  }
  if (end < text.length) {
    const nextSpace = text.indexOf(" ", end - 10);
    if (nextSpace !== -1 && nextSpace < end + 15) {
      end = nextSpace;
    }
  }

  const snippet = text.slice(start, end).trim();
  const prefix = start > 0 ? "... " : "";
  const suffix = end < text.length ? " ..." : "";
  return `${prefix}${snippet}${suffix}`;
}

/**
 * Indexes a single PDF file by its URL or media reference.
 */
async function indexPdfByUrl({
  url,
  title = "",
  year = "",
  category = "annual-report",
  coverImage = "",
  sourcePageSlug = "",
  force = false,
}) {
  if (!url) return null;
  await connectDB();

  const cleanUrl = String(url).trim();
  const existing = await PdfSearchIndex.findOne({ url: cleanUrl });
  if (existing && !force && existing.status === "ready" && existing.extractedText) {
    // Already indexed
    return existing;
  }

  const buffer = await resolvePdfBuffer(cleanUrl);
  if (!buffer) {
    console.warn(`[pdf-extractor] Could not resolve file buffer for URL: ${cleanUrl}`);
    return null;
  }

  const { text, pageCount, status } = await extractTextFromPdfBuffer(buffer);

  // Deduce year if not provided (e.g. "2024-25" or "2024")
  let derivedYear = year;
  if (!derivedYear) {
    const yearMatch = (title + " " + cleanUrl).match(/\b(20\d{2}[-–]\d{2,4}|20\d{2})\b/);
    if (yearMatch) derivedYear = yearMatch[1];
  }

  // Deduce filename
  const filename = path.basename(cleanUrl.split("?")[0]);

  const doc = await PdfSearchIndex.findOneAndUpdate(
    { url: cleanUrl },
    {
      url: cleanUrl,
      filename,
      title: title || filename,
      year: derivedYear,
      category,
      coverImage,
      sourcePageSlug,
      extractedText: text,
      pageCount,
      status,
      fileSize: buffer.length,
      lastIndexedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return doc;
}

/**
 * Discovers and indexes all Annual Reports configured across the CMS.
 */
async function indexAllAnnualReports() {
  await connectDB();
  const results = [];

  // 1. Scan page `media/annual-reports`
  const arPage = await Page.findOne({
    slug: { $in: ["media/annual-reports", "annual-reports"] },
  }).lean();

  if (arPage && Array.isArray(arPage.layout)) {
    for (const block of arPage.layout) {
      if (block.baseComponent === "Reports" && block.props) {
        const items = Array.isArray(block.props.reportsItems)
          ? block.props.reportsItems
          : Array.isArray(block.props.items)
            ? block.props.items
            : [];

        for (const item of items) {
          const pdfUrl = item.pdfUrl || item.link;
          if (pdfUrl) {
            const title = item.name || item.title || "";
            const yearMatch = title.match(/\b(20\d{2}[-–]\d{2,4}|20\d{2})\b/);
            const year = item.tag || (yearMatch ? yearMatch[1] : "");
            const cover = item.imageDesktop || item.image || "";

            const indexed = await indexPdfByUrl({
              url: pdfUrl,
              title,
              year,
              category: "annual-report",
              coverImage: cover,
              sourcePageSlug: arPage.slug,
            });
            if (indexed) results.push(indexed);
          }
        }
      }
    }
  }

  // 2. Scan all Media PDF items whose originalName, title, or filename contains "annual" or "report"
  const mediaReports = await Media.find({
    mimeType: "application/pdf",
    $or: [
      { originalName: /annual/i },
      { originalName: /report/i },
      { title: /annual/i },
      { title: /report/i },
      { filename: /annual/i },
      { filename: /report/i },
    ],
  }).lean();

  for (const m of mediaReports) {
    const url = m.publicUrl || m.originalUrl || m.url;
    if (url) {
      const title = m.title || m.originalName || m.filename;
      const yearMatch = title.match(/\b(20\d{2}[-–]\d{2,4}|20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : "";

      const indexed = await indexPdfByUrl({
        url,
        title,
        year,
        category: "annual-report",
        sourcePageSlug: "media/annual-reports",
      });
      if (indexed) results.push(indexed);
    }
  }

  return results;
}

module.exports = {
  resolvePdfBuffer,
  extractTextFromPdfBuffer,
  extractSnippet,
  indexPdfByUrl,
  indexAllAnnualReports,
};
