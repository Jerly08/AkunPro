import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendTransactionEmail } from '@/lib/email';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status, adminNote } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validasi status
    if (!['PAID', 'FAILED', 'REFUNDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update status pembayaran
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status === 'PAID' ? OrderStatus.PAID : 
                status === 'FAILED' ? OrderStatus.CANCELLED : 
                OrderStatus.REFUNDED,
        transaction: {
          update: {
            status: status as PaymentStatus,
            notes: adminNote || null
          }
        }
      },
      include: {
        items: {
          include: {
            account: true
          }
        }
      }
    });

    // Kirim email notifikasi status pembayaran
    try {
      await sendTransactionEmail(
        order.customerName,
        order.customerEmail,
        order.id,
        order.totalAmount,
        status as PaymentStatus,
        order.items.map(item => ({
          name: item.account.type,
          price: item.price
        }))
      );
    } catch (emailError) {
      console.error('Failed to send payment status email:', emailError);
      // Lanjutkan proses meskipun email gagal terkirim
    }

    // Jika pembayaran berhasil, kirim detail akun
    if (status === 'PAID') {
      // TODO: Implementasi pengiriman detail akun
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
} 