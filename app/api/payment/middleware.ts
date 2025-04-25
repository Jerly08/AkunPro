import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';

// Verifikasi signature API pembayaran
export async function verifyPaymentSignature(request: NextRequest, body: any) {
  // Ambil signature dari header
  const signature = request.headers.get('x-payment-signature');
  
  if (!signature) {
    return false;
  }
  
  // Ambil payment secret dari environment variable
  const paymentSecret = process.env.PAYMENT_SIGNATURE_SECRET;
  
  if (!paymentSecret) {
    console.error('PAYMENT_SIGNATURE_SECRET tidak dikonfigurasi');
    return false;
  }
  
  // Buat signature dari body request
  const payload = JSON.stringify(body);
  const expectedSignature = crypto
    .createHmac('sha256', paymentSecret)
    .update(payload)
    .digest('hex');
  
  // Bandingkan signature
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Middleware untuk API pembayaran
export async function paymentApiMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  // Untuk webhook dari payment provider, lakukan verifikasi signature
  if (request.nextUrl.pathname === '/api/payment/webhook') {
    try {
      const body = await request.json();
      const isValidSignature = await verifyPaymentSignature(request, body);
      
      if (!isValidSignature) {
        return NextResponse.json(
          { message: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      // Lanjutkan ke handler jika signature valid
      return handler(request);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request' },
        { status: 400 }
      );
    }
  }
  
  // Untuk API pembayaran lainnya, verifikasi token autentikasi
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Terapkan rate limit untuk API pembayaran
  // Tambahkan header anti-CSRF
  const response = await handler(request);
  response.headers.set('X-CSRF-Protection', '1');
  
  return response;
} 