'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import AccountForm from '@/components/admin/AccountForm';
import toast from 'react-hot-toast';

export default function CreateAccountPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncWithClient = () => {
    // Broadcast ke semua tab bahwa ada perubahan data
    const timestamp = Date.now().toString();
    localStorage.setItem('adminDataUpdated', timestamp);
    console.log('Sinkronisasi dengan client: Data akun diperbarui pada', new Date().toLocaleTimeString());
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Cek apakah kita mengirim multiple accounts
      const hasMultipleAccounts = Array.from(formData.keys()).some(key => key.startsWith('accounts['));
      
      if (hasMultipleAccounts) {
        // Extract the accounts data
        const accountsData: Record<string, any>[] = [];
        const accountsMap = new Map<number, { accountEmail: string, accountPassword: string }>();
        
        Array.from(formData.entries()).forEach(([key, value]) => {
          if (key.startsWith('accounts[')) {
            // Format: accounts[0][accountEmail] or accounts[0][accountPassword]
            const matches = key.match(/accounts\[(\d+)\]\[(\w+)\]/);
            if (matches && matches.length === 3) {
              const index = parseInt(matches[1]);
              const field = matches[2];
              
              if (!accountsMap.has(index)) {
                accountsMap.set(index, { accountEmail: '', accountPassword: '' });
              }
              
              const account = accountsMap.get(index)!;
              account[field as keyof typeof account] = value as string;
            }
          }
        });
        
        // Create the common account data
        const commonData = {
          type: formData.get('type') as string,
          price: parseFloat(formData.get('price') as string),
          description: formData.get('description') as string,
          warranty: parseInt(formData.get('warranty') as string),
          isActive: formData.has('isActive'),
          duration: parseInt(formData.get('duration') as string),
        };
        
        // Create each account with the common data
        accountsMap.forEach((account) => {
          accountsData.push({
            ...commonData,
            accountEmail: account.accountEmail,
            accountPassword: account.accountPassword,
            stock: 1, // Each account has stock of 1
          });
        });
        
        // Send the batch request
        const response = await fetch('/api/admin/accounts/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accounts: accountsData }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Gagal membuat akun');
        }
        
        toast.success(`${accountsData.length} akun berhasil ditambahkan`);
        
        // Sinkronkan perubahan dengan client
        syncWithClient();
        
        // Tambahkan toast tentang sinkronisasi
        setTimeout(() => {
          toast('Data telah disinkronkan dengan halaman publik', {
            icon: '🔄',
            duration: 3000,
          });
        }, 1000);
        
        router.refresh();
        router.push('/admin/accounts');
      } else {
        // Single account - original logic
        const response = await fetch('/api/admin/accounts', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Gagal membuat akun');
        }
        
        toast.success('Akun berhasil ditambahkan');
        
        // Sinkronkan perubahan dengan client
        syncWithClient();
        
        // Tambahkan toast tentang sinkronisasi
        setTimeout(() => {
          toast('Data telah disinkronkan dengan halaman publik', {
            icon: '🔄',
            duration: 3000,
          });
        }, 1000);
        
        router.refresh();
        router.push('/admin/accounts');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <AdminHeader 
        title="Tambah Akun Baru" 
        description="Tambahkan akun baru ke dalam sistem untuk dijual."
        backHref="/admin/accounts"
      />
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <AccountForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 