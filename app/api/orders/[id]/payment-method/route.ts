import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderId = params.id;
    const body = await request.json();
    const { paymentMethod } = body;
    
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Payment method is required' },
        { status: 400 }
      );
    }
    
    // Verify if the order exists and belongs to the user or user is admin
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to update this order' },
        { status: 403 }
      );
    }
    
    // Update the order payment method
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod },
    });
    
    // Update transaction's payment method as well
    await prisma.transaction.updateMany({
      where: { orderId },
      data: { paymentMethod }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment method updated successfully',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  }
} 