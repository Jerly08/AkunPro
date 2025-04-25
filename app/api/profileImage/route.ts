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
        image: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Return image URL dengan timestamp untuk mencegah cache
    const imageUrl = user.image || '/images/avatar-placeholder.svg';
    const timestamp = new Date().getTime();
    
    // Jangan tambahkan timestamp pada data URL
    const finalImageUrl = imageUrl.startsWith('data:') ? 
      imageUrl : 
      `${imageUrl}?t=${timestamp}`;
    
    return NextResponse.json(
      { 
        imageUrl: finalImageUrl
      }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('[PROFILE_IMAGE_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil data gambar profil' },
      { status: 500 }
    );
  }
} 