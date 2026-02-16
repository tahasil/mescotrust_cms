import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

function getNextAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret !== 'your-secret-here') return secret;
  if (process.env.NODE_ENV === 'development') return 'mescotrust-dev-secret-change-in-production';
  return secret;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const secret = getNextAuthSecret();

  // Allow auth API routes and login page
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/pages/')
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret });

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ req: request, secret });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
