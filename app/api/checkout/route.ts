import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { sendEmail, generateTransactionEmailTemplate, sendTransactionEmail } from '@/lib/email';

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

    // Proses item untuk mendukung kuantitas
    let processedItems = [];
    let itemsToCheck = [];

    // Proses input items dari request untuk mendukung kuantitas
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (typeof item === 'object' && item.id) {
          // Format baru: { id: "abc", quantity: 2 }
          const quantity = parseInt(item.quantity) || 1;
          itemsToCheck.push(item.id);
          
          // Buat entri untuk setiap kuantitas
          for (let i = 0; i < quantity; i++) {
            processedItems.push(item.id);
          }
        } else if (typeof item === 'string') {
          // Format lama: string ID
          itemsToCheck.push(item);
          processedItems.push(item);
        }
      }
    } else {
      // Fallback untuk format lama
      processedItems = Array.isArray(items) ? [...items] : [];
      itemsToCheck = Array.isArray(items) ? [...items] : [];
    }

    console.log('Items to checkout:', items);
    console.log('Processed items for quantity:', processedItems);
    console.log('Items to check availability:', itemsToCheck);

    // Reset booking status untuk akun yang sudah kedaluwarsa
    const resetCount = await resetExpiredBookings(itemsToCheck);
    if (resetCount > 0) {
      console.log(`Reset ${resetCount} expired bookings before checkout`);
    }

    // Validasi format ID item
    const invalidItems = itemsToCheck.filter(id => typeof id !== 'string' || id.length < 1);
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
    console.log('Searching for accounts with IDs:', itemsToCheck);
    try {
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: itemsToCheck },
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
          accountEmail: true,
          accountPassword: true,
          profiles: {
            where: {
              userId: null,
              orderId: null
            },
            select: {
              id: true,
              name: true,
              isKids: true
            }
          },
          isFamilyPlan: true,
          maxSlots: true,
          // Add count of existing slots for Spotify accounts
          spotifySlots: {
            select: {
              id: true,
              isAllocated: true
            }
          }
        },
      });

      console.log('Found accounts:', accounts);

      // Perform additional validation for Spotify accounts
      for (const account of accounts) {
        if (account.type === 'SPOTIFY') {
          console.log(`Validating Spotify account ${account.id}`);
          
          // Validate that Spotify Family Plan accounts have valid configuration
          if (account.isFamilyPlan) {
            // Check if maxSlots is set properly
            if (!account.maxSlots || account.maxSlots <= 0) {
              console.error(`Spotify Family Plan account ${account.id} has invalid maxSlots: ${account.maxSlots}`);
              return NextResponse.json(
                { 
                  success: false, 
                  message: `Spotify account configuration error: Invalid maximum slots (${account.maxSlots})` 
                },
                { status: 400 }
              );
            }
            
            // Count allocated slots
            const allocatedSlots = account.spotifySlots.filter(slot => slot.isAllocated).length;
            console.log(`Spotify account ${account.id}: ${allocatedSlots} allocated slots out of ${account.maxSlots} max slots`);
            
            // Check if there's room for new slots
            if (allocatedSlots >= account.maxSlots) {
              console.error(`Spotify Family Plan account ${account.id} has no available slots (${allocatedSlots}/${account.maxSlots})`);
              return NextResponse.json(
                { 
                  success: false, 
                  message: 'Spotify Family Plan tidak memiliki slot yang tersedia',
                  unavailableItems: [account.id],
                  isStockError: true
                },
                { status: 400 }
              );
            }
          }
        }
      }

      // Validasi status akun
      if (accounts.length !== itemsToCheck.length) {
        const foundAccountIds = accounts.map(acc => acc.id);
        const unavailableAccounts = itemsToCheck.filter(id => !foundAccountIds.includes(id));
        
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

      // Periksa ketersediaan profil untuk akun Netflix sesuai kuantitas
      for (const account of accounts) {
        if (account.type === 'NETFLIX') {
          // Hitung berapa kali akun ini muncul dalam processedItems (kuantitas)
          const requiredCount = processedItems.filter(id => id === account.id).length;
          
          // Periksa jika profil tersedia cukup untuk kuantitas yang diminta
          if (account.profiles.length < requiredCount) {
            console.log(`Not enough profiles available for Netflix account ${account.id}. Needed: ${requiredCount}, Available: ${account.profiles.length}`);
            return NextResponse.json(
              { 
                success: false, 
                message: `Tidak cukup profil tersedia untuk akun Netflix. Tersedia: ${account.profiles.length}, Dibutuhkan: ${requiredCount}`,
                unavailableItems: [account.id]
              },
              { status: 400 }
            );
          }
        }
      }

      // Hitung total harga dan pajak berdasarkan processedItems
      const subtotal = processedItems.reduce((total, id) => {
        const account = accounts.find(acc => acc.id === id);
        return total + (account ? account.price : 0);
      }, 0);
      
      const tax = Math.round(subtotal * 0.11); // 11% pajak
      const total = subtotal + tax;

      console.log('Order calculation:', { subtotal, tax, total });

      // Set waktu kadaluarsa pembayaran (24 jam dari sekarang)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      try {
        // Using increased transaction timeout to avoid "Transaction API error: Transaction already closed" errors
        // Default timeout is 5000ms (5 seconds), but checkout operations can take longer
        const result = await prisma.$transaction(
          async (tx) => {
            // Buat pesanan baru dengan timeout yang lebih lama
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
                  create: processedItems.map((id) => {
                    const account = accounts.find(acc => acc.id === id);
                    return {
                      accountId: id,
                      price: account ? account.price : 0,
                    };
                  }),
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
                items: {
                  include: {
                    account: true
                  }
                },
                transaction: true,
              }
            });

            // Tandai akun sebagai diboking
            await tx.account.updateMany({
              where: {
                id: { in: itemsToCheck },
              },
              data: {
                isBooked: true,
                bookedAt: new Date(),
                bookedUntil: expiresAt,
                orderIdBooking: order.id
              },
            });

            // Buat tracking profil yang tersedia untuk setiap akun
            const availableProfiles = {};
            accounts.forEach(account => {
              if (account.type === 'NETFLIX' && account.profiles) {
                availableProfiles[account.id] = [...account.profiles]; // Clone profiles array
              }
            });
            
            // Buat index untuk melacak order item yang tersedia untuk setiap akun
            const orderItemsByAccount = {};
            order.items.forEach(item => {
              if (!orderItemsByAccount[item.accountId]) {
                orderItemsByAccount[item.accountId] = [];
              }
              orderItemsByAccount[item.accountId].push(item);
            });
            
            // Mencatat item yang sudah diproses untuk menghindari duplikasi
            const processedOrderItems = new Set();
            
            // Untuk setiap item yang diproses, alokasikan profil/slot
            for (const accountId of processedItems) {
              const account = accounts.find(acc => acc.id === accountId);
              if (!account) continue;
              
              // Cari order item yang belum diproses untuk akun ini
              const availableOrderItems = orderItemsByAccount[accountId]?.filter(
                item => !processedOrderItems.has(item.id)
              ) || [];
              
              if (availableOrderItems.length === 0) continue;
              
              // Gunakan order item pertama yang tersedia
              const orderItem = availableOrderItems[0];
              
              // Tandai sebagai sudah diproses
              processedOrderItems.add(orderItem.id);
              
              console.log(`Processing account ${account.id} with order item ${orderItem.id}`);
              
              if (account.type === 'NETFLIX' && availableProfiles[account.id]?.length > 0) {
                // Get next available Netflix profile
                const profileToAllocate = availableProfiles[account.id].shift(); // Remove first profile
                
                if (profileToAllocate) {
                  try {
                    await tx.netflixProfile.update({
                      where: { id: profileToAllocate.id },
                      data: {
                        orderId: orderItem.id,
                        userId: session.user.id
                      }
                    });
                    
                    console.log(`Allocated Netflix profile ${profileToAllocate.id} to order item ${orderItem.id}`);
                  } catch (profileError) {
                    console.error(`Error allocating profile ${profileToAllocate.id}:`, profileError);
                    throw profileError;
                  }
                }
              } else if (account.type === 'SPOTIFY') {
                // Handle Spotify accounts 
                try {
                  // Make a single query to get account info instead of making it inside the loop for each account
                  const accountCheck = await tx.account.findUnique({
                    where: { 
                      id: account.id,
                      isActive: true
                    },
                    select: {
                      id: true,
                      isFamilyPlan: true,
                      maxSlots: true,
                      // Get current allocated slots count with a single query 
                      // instead of a separate count query later
                      _count: {
                        select: {
                          spotifySlots: {
                            where: {
                              isAllocated: true
                            }
                          }
                        }
                      }
                    }
                  });
                  
                  if (!accountCheck) {
                    throw new Error(`Account ${account.id} not found or inactive`);
                  }
                  
                  // Store the allocated slots count for reuse in the stock update section
                  let allocatedSlotsCount = 0;
                  
                  // If family plan, check available slots
                  if (account.isFamilyPlan) {
                    // Use the pre-fetched count instead of making another query
                    allocatedSlotsCount = accountCheck._count.spotifySlots;
                    
                    // Verify that we have room for another slot
                    if (allocatedSlotsCount >= (account.maxSlots || 0)) {
                      throw new Error(`No slots available in Family Plan account: ${allocatedSlotsCount}/${account.maxSlots}`);
                    }
                    
                    console.log(`Creating Spotify Family Plan slot for account ${account.id} (${allocatedSlotsCount}/${account.maxSlots} used)`);
                    
                    // Create a slot for the buyer
                    await tx.spotifySlot.create({
                      data: {
                        accountId: account.id,
                        slotName: `Slot untuk ${customerInfo.name}`,
                        isMainAccount: false,
                        isAllocated: true,
                        userId: session.user.id,
                        orderItemId: orderItem.id
                      }
                    });
                    
                    console.log(`Created Spotify slot for account ${account.id}`);
                    
                    // Update stock for Spotify Family Plan accounts right after creating the slot
                    // to keep related operations together
                    if (account.stock !== undefined && account.stock > 0) {
                      const remainingSlots = (account.maxSlots || 0) - (allocatedSlotsCount + 1);
                      
                      // Only update stock if it's different from remaining slots
                      if (account.stock !== remainingSlots) {
                        console.log(`Updating Spotify Family Plan stock for account ${account.id}: ${remainingSlots} slots remaining`);
                        
                        await tx.account.update({
                          where: { id: account.id },
                          data: {
                            stock: remainingSlots
                          }
                        });
                      }
                    }
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
                    // Update stock for regular Spotify accounts right away
                    if (account.stock !== undefined && account.stock > 0) {
                      await tx.account.update({
                        where: { id: account.id },
                        data: {
                          stock: {
                            decrement: 1
                          }
                        }
                      });
                      console.log(`Decremented stock for regular Spotify account ${account.id}`);
                    }
                  }
                } catch (spotifyError) {
                  console.error(`Error processing Spotify account ${account.id}:`, spotifyError);
                  throw new Error(`Error processing Spotify account: ${spotifyError.message}`);
                }
              }
            }

            return order;
          },
          {
            timeout: 30000, // 30 seconds
            maxWait: 5000,  // 5 seconds max wait time for the transaction to start
            isolationLevel: 'ReadCommitted'
          }
        );

        // Move the email sending outside the transaction to reduce transaction time
        try {
          await sendTransactionEmail(
            result.customerName,
            result.customerEmail,
            result.id,
            result.totalAmount,
            'PENDING',
            result.items.map(item => ({
              name: item.account.type,
              price: item.price
            }))
          );
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Continue process even if email fails
        }

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
              { success: false, message: `Constraint violation: ${error.meta?.target}` },
              { status: 400 }
            );
          }
          
          if (error.code === 'P2003') {
            return NextResponse.json(
              { success: false, message: 'Foreign key constraint failed' },
              { status: 400 }
            );
          }
          
          if (error.code === 'P2025') {
            return NextResponse.json(
              { success: false, message: 'Record not found' },
              { status: 400 }
            );
          }
        }
        
        // More specific error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';
        
        return NextResponse.json(
          { 
            success: false, 
            message: `Database error saat memproses pesanan: ${errorMessage}`,
            error: errorMessage
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