import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // TODO: remove once a real landing page exists
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/dashboard' : '/login', req.url)
    );
  }

  const isPublic = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
