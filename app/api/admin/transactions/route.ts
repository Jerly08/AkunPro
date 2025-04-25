import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Endpoint untuk mengambil daftar transaksi untuk admin
 */
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi dan role admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build query filters
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (method) {
      filters.paymentMethod = method;
    }
    
    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            status: true,
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip
    });
    
    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: filters
    });
    
    return NextResponse.json(transactions);
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 