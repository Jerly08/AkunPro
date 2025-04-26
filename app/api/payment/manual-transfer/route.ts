import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint untuk menangani unggahan bukti pembayaran manual
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk melakukan konfirmasi pembayaran' },
        { status: 401 }
      );
    }
    
    // Parse FormData
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const notes = formData.get('notes') as string;
    const proofFile = formData.get('proofFile') as File;
    
    // Validasi input
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }
    
    if (!proofFile) {
      return NextResponse.json(
        { success: false, message: 'Bukti pembayaran diperlukan' },
        { status: 400 }
      );
    }
    
    // Validasi order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Verifikasi kepemilikan order
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki akses ke order ini' },
        { status: 403 }
      );
    }
    
    // Cek status order
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: 'Order sudah dibayar atau dibatalkan' },
        { status: 400 }
      );
    }
    
    // Simpan file
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `payment-proof-${uuidv4()}.${fileExt}`;
    
    // Create directory if it doesn't exist
    const publicUploadsDir = join(process.cwd(), 'public', 'uploads', 'payments');
    
    try {
      await mkdir(publicUploadsDir, { recursive: true });
      const filePath = join(publicUploadsDir, fileName);
      const relativePath = `/uploads/payments/${fileName}`;
      
      await writeFile(filePath, buffer);
      console.log(`File saved to ${filePath}`);
      
      // Buat atau update transaksi
      let transaction = await prisma.transaction.findFirst({
        where: { orderId: orderId }
      });
      
      if (transaction) {
        // Update transaksi yang sudah ada
        transaction = await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paymentMethod: 'BANK_TRANSFER',
            status: 'PENDING',
            updatedAt: new Date(),
            // Simpan URL bukti pembayaran di kolom paymentUrl
            paymentUrl: relativePath
          }
        });
      } else {
        // Buat transaksi baru
        transaction = await prisma.transaction.create({
          data: {
            orderId: orderId,
            paymentMethod: 'BANK_TRANSFER',
            status: 'PENDING',
            paymentUrl: relativePath,
            amount: order.totalAmount
          }
        });
      }
      
      // Update order status - tetap di PENDING, tapi update paymentMethod dan lainnya
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'BANK_TRANSFER',
          updatedAt: new Date()
        }
      });
      
      // Kirim notifikasi ke admin (implementasi sesuai kebutuhan)
      // TODO: Implement admin notification
      
      return NextResponse.json({
        success: true,
        message: 'Bukti pembayaran berhasil diunggah dan sedang diverifikasi oleh admin',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          paymentUrl: transaction.paymentUrl
        }
      });
      
    } catch (fileError) {
      console.error('Failed to save file:', fileError);
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan file' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing manual payment proof:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 