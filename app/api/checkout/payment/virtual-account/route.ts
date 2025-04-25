import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * API untuk membuat virtual account untuk pembayaran
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk membuat pembayaran' },
        { status: 401 }
      );
    }
    
    // Parse request body dengan efisien
    const body = await request.json();
    const { orderId, bankName, updateExisting = false } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }
    
    if (!bankName) {
      return NextResponse.json(
        { success: false, message: 'Nama bank diperlukan' },
        { status: 400 }
      );
    }
    
    // Cari order dengan query minimal
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        transaction: true
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Verifikasi bahwa order milik user yang login
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki akses ke pesanan ini' },
        { status: 403 }
      );
    }
    
    // Jika sudah PAID atau COMPLETED, kembalikan status saat ini
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: `Order sudah berstatus ${order.status}`,
        order: {
          id: order.id,
          status: order.status,
          paidAt: order.paidAt
        }
      });
    }
    
    // Periksa apakah sudah ada virtual account untuk bank yang sama
    let existingVaInfo: any = null;
    
    if (order.transaction?.notes) {
      try {
        const parsedNotes = JSON.parse(order.transaction.notes);
        if (parsedNotes.virtualAccount && parsedNotes.bankName === bankName && !updateExisting) {
          // Jika virtual account untuk bank yang sama sudah ada dan tidak diminta untuk update
          return NextResponse.json({
            success: true,
            message: 'Virtual account untuk bank ini sudah ada',
            virtualAccount: parsedNotes,
            order: {
              id: order.id,
              status: order.status
            }
          });
        }
        existingVaInfo = parsedNotes;
      } catch (e) {
        console.error('Error parsing transaction notes:', e);
      }
    }
    
    // Generate VA number yang efisien
    const virtualAccountNumber = generateVirtualAccountNumber(bankName);
    
    // Set tanggal kadaluarsa 24 jam dari sekarang
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    
    // Buat data yang lebih simpel
    const virtualAccountInfo = {
      virtualAccount: virtualAccountNumber,
      bankName,
      accountNumber: virtualAccountNumber,
      amount: order.totalAmount,
      expiryDate: expiryDate.toISOString()
    };
    
    const jsonNotes = JSON.stringify(virtualAccountInfo);
    
    // Update atau create transaction
    if (order.transaction) {
      await prisma.transaction.update({
        where: { id: order.transaction.id },
        data: { 
          paymentMethod: `Virtual Account ${bankName}`,
          notes: jsonNotes
        }
      });
    } else {
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMethod: `Virtual Account ${bankName}`,
          status: 'PENDING',
          notes: jsonNotes
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: updateExisting ? 'Virtual account berhasil diperbarui' : 'Virtual account berhasil dibuat',
      virtualAccount: virtualAccountInfo,
      order: {
        id: order.id,
        status: order.status
      }
    });
    
  } catch (error) {
    console.error('Error creating virtual account:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat virtual account', error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Generate virtual account number untuk bank tertentu
 */
function generateVirtualAccountNumber(bankName: string): string {
  // Prefix kode bank yang lebih efisien dengan memory
  const bankPrefixes: Record<string, string> = {
    'BCA': '1010',
    'BNI': '2020',
    'Mandiri': '3030',
    'BRI': '4040',
    'CIMB': '5050',
    'Permata': '6060',
  };
  
  const prefix = bankPrefixes[bankName] || '9090'; // Default prefix
  
  // Generate random number dengan metode yang lebih efisien
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-6);
  
  return prefix + timestamp + randomDigits;
} 