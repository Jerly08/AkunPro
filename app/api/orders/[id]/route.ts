import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Handler untuk GET request - mendapatkan detail pesanan berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const params_obj = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login untuk melihat detail pesanan' },
        { status: 401 }
      );
    }

    // Dapatkan ID pesanan dari URL path
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const orderId = segments[segments.length - 1];
    console.log(`Fetching order details for ID: ${orderId}`);
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID pesanan diperlukan' },
        { status: 400 }
      );
    }

    // Cari pesanan dengan ID yang sesuai
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        // Pastikan pengguna hanya melihat pesanan miliknya sendiri, kecuali admin
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id })
      },
      include: {
        items: {
          include: {
            account: {
              include: {
                profiles: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        transaction: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Tambahkan log untuk debugging relasi profile
    console.log('===== DEBUG ORDER & NETFLIX PROFILES =====');
    console.log(`Order ID: ${order.id}`);
    console.log(`User ID: ${order.userId}`);
    console.log(`Status: ${order.status}`);
    console.log(`Total Items: ${order.items.length}`);
    
    // Log untuk setiap item pesanan
    order.items.forEach((item, index) => {
      console.log(`\nItem ${index + 1} (ID: ${item.id.substring(0, 8)}...):`);
      console.log(`Account ID: ${item.account.id.substring(0, 8)}...`);
      console.log(`Account Type: ${item.account.type}`);
      
      // Cek profil dari akun
      if (item.account.profiles && item.account.profiles.length > 0) {
        console.log(`Account has ${item.account.profiles.length} profiles`);
        
        item.account.profiles.forEach((profile, pIndex) => {
          console.log(`  Profile ${pIndex + 1}: ${profile.name}`);
          console.log(`    ID: ${profile.id.substring(0, 8)}...`);
          console.log(`    User ID: ${profile.userId || 'Not assigned'}`);
          console.log(`    Order ID: ${profile.orderId || 'Not assigned'}`);
          
          // Verifikasi relasi profile ke orderItem
          if (profile.orderId) {
            console.log(`    Linked to OrderItem: ${profile.orderId === item.id ? 'YES - THIS ITEM' : 'YES - DIFFERENT ITEM'}`);
          } else {
            console.log(`    Linked to OrderItem: NO`);
          }
        });
      } else {
        console.log(`Account has no profiles`);
      }
      
      // Cek juga NetflixProfile di netflixProfile - jika ada (perlu tambahkan ke query)
      console.log(`Relationship with NetflixProfile needs to be checked separately`);
    });
    
    // Verifikasi relasi NetflixProfile untuk order ini
    try {
      const relatedProfiles = await prisma.netflixProfile.findMany({
        where: {
          orderId: {
            in: order.items.map(item => item.id)
          }
        }
      });
      
      console.log(`\nFound ${relatedProfiles.length} NetflixProfiles linked to OrderItems in this order`);
      
      relatedProfiles.forEach((profile, index) => {
        console.log(`Related Profile ${index + 1}: ${profile.name}`);
        console.log(`  ID: ${profile.id.substring(0, 8)}...`);
        console.log(`  Account ID: ${profile.accountId.substring(0, 8)}...`);
        console.log(`  Order Item ID: ${profile.orderId?.substring(0, 8) || 'Not linked'}`);
        console.log(`  User ID: ${profile.userId || 'Not assigned'}`);
        
        // Verifikasi relasi ke orderItems di order ini
        const linkedOrderItem = order.items.find(item => item.id === profile.orderId);
        if (linkedOrderItem) {
          console.log(`  Linked to correct OrderItem: YES`);
        } else if (profile.orderId) {
          console.log(`  Linked to correct OrderItem: NO - linked to different order`);
        } else {
          console.log(`  Linked to correct OrderItem: NO - not linked to any order`);
        }
      });
    } catch (profileError) {
      console.error('Error querying related NetflixProfiles:', profileError);
    }
    
    console.log('=========================================');

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk DELETE request - sudah tidak digunakan lagi
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const params_obj = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login untuk menghapus pesanan' },
        { status: 401 }
      );
    }

    // Dapatkan ID pesanan dari URL path
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const orderId = segments[segments.length - 1];
    console.log(`Menghapus order ID: ${orderId}`);
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID pesanan diperlukan' },
        { status: 400 }
      );
    }

    // Cari pesanan dengan ID yang sesuai
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        // Pastikan pengguna hanya menghapus pesanan miliknya sendiri, kecuali admin
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id })
      },
      include: {
        items: {
          include: {
            account: {
              include: {
                profiles: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        transaction: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Jika pesanan dalam status PENDING, kita tidak menghapusnya secara permanen
    // tetapi mengubah statusnya menjadi CANCELLED dan mengembalikan stok
    if (order.status === 'PENDING') {
      try {
        console.log(`Memulai proses pembatalan pesanan ID: ${orderId}`);
        console.log(`Jumlah item dalam pesanan: ${order.items.length}`);
        
        // 1. Ubah status pesanan menjadi CANCELLED terlebih dahulu
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });
        
        console.log(`Status pesanan ID: ${updatedOrder.id} diubah menjadi CANCELLED`);
        
        // 2. Jika ada transaksi terkait, tandai sebagai FAILED
        if (order.transaction) {
          await prisma.transaction.update({
            where: { id: order.transaction.id },
            data: {
              status: 'FAILED',
              updatedAt: new Date()
            }
          });
          console.log(`Status transaksi ID: ${order.transaction.id} diubah menjadi FAILED`);
        }
        
        // 3. Kembalikan stok dan batalkan booking untuk setiap akun dalam pesanan
        for (const item of order.items) {
          console.log(`Menambah stok dan membatalkan booking untuk akun ID: ${item.account.id}`);
          
          // Check stok akun sebelum di-update
          const accountBefore = await prisma.account.findUnique({
            where: { id: item.account.id },
            select: { id: true, type: true, stock: true, isBooked: true, orderIdBooking: true }
          });
          
          console.log(`Stok sebelum update: ${JSON.stringify(accountBefore)}`);
          
          // Update stok akun dan batalkan booking
          const updatedAccount = await prisma.account.update({
            where: { id: item.account.id },
            data: {
              stock: {
                increment: 1
              },
              isBooked: false,
              bookedAt: null,
              bookedUntil: null,
              orderIdBooking: null
            },
            select: {
              id: true,
              type: true,
              stock: true,
              isBooked: true
            }
          });
          
          console.log(`Stok setelah update: ${JSON.stringify(updatedAccount)}`);
        }

        return NextResponse.json(
          { message: 'Pesanan berhasil dibatalkan' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Error canceling order:', error);
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Pesanan tidak dapat dibatalkan karena tidak dalam status PENDING' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 