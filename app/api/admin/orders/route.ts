import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil semua order dengan detail item dan akun
    console.log('Fetching orders with details');
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            account: {
              select: {
                id: true,
                type: true,
                accountEmail: true,
                profiles: {
                  select: {
                    id: true,
                    name: true,
                    isKids: true,
                    orderId: true,
                    userId: true
                  }
                }
              },
            },
            netflixProfile: true,
          },
        },
        transaction: {
          select: {
            status: true,
            paymentUrl: true,
            paymentMethod: true,
            createdAt: true,
            updatedAt: true
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Found ${orders.length} orders`);

    // Transformasi data agar profil lebih mudah diakses
    const ordersProcessed = orders.map(order => {
      const processedItems = order.items.map(item => {
        // Jika ini adalah akun Netflix, copy profil dari account.profiles ke item.profiles
        if (item.account?.type === 'NETFLIX') {
          const profiles = item.account.profiles || [];
          console.log(`Order ${order.id}, item ${item.id}: Found ${profiles.length} profiles in account`);
          
          return {
            ...item,
            profiles: profiles,
            account: {
              ...item.account,
              // Tetap sertakan profiles asli dalam account untuk backward compatibility
            }
          };
        }
        return item;
      });
      
      return {
        ...order,
        items: processedItems
      };
    });

    // Lakukan log untuk beberapa item sampel untuk debugging
    if (ordersProcessed.length > 0) {
      const sampleOrder = ordersProcessed[0];
      if (sampleOrder.items.length > 0) {
        const sampleItem = sampleOrder.items[0];
        console.log('Sample order item structure:', JSON.stringify({
          id: sampleItem.id,
          accountType: sampleItem.account?.type,
          hasNetflixProfile: !!sampleItem.netflixProfile,
          hasProfiles: Array.isArray(sampleItem.profiles),
          profilesCount: Array.isArray(sampleItem.profiles) ? sampleItem.profiles.length : 0
        }, null, 2));
      }
    }

    return NextResponse.json(ordersProcessed);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 