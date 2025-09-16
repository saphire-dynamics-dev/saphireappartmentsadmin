import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('admin-session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
