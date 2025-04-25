import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';

/**
 * Endpoint untuk memperbarui status pembayaran secara manual
 * Digunakan ketika pembayaran sudah dilakukan tetapi belum terverifikasi secara otomatis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Hanya admin yang bisa mengakses endpoint ini
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { orderId, paymentMethod, notes } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }
    
    // Cari order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transaction: true }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Jika sudah PAID atau COMPLETED, kembalikan status saat ini
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: `Order sudah berstatus ${order.status}`,
        order: {
          id: order.id,
          status: order.status,
          paidAt: order.paidAt
        }
      });
    }
    
    console.log(`Memperbarui status order ${orderId} ke status PAID`);
    
    // Update order status ke PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });
    
    // Update transaksi jika ada
    if (order.transaction) {
      await prisma.transaction.update({
        where: { id: order.transaction.id },
        data: { 
          status: 'PAID',
          // Update metode pembayaran jika disediakan
          ...(paymentMethod ? { paymentMethod } : {}),
          // Tambahkan catatan jika disediakan
          ...(notes ? { notes } : {})
        }
      });
    }
    
    // Kirim notifikasi ke pengguna
    try {
      // Ambil orderItems untuk notifikasi
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: updatedOrder.id }
      });
      
      // Kirim notifikasi untuk setiap item
      for (const item of orderItems) {
        await NotificationService.sendAccountPurchaseNotification(
          order.userId,
          item.id,
          'EMAIL' // Default channel
        );
      }
      
      console.log(`Notifications sent for order ${updatedOrder.id}`);
    } catch (error) {
      console.error(`Failed to send notifications for order ${updatedOrder.id}:`, error);
      // Lanjutkan proses meskipun notifikasi gagal
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order berhasil diupdate ke status PAID',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmation/${orderId}`
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memproses permintaan', error: (error as Error).message },
      { status: 500 }
    );
  }
} 