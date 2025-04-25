'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AccountForm from '@/components/admin/AccountForm';

interface EditAccountFormProps {
  account: {
    id: string;
    type: string;
    accountEmail: string;
    accountPassword: string;
    price: number;
    warranty: number;
    description: string;
    isActive: boolean;
    profiles?: {
      id: string;
      name: string;
      pin: string | null;
      isKids: boolean;
      orderId: string | null;
      userId: string | null;
    }[];
  };
  id: string;
}

export default function EditAccountForm({ account, id }: EditAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const syncWithClient = () => {
    // Broadcast ke semua tab bahwa ada perubahan data
    const timestamp = Date.now().toString();
    localStorage.setItem('adminDataUpdated', timestamp);
    console.log('Sinkronisasi dengan client: Data akun diperbarui pada', new Date().toLocaleTimeString());
    
    // Tambahkan notifikasi
    toast.success('Data berhasil disinkronkan dengan halaman client', { 
      duration: 3000,
      icon: '🔄'
    });
  };
  
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Tambahkan toast loading untuk menunjukkan proses sedang berjalan
      const loadingToast = toast.loading('Sedang memperbarui akun...');
      
      const type = formData.get('type') as string;
      const accountEmail = formData.get('accountEmail') as string;
      const accountPassword = formData.get('accountPassword') as string;
      const price = Number(formData.get('price'));
      const warranty = Number(formData.get('warranty'));
      const description = formData.get('description') as string;
      const isActive = formData.has('isActive');
      
      // Persiapkan data profil jika tipe NETFLIX
      let profiles = null;
      if (type === 'NETFLIX') {
        // Ekstrak data profil dari FormData
        profiles = [];
        // Cek apakah ada profil yang dikirim dalam form
        const formEntries = Array.from(formData.entries());
        const profileEntries = formEntries.filter(([key]) => key.startsWith('profiles['));
        
        // Kelompokkan entri profil berdasarkan indeks
        const profileIndices = new Set<number>();
        profileEntries.forEach(([key]) => {
          const match = key.match(/profiles\[(\d+)\]/);
          if (match) {
            profileIndices.add(parseInt(match[1]));
          }
        });
        
        // Buat objek profil untuk setiap indeks
        profileIndices.forEach(index => {
          const profile: any = {};
          
          const idValue = formData.get(`profiles[${index}][id]`);
          if (idValue) profile.id = idValue.toString();
          
          const nameValue = formData.get(`profiles[${index}][name]`);
          profile.name = nameValue ? nameValue.toString() : '';
          
          const pinValue = formData.get(`profiles[${index}][pin]`);
          profile.pin = pinValue ? pinValue.toString() : '';
          
          const isKidsValue = formData.get(`profiles[${index}][isKids]`);
          profile.isKids = isKidsValue === 'true';
          
          profiles.push(profile);
        });
      }
      
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          accountEmail,
          accountPassword,
          price,
          warranty,
          description,
          isActive,
          profiles,
        }),
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat memperbarui akun');
      }
      
      // Sinkronkan dengan client sebelum berpindah halaman
      syncWithClient();
      
      // Tambahkan toast sukses yang lebih menarik
      toast.success(`Akun ${accountEmail} berhasil diperbarui`, {
        duration: 4000,
        icon: '✅',
        style: {
          border: '1px solid #22c55e',
          padding: '16px',
          color: '#166534',
          background: '#f0fdf4',
        },
      });
      
      router.push(`/admin/accounts/${id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating account:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui akun');
      
      // Tambahkan toast error yang lebih informatif
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui akun', {
        duration: 5000,
        icon: '❌',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#b91c1c',
          background: '#fef2f2',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <AccountForm
        account={{
          id: account.id,
          type: account.type,
          accountEmail: account.accountEmail,
          accountPassword: account.accountPassword,
          price: account.price,
          warranty: account.warranty,
          description: account.description,
          isActive: account.isActive,
          profiles: account.profiles || []
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
} 