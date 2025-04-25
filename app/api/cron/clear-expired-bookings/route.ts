import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Handler untuk GET request - membersihkan booking akun yang sudah kadaluarsa
 * Endpoint ini dapat dipanggil oleh cron job atau oleh admin secara manual
 */
export async function GET(request: NextRequest) {
  try {
    // Verifikasi API key untuk keamanan (opsional)
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('api_key');
    
    // Jika API key diatur dalam environment, periksa apakah cocok
    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      console.log('Unauthorized access attempt to clear-expired-bookings');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Log waktu mulai
    const startTime = new Date();
    console.log(`[CRON] Mulai membersihkan booking kadaluarsa: ${startTime.toISOString()}`);
    
    // Cari akun dengan booking yang sudah kadaluarsa (bookedUntil < waktu sekarang)
    const now = new Date();
    const expiredBookings = await prisma.account.findMany({
      where: {
        bookedUntil: {
          lt: now
        },
        isBooked: true, // Pastikan hanya memeriksa akun yang diboking
        orderIdBooking: {
          not: null
        }
      },
      select: {
        id: true,
        type: true,
        orderIdBooking: true,
        bookedAt: true,
        bookedUntil: true
      }
    });
    
    console.log(`[CRON] Ditemukan ${expiredBookings.length} booking kadaluarsa`);
    
    // Log detail untuk debugging
    expiredBookings.forEach(account => {
      const bookingDuration = account.bookedUntil && account.bookedAt ? 
        Math.round((account.bookedUntil.getTime() - account.bookedAt.getTime()) / 60000) : 
        'unknown';
      
      console.log(`[CRON] Account ${account.id} (${account.type}) - Booking selama ~${bookingDuration} menit, kadaluarsa pada ${account.bookedUntil?.toISOString()}`);
    });
    
    // Batalkan booking yang sudah kadaluarsa
    if (expiredBookings.length > 0) {
      // Update semua akun dengan booking kadaluarsa
      const updatedAccounts = await prisma.account.updateMany({
        where: {
          id: {
            in: expiredBookings.map(account => account.id)
          },
          isBooked: true, // Pastikan memang masih diboking
          bookedUntil: {
            lt: now
          }
        },
        data: {
          isBooked: false,
          bookedAt: null,
          bookedUntil: null,
          orderIdBooking: null
        }
      });
      
      console.log(`[CRON] Berhasil membersihkan ${updatedAccounts.count} booking kadaluarsa`);
      
      // Cari order IDs terkait untuk diupdate
      const orderIds = [...new Set(expiredBookings
        .map(account => account.orderIdBooking)
        .filter((id): id is string => id !== null))] as string[]; // Ambil order ID unik dan hapus null
      
      // Update order menjadi CANCELLED jika masih PENDING
      if (orderIds.length > 0) {
        const cancelledOrders = await prisma.order.updateMany({
          where: {
            id: {
              in: orderIds
            },
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });
        
        console.log(`[CRON] Berhasil membatalkan ${cancelledOrders.count} pesanan terkait`);
        
        // Update transaction menjadi FAILED jika masih PENDING
        const failedTransactions = await prisma.transaction.updateMany({
          where: {
            orderId: {
              in: orderIds
            },
            status: 'PENDING'
          },
          data: {
            status: 'FAILED',
            updatedAt: new Date()
          }
        });
        
        console.log(`[CRON] Berhasil menandai ${failedTransactions.count} transaksi sebagai gagal`);
      }
    }
    
    // Log waktu selesai dan durasi
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    console.log(`[CRON] Selesai membersihkan booking kadaluarsa: ${endTime.toISOString()} (durasi: ${duration} detik)`);
    
    // Kembalikan respons sukses
    return NextResponse.json({
      success: true,
      message: `Berhasil membersihkan ${expiredBookings.length} booking kadaluarsa`,
      clearedBookings: expiredBookings.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CRON] Error clearing expired bookings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
} 