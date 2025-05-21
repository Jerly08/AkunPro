import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Fungsi untuk mengecek apakah pengguna adalah admin
async function isAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return false;
  }
  
  return true;
}

// GET: Mengambil semua voucher untuk halaman admin
export async function GET(request: NextRequest) {
  try {
    // Cek apakah pengguna adalah admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ambil semua voucher
    const vouchers = await prisma.voucher.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      vouchers
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Membuat voucher baru
export async function POST(request: NextRequest) {
  try {
    // Cek apakah pengguna adalah admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ambil data dari request
    const body = await request.json();
    
    // Validasi data
    if (!body.code || !body.description || !body.discountType || !body.discountValue) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Cek apakah kode sudah ada
    const existingVoucher = await prisma.voucher.findUnique({
      where: { code: body.code }
    });

    if (existingVoucher) {
      return NextResponse.json(
        { success: false, message: 'Kode voucher sudah digunakan' },
        { status: 400 }
      );
    }

    // Buat voucher baru
    const voucher = await prisma.voucher.create({
      data: {
        code: body.code,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minPurchaseAmount: body.minPurchaseAmount,
        maxDiscountAmount: body.maxDiscountAmount,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive,
        usageLimit: body.usageLimit,
        isForNewUsers: body.isForNewUsers,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil dibuat',
      voucher
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 