'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ConfirmationFallbackPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Jika user belum login, redirect ke halaman login
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/orders');
      return;
    }

    // Jika user sudah login, redirect ke halaman orders
    // karena URL /checkout/confirmation tanpa ID order tidak valid
    if (status === 'authenticated') {
      router.push('/orders');
    }
  }, [router, status]);

  // Tampilkan loading spinner selama proses redirect
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-gray-600">Mengalihkan ke halaman pesanan...</p>
    </div>
  );
} 