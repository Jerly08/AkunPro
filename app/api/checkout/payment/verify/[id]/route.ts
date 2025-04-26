import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';

// Definisikan tipe OrderStatus untuk mencegah error tipe
type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

// Handler untuk GET request
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });
    }
    
    console.log(`GET verification request for order ID: ${id}`);
    
    return await handleVerification(request, id);
  } catch (error) {
    console.error(`Error in GET verification:`, error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan saat verifikasi', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Handler untuk POST request
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });
    }
    
    console.log(`POST verification request for order ID: ${id}`);
    
    return await handleVerification(request, id);
  } catch (error) {
    console.error(`Error in POST verification:`, error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan saat verifikasi', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Helper function untuk menangani verifikasi pembayaran
async function handleVerification(
  request: NextRequest,
  orderId: string
) {
  try {
    console.log(`Payment verification request for order ID: ${orderId}`);
    
    // Periksa sesi
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk memverifikasi pembayaran' },
        { status: 401 }
      );
    }

    // Verifikasi bahwa order ada dan milik user
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        transaction: true,
      },
    });

    if (!order) {
      console.log(`Order dengan ID ${orderId} tidak ditemukan dalam database`);
      return NextResponse.json(
        { success: false, message: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Log informasi pesanan untuk debugging
    console.log(`Order ditemukan: ID=${order.id}, Status=${order.status}, UserId=${order.userId}`);
    console.log(`Detail transaksi: ${order.transaction 
      ? `ID=${order.transaction.id}, Status=${order.transaction.status}, PaymentMethod=${order.transaction.paymentMethod}, PaymentId=${order.transaction.paymentId}` 
      : 'Tidak ada transaksi terkait'}`);

    // Periksa apakah pesanan milik pengguna yang login atau admin
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      console.log(`Access denied: Order UserId=${order.userId}, Session UserId=${session.user.id}, Role=${session.user.role}`);
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki akses ke pesanan ini' },
        { status: 403 }
      );
    }

    // Jika order sudah paid atau completed, langsung redirect ke halaman konfirmasi
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      console.log(`Order ${orderId} sudah memiliki status ${order.status}, redirect ke konfirmasi`);
      // Cek jika request ini datang dari client yang menginginkan redirect
      const searchParams = new URL(request.url).searchParams;
      const wantsRedirect = searchParams.get('redirect') === 'true';
      
      if (wantsRedirect) {
        const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/confirmation/${orderId}`;
        console.log(`Redirecting ke halaman konfirmasi: ${confirmationUrl}`);
        return NextResponse.redirect(confirmationUrl);
      }
      
      // Jika tidak, kirim response JSON normal
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          transaction: order.transaction ? {
            status: order.transaction.status,
          } : null,
        },
        redirect: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/confirmation/${orderId}`,
        message: 'Pembayaran sudah selesai'
      });
    }

    // Periksa apakah ini request POST yang berisi data bukti pembayaran atau update metode pembayaran
    if (request.method === 'POST') {
      try {
        // Cek apakah request memiliki content-length > 0
        const contentType = request.headers.get('content-type');
        const contentLength = request.headers.get('content-length');
        
        // Hanya parse JSON jika ada content dan content-type adalah application/json
        if (contentType?.includes('application/json') && contentLength && parseInt(contentLength) > 0) {
          const body = await request.json();
          
          if (body.paymentMethod || body.paymentProof) {
            console.log(`Menerima update pembayaran untuk order ${orderId}`);
            
            // Pastikan transaksi ada
            if (!order.transaction) {
              return NextResponse.json(
                { success: false, message: 'Transaksi tidak ditemukan untuk pesanan ini' },
                { status: 404 }
              );
            }
            
            // Update data transaksi dengan bukti pembayaran atau metode pembayaran
            const updateData: any = {};
            
            if (body.paymentMethod) {
              updateData.paymentMethod = body.paymentMethod;
              console.log(`Metode pembayaran diupdate ke: ${body.paymentMethod}`);
            }
            
            if (body.paymentProof) {
              updateData.paymentUrl = body.paymentProof;
              console.log(`Bukti pembayaran ditambahkan: ${body.paymentProof}`);
            }
            
            if (body.virtualAccount) {
              updateData.notes = JSON.stringify({
                virtualAccount: body.virtualAccount,
                bankName: body.bankName || 'N/A',
                accountNumber: body.accountNumber || 'N/A',
                additionalInfo: body.additionalInfo || ''
              });
              console.log(`Data virtual account ditambahkan untuk: ${body.bankName || 'Bank'}`);
            }
            
            // Lakukan update
            if (Object.keys(updateData).length > 0) {
              await prisma.transaction.update({
                where: { id: order.transaction.id },
                data: updateData
              });
              
              return NextResponse.json({
                success: true,
                message: 'Informasi pembayaran berhasil diperbarui',
                order: {
                  id: order.id,
                  status: order.status
                }
              });
            }
          }
        }
        // Jika tidak ada body JSON atau parsing gagal, lanjutkan dengan proses verifikasi normal
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        // Lanjutkan dengan verifikasi normal jika parsing gagal
      }
    }

    // Untuk manual payment, kita hanya perlu memeriksa status transaksi di database
    // Jika ada paymentUrl yang tersimpan, artinya user sudah upload bukti pembayaran
    const hasProofOfPayment = order.transaction?.paymentUrl ? true : false;
    
    // Status default
    let paymentStatus = {
      transactionStatus: 'pending',
      statusCode: '201',
      statusMessage: hasProofOfPayment 
        ? 'Bukti pembayaran telah diterima dan sedang diverifikasi admin' 
        : 'Silakan upload bukti pembayaran'
    };
      
    return NextResponse.json({
      success: true,
      message: paymentStatus.statusMessage,
      order: {
        id: order.id,
        status: order.status,
        updatedStatus: false,
        transaction: order.transaction ? {
          id: order.transaction.id,
          status: order.transaction.status,
          hasProofOfPayment,
        } : null
      },
      paymentStatus: {
        status: paymentStatus.transactionStatus,
        message: paymentStatus.statusMessage
      }
    });
  } catch (error) {
    console.error('Error saat verifikasi pembayaran:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal memverifikasi pembayaran', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}