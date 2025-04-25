import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Fungsi untuk mereset booking status akun yang sudah kedaluwarsa
async function resetExpiredBookings(accountIds: string[]) {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  
  console.log(`Checking ${accountIds.length} accounts for expired bookings...`);
  
  try {
    // Ambil akun yang sedang dibooking tapi sudah lebih dari 15 menit
    const bookedAccounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        isBooked: true,
        bookedAt: {
          lt: fifteenMinutesAgo
        }
      },
      select: {
        id: true,
        bookedAt: true
      }
    });
    
    if (bookedAccounts.length > 0) {
      console.log(`Found ${bookedAccounts.length} accounts with expired bookings`);
      
      // Reset booking status
      const updatedAccounts = await prisma.account.updateMany({
        where: {
          id: { in: bookedAccounts.map(a => a.id) }
        },
        data: {
          isBooked: false,
          bookedAt: null,
          bookedUntil: null,
          orderIdBooking: null
        }
      });
      
      console.log(`Reset booking status for ${updatedAccounts.count} accounts`);
      return updatedAccounts.count;
    } else {
      console.log('No expired bookings found');
      return 0;
    }
  } catch (error) {
    console.error('Error resetting expired bookings:', error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log raw request for debugging
    const rawText = await request.text();
    console.log('Raw request body:', rawText);
    
    // Periksa sesi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      console.log('Checkout error: No session or user ID');
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk melakukan checkout' },
        { status: 401 }
      );
    }

    // Parse request body with better error handling
    let body;
    try {
      body = JSON.parse(rawText);
      console.log('Parsed request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { success: false, message: 'Format request tidak valid (JSON invalid)' },
        { status: 400 }
      );
    }
    
    const { items, customerInfo } = body;

    // Validasi input yang lebih ketat
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Checkout error: Invalid items array:', items);
      return NextResponse.json(
        { success: false, message: 'Item pesanan tidak valid atau kosong' },
        { status: 400 }
      );
    }

    console.log('Items to checkout:', items);

    // Reset booking status untuk akun yang sudah kedaluwarsa
    const resetCount = await resetExpiredBookings(items);
    if (resetCount > 0) {
      console.log(`Reset ${resetCount} expired bookings before checkout`);
    }

    // Validasi format ID item
    const invalidItems = items.filter(id => typeof id !== 'string' || id.length < 1);
    if (invalidItems.length > 0) {
      console.log('Checkout error: Invalid item IDs:', invalidItems);
      return NextResponse.json(
        { success: false, message: 'Format ID item tidak valid' },
        { status: 400 }
      );
    }

    // Validasi informasi pelanggan
    if (!customerInfo) {
      console.log('Checkout error: Missing customer info');
      return NextResponse.json(
        { success: false, message: 'Informasi pelanggan tidak ditemukan' },
        { status: 400 }
      );
    }

    console.log('Customer info received:', customerInfo);

    const { name, email, phone, paymentMethod = 'BANK_TRANSFER' } = customerInfo;

    // Validasi metode pembayaran
    if (!['BANK_TRANSFER', 'VIRTUAL_ACCOUNT'].includes(paymentMethod)) {
      console.log('Checkout error: Invalid payment method:', paymentMethod);
      return NextResponse.json(
        { success: false, message: 'Metode pembayaran tidak valid' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      console.log('Checkout error: Invalid customer name:', name);
      return NextResponse.json(
        { success: false, message: 'Nama pelanggan tidak valid' },
        { status: 400 }
      );
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.log('Checkout error: Invalid customer email:', email);
      return NextResponse.json(
        { success: false, message: 'Email pelanggan tidak valid' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.match(/^[0-9+-\s()]{8,}$/)) {
      console.log('Checkout error: Invalid customer phone:', phone);
      return NextResponse.json(
        { success: false, message: 'Nomor telepon tidak valid' },
        { status: 400 }
      );
    }

    // Periksa apakah user ada di database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.log('Checkout error: User not found in database:', session.user.id);
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan di database' },
        { status: 400 }
      );
    }

    // Ambil detail akun dari database dengan pengecualian error yang lebih baik
    console.log('Searching for accounts with IDs:', items);
    try {
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: items },
          isActive: true,
          isBooked: false,
        },
        select: {
          id: true,
          type: true,
          price: true,
          warranty: true,
          isBooked: true,
          isActive: true,
          stock: true,
          profiles: {
            where: {
              userId: null,
              orderId: null
            },
            select: {
              id: true,
              name: true
            }
          }
        },
      });

      console.log('Found accounts:', accounts);

      // Validasi status akun
      if (accounts.length !== items.length) {
        const foundAccountIds = accounts.map(acc => acc.id);
        const unavailableAccounts = items.filter(id => !foundAccountIds.includes(id));
        
        console.log('Unavailable accounts:', unavailableAccounts);
        
        // Cek status akun yang tidak tersedia
        const unavailableAccountsDetails = await prisma.account.findMany({
          where: {
            id: { in: unavailableAccounts },
          },
          select: {
            id: true,
            isBooked: true,
            isActive: true,
          },
        });

        console.log('Unavailable accounts details:', unavailableAccountsDetails);

        const bookedAccounts = unavailableAccountsDetails.filter(acc => acc.isBooked);
        const inactiveAccounts = unavailableAccountsDetails.filter(acc => !acc.isActive);
        const notFoundAccounts = unavailableAccounts.filter(id => 
          !unavailableAccountsDetails.some(detail => detail.id === id)
        );

        if (bookedAccounts.length > 0) {
          console.log('Booked accounts found:', bookedAccounts);
          return NextResponse.json(
            { 
              success: false, 
              message: 'Beberapa akun sedang dalam proses checkout oleh pengguna lain',
              unavailableItems: bookedAccounts.map(acc => acc.id),
              isBookedError: true
            },
            { status: 400 }
          );
        }

        if (inactiveAccounts.length > 0) {
          console.log('Inactive accounts found:', inactiveAccounts);
          return NextResponse.json(
            { 
              success: false, 
              message: 'Beberapa akun tidak aktif',
              unavailableItems: inactiveAccounts.map(acc => acc.id),
              isInactiveError: true
            },
            { status: 400 }
          );
        }
        
        if (notFoundAccounts.length > 0) {
          console.log('Accounts not found in database:', notFoundAccounts);
          return NextResponse.json(
            { 
              success: false, 
              message: 'Beberapa akun tidak ditemukan dalam database',
              unavailableItems: notFoundAccounts 
            },
            { status: 400 }
          );
        }
        
        console.log('Accounts not found:', unavailableAccounts);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Beberapa akun tidak tersedia',
            unavailableItems: unavailableAccounts 
          },
          { status: 400 }
        );
      }

      // Periksa apakah ada akun Netflix tanpa profil tersedia
      const netflixAccountsWithoutProfiles = accounts.filter(
        acc => acc.type === 'NETFLIX' && (!acc.profiles || acc.profiles.length === 0)
      );

      if (netflixAccountsWithoutProfiles.length > 0) {
        console.log('Netflix accounts without available profiles:', netflixAccountsWithoutProfiles);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Beberapa akun Netflix tidak memiliki profil yang tersedia',
            unavailableItems: netflixAccountsWithoutProfiles.map(acc => acc.id)
          },
          { status: 400 }
        );
      }

      // Hitung total harga dan pajak
      const subtotal = accounts.reduce((total, account) => total + account.price, 0);
      const tax = Math.round(subtotal * 0.11); // 11% pajak
      const total = subtotal + tax;

      console.log('Order calculation:', { subtotal, tax, total });

      // Set waktu kadaluarsa pembayaran (24 jam dari sekarang)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      try {
        // Buat transaksi database untuk memastikan semua operasi berhasil atau gagal bersama
        const result = await prisma.$transaction(async (tx) => {
          // Buat pesanan baru
          const order = await tx.order.create({
            data: {
              userId: session.user.id,
              customerName: customerInfo.name.trim(),
              customerEmail: customerInfo.email.toLowerCase(),
              customerPhone: customerInfo.phone,
              customerAddress: customerInfo.address?.trim() || '',
              status: 'PENDING',
              paymentMethod: customerInfo.paymentMethod || 'BANK_TRANSFER',
              subtotalAmount: subtotal,
              taxAmount: tax,
              totalAmount: total,
              expiresAt,
              items: {
                create: accounts.map((account) => ({
                  accountId: account.id,
                  price: account.price,
                })),
              },
              transaction: {
                create: {
                  amount: total,
                  paymentMethod: customerInfo.paymentMethod || 'BANK_TRANSFER',
                  status: 'PENDING',
                }
              }
            },
            include: {
              items: true,
              transaction: true,
            }
          });

          console.log('Created order:', order);

          // Tandai akun sebagai diboking
          await tx.account.updateMany({
            where: {
              id: { in: accounts.map(acc => acc.id) },
            },
            data: {
              isBooked: true,
              bookedAt: new Date(),
              bookedUntil: expiresAt,
              orderIdBooking: order.id
            },
          });

          // Untuk akun Netflix, alokasikan satu profil ke order
          for (const account of accounts) {
            if (account.type === 'NETFLIX' && account.profiles && account.profiles.length > 0) {
              // Ambil profil pertama yang tersedia
              const profileToAllocate = account.profiles[0];
              
              // Update profil dengan orderItem yang baru dibuat
              const orderItem = order.items.find(item => item.accountId === account.id);
              
              if (orderItem && profileToAllocate) {
                await tx.netflixProfile.update({
                  where: { id: profileToAllocate.id },
                  data: {
                    orderId: orderItem.id,
                    userId: session.user.id
                  }
                });
                
                console.log(`Allocated Netflix profile ${profileToAllocate.id} to order item ${orderItem.id}`);
                
                // Update stok account
                await tx.account.update({
                  where: { id: account.id },
                  data: {
                    stock: {
                      decrement: 1
                    }
                  }
                });
                
                console.log(`Decremented stock for Netflix account ${account.id}`);
              }
            } else if (account.type === 'SPOTIFY') {
              // Handle Spotify accounts 
              const orderItem = order.items.find(item => item.accountId === account.id);
              
              if (orderItem) {
                // Check if it's a Family Plan
                const spotifyAccount = await tx.account.findUnique({
                  where: { id: account.id },
                  select: { isFamilyPlan: true, maxSlots: true }
                });
                
                if (spotifyAccount?.isFamilyPlan) {
                  console.log(`Creating Spotify Family Plan slot for account ${account.id}`);
                  
                  // Create a main slot for the buyer
                  await tx.spotifySlot.create({
                    data: {
                      accountId: account.id,
                      slotName: `Slot Utama - ${customerInfo.name}`,
                      isMainAccount: true,
                      isAllocated: true,
                      userId: session.user.id,
                      orderItemId: orderItem.id
                    }
                  });
                  
                  console.log(`Created main Spotify slot for account ${account.id}`);
                } else {
                  // Regular Spotify account (not family plan)
                  await tx.spotifySlot.create({
                    data: {
                      accountId: account.id,
                      slotName: `Akun Premium - ${customerInfo.name}`,
                      isMainAccount: true,
                      isAllocated: true,
                      userId: session.user.id,
                      orderItemId: orderItem.id
                    }
                  });
                  
                  console.log(`Created regular Spotify slot for account ${account.id}`);
                }
              }
              
              // Update stock for Spotify account
              if (account.stock !== undefined && account.stock > 0) {
                await tx.account.update({
                  where: { id: account.id },
                  data: {
                    stock: {
                      decrement: 1
                    }
                  }
                });
                
                console.log(`Decremented stock for Spotify account ${account.id}`);
              }
            } else if (account.stock !== undefined && account.stock > 0) {
              // Handle other account types
              await tx.account.update({
                where: { id: account.id },
                data: {
                  stock: {
                    decrement: 1
                  }
                }
              });
              
              console.log(`Decremented stock for account ${account.id} (type: ${account.type})`);
            }
          }

          return order;
        });

        // Info rekening bank untuk transfer manual
        const paymentData = {
          bankAccounts: [
            { bank: 'BCA', accountNumber: '1234567890', accountName: 'PT. NETFLIX SPOTIFY MARKETPLACE' },
            { bank: 'BNI', accountNumber: '0987654321', accountName: 'PT. NETFLIX SPOTIFY MARKETPLACE' },
          ],
          expiresAt: expiresAt.toISOString(),
        };

        return NextResponse.json({
          success: true,
          message: 'Pesanan berhasil dibuat',
          id: result.id,
          transactionId: result.transaction?.id,
          paymentMethod: result.paymentMethod,
          amount: total,
          paymentData,
          expiresAt: expiresAt.toISOString()
        });
      } catch (error) {
        console.error('Transaction error:', error);
        
        // Handle specific Prisma errors
        if (error instanceof PrismaClientKnownRequestError) {
          console.log('Prisma error code:', error.code);
          
          if (error.code === 'P2002') {
            return NextResponse.json(
              { success: false, message: 'Constraint violation: ' + error.meta?.target },
              { status: 400 }
            );
          }
          
          if (error.code === 'P2003') {
            return NextResponse.json(
              { success: false, message: 'Foreign key constraint failed' },
              { status: 400 }
            );
          }
        }
        
        return NextResponse.json(
          { 
            success: false, 
            message: 'Database error saat memproses pesanan',
            error: error instanceof Error ? error.message : 'Unknown transaction error'
          },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database error saat memeriksa akun',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat memproses checkout',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 