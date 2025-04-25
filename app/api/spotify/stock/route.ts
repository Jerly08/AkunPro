import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * GET - Mendapatkan informasi stok Spotify
 */
export async function GET(request: NextRequest) {
  try {
    // Verifikasi admin untuk akses endpoint
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      );
    }

    // Admin dapat melihat semua informasi stok
    if (session.user?.role === 'ADMIN') {
      const stockInfo = await SpotifyService.getAccountsStock();
      return NextResponse.json(stockInfo);
    }

    // User biasa mendapatkan versi terbatas
    return NextResponse.json({
      success: true,
      totalStock: await SpotifyService.getAccountsStock().then(info => info.totalStock || 0)
    });
  } catch (error) {
    console.error('Error fetching Spotify stock info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Spotify stock information' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update stok akun Spotify
 * Body:
 * - accountId?: string (optional - jika kosong, update semua akun)
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi admin untuk akses endpoint
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Parse body request
    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    let result;
    if (accountId) {
      // Update stok untuk akun tertentu
      result = await SpotifyService.updateAccountStock(accountId);
    } else {
      // Update stok untuk semua akun
      result = await SpotifyService.updateAllAccountsStock();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating Spotify stock:', error);
    return NextResponse.json(
      { error: 'Failed to update Spotify stock' },
      { status: 500 }
    );
  }
} 