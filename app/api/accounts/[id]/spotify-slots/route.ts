import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { OrderStatus, accounts_type } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Next.js requires params to be awaited in route handlers
    const accountId = params.id;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'ID akun tidak ditemukan' },
        { status: 400 }
      );
    }
    
    // Verify that the user has access to this account
    const userAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        orderItems: {
          some: {
            order: {
              userId: session.user.id,
              OR: [
                { status: OrderStatus.PAID },
                { status: OrderStatus.COMPLETED }
              ]
            }
          }
        }
      }
    });
    
    if (!userAccount) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      );
    }
    
    // Check if the account is Spotify
    if (userAccount.type !== accounts_type.SPOTIFY) {
      return NextResponse.json(
        { error: 'Akun ini bukan akun Spotify' },
        { status: 400 }
      );
    }
    
    // Cek jika akun ini adalah family plan
    if (!userAccount.isFamilyPlan) {
      return NextResponse.json(
        { success: true, slots: [] },
        { status: 200 }
      );
    }
    
    // Cari slot yang sudah dialokasikan untuk pengguna ini
    const allocatedSlots = await prisma.spotifySlot.findMany({
      where: {
        accountId: accountId,
        isAllocated: true,
        userId: session.user.id,
      },
      include: {
        account: {
          select: {
            accountEmail: true,
            accountPassword: true,
            description: true,
            warranty: true,
            duration: true
          }
        },
        orderItem: {
          select: {
            orderId: true,
            price: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    // Jika pengguna belum memiliki slot, cari slot yang tersedia untuk dialokasikan
    if (allocatedSlots.length === 0) {
      // Cari OrderItem yang dimiliki pengguna ini untuk akun Spotify ini
      const orderItems = await prisma.orderItem.findMany({
        where: {
          accountId: accountId,
          order: {
            userId: session.user.id,
            OR: [
              { status: OrderStatus.PAID },
              { status: OrderStatus.COMPLETED }
            ]
          },
          spotifySlot: null // Belum memiliki slot yang teralokasi
        },
      });
      
      if (orderItems.length > 0) {
        // Cari slot yang tersedia untuk dialokasikan
        const availableSlots = await prisma.spotifySlot.findMany({
          where: {
            accountId: accountId,
            isAllocated: false,
            isActive: true,
            userId: null,
            orderItemId: null
          },
          take: orderItems.length, // Batasi jumlah slot sesuai jumlah OrderItem
        });
        
        // Alokasikan slot yang tersedia ke OrderItem
        if (availableSlots.length > 0) {
          for (let i = 0; i < Math.min(availableSlots.length, orderItems.length); i++) {
            await prisma.spotifySlot.update({
              where: {
                id: availableSlots[i].id
              },
              data: {
                isAllocated: true,
                userId: session.user.id,
                orderItemId: orderItems[i].id
              }
            });
          }
          
          // Ambil kembali slot yang sudah dialokasikan
          const newlyAllocatedSlots = await prisma.spotifySlot.findMany({
            where: {
              accountId: accountId,
              userId: session.user.id,
              orderItemId: {
                in: orderItems.map(item => item.id)
              }
            },
            include: {
              account: {
                select: {
                  accountEmail: true,
                  accountPassword: true,
                  description: true,
                  warranty: true,
                  duration: true
                }
              },
              orderItem: {
                select: {
                  orderId: true,
                  price: true,
                  createdAt: true,
                  order: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
            }
          });
          
          return NextResponse.json({
            success: true,
            slots: newlyAllocatedSlots,
            message: "Slot berhasil dialokasikan otomatis"
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      slots: allocatedSlots
    });
  } catch (error) {
    console.error('Error fetching spotify slots:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data slot Spotify', details: String(error) },
      { status: 500 }
    );
  }
} 