import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { accounts_type } from '@prisma/client';

// Definisi tipe session user yang diperluas
interface ExtendedUser {
  id: string;
  role: "USER" | "ADMIN";
  isAdmin?: boolean;
}

// GET - Mengambil detail dan slot untuk akun Spotify
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ambil ID dari params dengan cara yang benar
    const id = context.params.id;

    if (!id) {
      return NextResponse.json(
        { message: 'Missing account ID' },
        { status: 400 }
      );
    }

    // Periksa apakah akun ada dan bertipe SPOTIFY
    const account = await prisma.account.findUnique({
      where: { id }
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.type !== accounts_type.SPOTIFY) {
      return NextResponse.json(
        { message: 'Account is not a Spotify account' },
        { status: 400 }
      );
    }

    // Ambil semua slot untuk akun ini
    const slots = await prisma.spotifySlot.findMany({
      where: { accountId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItem: {
          select: {
            id: true,
            order: {
              select: {
                id: true,
                status: true,
                customerName: true,
                customerEmail: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const allocatedSlotsCount = slots.filter((slot) => slot.isAllocated).length;
    const availableSlotsCount = slots.filter((slot) => !slot.isAllocated).length;

    const result = {
      account,
      slots,
      totalSlots: slots.length,
      allocatedSlots: allocatedSlotsCount,
      availableSlots: availableSlotsCount,
      maxSlots: account.maxSlots
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting Spotify account details:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH - Mengupdate slot Spotify
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const slotId = context.params.id;
    const body = await request.json();
    
    // Update slot
    const updatedSlot = await prisma.spotifySlot.update({
      where: { id: slotId },
      data: {
        slotName: body.slotName,
        email: body.email,
        password: body.password,
        isActive: body.isActive,
        isMainAccount: body.isMainAccount || false
      }
    });
    
    return NextResponse.json(updatedSlot);
  } catch (error) {
    console.error('Error updating Spotify slot:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Membuat slot Spotify baru
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accountId = context.params.id;
    const body = await request.json();
    
    // Buat slot baru
    const newSlot = await prisma.spotifySlot.create({
      data: {
        accountId,
        slotName: body.slotName || `Slot ${Date.now()}`,
        email: body.email,
        password: body.password,
        isActive: body.isActive !== undefined ? body.isActive : true,
        isMainAccount: body.isMainAccount || false
      }
    });
    
    return NextResponse.json(newSlot);
  } catch (error) {
    console.error('Error creating Spotify slot:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Menghapus slot Spotify
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifikasi admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const slotId = context.params.id;
    
    // Periksa jika slot sedang digunakan
    const slot = await prisma.spotifySlot.findUnique({
      where: { id: slotId },
      include: { orderItem: true }
    });
    
    if (!slot) {
      return NextResponse.json(
        { message: 'Slot not found' },
        { status: 404 }
      );
    }
    
    if (slot.isAllocated || slot.orderItem) {
      return NextResponse.json(
        { message: 'Cannot delete slot that is already allocated to a user' },
        { status: 400 }
      );
    }
    
    // Dapatkan akun terkait untuk verifikasi tipe
    const account = await prisma.account.findUnique({
      where: { id: slot.accountId }
    });
    
    if (!account || account.type !== accounts_type.SPOTIFY || !account.isFamilyPlan) {
      return NextResponse.json(
        { message: 'Invalid account type or not a family plan' },
        { status: 400 }
      );
    }
    
    // Hapus slot
    await prisma.spotifySlot.delete({
      where: { id: slotId }
    });
    
    return NextResponse.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting Spotify slot:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 