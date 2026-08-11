import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const MEDIA_PATH_PATTERN = /^\/(?:api\/)?media\/[0-9a-f]{24}\/?$/i;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

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

function getSafeSource(req) {
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
    sourceUrl = new URL(rawSource, req.nextUrl.origin);
  } catch {
    return null;
  }

  const isLocal = sourceUrl.origin === req.nextUrl.origin;
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
  const source = getSafeSource(req);
  if (!source) {
    return NextResponse.json(
      { error: "A valid PDF URL is required." },
      { status: 400 },
    );
  }

  try {
    const requestHeaders = new Headers({ Accept: "application/pdf" });
    const range = req.headers.get("range");
    if (range) requestHeaders.set("Range", range);

    const upstream = await fetchPdfSource(
      source.url,
      requestHeaders,
      req.nextUrl.origin,
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
