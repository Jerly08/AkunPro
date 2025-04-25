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
    const { subject, message } = body;
    
    // Validasi data
    if (!subject || !message) {
      return NextResponse.json(
        { message: 'Subjek dan pesan harus diisi' },
        { status: 400 }
      );
    }
    
    // Simpan pesan kontak ke database
    // Catatan: Dalam aplikasi sebenarnya, kita akan memiliki model Contact
    // Untuk demo ini, kita akan simulasikan dengan mengembalikan success
    
    /* 
    // Contoh implementasi dengan model Contact
    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        status: 'PENDING',
      },
    });
    */
    
    // Untuk demo, tunggu 1 detik untuk simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(
      { 
        message: 'Pesan berhasil dikirim. Kami akan menghubungi Anda segera.',
        // contact: contact, // Pada implementasi sebenarnya
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CONTACT_CREATE_ERROR]', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengirim pesan' },
      { status: 500 }
    );
  }
} 