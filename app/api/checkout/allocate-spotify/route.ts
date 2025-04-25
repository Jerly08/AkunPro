import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * API endpoint untuk mengalokasikan slot Spotify ke orderItem
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validasi user terautentikasi
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Parse request body
    const body = await req.json();
    const { orderItemId } = body;
    
    if (!orderItemId) {
      return NextResponse.json(
        { success: false, message: 'Order item ID diperlukan' },
        { status: 400 }
      );
    }
    
    // 3. Alokasikan slot Spotify untuk order item
    const result = await SpotifyService.allocateSlotToOrder(
      orderItemId, 
      session.user.id
    );
    
    if (!result.success) {
      console.error(`[API] Gagal mengalokasikan slot Spotify:`, result.message);
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    // 4. Return hasil alokasi
    return NextResponse.json({
      success: true,
      message: 'Slot Spotify berhasil dialokasikan',
      data: result.slot
    });
    
  } catch (error) {
    console.error('[API] Error mengalokasikan slot Spotify:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error: ${(error as Error).message}` 
      },
      { status: 500 }
    );
  }
} 