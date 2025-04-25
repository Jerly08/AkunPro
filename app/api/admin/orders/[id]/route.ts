import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetflixService } from '@/lib/netflix-service';
import { SpotifyService } from '@/lib/spotify-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body with error handling
    let body = { verifyManualPayment: false };
    try {
      const contentType = request.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const rawBody = await request.text();
        if (rawBody && rawBody.trim()) {
          body = JSON.parse(rawBody);
        }
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      // Continue with default values
    }
    
    const { verifyManualPayment } = body;

    // Menggunakan params dengan benar di Next.js 14/15
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID diperlukan' },
        { status: 400 }
      );
    }
    
    // Cari order dan transaksi terkait
    const order = await prisma.order.findUnique({
      where: { id },
      include: { transaction: true }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Verifikasi bahwa order memiliki bukti pembayaran manual jika flag verifyManualPayment aktif
    if (verifyManualPayment) {
      if (!order.transaction?.paymentUrl) {
        return NextResponse.json(
          { error: 'Tidak ada bukti pembayaran yang ditemukan untuk pesanan ini' },
          { status: 400 }
        );
      }
      
      console.log(`Verifikasi bukti pembayaran manual untuk order ${id} oleh admin`);
    } else {
      console.log(`Memaksa update order ${id} ke status PAID oleh admin`);
    }
    
    // Update order ke status PAID
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'PAID',
        paidAt: new Date()
      },
      include: { transaction: true }
    });
    
    // Update transaction jika ada
    if (order.transaction) {
      await prisma.transaction.update({
        where: { id: order.transaction.id },
        data: { 
          status: 'PAID'
        }
      });
    }
    
    // Object untuk menampung hasil alokasi
    const allocationResults = {
      netflix: { processed: 0, results: [] },
      spotify: { processed: 0, results: [] }
    };
    
    // 1. Alokasikan profil Netflix jika ada pesanan Netflix
    try {
      console.log(`Mencoba mengalokasikan profil Netflix untuk order: ${id}`);
      
      // Cari orderItems untuk akun Netflix
      const netflixOrderItems = await prisma.orderItem.findMany({
        where: {
          orderId: id,
          account: {
            type: 'NETFLIX'
          }
        },
        include: {
          account: true
        }
      });
      
      if (netflixOrderItems.length > 0) {
        console.log(`Menemukan ${netflixOrderItems.length} akun Netflix dalam pesanan`);
        
        // Alokasikan profil untuk setiap item Netflix
        for (const item of netflixOrderItems) {
          console.log(`Mengalokasikan profil untuk orderItem Netflix: ${item.id}`);
          const result = await NetflixService.allocateProfileToOrder(item.id, updatedOrder.userId);
          console.log(`Hasil alokasi Netflix: ${result.success ? 'Berhasil' : 'Gagal'} - ${result.message}`);
          allocationResults.netflix.results.push(result);
        }
        
        allocationResults.netflix.processed = netflixOrderItems.length;
      }
    } catch (netflixError) {
      console.error(`Error saat mengalokasikan profil Netflix:`, netflixError);
      // Lanjutkan meskipun alokasi gagal
    }
    
    // 2. Alokasikan slot Spotify jika ada pesanan Spotify
    try {
      console.log(`Mencoba mengalokasikan slot Spotify untuk order: ${id}`);
      
      // Cari orderItems untuk akun Spotify
      const spotifyOrderItems = await prisma.orderItem.findMany({
        where: {
          orderId: id,
          account: {
            type: 'SPOTIFY'
          }
        },
        include: {
          account: true
        }
      });
      
      if (spotifyOrderItems.length > 0) {
        console.log(`Menemukan ${spotifyOrderItems.length} akun Spotify dalam pesanan`);
        
        // Alokasikan slot untuk setiap item Spotify
        for (const item of spotifyOrderItems) {
          console.log(`Mengalokasikan slot untuk orderItem Spotify: ${item.id}`);
          const result = await SpotifyService.allocateSlotToOrder(item.id, updatedOrder.userId);
          console.log(`Hasil alokasi Spotify: ${result.success ? 'Berhasil' : 'Gagal'} - ${result.message}`);
          allocationResults.spotify.results.push(result);
        }
        
        allocationResults.spotify.processed = spotifyOrderItems.length;
      }
    } catch (spotifyError) {
      console.error(`Error saat mengalokasikan slot Spotify:`, spotifyError);
      // Lanjutkan meskipun alokasi gagal
    }
    
    // Respons dengan informasi lengkap
    return NextResponse.json({
      success: true,
      message: verifyManualPayment 
        ? `Bukti pembayaran berhasil diverifikasi dan order ${id} telah diubah ke status PAID` 
        : `Order ${id} berhasil diupdate ke status PAID`,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt
      },
      allocation: allocationResults
    });
  } catch (error) {
    console.error('Error updating order payment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validasi status
    if (!['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // Ambil ID order dari params dengan benar untuk Next.js 14/15
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update order status
    const order = await prisma.order.update({
      where: {
        id: id,
      },
      data: {
        status,
        ...(status === 'COMPLETED' && { paidAt: new Date() }),
      },
    });

    // Jika status diubah menjadi CANCELLED, update status transaksi
    if (status === 'CANCELLED') {
      await prisma.transaction.update({
        where: {
          orderId: id,
        },
        data: {
          status: 'FAILED',
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID diperlukan' },
        { status: 400 }
      );
    }
    
    // Ambil ID order dari params
    const params = await context.params;
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    // Cari order di database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transaction: true }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Dengan manual payment, kita tidak perlu memeriksa status transaksi dari layanan eksternal
    console.log(`Mengaitkan ID transaksi: ${transactionId} dengan order: ${orderId}`);
    
    // Update order ke PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      }
    });
    
    console.log(`Order ${orderId} diupdate menjadi PAID`);
    
    // Update transaksi jika ada
    if (order.transaction) {
      await prisma.transaction.update({
        where: { id: order.transaction.id },
        data: {
          status: 'PAID',
          paymentId: transactionId
        }
      });
      console.log(`Transaction ${order.transaction.id} diupdate menjadi PAID`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Status pesanan berhasil diupdate menjadi PAID',
      order: {
        id: orderId,
        status: updatedOrder.status
      }
    });
  } catch (error) {
    console.error('Error updating order with transaction ID:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 