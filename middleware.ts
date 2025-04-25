import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes
const publicRoutes = [
  '/', 
  '/auth/login', 
  '/auth/register',
  '/netflix',
  '/spotify', 
  '/about',
  '/api/auth/register'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if path is public
  const isPublicPath = publicRoutes.some(route => 
    path === route || 
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/accounts') ||
    path.includes('_next') ||
    path.includes('favicon.ico')
  );
  
  // Get token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Security headers untuk semua response
  const response = NextResponse.next();
  
  // Tambahkan security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  
  // Tambahkan headers ke response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Redirect to login if accessing protected routes without auth
  if (!token && !isPublicPath) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(url);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    return redirectResponse;
  }
  
  // Redirect authenticated users away from auth pages
  if (token && (path === '/auth/login' || path === '/auth/register')) {
    const destination = token.role === 'ADMIN' ? '/admin' : '/dashboard';
    
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    return redirectResponse;
  }
  
  // Protect admin routes
  if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    return redirectResponse;
  }
  
  // Admin redirect from user dashboard
  if (path === '/dashboard' && token?.role === 'ADMIN') {
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(new URL('/admin', request.url));
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    return redirectResponse;
  }
  
  return response;
}

// Matcher for routes to apply middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|fonts|favicon.ico).*)',
  ],
}; 