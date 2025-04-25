import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
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
    const { image } = body;
    
    // Validasi input
    if (!image) {
      return NextResponse.json(
        { message: 'Data gambar tidak ditemukan' },
        { status: 400 }
      );
    }
    
    // Periksa format data gambar
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { message: 'Format gambar tidak valid' },
        { status: 400 }
      );
    }
    
    // Periksa ukuran base64 (estimasi)
    if (image.length > 1500000) { // ~1.5MB
      return NextResponse.json(
        { message: 'Ukuran gambar terlalu besar (maksimal 1MB)' },
        { status: 400 }
      );
    }
    
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
    
    // Update gambar profil pengguna
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { image },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      });
      
      return NextResponse.json(
        { 
          message: 'Foto profil berhasil diperbarui',
          user: updatedUser
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('[USER_PHOTO_UPDATE_DB_ERROR]', dbError);
      return NextResponse.json(
        { message: 'Gagal menyimpan foto profil ke database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[USER_PHOTO_UPDATE_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui foto profil' },
      { status: 500 }
    );
  }
} 