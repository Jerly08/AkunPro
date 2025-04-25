import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Dapatkan data dari body
    const data = await request.json();
    const { accountId, description } = data;
    
    // Validasi input
    if (!accountId || !description) {
      return NextResponse.json(
        { error: 'Account ID and description are required' },
        { status: 400 }
      );
    }
    
    // Cek jika pengguna adalah pemilik akun (melalui OrderItem)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        accountId,
        order: {
          userId: session.user.id,
          status: 'COMPLETED',
        },
      },
    });
    
    // Jika pengguna bukan pemilik akun dan bukan admin, tolak akses
    if (orderItems.length === 0 && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to report issues for this account' },
        { status: 403 }
      );
    }
    
    // Buat laporan masalah (misalnya menyimpan ke tabel SupportTicket yang harus dibuat)
    // Untuk contoh ini, kita hanya simulasikan penyimpanan dan berikan respon sukses
    
    // Dalam implementasi nyata, Anda perlu membuat model SupportTicket di schema.prisma
    // dan menggunakan kode seperti di bawah ini
    /*
    const ticket = await prisma.supportTicket.create({
      data: {
        accountId,
        userId: session.user.id,
        description,
        status: 'OPEN',
      },
    });
    */
    
    // Simulasi pengiriman notifikasi email ke admin (dalam implementasi nyata)
    console.log(`Issue reported for account ${accountId}:`, description);
    
    return NextResponse.json({
      success: true,
      message: 'Issue reported successfully. Our team will contact you soon.',
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    return NextResponse.json(
      { error: 'Failed to report issue' },
      { status: 500 }
    );
  }
} 