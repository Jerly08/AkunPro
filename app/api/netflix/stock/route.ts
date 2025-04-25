import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NetflixService } from '@/lib/netflix-service';

/**
 * Endpoint untuk mengambil informasi stok Netflix
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Periksa autentikasi dan hak akses
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // 2. Dapatkan informasi stok
    const stockInfo = await NetflixService.getAccountsStock();
    
    return NextResponse.json(stockInfo);
    
  } catch (error) {
    console.error('Error fetching Netflix stock info:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Endpoint untuk memperbarui stok Netflix
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Periksa autentikasi dan hak akses
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // 2. Parse request body
    const requestData = await request.json();
    const { accountId } = requestData;
    
    // 3. Update stok berdasarkan accountId atau semua akun
    let result;
    
    if (accountId) {
      // Update stok untuk akun tertentu
      result = await NetflixService.updateAccountStock(accountId);
    } else {
      // Update stok untuk semua akun
      result = await NetflixService.updateAllAccountsStock();
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error updating Netflix stock:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 