"use client";

import { FC } from 'react';
import DokuPaymentButton from '@/components/payment/DokuPaymentButton';

interface PaymentSectionProps {
  order: {
    id: string;
    totalAmount: number;
    customerName: string;
    customerEmail: string;
  };
  cartItems: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

const PaymentSection: FC<PaymentSectionProps> = ({ order, cartItems }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
      
      <div className="grid gap-4">
        <DokuPaymentButton
          orderId={order.id}
          amount={order.totalAmount}
          customerName={order.customerName}
          customerEmail={order.customerEmail}
          items={cartItems}
          buttonClassName="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg"
        />
      </div>
    </div>
  );
};

export default PaymentSection; 