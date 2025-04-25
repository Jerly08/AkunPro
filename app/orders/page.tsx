import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OrderHistoryClient from './client-page';

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Ambil riwayat pesanan user
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          account: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <OrderHistoryClient orders={orders} />;
} 