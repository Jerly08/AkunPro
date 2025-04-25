import { Suspense } from 'react';
import AccountClientPage from './client-page';

export default function AccountPage() {
  // Gunakan client component untuk menangani searchParams dengan aman
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <AccountClientPage />
    </Suspense>
  );
} 