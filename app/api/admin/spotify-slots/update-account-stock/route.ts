import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

// POST - Update account stock count
export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get account ID from request body
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { message: 'Missing account ID' },
        { status: 400 }
      );
    }
    
    // Update the account stock
    const result = await SpotifyService.updateAccountStock(accountId);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Failed to update account stock' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account stock updated successfully',
      stock: result.stock
    });
    
  } catch (error) {
    console.error('Error updating account stock:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error updating account stock',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 