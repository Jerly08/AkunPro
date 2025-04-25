import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Endpoint untuk dijalankan secara berkala oleh job cron untuk membersihkan booking yang kedaluwarsa
export async function GET(request: NextRequest) {
  try {
    // Verifikasi kunci API
    const apiKey = request.headers.get('x-api-key');
    const configuredApiKey = process.env.CRON_API_KEY;
    
    if (!configuredApiKey || apiKey !== configuredApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized access' 
      }, { status: 401 });
    }
    
    // Set waktu 15 menit yang lalu
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    console.log(`Running cron job to clean expired bookings (older than ${fifteenMinutesAgo.toISOString()})`);
    
    // Cari semua akun yang dibooking lebih dari 15 menit yang lalu
    const expiredBookings = await prisma.account.findMany({
      where: {
        isBooked: true,
        bookedAt: {
          lt: fifteenMinutesAgo
        }
      },
      select: {
        id: true,
        type: true,
        bookedAt: true
      }
    });
    
    console.log(`Found ${expiredBookings.length} expired bookings`);
    
    if (expiredBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired bookings found',
        clearedCount: 0
      });
    }
    
    // Reset booking status
    const result = await prisma.account.updateMany({
      where: {
        id: {
          in: expiredBookings.map(booking => booking.id)
        }
      },
      data: {
        isBooked: false,
        bookedAt: null,
        bookedUntil: null,
        orderIdBooking: null
      }
    });
    
    console.log(`Reset ${result.count} expired bookings`);
    
    // Log detail masing-masing akun yang dibersihkan
    for (const booking of expiredBookings) {
      const bookingAge = now.getTime() - new Date(booking.bookedAt!).getTime();
      const ageMinutes = Math.floor(bookingAge / 60000);
      console.log(`Reset booking for account ${booking.id} (${booking.type}), age: ${ageMinutes} minutes`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.count} expired bookings`,
      clearedCount: result.count,
      details: expiredBookings.map(b => ({
        id: b.id,
        type: b.type,
        bookedAt: b.bookedAt,
        ageMinutes: Math.floor((now.getTime() - new Date(b.bookedAt!).getTime()) / 60000)
      }))
    });
    
  } catch (error) {
    console.error('Error cleaning expired bookings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error cleaning expired bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 