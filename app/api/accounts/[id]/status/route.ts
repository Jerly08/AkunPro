import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma, { validateId } from '@/lib/prisma';

// Simple in-memory rate limiting
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // max requests per IP per window
  cache: new Map<string, { count: number, resetTime: number }>()
};

// Rate limiting middleware function
function checkRateLimit(ip: string): { success: boolean; message?: string } {
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;
  
  // Clean expired entries
  for (const [key, data] of rateLimit.cache.entries()) {
    if (data.resetTime < now) {
      rateLimit.cache.delete(key);
    }
  }
  
  // Get or create rate limit data for this IP
  let rateLimitData = rateLimit.cache.get(ip);
  if (!rateLimitData) {
    rateLimitData = { count: 0, resetTime: now + rateLimit.windowMs };
    rateLimit.cache.set(ip, rateLimitData);
  } else if (rateLimitData.resetTime < now) {
    // Reset if window expired
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + rateLimit.windowMs;
  }
  
  // Check if rate limit exceeded
  if (rateLimitData.count >= rateLimit.maxRequests) {
    return { 
      success: false, 
      message: "Too Many Requests. Please try again later." 
    };
  }
  
  // Increment counter
  rateLimitData.count++;
  return { success: true };
}

// GET handler untuk menampilkan informasi status akun
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
  const rateLimitResult = checkRateLimit(ip);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: rateLimitResult.message },
      { status: 429 }
    );
  }
  
  try {
    // Await the params object before accessing id
    const { id } = await params;
    
    // Validate ID format
    if (!validateId(id)) {
      return NextResponse.json(
        { message: 'ID akun tidak valid' },
        { status: 400 }
      );
    }
    
    // Fetch account
    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        price: true,
        description: true,
        warranty: true,
        isActive: true,
        stock: true,
        duration: true,
        isFamilyPlan: true,
        maxSlots: true,
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { message: 'Akun tidak ditemukan', isAvailable: false },
        { status: 404 }
      );
    }
    
    // Check account availability (minimal info for public access)
    const isAvailable = account.isActive && (account.stock > 0);
    
    // Hanya menampilkan data minimal untuk user yang tidak login
    return NextResponse.json({
      id: account.id,
      type: account.type,
      price: account.price,
      description: account.description,
      warranty: account.warranty,
      isAvailable: isAvailable,
      stock: account.stock,
      duration: account.duration,
      message: !isAvailable ? 'Akun tidak tersedia atau stok habis' : undefined
    });
    
  } catch (error) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil status akun', isAvailable: false },
      { status: 500 }
    );
  }
} 