import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import mysql from 'mysql2/promise';
import getDatabaseConnection from '@/lib/db-connect';

// Helper to get DB connection
async function getConnection() {
  return await getDatabaseConnection();
}

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
    
    // Format pesan untuk chat (termasuk subject)
    const chatContent = `[Form Kontak] ${subject}\n\n${message}`;
    const userId = session.user.id;
    const timestamp = new Date();
    
    // Simpan ke chat message database
    try {
      // Try using Prisma first
      // @ts-ignore - We're checking if it exists at runtime
      if (prisma.chatMessage) {
        // @ts-ignore - We've already checked if it exists
        await prisma.chatMessage.create({
          data: {
            userId: userId,
            content: chatContent,
            isRead: false,
            isFromAdmin: false,
            createdAt: timestamp
          }
        });
      } else {
        // Fallback to MySQL connection
        const connection = await getConnection();
        await connection.execute(
          'INSERT INTO chat_messages (id, userId, content, isRead, isFromAdmin, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?)',
          [userId, chatContent, 0, 0, timestamp]
        );
        await connection.end();
      }
    } catch (chatError) {
      console.error('[CONTACT_CHAT_ERROR]', chatError);
      // Continue even if chat creation fails - we don't want to block the contact form
    }
    
    // For demo, wait 1 second to simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(
      { 
        message: 'Pesan berhasil dikirim. Kami akan menghubungi Anda melalui sistem chat.',
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