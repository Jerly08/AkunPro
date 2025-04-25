'use client';

import { useRouter } from 'next/navigation';

export default function PaymentTestPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Halaman Test Pembayaran</h1>
        <p className="mb-4">Fitur pembayaran QRIS tidak digunakan dalam aplikasi ini.</p>
        
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800"
        >
          &larr; Kembali
        </button>
      </div>
    </div>
  );
} 