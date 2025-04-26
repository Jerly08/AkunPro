import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma, { validateId } from '@/lib/prisma';

// GET handler untuk menampilkan informasi status akun
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID format
    if (!validateId(id)) {
      return NextResponse.json(
        { message: 'ID akun tidak valid' },
        { status: 400 }
      );
    }
    
    // Fetch account
    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        price: true,
        description: true,
        warranty: true,
        isActive: true,
        stock: true,
        duration: true,
        isFamilyPlan: true,
        maxSlots: true,
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { message: 'Akun tidak ditemukan', isAvailable: false },
        { status: 404 }
      );
    }
    
    // Check account availability (minimal info for public access)
    const isAvailable = account.isActive && (account.stock > 0);
    
    // Hanya menampilkan data minimal untuk user yang tidak login
    return NextResponse.json({
      id: account.id,
      type: account.type,
      price: account.price,
      description: account.description,
      warranty: account.warranty,
      isAvailable: isAvailable,
      stock: account.stock,
      duration: account.duration,
      message: !isAvailable ? 'Akun tidak tersedia atau stok habis' : undefined
    });
    
  } catch (error) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil status akun', isAvailable: false },
      { status: 500 }
    );
  }
} 