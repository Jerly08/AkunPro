import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Handler untuk POST request - validasi ketersediaan beberapa akun
 * Menerima array item ID dan mengembalikan daftar akun yang tidak tersedia
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body request
    const body = await request.json();
    const { items } = body;

    // Validasi input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Daftar item tidak valid' },
        { status: 400 }
      );
    }

    // Cari akun yang tersedia (aktif dan tidak diboking)
    const availableAccounts = await prisma.account.findMany({
      where: {
        id: { in: items },
        isActive: true,
        OR: [
          { isBooked: false },
          { 
            isBooked: true,
            bookedUntil: {
              lt: new Date() // Booking sudah kadaluarsa
            }
          }
        ]
      },
      select: {
        id: true,
      },
    });

    // Bandingkan dengan daftar yang diminta
    const availableIds = availableAccounts.map(acc => acc.id);
    const unavailableItems = items.filter(id => !availableIds.includes(id));

    // Jika semua tersedia
    if (unavailableItems.length === 0) {
      return NextResponse.json({ 
        valid: true, 
        message: 'Semua item tersedia' 
      });
    }

    // Jika ada yang tidak tersedia
    return NextResponse.json({ 
      valid: false, 
      message: 'Beberapa item tidak tersedia', 
      unavailableItems 
    });
    
  } catch (error) {
    console.error('Error validating accounts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memvalidasi akun' },
      { status: 500 }
    );
  }
} 