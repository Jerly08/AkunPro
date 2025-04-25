'use client';

import dynamic from 'next/dynamic';

// Import komponen DatabaseStatus dengan dynamic import (client-side only)
const DatabaseStatus = dynamic(() => import('@/components/admin/DatabaseStatus'), { 
  ssr: false,
  loading: () => <div className="bg-white rounded-lg shadow p-4 mb-6">
    <p className="text-sm text-gray-500">Memuat status database...</p>
  </div>
});

export default function ClientDatabaseStatus() {
  return <DatabaseStatus />;
} 