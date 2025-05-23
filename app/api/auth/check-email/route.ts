import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 });
    }

    // Check if a user with this email exists
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true }, // Only select the ID to minimize data exposure
    });

    // Return whether the user exists, without exposing any user data
    return NextResponse.json({ 
      exists: !!user 
    });

  } catch (error) {
    console.error('Error checking email existence:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 