import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Definisi tipe session user yang diperluas
interface ExtendedUser {
  id: string;
  role: "USER" | "ADMIN";
  isAdmin?: boolean;
}

/**
 * Endpoint untuk mendapatkan semua slot Spotify dari akun tertentu
 */
export async function GET(req: NextRequest) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Ambil accountId dari query string
    const accountId = req.nextUrl.searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID diperlukan' },
        { status: 400 }
      );
    }
    
    // Cari akun untuk memastikan itu adalah akun Spotify
    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
        type: 'SPOTIFY'
      }
    });
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Akun Spotify tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Ambil semua slot Spotify untuk akun ini
    const slots = await prisma.spotifySlot.findMany({
      where: {
        accountId: accountId
      },
      include: {
        account: {
          select: {
            accountEmail: true,
            accountPassword: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItem: {
          select: {
            id: true,
            orderId: true,
            order: {
              select: {
                customerName: true,
                customerEmail: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      accountId,
      accountEmail: account.accountEmail,
      slots
    });
    
  } catch (error) {
    console.error('Error fetching Spotify slots:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/spotify-slots
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Cek apakah user sudah login dan memiliki role ADMIN
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse body request
    const body = await request.json();
    const { accountId, slotName, email, password, isMainAccount } = body;
    
    if (!accountId || !slotName) {
      return NextResponse.json(
        { success: false, message: 'Account ID dan nama slot diperlukan' },
        { status: 400 }
      );
    }
    
    // Cek apakah akun spotify ada
    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
        type: 'SPOTIFY',
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Akun Spotify tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Hitung jumlah slot yang sudah ada
    const existingSlots = await prisma.spotifySlot.count({
      where: {
        accountId: accountId,
      },
    });
    
    if (existingSlots >= 6) {
      return NextResponse.json(
        { success: false, message: 'Jumlah maksimum slot (6) telah tercapai' },
        { status: 400 }
      );
    }
    
    // Jika isMainAccount true, pastikan tidak ada slot lain yang menjadi akun utama
    if (isMainAccount) {
      // Reset semua isMainAccount ke false
      await prisma.spotifySlot.updateMany({
        where: {
          accountId: accountId,
          isMainAccount: true,
        },
        data: {
          isMainAccount: false,
        },
      });
    }
    
    // Buat slot baru
    const newSlot = await prisma.spotifySlot.create({
      data: {
        accountId,
        slotName,
        email,
        password,
        isAllocated: false,
        isActive: true,
        isMainAccount: isMainAccount || false,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Slot berhasil ditambahkan',
      slot: newSlot,
    });
    
  } catch (error) {
    console.error('Error creating Spotify slot:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 