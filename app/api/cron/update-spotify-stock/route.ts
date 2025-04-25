import { NextRequest, NextResponse } from 'next/server';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * GET - Endpoint CRON untuk otomatis update stok akun Spotify
 * Jalankan endpoint ini periodik melalui service seperti cron-job.org
 * Contoh: GET /api/cron/update-spotify-stock?key=your-cron-api-key
 */
export async function GET(request: NextRequest) {
  console.log('[CRON] Starting Spotify stock update job');
  
  try {
    // Verifikasi API key sederhana untuk mencegah akses yang tidak diinginkan
    const validApiKey = process.env.CRON_API_KEY || 'spotify-stock-update-key';
    const queryParams = request.nextUrl.searchParams;
    const providedKey = queryParams.get('key');
    
    if (providedKey !== validApiKey) {
      console.error('[CRON] Invalid API key provided');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }
    
    // Update stok semua akun Spotify
    const result = await SpotifyService.updateAllAccountsStock();
    
    console.log(`[CRON] Spotify stock update completed. Processed ${result.processed} accounts`);
    
    return NextResponse.json({
      success: true,
      message: `Spotify stock update completed successfully. Processed ${result.processed} accounts.`,
      processed: result.processed
    });
    
  } catch (error) {
    console.error('[CRON] Error updating Spotify stock:', error);
    return NextResponse.json(
      { error: `Failed to update Spotify stock: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 