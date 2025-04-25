import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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
    
    // Dapatkan data user dari database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[PROFILE_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil data profil' },
      { status: 500 }
    );
  }
}

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
    const { name, currentPassword, newPassword, image } = body;
    
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
    
    // Persiapkan data untuk update
    const updateData: { name?: string; password?: string; image?: string } = {};
    
    // Update nama jika disediakan
    if (name) {
      updateData.name = name;
    }

    // Update image jika disediakan
    if (image) {
      updateData.image = image;
    }
    
    // Jika tidak ada yang diupdate
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data yang diperbarui' },
        { status: 400 }
      );
    }
    
    // Update pengguna
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    
    return NextResponse.json(
      { 
        message: 'Profil berhasil diperbarui',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui profil' },
      { status: 500 }
    );
  }
} 