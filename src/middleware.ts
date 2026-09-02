import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth');
  const isPublicApi = req.nextUrl.pathname.startsWith('/api/v1');

  if (!req.auth && !isLoginPage && !isAuthApi && !isPublicApi) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (isLoginPage || req.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/templates', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
