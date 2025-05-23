import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, subtotal } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Kode voucher tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Cari voucher berdasarkan kode
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    // Validasi voucher
    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah voucher masih aktif
    if (!voucher.isActive) {
      return NextResponse.json(
        { success: false, message: 'Voucher sudah tidak aktif' },
        { status: 400 }
      );
    }

    // Cek tanggal validitas voucher
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return NextResponse.json(
        { success: false, message: 'Voucher sudah tidak berlaku' },
        { status: 400 }
      );
    }

    // Cek batas penggunaan
    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      return NextResponse.json(
        { success: false, message: 'Batas penggunaan voucher sudah tercapai' },
        { status: 400 }
      );
    }

    // Cek jika voucher untuk pengguna baru
    if (voucher.isForNewUsers) {
      // Cek apakah user sudah pernah melakukan order sebelumnya
      const userOrders = await prisma.order.count({
        where: { userId: session.user.id }
      });

      if (userOrders > 0) {
        return NextResponse.json(
          { success: false, message: 'Voucher hanya berlaku untuk pengguna baru' },
          { status: 400 }
        );
      }
    }

    // Cek minimum pembelian
    if (voucher.minPurchaseAmount && subtotal < voucher.minPurchaseAmount) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Minimum pembelian Rp ${voucher.minPurchaseAmount.toLocaleString('id-ID')}` 
        },
        { status: 400 }
      );
    }

    // Hitung diskon
    let discount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discount = subtotal * (voucher.discountValue / 100);
      
      // Jika ada maksimum diskon
      if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    } else {
      // Diskon tetap
      discount = voucher.discountValue;
      
      // Diskon tidak boleh lebih besar dari subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil diterapkan',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discount: Math.round(discount), // Bulatkan ke bawah
        description: voucher.description
      }
    });
  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat validasi voucher' },
      { status: 500 }
    );
  }
} 