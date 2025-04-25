import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * GET - Mendapatkan semua slot Spotify milik pengguna
 */
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      );
    }
    
    // Ambil slot Spotify milik pengguna
    const userId = session.user.id;
    const result = await SpotifyService.getUserSpotifySlots(userId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      slots: result.slots
    });
    
  } catch (error) {
    console.error('Error fetching user Spotify slots:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Spotify slots' },
      { status: 500 }
    );
  }
} 