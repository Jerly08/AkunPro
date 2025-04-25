import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SpotifyService } from '@/lib/spotify-service';

// POST - Delete a slot and update stock
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

    // Get slot ID from request body
    const { slotId } = await request.json();
    
    if (!slotId) {
      return NextResponse.json(
        { message: 'Missing slot ID' },
        { status: 400 }
      );
    }
    
    // Check if slot exists
    const slot = await prisma.spotifySlot.findUnique({
      where: { id: slotId },
      include: { orderItem: true }
    });
    
    if (!slot) {
      return NextResponse.json(
        { message: 'Slot not found' },
        { status: 404 }
      );
    }
    
    // Check if slot is allocated
    if (slot.isAllocated || slot.orderItem) {
      return NextResponse.json(
        { message: 'Cannot delete slot that is already allocated to a user' },
        { status: 400 }
      );
    }
    
    // Check related account
    const account = await prisma.account.findUnique({
      where: { id: slot.accountId }
    });
    
    if (!account || account.type !== 'SPOTIFY' || !account.isFamilyPlan) {
      return NextResponse.json(
        { message: 'Invalid account type or not a family plan' },
        { status: 400 }
      );
    }
    
    // Store the accountId for updating stock later
    const accountId = slot.accountId;
    
    // Delete the slot
    await prisma.spotifySlot.delete({
      where: { id: slotId }
    });
    
    // Update the account stock
    await SpotifyService.updateAccountStock(accountId);
    
    return NextResponse.json({
      success: true,
      message: 'Slot deleted and stock updated successfully'
    });
    
  } catch (error) {
    console.error('Error handling slot deletion:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error deleting slot',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 