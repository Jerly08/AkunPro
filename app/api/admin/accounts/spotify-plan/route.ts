import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/accounts/spotify-plan - Toggle family plan status untuk akun Spotify
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { accountId, isFamilyPlan, maxSlots = 6 } = body;

    if (!accountId) {
      return NextResponse.json(
        { message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Periksa apakah akun ada dan bertipe SPOTIFY
    const account = await prisma.account.findUnique({
      where: { 
        id: accountId,
        type: 'SPOTIFY'
      }
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Spotify account not found' },
        { status: 404 }
      );
    }

    // Toggle family plan status
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        isFamilyPlan: isFamilyPlan,
        maxSlots: isFamilyPlan ? maxSlots : 1
      }
    });

    // Jika family plan dinonaktifkan, tandai semua slot non-utama sebagai nonaktif
    if (!isFamilyPlan) {
      const slots = await prisma.spotifySlot.findMany({
        where: {
          accountId,
          isMainAccount: false,
          isAllocated: false // Hanya nonaktifkan slot yang belum digunakan
        }
      });

      // Disable non-main slots
      if (slots.length > 0) {
        await prisma.spotifySlot.updateMany({
          where: {
            accountId,
            isMainAccount: false,
            isAllocated: false
          },
          data: {
            isActive: false
          }
        });
      }
    } else {
      // Jika family plan diaktifkan, buatlah slot utama jika belum ada
      const existingMainSlot = await prisma.spotifySlot.findFirst({
        where: {
          accountId,
          isMainAccount: true
        }
      });

      if (!existingMainSlot) {
        await prisma.spotifySlot.create({
          data: {
            accountId,
            slotName: 'Head Account',
            isMainAccount: true,
            isActive: true,
            isAllocated: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: isFamilyPlan ? 'Family Plan enabled' : 'Family Plan disabled',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Error toggling family plan:', error);
    return NextResponse.json(
      { 
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 