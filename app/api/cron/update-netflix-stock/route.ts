import { NextRequest, NextResponse } from 'next/server';
import { NetflixService } from '@/lib/netflix-service';

/**
 * Endpoint untuk cron job yang memperbarui stok Netflix secara otomatis
 * Dijalankan dengan interval tertentu (misalnya setiap jam)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[CRON] Starting Netflix stock update job');
    
    // Verifikasi API key untuk keamanan
    const apiKey = request.nextUrl.searchParams.get('key');
    const validApiKey = process.env.CRON_API_KEY || 'netflix-stock-update-key';
    
    if (apiKey !== validApiKey) {
      console.log('[CRON] Unauthorized access attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Update stok semua akun Netflix
    const result = await NetflixService.updateAllAccountsStock();
    
    console.log(`[CRON] Netflix stock update completed. Processed ${result.processed} accounts`);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    console.error('[CRON] Error updating Netflix stock:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 