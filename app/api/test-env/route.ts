import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD ? '******' : undefined,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV
  });
} 