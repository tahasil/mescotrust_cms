import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import mediaDelivery from "@/lib/media/delivery";
import { toAbsolutePath } from "@/lib/storage/localStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const MEDIA_PATH_PATTERN = /^\/(?:api\/)?media\/[0-9a-f]{24}\/?$/i;
const MEDIA_ID_PATTERN = /^\/(?:api\/)?media\/([0-9a-f]{24})\/?$/i;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

/**
 * Behind a reverse proxy `req.nextUrl.origin` is the internal listener
 * (http://localhost:3000), which the server itself usually cannot reach. Rebuild
 * the public origin from the forwarded headers so relative `src` values resolve
 * to a fetchable URL when the on-disk fast paths do not apply.
 */
function resolveRequestOrigin(req) {
  const forwardedHost = String(
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "",
  )
    .split(",")[0]
    .trim();

  if (forwardedHost) {
    const forwardedProto = String(req.headers.get("x-forwarded-proto") || "")
      .split(",")[0]
      .trim()
      .replace(/:$/, "");
    const protocol =
      forwardedProto || req.nextUrl.protocol.replace(/:$/, "") || "https";
    try {
      return new URL(`${protocol}://${forwardedHost}`).origin;
    } catch {}
  }

  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {}
  }

  return req.nextUrl.origin;
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIp(address) {
  const normalized = String(address || "").toLowerCase().split("%")[0];
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  );
}

async function assertSafeExternalUrl(url) {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Unsupported external PDF URL");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Private external PDF URL");
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Private external PDF URL");
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Private external PDF URL");
  }
}

function isLocalUrl(sourceUrl, req, requestOrigin) {
  if (sourceUrl.origin === requestOrigin) return true;
  if (sourceUrl.origin === req.nextUrl.origin) return true;

  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (hostHeader) {
    const hostWithPort = hostHeader.toLowerCase().trim();
    if (sourceUrl.host.toLowerCase() === hostWithPort) return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const parsedSiteUrl = new URL(siteUrl);
      if (sourceUrl.origin.toLowerCase() === parsedSiteUrl.origin.toLowerCase()) {
        return true;
      }
    } catch {}
  }

  return false;
}

function getSafeSource(req, requestOrigin) {
  const rawSource = String(req.nextUrl.searchParams.get("src") || "").trim();
  if (!rawSource) return null;

  let decodedSource;
  try {
    decodedSource = decodeURIComponent(rawSource);
  } catch {
    return null;
  }

  if (
    decodedSource.includes("\0") ||
    decodedSource.split(/[\\/]/).some((segment) => segment === "..")
  ) {
    return null;
  }

  let sourceUrl;
  try {
    sourceUrl = new URL(rawSource, requestOrigin);
  } catch {
    return null;
  }

  const isLocal = isLocalUrl(sourceUrl, req, requestOrigin);
  if (
    !isLocal &&
    (!["http:", "https:"].includes(sourceUrl.protocol) ||
      sourceUrl.username ||
      sourceUrl.password)
  ) {
    return null;
  }

  const pathname = sourceUrl.pathname;
  const isUploadedPdf =
    isLocal &&
    pathname.toLowerCase().startsWith("/uploads/") &&
    pathname.toLowerCase().endsWith(".pdf");
  const isMediaDocument = isLocal && MEDIA_PATH_PATTERN.test(pathname);
  const isExternalPdf = !isLocal && pathname.toLowerCase().endsWith(".pdf");
  if (!isUploadedPdf && !isMediaDocument && !isExternalPdf) return null;

  return {
    isMediaDocument,
    isUploadedPdf,
    pathname,
    url: sourceUrl,
  };
}

function inlineFileName(pathname) {
  let fileName = pathname.split("/").filter(Boolean).pop() || "notice.pdf";
  try {
    fileName = decodeURIComponent(fileName);
  } catch {}
  if (!fileName.toLowerCase().endsWith(".pdf")) fileName += ".pdf";
  return fileName.replace(/["\\\r\n]/g, "_");
}

function copyHeader(source, target, name) {
  const value = source.headers.get(name);
  if (value) target.set(name, value);
}

function pdfResponseHeaders(pathname) {
  return new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
    "Content-Disposition": `inline; filename="${inlineFileName(pathname)}"`,
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'",
    "Content-Type": "application/pdf",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "0",
  });
}

/** Stream a PDF straight off local disk, honouring a single byte range. */
async function streamLocalPdf(absolutePath, fileNameSource, req) {
  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) return null;

    const fileSize = fileStat.size;
    const rangeHeader = String(req?.headers?.get("range") || "").trim();
    const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
    const headers = pdfResponseHeaders(fileNameSource);

    if (rangeMatch) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
      const requestedEnd = rangeMatch[2] ? Number(rangeMatch[2]) : fileSize - 1;
      const end = Math.min(requestedEnd, fileSize - 1);

      if (!Number.isInteger(start) || start < 0 || start >= fileSize || end < start) {
        headers.set("Content-Range", `bytes */${fileSize}`);
        return new NextResponse(null, { status: 416, headers });
      }

      const contentLength = end - start + 1;
      headers.set("Content-Length", String(contentLength));
      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);

      const stream = Readable.toWeb(createReadStream(absolutePath, { start, end }));
      return new NextResponse(stream, { status: 206, headers });
    }

    headers.set("Content-Length", String(fileSize));
    const stream = Readable.toWeb(createReadStream(absolutePath));
    return new NextResponse(stream, { status: 200, headers });
  } catch {
    return null;
  }
}

async function tryServeLocalUploadedPdf(pathname, req) {
  const normalizedPath = String(pathname || "").trim();
  if (!normalizedPath.toLowerCase().startsWith("/uploads/")) return null;

  return streamLocalPdf(
    toAbsolutePath(normalizedPath.replace(/^\/+/, "")),
    pathname,
    req,
  );
}

/**
 * Resolve `/media/<id>` documents from the database and stream them off disk.
 *
 * Without this the route would fall through to an HTTP self-fetch, which fails
 * behind a reverse proxy because `req.nextUrl.origin` is the internal listener
 * the server cannot reach. Reading the file directly also avoids proxying the
 * whole document through a second internal request.
 */
async function tryServeLocalMediaPdf(source, req) {
  const match = MEDIA_ID_PATTERN.exec(String(source?.pathname || ""));
  if (!match) return null;

  const mediaId = match[1];
  if (!mongoose.Types.ObjectId.isValid(mediaId)) return null;

  let media;
  try {
    await connectDB();
    media = await Media.findById(mediaId).lean();
  } catch {
    return null;
  }
  if (!media) return null;

  const mimeType = String(media.mimeType || "").toLowerCase().trim();
  const storedUrl = String(
    mediaDelivery.pickVariantUrl(
      media,
      source.url.searchParams.get("size") || "",
      "original",
    ) || "",
  ).trim();
  const storageKey = storedUrl.split("?", 1)[0];
  const looksLikePdf =
    mimeType === "application/pdf" || storageKey.toLowerCase().endsWith(".pdf");

  // Tell the client to open non-PDF documents (docx, xlsx, ...) directly.
  if (!looksLikePdf && (mimeType || storageKey)) {
    return NextResponse.json(
      { error: "The selected document is not a PDF." },
      { status: 415 },
    );
  }

  if (!storageKey || /^https?:\/\//i.test(storageKey)) return null;
  if (String(media.storageProvider || "local").toLowerCase() !== "local") return null;

  const fileName = media.filename || media.fileName || storageKey;
  return streamLocalPdf(
    toAbsolutePath(storageKey.replace(/^\/+/, "")),
    fileName,
    req,
  );
}

async function fetchPdfSource(initialUrl, requestHeaders, requestOrigin) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (currentUrl.origin !== requestOrigin) {
      await assertSafeExternalUrl(currentUrl);
    }

    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: requestHeaders,
      redirect: "manual",
    });

    if (!REDIRECT_STATUSES.has(response.status)) return response;

    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirectCount === MAX_REDIRECTS) {
      throw new Error("Too many PDF redirects");
    }
    currentUrl = new URL(location, currentUrl);
  }

  throw new Error("Unable to load PDF");
}

export async function GET(req) {
  const requestOrigin = resolveRequestOrigin(req);
  const source = getSafeSource(req, requestOrigin);
  if (!source) {
    return NextResponse.json(
      { error: "A valid PDF URL is required." },
      { status: 400 },
    );
  }

  if (source.isUploadedPdf) {
    const localResponse = await tryServeLocalUploadedPdf(source.pathname, req);
    if (localResponse) return localResponse;
  }

  if (source.isMediaDocument) {
    const mediaResponse = await tryServeLocalMediaPdf(source, req);
    if (mediaResponse) return mediaResponse;
  }

  try {
    const requestHeaders = new Headers({ Accept: "application/pdf" });
    const range = req.headers.get("range");
    if (range) requestHeaders.set("Range", range);

    const upstream = await fetchPdfSource(
      source.url,
      requestHeaders,
      requestOrigin,
    );

    if (!upstream.ok && upstream.status !== 206) {
      await upstream.body?.cancel();
      return NextResponse.json(
        { error: "The requested PDF could not be loaded." },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const contentType = String(upstream.headers.get("content-type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== "application/pdf") {
      await upstream.body?.cancel();
      return NextResponse.json(
        { error: "The selected document is not a PDF." },
        { status: 415 },
      );
    }

    const headers = new Headers({
      "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Content-Disposition": `inline; filename="${inlineFileName(source.pathname)}"`,
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'",
      "Content-Type": "application/pdf",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "0",
    });

    ["content-length", "content-range", "etag", "last-modified"].forEach(
      (name) => copyHeader(upstream, headers, name),
    );

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "The requested PDF could not be loaded." },
      { status: 502 },
    );
  }
}

