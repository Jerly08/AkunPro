import { NextRequest, NextResponse } from 'next/server';

// Memory store untuk rate limiting (dalam aplikasi produksi sebaiknya gunakan Redis)
type RateLimitStore = {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
};

const store: RateLimitStore = {};

// Membersihkan store secara periodik setiap 1 jam
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((ip) => {
    if (store[ip].resetTime < now) {
      delete store[ip];
    }
  });
}, 60 * 60 * 1000);

export async function rateLimiter(
  request: NextRequest,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000 // 1 menit default
) {
  // Dapatkan IP pengguna dari headers
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const now = Date.now();

  // Inisialisasi jika IP belum ada di store
  if (!store[ip]) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Reset counter jika sudah melewati reset time
  if (store[ip].resetTime < now) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment counter
  store[ip].count += 1;

  // Header untuk informasi rate limit
  const remainingRequests = Math.max(0, maxRequests - store[ip].count);
  const headers = new Headers({
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(remainingRequests),
    'X-RateLimit-Reset': String(store[ip].resetTime),
  });

  // Jika melebihi batas, tolak request
  if (store[ip].count > maxRequests) {
    // Tambahkan delay eksponensial untuk mencegah brute force
    const retryAfter = Math.floor(Math.random() * 30) + 30; // 30-60 detik
    headers.set('Retry-After', String(retryAfter));

    return NextResponse.json(
      { message: 'Terlalu banyak permintaan, coba lagi nanti' },
      { status: 429, headers }
    );
  }

  // Return headers untuk ditambahkan ke respons
  return headers;
} 