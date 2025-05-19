import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateTransactionEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate template email
    const emailTemplate = generateTransactionEmailTemplate(
      data.customerName,
      data.orderId,
      data.totalAmount,
      data.status,
      data.items
    );

    // Kirim email test
    const result = await sendEmail({
      to: 'akunproofficial@gmail.com',
      subject: 'Test Email - Bukti Pembayaran',
      html: emailTemplate
    });

    return NextResponse.json({
      success: true,
      message: 'Email test berhasil dikirim',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengirim email test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 