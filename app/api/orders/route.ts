import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { error: 'Anda harus login untuk melihat daftar pesanan' },
        { status: 401 }
      );
    }

    // Cari pesanan pengguna
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        transaction: true,
        items: {
          include: {
            account: {
              select: {
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        transactionStatus: order.transaction?.status || 'PENDING',
        items: order.items.map(item => ({
          type: item.account.type,
          price: item.price,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memuat daftar pesanan' },
      { status: 500 }
    );
  }
}
