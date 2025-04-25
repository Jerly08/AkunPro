import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetflixService } from '@/lib/netflix-service';

/**
 * POST /api/netflix/allocate
 * Mengalokasikan profil Netflix ke orderItem dan user tertentu
 * - Dapat digunakan secara manual, atau
 * - Dijalankan otomatis saat pesanan selesai
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Pastikan ini admin atau request datang dari sistem
    const isAdmin = session.user.role === 'ADMIN';
    
    // Parse request body
    const body = await request.json();
    const { orderItemId, orderId, userId, allocateAll = false } = body;
    
    // Jika allocateAll=true, jalankan alokasi untuk semua pesanan
    if (allocateAll) {
      // Hanya admin yang bisa menjalankan allocateAll
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Only admin can run global allocation' },
          { status: 403 }
        );
      }
      
      console.log('Menjalankan alokasi profil untuk semua pesanan Netflix');
      const result = await NetflixService.ensureAllOrdersHaveProfiles();
      return NextResponse.json(result);
    }
    
    // Jika tidak ada orderItemId tetapi ada orderId, cari orderItems dari order
    if (!orderItemId && orderId) {
      // Pastikan orderId adalah milik user yang sedang login, kecuali jika admin
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
          ...(isAdmin ? {} : { userId: session.user.id })
        },
        include: {
          items: {
            include: {
              account: true
            }
          }
        }
      });
      
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found or access denied' },
          { status: 404 }
        );
      }
      
      // Temukan semua orderItems yang terkait dengan akun Netflix
      const netflixItems = order.items.filter(item => item.account.type === 'NETFLIX');
      
      if (netflixItems.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No Netflix accounts found in this order' },
          { status: 400 }
        );
      }
      
      // Alokasikan profil untuk setiap item Netflix
      const results = [];
      for (const item of netflixItems) {
        const result = await NetflixService.allocateProfileToOrder(
          item.id, 
          userId || order.userId
        );
        results.push({
          orderItemId: item.id,
          success: result.success,
          message: result.message,
          profile: result.profile
        });
      }
      
      return NextResponse.json({
        success: true,
        message: `Allocated profiles for ${results.filter(r => r.success).length} out of ${netflixItems.length} items`,
        results
      });
    }
    
    // Jika hanya ada orderItemId, alokasikan untuk item tersebut
    if (orderItemId) {
      // Verifikasi bahwa orderItem ini milik user tersebut
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: true,
          account: true
        }
      });
      
      if (!orderItem) {
        return NextResponse.json(
          { success: false, message: 'OrderItem not found' },
          { status: 404 }
        );
      }
      
      // Pastikan ini orderItem milik user yang login, kecuali jika admin
      if (!isAdmin && orderItem.order.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: This OrderItem does not belong to you' },
          { status: 403 }
        );
      }
      
      // Alokasikan profil
      const targetUserId = userId || orderItem.order.userId;
      const result = await NetflixService.allocateProfileToOrder(orderItemId, targetUserId);
      
      // Jika alokasi berhasil, update stok akun
      if (result.success) {
        await NetflixService.updateAccountStock(orderItem.accountId);
      }
      
      return NextResponse.json(result);
    }
    
    // Jika tidak ada orderItemId atau orderId
    return NextResponse.json(
      { success: false, message: 'Missing required parameters: orderItemId or orderId' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error allocating Netflix profile:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 