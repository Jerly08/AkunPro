import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';
import prisma from '@/lib/prisma';

/**
 * Endpoint untuk mengalokasikan slot Spotify ke order item tertentu dari panel admin
 */
export async function POST(req: NextRequest) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Parse body request
    const body = await req.json();
    const { orderItemId } = body;
    
    if (!orderItemId) {
      return NextResponse.json(
        { success: false, message: 'Order item ID diperlukan' },
        { status: 400 }
      );
    }
    
    // Dapatkan order item untuk mendapatkan ID user
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            status: true
          }
        }
      }
    });
    
    if (!orderItem) {
      return NextResponse.json(
        { success: false, message: 'Order item tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Pastikan order sudah dibayar
    if (orderItem.order.status !== 'PAID' && orderItem.order.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Order belum dibayar (status tidak PAID atau COMPLETED)' },
        { status: 400 }
      );
    }
    
    // Alokasikan slot Spotify menggunakan SpotifyService
    const result = await SpotifyService.allocateSlotToOrder(
      orderItemId,
      orderItem.order.userId
    );
    
    // Return hasil alokasi
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Slot Spotify berhasil dialokasikan',
        data: result.slot
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error allocating Spotify slot:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
} 