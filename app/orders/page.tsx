import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OrderHistoryClient from './client-page';
import { addMonths } from 'date-fns';

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Ambil riwayat pesanan user dengan detail akun, profil Netflix dan slot Spotify
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      // Ambil semua pesanan
    },
    include: {
      items: {
        include: {
          account: true,
          netflixProfile: true,
          spotifySlot: {
            include: {
              account: {
                select: {
                  accountEmail: true,
                  accountPassword: true,
                  isFamilyPlan: true,
                }
              }
            }
          }
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Urutkan pesanan dari yang terbaru ke terlama (desc)
    },
  });
  
  // Tambahkan informasi expiry date berdasarkan duration akun
  const ordersWithExpiry = orders.map(order => {
    const processedItems = order.items.map(item => {
      // Hitung tanggal expired berdasarkan createdAt dan duration
      const expiryDate = item.account.duration 
        ? addMonths(new Date(order.createdAt), item.account.duration)
        : undefined;
      
      return {
        ...item,
        createdAt: order.createdAt.toISOString(),
        expiryDate
      };
    });
    
    return {
      ...order,
      // Cast status ke tipe yang diharapkan oleh komponen client
      status: order.status as any,
      items: processedItems
    };
  });

  return <OrderHistoryClient orders={ordersWithExpiry as any} />;
} 