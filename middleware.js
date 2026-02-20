import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/blog", "/contact", "/search", "/preview", "/api/public", "/api/health", "/api/theme", "/api/contact"];
const adminPathPrefix = "/admin";
const loginPath = "/admin/login";

function isPublic(pathname) {
  if (pathname === loginPath) return true;
  if (pathname.startsWith("/api/public")) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/api/theme") return true;
  if (pathname.startsWith("/api/contact")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/blog")) return true;
  if (pathname === "/contact" || pathname === "/search") return true;
  return false;
}

function isAdminRoute(pathname) {
  return pathname.startsWith(adminPathPrefix) || pathname.startsWith("/api/admin");
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  if (pathname === loginPath) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Editor cannot access users or theme (Admin only)
  if (token.role !== "Admin" && (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/theme"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
