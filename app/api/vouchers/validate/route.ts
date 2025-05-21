import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Periksa sesi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk menggunakan voucher' },
        { status: 401 }
      );
    }

    // Ambil data dari request
    const body = await request.json();
    const { code, amount } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Kode voucher diperlukan' },
        { status: 400 }
      );
    }

    // Ambil user dari database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        voucherUsage: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cari voucher dengan kode tersebut
    const voucher = await prisma.voucher.findUnique({
      where: { code },
      include: {
        usedBy: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher tidak ditemukan' },
        { status: 404 }
      );
    }

    // Periksa apakah voucher masih aktif
    if (!voucher.isActive) {
      return NextResponse.json(
        { success: false, message: 'Voucher sudah tidak aktif' },
        { status: 400 }
      );
    }

    // Periksa tanggal validitas voucher
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return NextResponse.json(
        { success: false, message: 'Voucher di luar periode validitas' },
        { status: 400 }
      );
    }

    // Periksa batas penggunaan voucher
    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      return NextResponse.json(
        { success: false, message: 'Voucher sudah mencapai batas penggunaan' },
        { status: 400 }
      );
    }

    // Periksa apakah untuk pengguna baru saja
    if (voucher.isForNewUsers) {
      // Ambil jumlah order yang sudah selesai
      const completedOrdersCount = await prisma.order.count({
        where: {
          userId: session.user.id,
          status: { in: ['COMPLETED', 'PAID'] }
        }
      });

      if (completedOrdersCount > 0) {
        return NextResponse.json(
          { success: false, message: 'Voucher hanya berlaku untuk pengguna baru' },
          { status: 400 }
        );
      }
    }

    // Periksa apakah pengguna sudah pernah menggunakan voucher ini
    if (voucher.usedBy.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Anda sudah pernah menggunakan voucher ini' },
        { status: 400 }
      );
    }

    // Pastikan jumlah pembelian minimal terpenuhi (jika ada)
    if (voucher.minPurchaseAmount && amount < voucher.minPurchaseAmount) {
      return NextResponse.json(
        { success: false, message: `Minimal pembelian Rp ${voucher.minPurchaseAmount.toLocaleString('id-ID')} untuk menggunakan voucher ini` },
        { status: 400 }
      );
    }

    // Hitung diskon berdasarkan tipe voucher
    let discountAmount = 0;
    
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = (amount * voucher.discountValue) / 100;
      // Terapkan batas maksimum diskon jika ada
      if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
    } else {
      // FIXED discount
      discountAmount = voucher.discountValue;
      // Pastikan diskon tidak melebihi jumlah pembelian
      if (discountAmount > amount) {
        discountAmount = amount;
      }
    }

    // Format angka decimal
    discountAmount = Math.round(discountAmount);

    return NextResponse.json({
      success: true,
      message: 'Voucher valid',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount
      }
    });
    
  } catch (error) {
    console.error('Validate voucher error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat memvalidasi voucher',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 