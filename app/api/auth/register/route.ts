import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // Terapkan rate limiting (max 5 request per 1 menit)
    const rateLimit = await rateLimiter(request as any, 5, 60 * 1000);
    
    // Jika rate limit terlampaui, return error
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }
    
    const body = await request.json();
    const { name, email, password } = body;

    // Hanya log upaya registrasi tanpa detail pengguna
    console.log('Registration attempt received');

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nama, email, dan password diperlukan' },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validasi panjang password
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password harus minimal 6 karakter' },
        { status: 400 }
      );
    }
    
    // Validasi kekuatan password (minimal 8 karakter, kombinasi huruf besar/kecil/angka/simbol)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return NextResponse.json(
        { message: 'Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol' },
        { status: 400 }
      );
    }

    try {
      // Periksa apakah email sudah terdaftar
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        // Jangan bocorkan informasi spesifik untuk mencegah user enumeration
        return NextResponse.json(
          { message: 'Registrasi tidak berhasil' },
          { status: 400 }
        );
      }
    } catch (dbError) {
      // Log error tanpa detail sensitif
      console.error('Database error during registration');
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memproses registrasi' },
        { status: 500 }
      );
    }

    // Hash password dengan cost factor yang lebih tinggi untuk keamanan
    let hashedPassword;
    try {
      // Meningkatkan cost factor menjadi 12 (dari 10)
      hashedPassword = await hash(password, 12);
    } catch (hashError) {
      console.error('Password hashing error');
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memproses registrasi' },
        { status: 500 }
      );
    }

    // Buat pengguna baru
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
        },
      });

      // Log berhasil tanpa menampilkan ID atau data lain
      console.log('User registration successful');

      // Hapus password dari respons
      const { password: _, ...userWithoutPassword } = user;

      return NextResponse.json(
        {
          message: 'Pendaftaran berhasil',
          user: userWithoutPassword,
        },
        { status: 201 }
      );
    } catch (createError: any) {
      console.error('User creation error');
      // Jangan tampilkan detail error spesifik ke client
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memproses registrasi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error');
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mendaftar' },
      { status: 500 }
    );
  }
} 