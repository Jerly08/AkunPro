'use client';

import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import EditAccountForm from './EditAccountForm';

interface EditAccountPageClientProps {
  account: any; // Use proper type when available
  id: string;
}

// Client component to render form
export default function EditAccountPageClient({ account, id }: EditAccountPageClientProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminHeader title="Edit Akun" showBackButton backUrl={`/admin/accounts/${id}`} />
      
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <EditAccountForm account={account} id={id} />
        </div>
      </div>
    </div>
  );
} 