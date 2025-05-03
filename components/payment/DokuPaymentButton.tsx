"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface DokuPaymentButtonProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  buttonClassName?: string;
}

export default function DokuPaymentButton({
  orderId,
  amount,
  customerName,
  customerEmail,
  items,
  onSuccess,
  onError,
  buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg'
}: DokuPaymentButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/payment/doku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          customerName,
          customerEmail,
          items,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Check if payment URL exists in response
      if (data.response?.payment?.url) {
        // If onSuccess callback provided, call it first
        if (onSuccess) {
          onSuccess(data);
        }
        
        // Redirect to DOKU payment page
        window.location.href = data.response.payment.url;
      } else {
        throw new Error('Payment URL not found in response');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className={`${buttonClassName} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Processing...' : 'Pay with DOKU'}
    </button>
  );
} 