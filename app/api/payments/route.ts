import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Dapatkan sesi pengguna
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Anda harus login untuk mengakses halaman ini' },
        { status: 401 }
      );
    }
    
    // Dapatkan data user dari database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Ambil transaksi pembayaran pengguna
    const transactions = await prisma.transaction.findMany({
      where: {
        order: {
          userId: user.id,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            status: true,
            items: {
              include: {
                account: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Format data untuk response
    const payments = transactions.map(transaction => ({
      id: transaction.id,
      orderId: transaction.orderId,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      order: {
        id: transaction.order.id,
        status: transaction.order.status,
        customerName: transaction.order.customerName,
        items: transaction.order.items.map(item => ({
          id: item.id,
          productName: item.account.type,
          price: item.price,
        })),
      },
    }));
    
    // Jika tidak ada transaksi, berikan data dummy untuk pengembangan
    if (payments.length === 0 && process.env.NODE_ENV !== 'production') {
      const dummyPayments = [
        {
          id: '1',
          orderId: 'order-123',
          amount: 150000,
          paymentMethod: 'QRIS',
          status: 'PAID',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari yang lalu
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          order: {
            id: 'order-123',
            status: 'COMPLETED',
            customerName: session.user.name || 'Pengguna',
            items: [
              {
                id: 'item-1',
                productName: 'NETFLIX',
                price: 150000
              }
            ]
          }
        },
        {
          id: '2',
          orderId: 'order-456',
          amount: 85000,
          paymentMethod: 'Transfer Bank',
          status: 'PAID',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 hari yang lalu
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          order: {
            id: 'order-456',
            status: 'COMPLETED',
            customerName: session.user.name || 'Pengguna',
            items: [
              {
                id: 'item-2',
                productName: 'SPOTIFY',
                price: 85000
              }
            ]
          }
        },
        {
          id: '3',
          orderId: 'order-789',
          amount: 150000,
          paymentMethod: 'QRIS',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 hari yang lalu
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          order: {
            id: 'order-789',
            status: 'PENDING',
            customerName: session.user.name || 'Pengguna',
            items: [
              {
                id: 'item-3',
                productName: 'NETFLIX',
                price: 150000
              }
            ]
          }
        }
      ];
      
      return NextResponse.json({ payments: dummyPayments }, { status: 200 });
    }
    
    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error('[PAYMENTS_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil data pembayaran' },
      { status: 500 }
    );
  }
} 