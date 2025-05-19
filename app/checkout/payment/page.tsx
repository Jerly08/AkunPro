import { FC } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import PaymentSection from './PaymentSection';

async function getCheckoutData(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            account: true
          }
        }
      }
    });

    return order;
  } catch (error) {
    console.error('Error fetching checkout data:', error);
    return null;
  }
}

interface PageProps {
  searchParams: {
    orderId?: string;
  };
}

const PaymentPage: FC<PageProps> = async ({ searchParams }) => {
  const { orderId } = searchParams;
  const session = await getServerSession();
  
  if (!orderId) {
    redirect('/checkout');
  }

  const order = await getCheckoutData(orderId);
  
  if (!order) {
    redirect('/checkout');
  }

  // Format cart items for DOKU
  const cartItems = order.items.map(item => ({
    name: `${item.account.type} - ${item.account.description.substring(0, 50)}`,
    price: item.price,
    quantity: 1
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{order.id}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{order.customerName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{order.customerEmail}</span>
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${order.subtotalAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">${order.taxAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <PaymentSection
          order={order}
          cartItems={cartItems}
        />
      </div>
    </div>
  );
};

export default PaymentPage; 