import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Handler untuk membuat pembayaran baru
export async function POST(request: NextRequest) {
  console.log('==== NEW PAYMENT REQUEST ====');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Verifikasi sesi untuk mendapatkan ID pengguna yang login
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk checkout' },
        { status: 401 }
      );
    }
    
    // Parsing request body
    const body = await request.json();
    console.log('Payment request body:', JSON.stringify(body, null, 2));
    
    // Validasi bahwa semua field yang dibutuhkan ada
    if (!body.orderId || !body.customerName || !body.customerEmail || !body.customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ambil order dari database
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
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
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: 'Order sudah dibayar atau dibatalkan' },
        { status: 400 }
      );
    }
    
    // Untuk manual payment, kita tidak perlu membuat payment link atau apapun
    return NextResponse.json({
      success: true,
      message: 'Silakan transfer sesuai instruksi pembayaran',
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        expiresAt: order.expiresAt
      },
      paymentMethod: 'BANK_TRANSFER',
      bankAccounts: [
        { bank: 'BCA', accountNumber: '1234567890', accountName: 'PT. NETFLIX SPOTIFY MARKETPLACE' },
        { bank: 'BNI', accountNumber: '0987654321', accountName: 'PT. NETFLIX SPOTIFY MARKETPLACE' },
      ]
    });
    
  } catch (error) {
    console.error('Error processing payment request:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memproses pembayaran' },
      { status: 500 }
    );
  }
} 