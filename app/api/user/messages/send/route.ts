import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { content } = body;
    
    // Validate content
    if (!content || content.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'Message content is required'
      }, { status: 400 });
    }
    
    // Create new message
    const userId = session.user.id;
    const message = await prisma.chatMessage.create({
      data: {
        content,
        userId,
        isFromAdmin: false,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send message'
    }, { status: 500 });
  }
} 