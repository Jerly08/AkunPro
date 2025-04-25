import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Periksa sesi
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki izin untuk mengakses endpoint ini' },
        { status: 401 }
      );
    }

    // Dapatkan body request
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'ID akun diperlukan' },
        { status: 400 }
      );
    }

    // Ambil akun Netflix dari database
    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
        type: 'NETFLIX'
      },
      select: {
        id: true,
        profiles: {
          where: {
            userId: null,
            orderId: null
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Akun Netflix tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hitung jumlah profil yang tersedia
    const availableProfilesCount = account.profiles.length;

    // Update stok akun
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        stock: availableProfilesCount
      }
    });

    console.log(`Stock for Netflix account ${accountId} updated to ${availableProfilesCount}`);

    return NextResponse.json({
      success: true,
      message: `Stok akun Netflix berhasil diperbarui ke ${availableProfilesCount}`,
      account: {
        id: updatedAccount.id,
        stock: updatedAccount.stock,
        availableProfiles: availableProfilesCount
      }
    });

  } catch (error) {
    console.error('Error updating Netflix stock:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui stok Netflix', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Endpoint untuk memperbarui semua stok akun Netflix sekaligus
export async function GET(request: NextRequest) {
  try {
    // Periksa sesi
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki izin untuk mengakses endpoint ini' },
        { status: 401 }
      );
    }

    // Ambil semua akun Netflix dari database
    const netflixAccounts = await prisma.account.findMany({
      where: {
        type: 'NETFLIX',
        isActive: true
      },
      select: {
        id: true,
        profiles: {
          where: {
            userId: null,
            orderId: null
          },
          select: {
            id: true
          }
        }
      }
    });

    const updateResults = [];

    // Update stok masing-masing akun
    for (const account of netflixAccounts) {
      const availableProfilesCount = account.profiles.length;
      
      const updatedAccount = await prisma.account.update({
        where: {
          id: account.id
        },
        data: {
          stock: availableProfilesCount
        }
      });

      updateResults.push({
        id: updatedAccount.id,
        availableProfiles: availableProfilesCount,
        stock: updatedAccount.stock
      });

      console.log(`Stock for Netflix account ${account.id} updated to ${availableProfilesCount}`);
    }

    return NextResponse.json({
      success: true,
      message: `${updateResults.length} akun Netflix berhasil diperbarui stoknya`,
      accounts: updateResults
    });

  } catch (error) {
    console.error('Error updating all Netflix stock:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui stok Netflix', error: (error as Error).message },
      { status: 500 }
    );
  }
} 