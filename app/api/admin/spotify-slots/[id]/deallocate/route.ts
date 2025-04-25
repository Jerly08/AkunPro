import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/spotify-slots/[id]/deallocate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ambil ID dari params
    const slotId = params.id;
    
    // Periksa apakah slot ada
    const slot = await prisma.spotifySlot.findUnique({
      where: { id: slotId }
    });
    
    if (!slot) {
      return NextResponse.json(
        { message: 'Slot tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Periksa apakah slot sudah dialokasikan
    if (!slot.isAllocated) {
      return NextResponse.json(
        { message: 'Slot ini belum dialokasikan kepada pengguna mana pun' },
        { status: 400 }
      );
    }
    
    // Dealokasi slot - hapus userId dan orderItemId
    const updatedSlot = await prisma.spotifySlot.update({
      where: { id: slotId },
      data: {
        userId: null,
        orderItemId: null,
        isAllocated: false
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Slot berhasil didealokasi dari pengguna',
      slot: updatedSlot
    });
  } catch (error) {
    console.error('Error deallocating slot:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Terjadi kesalahan saat mendealokasi slot',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 