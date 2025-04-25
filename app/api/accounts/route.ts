import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma, { sanitizeInput, validateId } from '@/lib/prisma';
import crypto from 'crypto';

// Definisi tipe untuk AccountType
type AccountType = 'NETFLIX' | 'SPOTIFY';

// Definisi interface Account untuk memperjelas tipe data
interface Account {
  id: string;
  type: AccountType;
  accountEmail: string;
  accountPassword: string;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  stock: number;
  duration: number;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fungsi untuk mengenkripsi password akun
function encryptAccountPassword(password: string): string {
  // Gunakan environment variable sebagai encryption key
  const ENCRYPTION_KEY = process.env.ACCOUNT_ENCRYPTION_KEY || 'defaultkeythatshouldbechanged';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Fungsi untuk mendekripsi password akun
function decryptAccountPassword(encryptedPassword: string): string {
  const ENCRYPTION_KEY = process.env.ACCOUNT_ENCRYPTION_KEY || 'defaultkeythatshouldbechanged';
  const [ivHex, encryptedHex] = encryptedPassword.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET handler
export async function GET(request: Request) {
  try {
    // Authenticate request
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get accounts with pagination
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50 items
    const type = searchParams.get('type');
    
    // Sanitize and validate input
    const sanitizedType = type ? sanitizeInput(type) : undefined;
    
    const where = sanitizedType ? { type: sanitizedType } : {};
    
    const accounts = await prisma.account.findMany({
      where,
      select: {
        id: true,
        type: true,
        accountEmail: true,
        // Explicitly omit accountPassword for security
        price: true,
        description: true,
        isActive: true,
        sellerId: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Count total for pagination
    const total = await prisma.account.count({ where });
    
    return NextResponse.json({
      accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil data akun' },
      { status: 500 }
    );
  }
}

// POST handler untuk membuat akun baru
export async function POST(request: Request) {
  try {
    // Authenticate request
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role for account creation
    if (token.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Enkripsi password akun sebelum disimpan
    const encryptedPassword = encryptAccountPassword(body.accountPassword);
    
    // Buat akun dengan password terenkripsi
    const account = await prisma.account.create({
      data: {
        ...body,
        accountPassword: encryptedPassword,
      },
    });
    
    // Hapus password dari response
    const { accountPassword, ...accountWithoutPassword } = account;
    
    return NextResponse.json(accountWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat akun baru' },
      { status: 500 }
    );
  }
}

// GET - Mengambil semua akun yang aktif untuk ditampilkan di halaman publik
export async function GETPublic() {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        price: true,
        description: true,
        warranty: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error getting public accounts:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 