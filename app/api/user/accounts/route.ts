import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get orders with raw SQL query
    const userId = session.user.id;
    const result = await prisma.$queryRaw`
      SELECT a.* 
      FROM accounts a
      JOIN order_items oi ON a.id = oi.accountId
      JOIN orders o ON oi.orderId = o.id
      WHERE o.userId = ${userId}
      AND (o.status = 'PAID' OR o.status = 'COMPLETED')
      GROUP BY a.id
      ORDER BY a.createdAt DESC
    `;

    const accounts = result as any[];
    
    // Fetch profiles for these accounts
    const accountIds = accounts.map(acc => acc.id);
    
    // Get Netflix profiles for accounts
    const profiles = await prisma.netflixProfile.findMany({
      where: {
        accountId: { in: accountIds },
        userId: session.user.id
      }
    });
    
    // Group profiles by account ID
    const profilesByAccount = profiles.reduce((acc, profile) => {
      if (!acc[profile.accountId]) {
        acc[profile.accountId] = [];
      }
      acc[profile.accountId].push(profile);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Add profiles to accounts
    const accountsWithProfiles = accounts.map(account => {
      return {
        ...account,
        profiles: profilesByAccount[account.id] || []
      };
    });
    
    console.log('===== DEBUG USER ACCOUNTS & PROFILES =====');
    console.log(`User ID: ${session.user.id}`);
    console.log(`Total accounts found: ${accountsWithProfiles.length}`);
    
    return NextResponse.json(accountsWithProfiles);
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
} 