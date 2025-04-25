import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetflixService } from '@/lib/netflix-service';
import { SpotifyService } from '@/lib/spotify-service';

/**
 * Endpoint untuk admin memverifikasi pembayaran manual
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi dan role admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { transactionId, approved } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Cari transaksi
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { order: true }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Pastikan transaksi adalah bank transfer
    if (transaction.paymentMethod !== 'BANK_TRANSFER') {
      return NextResponse.json(
        { success: false, message: 'This endpoint is only for bank transfer payments' },
        { status: 400 }
      );
    }
    
    // Pastikan status masih pending
    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: 'Transaction already processed' },
        { status: 400 }
      );
    }
    
    // Update transaksi dan status order
    const newStatus = approved ? 'PAID' : 'FAILED';
    
    // Update transaksi
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });
    
    // Update order jika disetujui
    if (approved) {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });
      
      // Handle alokasi Netflix profiles dan Spotify slots
      if (transaction.order) {
        try {
          // Cari order items untuk akun Netflix
          const netflixOrderItems = await prisma.orderItem.findMany({
            where: {
              orderId: transaction.orderId,
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
            const netflixAllocationResults = [];
            for (const item of netflixOrderItems) {
              console.log(`Mengalokasikan profil untuk orderItem Netflix: ${item.id}`);
              const result = await NetflixService.allocateProfileToOrder(
                item.id, 
                transaction.order.userId
              );
              console.log(`Hasil alokasi Netflix: ${result.success ? 'Berhasil' : 'Gagal'} - ${result.message}`);
              netflixAllocationResults.push(result);
            }
            
            console.log('Hasil alokasi profil Netflix:', netflixAllocationResults);
          }
          
          // Cari order items untuk akun Spotify
          const spotifyOrderItems = await prisma.orderItem.findMany({
            where: {
              orderId: transaction.orderId,
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
            const spotifyAllocationResults = [];
            for (const item of spotifyOrderItems) {
              console.log(`Mengalokasikan slot untuk orderItem Spotify: ${item.id}`);
              const result = await SpotifyService.allocateSlotToOrder(
                item.id, 
                transaction.order.userId
              );
              console.log(`Hasil alokasi Spotify: ${result.success ? 'Berhasil' : 'Gagal'} - ${result.message}`);
              spotifyAllocationResults.push(result);
            }
            
            console.log('Hasil alokasi slot Spotify:', spotifyAllocationResults);
          }
        } catch (allocationError) {
          console.error('Error allocating account resources:', allocationError);
          // Continue even if allocation fails
        }
      }
      
      // Kirim notifikasi ke pengguna
      try {
        // TODO: Implement email notification
        console.log(`Kirim notifikasi pembayaran berhasil ke pengguna untuk order ${transaction.orderId}`);
      } catch (notificationError) {
        console.error('Error sending user notification:', notificationError);
      }
    } else {
      // Jika pembayaran ditolak, update order status
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { status: 'CANCELLED' }
      });
      
      // Kirim notifikasi penolakan ke pengguna
      try {
        // TODO: Implement email notification
        console.log(`Kirim notifikasi pembayaran ditolak ke pengguna untuk order ${transaction.orderId}`);
      } catch (notificationError) {
        console.error('Error sending rejection notification:', notificationError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: approved ? 'Payment verified successfully' : 'Payment rejected',
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status
      }
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 