import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetflixService } from '@/lib/netflix-service';
import { SpotifyService } from '@/lib/spotify-service';
import { sendAccountDetailsEmail } from '@/lib/email';

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
      include: { 
        transaction: true,
        items: {
          include: {
            account: true
          }
        }
      }
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
    
    // Process order items dan alokasikan akun
    for (const item of order.items) {
      if (item.account) {
        // Alokasikan akun Netflix
        if (item.account.type === 'NETFLIX') {
          try {
            const result = await NetflixService.allocateProfileToOrder(item.id, order.userId);
            allocationResults.netflix.processed++;
            allocationResults.netflix.results.push({
              itemId: item.id,
              success: result.success,
              message: result.message
            });
          } catch (error) {
            console.error(`Error allocating Netflix profile for orderItem ${item.id}:`, error);
            allocationResults.netflix.results.push({
              itemId: item.id,
              success: false,
              message: (error as Error).message
            });
          }
        }
        
        // Alokasikan akun Spotify
        if (item.account.type === 'SPOTIFY') {
          try {
            const result = await SpotifyService.allocateSlotToOrder(item.id, order.userId);
            allocationResults.spotify.processed++;
            allocationResults.spotify.results.push({
              itemId: item.id,
              success: result.success,
              message: result.message
            });
          } catch (error) {
            console.error(`Error allocating Spotify slot for orderItem ${item.id}:`, error);
            allocationResults.spotify.results.push({
              itemId: item.id,
              success: false,
              message: (error as Error).message
            });
          }
        }
      }
    }
    
    // Kirim email dengan detail akun ke pengguna
    try {
      // Ambil data order yang sudah diupdate dengan akun, profil Netflix, dan slot Spotify
      const completedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              account: true,
              netflixProfile: true,
              spotifySlot: true
            }
          }
        }
      });
      
      if (completedOrder && completedOrder.items.length > 0) {
        // Persiapkan data akun untuk email
        const accountsForEmail = [];
        
        for (const item of completedOrder.items) {
          if (!item.account) continue;
          
          const accountType = item.account.type as 'NETFLIX' | 'SPOTIFY';
          let email = '';
          let password = '';
          let profile = undefined;
          
          // Untuk Netflix, lihat profil yang dialokasikan
          if (accountType === 'NETFLIX' && item.netflixProfile) {
            email = item.account.accountEmail;
            password = item.account.accountPassword;
            profile = item.netflixProfile.name;
          } 
          // Untuk Spotify, lihat slot yang dialokasikan
          else if (accountType === 'SPOTIFY' && item.spotifySlot) {
            // Jika slot adalah main account, gunakan email/password dari account
            if (item.spotifySlot.isMainAccount) {
              email = item.account.accountEmail;
              password = item.account.accountPassword;
            } else {
              email = item.spotifySlot.email || item.account.accountEmail;
              password = item.spotifySlot.password || item.account.accountPassword;
            }
          }
          // Fallback ke data account jika tidak ada profil/slot
          else {
            email = item.account.accountEmail;
            password = item.account.accountPassword;
          }
          
          // Tambahkan data akun ke array
          accountsForEmail.push({
            type: accountType,
            email,
            password,
            profile,
            purchaseDate: completedOrder.paidAt || new Date(),
            expiryDate: new Date(
              (completedOrder.paidAt || new Date()).getTime() + 
              (item.account.duration || 30) * 24 * 60 * 60 * 1000
            )
          });
        }
        
        if (accountsForEmail.length > 0) {
          // Kirim email dengan detail akun
          await sendAccountDetailsEmail(
            completedOrder.customerName,
            completedOrder.customerEmail,
            completedOrder.id,
            completedOrder.totalAmount,
            completedOrder.paymentMethod,
            completedOrder.paidAt || new Date(),
            accountsForEmail
          );
          console.log(`Email detail akun berhasil dikirim untuk order ${id}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending account details email:', emailError);
    }
    
    // Return response termasuk hasil alokasi
    return NextResponse.json({
      success: true,
      message: 'Order berhasil diproses',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt
      },
      allocation: allocationResults
    });
    
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: `Terjadi kesalahan: ${(error as Error).message}` },
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