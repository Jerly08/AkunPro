import { Suspense } from 'react';
import PaymentClient from './payment-client';

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
    </div>}>
      <PaymentClient />
    </Suspense>
  );
} 