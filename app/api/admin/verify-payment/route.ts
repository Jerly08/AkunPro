import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetflixService } from '@/lib/netflix-service';
import { SpotifyService } from '@/lib/spotify-service';
import { sendAccountDetailsEmail } from '@/lib/email';
import { accounts_type } from '@prisma/client';

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
      include: { 
        order: {
          include: {
            items: {
              include: {
                account: true
              }
            },
            user: true
          }
        } 
      }
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
    
    // Update status transaksi
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: approved ? 'PAID' : 'FAILED',
        updatedAt: new Date()
      }
    });
    
    if (approved) {
      // Update order ke status PAID
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { 
          status: 'PAID',
          paidAt: new Date()
        }
      });
      
      // Proses alokasi akun Netflix
      const netflixItems = transaction.order.items.filter(item => 
        item.account && item.account.type === 'NETFLIX'
      );
      
      if (netflixItems.length > 0) {
        try {
          for (const item of netflixItems) {
            await NetflixService.allocateProfileToOrder(item.id, transaction.order.userId);
          }
          console.log(`Akun Netflix berhasil dialokasikan untuk order ${transaction.orderId}`);
        } catch (error) {
          console.error(`Error allocating Netflix accounts for order ${transaction.orderId}:`, error);
        }
      }
      
      // Proses alokasi akun Spotify
      const spotifyItems = transaction.order.items.filter(item => 
        item.account && item.account.type === 'SPOTIFY'
      );
      
      if (spotifyItems.length > 0) {
        try {
          for (const item of spotifyItems) {
            await SpotifyService.allocateSlotToOrder(item.id, transaction.order.userId);
          }
          console.log(`Akun Spotify berhasil dialokasikan untuk order ${transaction.orderId}`);
        } catch (error) {
          console.error(`Error allocating Spotify accounts for order ${transaction.orderId}:`, error);
        }
      }
      
      // Kirim email notifikasi ke pengguna dengan detail akun
      try {
        // Ambil data order yang sudah diupdate dengan akun, profil Netflix, dan slot Spotify
        const updatedOrderData = await prisma.order.findUnique({
          where: { id: transaction.orderId },
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
        
        if (updatedOrderData && updatedOrderData.items.length > 0) {
          // Persiapkan data akun untuk email
          const accountsForEmail = [];
          
          for (const item of updatedOrderData.items) {
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
              purchaseDate: updatedOrderData.paidAt || new Date(),
              expiryDate: new Date(
                (updatedOrderData.paidAt || new Date()).getTime() + 
                (item.account.duration || 30) * 24 * 60 * 60 * 1000
              )
            });
          }
          
          if (accountsForEmail.length > 0) {
            // Kirim email dengan detail akun
            await sendAccountDetailsEmail(
              transaction.order.customerName,
              transaction.order.customerEmail,
              transaction.orderId,
              transaction.amount,
              transaction.paymentMethod,
              new Date(),
              accountsForEmail
            );
            console.log(`Email detail akun berhasil dikirim untuk order ${transaction.orderId}`);
          }
        }
      } catch (emailError) {
        console.error('Error sending account details email:', emailError);
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