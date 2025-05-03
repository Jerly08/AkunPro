import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from '@prisma/client';
import { DOKU_CONFIG, generateDokuHeaders, generateSignature, generateDigest } from '@/lib/doku';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderId, customerName, customerEmail, items } = body;

    if (!amount || !orderId || !customerName || !customerEmail || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate DOKU payment request
    const requestId = uuidv4();
    const requestTimestamp = new Date().toISOString();
    const requestTarget = '/checkout/v1/payment';
    
    const paymentRequest = {
      order: {
        amount,
        invoice_number: orderId,
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
      payment: {
        payment_due_date: 60, // minutes
      },
      additional_info: {
        cart_items: items
      }
    };

    // Generate digest and signature
    const digest = generateDigest(paymentRequest);
    const signature = generateSignature(
      DOKU_CONFIG.CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget,
      DOKU_CONFIG.SECRET_KEY,
      digest
    );

    // Set request headers
    const headers = generateDokuHeaders(
      requestId,
      DOKU_CONFIG.CLIENT_ID,
      requestTimestamp,
      signature
    );

    // Make request to DOKU
    const response = await fetch(`${DOKU_CONFIG.BASE_URL}${requestTarget}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentRequest)
    });

    const responseData = await response.json();
    const paymentUrl = responseData.response?.payment?.url || '';
    const paymentId = responseData.response?.payment?.id || requestId;

    // Store payment data in database using Transaction model
    await prisma.transaction.create({
      data: {
        orderId,
        amount,
        status: PaymentStatus.PENDING,
        paymentMethod: 'DOKU',
        paymentId,
        paymentUrl,
        notes: JSON.stringify(responseData)
      }
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('DOKU payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// Handle DOKU webhook notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature to ensure it's from DOKU
    // Logic for verification would go here...
    
    const { order, transaction } = body;
    
    if (!order?.invoice_number || !transaction?.status) {
      return NextResponse.json(
        { error: 'Invalid notification data' },
        { status: 400 }
      );
    }

    // Map DOKU status to our PaymentStatus enum
    let paymentStatus: PaymentStatus;
    switch (transaction.status.toLowerCase()) {
      case 'success':
        paymentStatus = PaymentStatus.PAID;
        break;
      case 'failed':
        paymentStatus = PaymentStatus.FAILED;
        break;
      case 'refund':
        paymentStatus = PaymentStatus.REFUNDED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    // Update transaction status in database
    await prisma.transaction.update({
      where: {
        orderId: order.invoice_number
      },
      data: {
        status: paymentStatus,
        updatedAt: new Date(),
        notes: JSON.stringify(body)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DOKU webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 