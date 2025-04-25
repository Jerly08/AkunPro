import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Mengambil semua spotify slots untuk akun tertentu
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accountId = params.id;
    if (!accountId) {
      return NextResponse.json(
        { message: 'Missing account ID' },
        { status: 400 }
      );
    }

    // Periksa apakah akun ada dan bertipe SPOTIFY
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { type: true, isFamilyPlan: true }
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.type !== 'SPOTIFY' || !account.isFamilyPlan) {
      return NextResponse.json(
        { message: 'Account is not a Spotify Family Plan' },
        { status: 400 }
      );
    }

    // Ambil semua slot untuk akun ini
    const slots = await prisma.spotifySlot.findMany({
      where: { accountId },
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

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error getting Spotify slots:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Menambah slot baru
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accountId = params.id;
    if (!accountId) {
      return NextResponse.json(
        { message: 'Missing account ID' },
        { status: 400 }
      );
    }

    // Periksa apakah akun ada dan bertipe SPOTIFY dengan family plan
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { type: true, isFamilyPlan: true, maxSlots: true }
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.type !== 'SPOTIFY' || !account.isFamilyPlan) {
      return NextResponse.json(
        { message: 'Account is not a Spotify Family Plan' },
        { status: 400 }
      );
    }

    // Hitung jumlah slot yang sudah ada
    const existingSlotsCount = await prisma.spotifySlot.count({
      where: { accountId }
    });

    if (existingSlotsCount >= account.maxSlots) {
      return NextResponse.json(
        { message: `Maximum number of slots (${account.maxSlots}) reached` },
        { status: 400 }
      );
    }

    // Parse form data atau JSON
    let slotData;
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      slotData = await request.json();
    } else {
      const formData = await request.formData();
      slotData = {
        slotName: formData.get('slotName'),
        email: formData.get('email') || null,
        password: formData.get('password') || null,
        isMainAccount: formData.get('isMainAccount') === 'true',
        isActive: formData.get('isActive') !== 'false' // Default true
      };
    }

    // Validasi data slot
    if (!slotData.slotName) {
      return NextResponse.json(
        { message: 'Slot name is required' },
        { status: 400 }
      );
    }

    // Jika ini slot utama, pastikan tidak ada slot utama lain
    if (slotData.isMainAccount) {
      const existingMainSlot = await prisma.spotifySlot.findFirst({
        where: {
          accountId,
          isMainAccount: true
        }
      });

      if (existingMainSlot) {
        return NextResponse.json(
          { message: 'There is already a main account slot' },
          { status: 400 }
        );
      }
    }

    // Buat slot baru
    const newSlot = await prisma.spotifySlot.create({
      data: {
        accountId,
        slotName: slotData.slotName,
        email: slotData.email,
        password: slotData.password,
        isMainAccount: slotData.isMainAccount,
        isActive: slotData.isActive !== false,
        isAllocated: false
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