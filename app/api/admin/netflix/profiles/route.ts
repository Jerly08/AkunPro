import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Endpoint untuk membuat profil Netflix baru untuk akun tertentu
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { accountId, name, pin, isKids = false } = body;
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Profile name is required' },
        { status: 400 }
      );
    }
    
    // Verifikasi bahwa akun ada dan jenisnya Netflix
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        profiles: true
      }
    });
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }
    
    if (account.type !== 'NETFLIX') {
      return NextResponse.json(
        { success: false, message: 'Account is not a Netflix account' },
        { status: 400 }
      );
    }
    
    // Periksa jumlah profil, maksimal 5 profil per akun Netflix
    if (account.profiles.length >= 5) {
      return NextResponse.json(
        { success: false, message: 'This Netflix account already has 5 profiles (maximum)' },
        { status: 400 }
      );
    }
    
    // Buat profil baru
    const newProfile = await prisma.netflixProfile.create({
      data: {
        accountId,
        name,
        pin: pin || null,
        isKids
      }
    });
    
    console.log(`Admin created new Netflix profile: ${newProfile.name} for account ${accountId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Netflix profile created successfully',
      profile: newProfile
    });
    
  } catch (error) {
    console.error('Error creating Netflix profile:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Endpoint untuk mendapatkan semua profil Netflix yang tersedia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Query parameters
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const allocated = url.searchParams.get('allocated');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Buat filter berdasarkan query params
    const where: any = {};
    
    if (accountId) {
      where.accountId = accountId;
    }
    
    if (allocated === 'true') {
      where.OR = [
        { userId: { not: null } },
        { orderId: { not: null } }
      ];
    } else if (allocated === 'false') {
      where.AND = [
        { userId: null },
        { orderId: null }
      ];
    }
    
    // Ambil profil Netflix
    const profiles = await prisma.netflixProfile.findMany({
      where,
      take: limit,
      include: {
        account: {
          select: {
            id: true,
            type: true,
            accountEmail: true
          }
        },
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Buat summary
    const summary = {
      total: profiles.length,
      allocated: profiles.filter(p => p.userId !== null || p.orderId !== null).length,
      available: profiles.filter(p => p.userId === null && p.orderId === null).length,
      byAccount: {} as Record<string, number>
    };
    
    // Group by account
    profiles.forEach(profile => {
      const accountEmail = profile.account.accountEmail;
      summary.byAccount[accountEmail] = (summary.byAccount[accountEmail] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      summary,
      profiles
    });
    
  } catch (error) {
    console.error('Error fetching Netflix profiles:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 