import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/spotify-slots/[id]/set-main - Menetapkan slot sebagai akun utama
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ambil ID dari params
    const slotId = params.id;
    
    // Check if slot exists
    const slot = await prisma.spotifySlot.findUnique({
      where: { id: slotId },
      include: {
        account: true
      }
    });
    
    if (!slot) {
      return NextResponse.json(
        { message: 'Slot tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Reset semua slot untuk akun ini
    await prisma.spotifySlot.updateMany({
      where: {
        accountId: slot.accountId,
        isMainAccount: true
      },
      data: {
        isMainAccount: false
      }
    });
    
    // Set slot ini sebagai akun utama
    await prisma.spotifySlot.update({
      where: { id: slotId },
      data: {
        isMainAccount: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Slot berhasil ditetapkan sebagai akun utama'
    });
  } catch (error) {
    console.error('Error setting main account:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Terjadi kesalahan saat menetapkan akun utama',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 