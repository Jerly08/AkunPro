import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * POST - Alokasikan slot Spotify ke user
 * Body:
 * - orderItemId: string (ID orderItem yang akan dialokasikan slot)
 * - userId?: string (optional, ID user target, default: user saat ini)
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { orderItemId, userId: targetUserId } = body;
    
    if (!orderItemId) {
      return NextResponse.json(
        { success: false, message: 'Order Item ID is required' },
        { status: 400 }
      );
    }
    
    // Admin bisa menentukan user target, user biasa hanya bisa untuk dirinya sendiri
    const isAdmin = session.user.role === 'ADMIN';
    const requestingUserId = session.user.id;
    
    // Jika ada targetUserId tapi bukan admin, tolak request
    if (targetUserId && targetUserId !== requestingUserId && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'You can only allocate slots to your own account' },
        { status: 403 }
      );
    }
    
    // Gunakan userId yang diberikan atau default ke user saat ini
    const userId = targetUserId || requestingUserId;
    
    // Alokasikan slot menggunakan SpotifyService
    const result = await SpotifyService.allocateSlotToOrder(orderItemId, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      slotId: result.slotId
    });
    
  } catch (error) {
    console.error('Error allocating Spotify slot:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 