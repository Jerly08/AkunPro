import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { SpotifyService } from '@/lib/spotify-service';

// POST - Menambahkan banyak akun sekaligus
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { accounts } = await request.json();
    
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { message: 'Data akun tidak valid' },
        { status: 400 }
      );
    }

    // Memastikan semua akun memiliki field yang diperlukan
    for (const account of accounts) {
      const { type, accountEmail, accountPassword, price, description, warranty } = account;
      
      if (!type || !accountEmail || !accountPassword || !price || !description || !warranty) {
        return NextResponse.json(
          { message: 'Semua field untuk setiap akun harus diisi' },
          { status: 400 }
        );
      }
    }

    // Periksa apakah ada email yang duplikat dalam batch data
    const emails = accounts.map(account => account.accountEmail);
    const uniqueEmails = new Set(emails);
    
    if (emails.length !== uniqueEmails.size) {
      return NextResponse.json(
        { message: 'Terdapat email yang duplikat dalam data yang dikirim' },
        { status: 400 }
      );
    }

    // Periksa apakah ada email yang sudah ada di database
    const existingEmails = await prisma.account.findMany({
      where: {
        accountEmail: {
          in: emails
        }
      },
      select: {
        accountEmail: true
      }
    });

    if (existingEmails.length > 0) {
      const duplicateEmails = existingEmails.map(account => account.accountEmail).join(', ');
      
      return NextResponse.json(
        { message: `Email berikut sudah terdaftar: ${duplicateEmails}` },
        { status: 400 }
      );
    }

    // Siapkan data akun dengan format prisma yang benar
    const accountsWithSeller = accounts.map(account => {
      const { type, duration, isFamilyPlan, maxSlots } = account;
      const isSpotifyFamily = type === 'SPOTIFY' && isFamilyPlan;
      const slotText = isSpotifyFamily ? ` Family Plan (${maxSlots || 6} slot)` : '';
      const name = `Akun ${type === 'NETFLIX' ? 'Netflix' : 'Spotify'}${slotText} Premium ${duration || 1} Bulan`;
      
      // Hilangkan field yang tidak ada di model Prisma dan yang tidak valid
      const { 
        sellerId, 
        profiles, 
        orderItems,
        orderIdBooking,
        isBooked,
        bookedAt,
        bookedUntil,
        ...accountDataClean 
      } = account;
      
      // Construct prisma-compatible object
      return {
        type: type as 'NETFLIX' | 'SPOTIFY', // Memastikan enum valid
        accountEmail: accountDataClean.accountEmail,
        accountPassword: accountDataClean.accountPassword,
        price: Number(account.price),
        description: account.description,
        warranty: Number(account.warranty),
        isActive: account.isActive !== false,
        duration: Number(account.duration || 1),
        stock: Number(account.stock || 1),
        isFamilyPlan: Boolean(isSpotifyFamily),
        maxSlots: isSpotifyFamily ? Number(maxSlots || 6) : 1,
        // Connect ke seller
        seller: {
          connect: {
            id: session.user.id
          }
        }
      };
    });

    // Log data untuk debugging
    console.log('Data yang akan disimpan:', JSON.stringify(accountsWithSeller[0], null, 2));

    // Lakukan operasi batch create dengan try catch per item
    try {
      const createdAccounts = await Promise.all(
        accountsWithSeller.map(async (accountData) => {
          try {
            const account = await prisma.account.create({
              data: accountData,
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });
            
            // If it's a Spotify account, create a default slot with spotify1@gmail.com
            if (account.type === 'SPOTIFY') {
              try {
                await SpotifyService.createDefaultSpotifySlot(account.id);
              } catch (slotError) {
                console.error('Error creating default Spotify slot:', slotError);
                // Continue with the process even if there's an error creating the default slot
              }
            }
            
            return account;
          } catch (singleError) {
            console.error('Error creating single account:', singleError, accountData);
            return null;
          }
        })
      );

      // Filter out any failed creations
      const successfulAccounts = createdAccounts.filter(account => account !== null);

      return NextResponse.json({
        message: `${successfulAccounts.length} akun berhasil ditambahkan dari ${accountsWithSeller.length} permintaan`,
        accounts: successfulAccounts
      });
    } catch (transactionError: any) {
      console.error('Error in Promise.all:', transactionError);
      throw new Error(`Batch operation failed: ${transactionError.message}`);
    }
  } catch (error: any) {
    console.error('Error creating batch accounts:', error);
    
    // Cek apakah error adalah Prisma error untuk unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Terdapat email yang sudah terdaftar' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
} 