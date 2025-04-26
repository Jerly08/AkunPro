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
  '/api/auth/register',
  '/account',
  '/api/accounts'
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 100; // Maximum requests per window
const requestLimitMap = new Map();

function rateLimiter(ip: string): { limited: boolean, remaining: number } {
  const now = Date.now();
  
  if (!requestLimitMap.has(ip)) {
    requestLimitMap.set(ip, { count: 1, startTime: now });
    return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  const clientData = requestLimitMap.get(ip);
  
  // Reset if time window has passed
  if (now - clientData.startTime > RATE_LIMIT_WINDOW) {
    requestLimitMap.set(ip, { count: 1, startTime: now });
    return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  // Increment request count
  clientData.count++;
  requestLimitMap.set(ip, clientData);
  
  // Check if rate limit exceeded
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientData.count);
  return { 
    limited: clientData.count > MAX_REQUESTS_PER_WINDOW,
    remaining
  };
}

// Cleanup old entries - run every 5 minutes
setInterval(() => {
  const now = Date.now();
  requestLimitMap.forEach((data, key) => {
    if (now - data.startTime > RATE_LIMIT_WINDOW) {
      requestLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const { limited, remaining } = rateLimiter(ip);
  
  // Return 429 Too Many Requests if rate limited
  if (limited) {
    const response = new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'Too Many Requests. Please try again later.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('Retry-After', (RATE_LIMIT_WINDOW / 1000).toString());
    return response;
  }
  
  // Check if path is public
  const isPublicPath = publicRoutes.some(route => 
    path === route || 
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/accounts') ||
    path.startsWith('/account/') ||
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
  
  // Add rate limit headers to all responses
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  // Tambahkan security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self';",
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
    
    // Add rate limit headers to redirect
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
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
    
    // Add rate limit headers to redirect
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Protect admin routes
  if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    // Add rate limit headers to redirect
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Admin redirect from user dashboard
  if (path === '/dashboard' && token?.role === 'ADMIN') {
    // Add security headers to redirect response
    const redirectResponse = NextResponse.redirect(new URL('/admin', request.url));
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    // Add rate limit headers to redirect
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Add CSP headers for development environment
  if (process.env.NODE_ENV === 'development') {
    // In development, we need 'unsafe-eval' for hot reloading
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' ws:"
    );
  } else {
    // In production, we use more restrictive CSP
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'"
    );
  }
  
  return response;
}

// Matcher for routes to apply middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|fonts|favicon.ico).*)',
  ],
}; 