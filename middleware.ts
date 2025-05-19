import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/home',
  '/help',
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
const MAX_REQUESTS_PER_WINDOW = Number.MAX_SAFE_INTEGER; // Secara efektif unlimited (9007199254740991)
const requestLimitMap = new Map();

function rateLimiter(ip: string): { limited: boolean, remaining: number } {
  // Selalu mengembalikan not limited
  return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  
  // Kode rate limiting yang lama:
  /*
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
  */
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
  
  // Check if path is public
  const isPublicPath = publicRoutes.includes(path) || 
                      path.startsWith('/api/auth/') ||
                      path.startsWith('/api/accounts') ||
                      path.startsWith('/account/') ||
                      path.includes('_next') ||
                      path.includes('favicon.ico');
  
  // Get token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Security headers for all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  
  // Redirect to login if accessing protected routes without auth
  if (!token && !isPublicPath) {
    const loginPath = '/auth/login';
    const callbackUrl = request.nextUrl.pathname;
    
    const url = new URL(loginPath, request.url);
    url.searchParams.set('callbackUrl', callbackUrl);
    
    const redirectResponse = NextResponse.redirect(url);
    
    // Add headers to redirect
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Redirect authenticated users away from auth pages
  if (token && (path === '/auth/login' || path === '/auth/register')) {
    const destination = token.role === 'ADMIN' ? '/admin' : '/dashboard';
    
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    
    // Add headers to redirect
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Protect admin routes
  if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Add headers to redirect
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Admin redirect from user dashboard
  if (path === '/dashboard' && token?.role === 'ADMIN') {
    const redirectResponse = NextResponse.redirect(new URL('/admin', request.url));
    
    // Add headers to redirect
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    redirectResponse.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    redirectResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return redirectResponse;
  }
  
  // Continue with the request
  const response = NextResponse.next();
  
  // Add headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  // Adjust CSP for development environment
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' ws:"
    );
  }
  
  return response;
}

// Specify paths for middleware to run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|fonts|favicon.ico).*)',
  ],
}; 