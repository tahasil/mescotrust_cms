import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import {
  getAdminApiRestriction,
  getAdminPageRestriction,
  isRoleAllowedForRestriction,
  normalizeRoleLabel,
} from "@/lib/adminAccess";

const adminPathPrefix = "/admin";
const loginPath = "/admin/login";

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX = 10;
const loginBuckets = new Map();

function checkLoginRate(ip) {
  const now = Date.now();
  const bucket = loginBuckets.get(ip) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + LOGIN_WINDOW_MS;
  }
  bucket.count++;
  loginBuckets.set(ip, bucket);
  if (loginBuckets.size > 10000) {
    for (const [k, v] of loginBuckets) {
      if (now > v.resetAt) loginBuckets.delete(k);
    }
  }
  return bucket.count <= LOGIN_MAX;
}

function getIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function isAdminRoute(pathname) {
  return pathname.startsWith(adminPathPrefix) || pathname.startsWith("/api/admin");
}

function isMediaObjectIdPath(pathname) {
  const m = pathname.match(/^\/media\/([^/]+)$/);
  if (!m) return false;
  return /^[0-9a-fA-F]{24}$/.test(m[1]);
}

function isStateChanging(method) {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function checkSameOrigin(req) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function withPathname(req) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  const newRequest = new Request(req.url, {
    method: req.method,
    headers,
  });
  return NextResponse.next({ request: newRequest });
}

function buildForbiddenRedirectUrl(req, { requiredRole, requiredPermission } = {}) {
  const url = req.nextUrl.clone();
  const requestedPath = `${req.nextUrl.pathname}${req.nextUrl.search || ""}`;
  url.pathname = "/admin/forbidden";
  url.search = "";
  url.searchParams.set("requiredRole", String(requiredRole || "Admin"));
  if (requiredPermission) {
    url.searchParams.set("requiredPermission", String(requiredPermission));
  }
  url.searchParams.set("from", requestedPath);
  return url;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Never intercept uploaded static assets. Let Next serve them directly.
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  // Resolve frontend CMS pages under /media/* (e.g. /media/in-media)
  // while preserving /media/<ObjectId> for media-file delivery.
  if (pathname.startsWith("/media/") && !isMediaObjectIdPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/resolved-pages${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/api/auth") && req.method === "POST") {
    if (!checkLoginRate(getIp(req))) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/") && isStateChanging(req.method)) {
    if (!checkSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden: cross-origin request" }, { status: 403 });
    }
  }

  if (!isAdminRoute(pathname)) {
    return withPathname(req);
  }

  if (pathname === loginPath) {
    const forceReloginReason = String(req.nextUrl.searchParams.get("reason") || "").trim();
    if (forceReloginReason) {
      return withPathname(req);
    }
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return withPathname(req);
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" && req.nextUrl.searchParams.get("forbidden") === "1") {
    const url = buildForbiddenRedirectUrl(req, { requiredRole: "Admin" });
    return NextResponse.redirect(url);
  }

  const pageRestriction = getAdminPageRestriction(pathname);
  if (pageRestriction && !isRoleAllowedForRestriction(token, pageRestriction)) {
    const url = buildForbiddenRedirectUrl(req, {
      requiredRole: pageRestriction.requiredRole,
      requiredPermission: pageRestriction.requiredPermission,
    });
    return NextResponse.redirect(url);
  }

  const apiRestriction = getAdminApiRestriction(pathname, req.method);
  if (apiRestriction && !isRoleAllowedForRestriction(token, apiRestriction)) {
    return NextResponse.json(
      {
        error: "Forbidden: insufficient permission",
        requiredPermission: apiRestriction.requiredPermission,
        requiredRole: apiRestriction.requiredRole,
        currentRole: normalizeRoleLabel(token.role),
      },
      { status: 403 },
    );
  }

  return withPathname(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|uploads/|uploads$).*)"],
};
