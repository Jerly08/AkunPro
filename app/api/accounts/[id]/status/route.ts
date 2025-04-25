import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure params are properly awaited
    const { id } = await Promise.resolve(params);
    const accountId = id;
    
    // Cari akun di database
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      return NextResponse.json(
        { 
          error: 'Account not found',
          isAvailable: false,
          message: 'Akun tidak ditemukan' 
        },
        { status: 404 }
      );
    }
    
    // Calculate available slots for Spotify family plans
    let availableSlots = Number(account.stock || 0);
    let allocatedSlots = 0;
    
    if (account.type === 'SPOTIFY' && account.isFamilyPlan) {
      try {
        // Get total allocated slots
        const result: any = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM spotify_slots 
          WHERE accountId = ${accountId} AND isAllocated = 1
        `;
        
        // Konversi eksplisit dari BigInt ke number
        allocatedSlots = Number(result[0]?.count || 0);
        
        // Calculate available slots
        const maxSlots = Number(account.maxSlots || 0);
        availableSlots = Math.max(0, maxSlots - allocatedSlots);
      } catch (slotError) {
        console.error('Error calculating Spotify slots:', slotError);
        // Fallback to stock value if error occurs
        availableSlots = Number(account.stock || 0);
        allocatedSlots = 0;
      }
    }
    
    // Prepare safe values for JSON response
    const safeAccount = {
      id: account.id,
      type: account.type,
      isActive: !!account.isActive,
      isBooked: !!account.isBooked,
      bookedUntil: account.bookedUntil,
      stock: availableSlots,
      duration: Number(account.duration || 1),
      price: Number(account.price || 0),
      description: account.description || "",
      warranty: Number(account.warranty || 0),
      isFamilyPlan: !!account.isFamilyPlan,
      maxSlots: Number(account.maxSlots || 0),
      allocatedSlots: Number(allocatedSlots)
    };
    
    // Return account status
    return NextResponse.json({
      isAvailable: !!account.isActive && (availableSlots > 0),
      status: account.isActive ? 'active' : 'inactive',
      ...safeAccount,
      // Tambahkan data untuk membantu debugging
      message: account.isActive ? 
        (availableSlots > 0 ? 'Akun tersedia' : 'Stok akun habis') : 
        'Akun tidak aktif'
    });
    
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check account status',
        isAvailable: false,
        message: 'Gagal memeriksa status akun'
      },
      { status: 500 }
    );
  }
} 