import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can use debug APIs' },
        { status: 401 }
      );
    }
    
    // Dapatkan ID dari URL path
    const accountId = params.id;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Ambil detail akun dengan semua relasi
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        // Profil Netflix yang terkait dengan akun
        profiles: {
          include: {
            orderItem: {
              include: {
                order: true
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
        },
        // Item Pesanan yang terkait dengan akun
        orderItems: {
          include: {
            netflixProfile: true,
            order: {
              select: {
                id: true,
                customerName: true,
                status: true,
                userId: true
              }
            }
          }
        },
        // Penjual akun
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Tambahkan ringkasan data untuk memudahkan debug
    const summary = {
      accountId: account.id,
      accountType: account.type,
      totalProfiles: account.profiles.length,
      totalOrderItems: account.orderItems.length,
      profilesWithOrderItem: account.profiles.filter(p => p.orderId).length,
      profilesWithUser: account.profiles.filter(p => p.userId).length,
      orderItemsWithProfile: account.orderItems.filter(oi => oi.netflixProfile).length
    };
    
    // Log detail informasi untuk debugging relasi
    console.log('===== DEBUG NETFLIX PROFILE RELATIONS =====');
    console.log(`Account ID: ${account.id}, Type: ${account.type}`);
    console.log(`Total Profiles: ${account.profiles.length}`);
    console.log(`Total OrderItems: ${account.orderItems.length}`);
    
    // Periksa profiles dan relasi ke orderItem
    console.log('\nProfiles dan relasi OrderItem:');
    account.profiles.forEach((profile, index) => {
      console.log(`Profile ${index + 1}: ${profile.name} (ID: ${profile.id.substring(0, 8)}...)`);
      console.log(`  User ID: ${profile.userId || 'Tidak ada'}`);
      console.log(`  Order Item ID: ${profile.orderId || 'Tidak ada'}`);
      
      if (profile.orderId) {
        const matchingOrderItem = account.orderItems.find(oi => oi.id === profile.orderId);
        console.log(`  Terhubung dengan OrderItem: ${matchingOrderItem ? 'YA' : 'TIDAK'}`);
      }
    });
    
    // Periksa orderItems dan relasi ke profile
    console.log('\nOrderItems dan relasi Profile:');
    account.orderItems.forEach((orderItem, index) => {
      console.log(`OrderItem ${index + 1} (ID: ${orderItem.id.substring(0, 8)}...)`);
      console.log(`  Order ID: ${orderItem.order.id.substring(0, 8)}...`);
      console.log(`  Order Status: ${orderItem.order.status}`);
      
      if (orderItem.netflixProfile) {
        console.log(`  NetflixProfile: ADA (${orderItem.netflixProfile.name})`);
        console.log(`  Profile ID: ${orderItem.netflixProfile.id.substring(0, 8)}...`);
      } else {
        // Cari apakah ada profile yang menunjuk ke orderItem ini
        const linkedProfile = account.profiles.find(p => p.orderId === orderItem.id);
        if (linkedProfile) {
          console.log(`  Anomali: Ada profile (${linkedProfile.name}) yang menunjuk ke OrderItem ini, tetapi tidak terhubung`);
        } else {
          console.log(`  NetflixProfile: TIDAK ADA`);
        }
      }
    });
    console.log('=========================================');
    
    return NextResponse.json({
      success: true,
      summary,
      account
    });
  } catch (error) {
    console.error('Error in debug account API:', error);
    return NextResponse.json(
      { error: 'Failed to get debug data', details: (error as Error).message },
      { status: 500 }
    );
  }
} 