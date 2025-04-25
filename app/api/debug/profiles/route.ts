import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can use debug APIs' },
        { status: 401 }
      );
    }
    
    // Ambil query parameter
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const userId = url.searchParams.get('userId');
    const orderId = url.searchParams.get('orderId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Buat filter berdasarkan query params
    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (userId) where.userId = userId;
    if (orderId) where.orderId = orderId;
    
    // Ambil profil Netflix dengan semua relasinya
    const profiles = await prisma.netflixProfile.findMany({
      where,
      take: limit,
      include: {
        account: {
          select: {
            id: true,
            type: true,
            accountEmail: true,
            price: true,
            isActive: true
          }
        },
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                status: true,
                createdAt: true
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
      }
    });
    
    // Hitung statistik
    const stats = {
      totalProfiles: profiles.length,
      profilesWithUser: profiles.filter(p => p.userId).length,
      profilesWithOrderItem: profiles.filter(p => p.orderId).length,
      activeAccounts: profiles.filter(p => p.account.isActive).length,
      accountTypes: {} as Record<string, number>
    };
    
    // Hitung jumlah profil per tipe akun
    profiles.forEach(p => {
      const type = p.account.type;
      stats.accountTypes[type] = (stats.accountTypes[type] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      stats,
      profiles,
      filters: {
        accountId,
        userId,
        orderId,
        limit
      }
    });
  } catch (error) {
    console.error('Error in debug profiles API:', error);
    return NextResponse.json(
      { error: 'Failed to get profiles data', details: (error as Error).message },
      { status: 500 }
    );
  }
} 