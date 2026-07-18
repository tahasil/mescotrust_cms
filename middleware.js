import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { getDefaultPermissionKeysForRole, getPermissionForAdminPage, getRequiredPermissionsForAdminApi } from "@/lib/rbac/catalog";
import { isConfiguredSuperAdminEmail, ROLE_KEYS } from "@/lib/rbac/constants";
import { hasAnyPermissionKey, hasPermissionKey } from "@/lib/rbac/permissionUtils";

const adminPathPrefix = "/admin";
const loginPath = "/admin/login";
const CSRF_ORIGIN_EXEMPT_PATHS = new Set([
  "/api/payment/callback",
]);

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

function isCsrfExemptPath(pathname) {
  return CSRF_ORIGIN_EXEMPT_PATHS.has(pathname);
}

function checkSameOrigin(req, pathname) {
  if (isCsrfExemptPath(pathname)) return true;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const requestProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    req.nextUrl.protocol.replace(":", "");

  if (!origin) {
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return (
          refererUrl.host === host &&
          refererUrl.protocol.replace(":", "") === requestProto
        );
      } catch {
        return false;
      }
    }

    const secFetchSite = req.headers.get("sec-fetch-site");
    if (!secFetchSite) return false;
    return secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none";
  }
  try {
    const originUrl = new URL(origin);
    return (
      originUrl.host === host &&
      originUrl.protocol.replace(":", "") === requestProto
    );
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

function clearSessionCookies(req, response) {
  const sessionCookiePrefixes = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  for (const cookie of req.cookies.getAll()) {
    if (sessionCookiePrefixes.some((prefix) => cookie.name === prefix || cookie.name.startsWith(`${prefix}.`))) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}

function roleUpdatedLoginUrl(req, reason = "role-updated") {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("reason", String(reason || "role-updated"));
  return url;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

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
    if (!checkSameOrigin(req, pathname)) {
      return NextResponse.json({ error: "Forbidden: cross-origin request" }, { status: 403 });
    }
  }

  if (!isAdminRoute(pathname)) {
    return withPathname(req);
  }

  if (pathname === loginPath) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const reason = String(req.nextUrl.searchParams.get("reason") || "");
    const requiresFreshLogin =
      token?.forceReauth || reason === "role-updated" || reason === "account-deactivated";
    if (requiresFreshLogin) {
      return clearSessionCookies(req, withPathname(req));
    }
    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
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
  if (token.forceReauth) {
    const response = NextResponse.redirect(
      roleUpdatedLoginUrl(req, token.forceReauthReason),
    );
    return clearSessionCookies(req, response);
  }
  const tokenPermissionKeys = Array.isArray(token.permissionKeys)
    ? token.permissionKeys
    : Array.from(
        getDefaultPermissionKeysForRole(
          isConfiguredSuperAdminEmail(token.email)
            ? ROLE_KEYS.SUPER_ADMIN
            : token.roleKey || token.role,
        ),
      );
  const requiredPermission = pathname.startsWith("/api/")
    ? getRequiredPermissionsForAdminApi(pathname, req.method)
    : getPermissionForAdminPage(pathname);
  const allowed = !requiredPermission || (Array.isArray(requiredPermission)
    ? hasAnyPermissionKey(tokenPermissionKeys, requiredPermission)
    : hasPermissionKey(tokenPermissionKeys, requiredPermission));

  if (!allowed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permission", requiredPermission },
        { status: 403 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/forbidden";
    url.searchParams.set("from", pathname);
    if (typeof requiredPermission === "string") {
      url.searchParams.set("requiredPermission", requiredPermission);
    }
    return NextResponse.redirect(url);
  }
  return withPathname(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|uploads/).*)"],
};
