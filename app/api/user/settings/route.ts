import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    // Dapatkan sesi pengguna
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Anda harus login untuk mengakses halaman ini' },
        { status: 401 }
      );
    }
    
    // Dapatkan data dari body
    const body = await req.json();
    const { settings } = body;
    
    // Dapatkan data user dari database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Update pengaturan pengguna
    // Perhatikan bahwa 'settings' sudah ada di model User (lihat schema.prisma)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: JSON.stringify(settings),
      },
      select: {
        id: true,
        settings: true
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Pengaturan berhasil disimpan',
        settings: JSON.parse(updatedUser.settings || '{}')
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SETTINGS_UPDATE_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menyimpan pengaturan' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Dapatkan sesi pengguna
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Anda harus login untuk mengakses halaman ini' },
        { status: 401 }
      );
    }
    
    // Dapatkan data user dari database dengan select settings
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        settings: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Default settings jika belum ada
    const defaultSettings = {
      notifications: {
        email: true,
        promotions: false,
        orderUpdates: true,
        newsletter: false
      },
      privacy: {
        profileVisibility: 'public',
        shareActivity: false,
        allowDataCollection: true
      },
      preferences: {
        language: 'id',
        darkMode: false,
        autoPlayVideos: true
      }
    };
    
    // Parse settings dari string JSON
    const userSettings = user.settings ? JSON.parse(user.settings) : defaultSettings;
    
    return NextResponse.json({ settings: userSettings }, { status: 200 });
  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil pengaturan' },
      { status: 500 }
    );
  }
} 