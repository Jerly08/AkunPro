import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Endpoint untuk mengambil data slot Spotify yang dialokasikan untuk order item tertentu
 */
export async function GET(
  request: Request,
  { params }: { params: { orderItemId: string } }
) {
  try {
    // Periksa autentikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { orderItemId } = params;
    
    if (!orderItemId) {
      return NextResponse.json(
        { error: 'Order item ID is required' },
        { status: 400 }
      );
    }
    
    // Cari slot Spotify yang terkait dengan order item ini
    const slot = await prisma.spotifySlot.findFirst({
      where: {
        orderItemId: orderItemId
      },
      include: {
        account: {
          select: {
            accountEmail: true,
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
            orderId: true
          }
        }
      }
    });
    
    if (!slot) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada slot yang dialokasikan',
        slot: null
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Slot berhasil ditemukan',
      slot
    });
    
  } catch (error) {
    console.error('Error fetching slot for order item:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
} 