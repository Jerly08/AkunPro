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

// GET: Mendapatkan detail voucher berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cek apakah pengguna adalah admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Ambil data voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        voucherUsages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            order: true
          }
        }
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher
    });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update detail voucher
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cek apakah pengguna adalah admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await request.json();

    // Validasi data
    if (!body.code || !body.description || !body.discountType || !body.discountValue === undefined) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Cek apakah voucher ada
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah kode sudah digunakan oleh voucher lain
    if (body.code !== existingVoucher.code) {
      const codeExists = await prisma.voucher.findFirst({
        where: {
          code: body.code,
          id: { not: id }
        }
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, message: 'Kode voucher sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Update voucher
    const updatedVoucher = await prisma.voucher.update({
      where: { id },
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
        isForNewUsers: body.isForNewUsers
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil diperbarui',
      voucher: updatedVoucher
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus voucher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cek apakah pengguna adalah admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Cek apakah voucher ada
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id },
      include: { orders: true, voucherUsages: true }
    });

    if (!existingVoucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah voucher telah digunakan
    if (existingVoucher.usageCount > 0) {
      // Nonaktifkan voucher sebagai gantinya
      const disabledVoucher = await prisma.voucher.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Voucher telah digunakan dan telah dinonaktifkan',
        voucher: disabledVoucher
      });
    }

    // Hapus voucher jika belum digunakan
    await prisma.voucher.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 