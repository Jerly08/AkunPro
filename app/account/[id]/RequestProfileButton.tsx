'use client';

import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface OrderItem {
  id: string;
  orderId: string;
  accountId: string;
  netflixProfile?: any;
  order: {
    id: string;
    status: string;
  };
}

interface RequestProfileButtonProps {
  accountId: string;
  orderItems: OrderItem[];
}

export default function RequestProfileButton({ accountId, orderItems }: RequestProfileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRequestProfile = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Cari OrderItem yang sesuai
      const orderItem = orderItems[0]; // Ambil yang pertama jika ada beberapa
      
      if (!orderItem) {
        toast.error('Tidak ada data pesanan yang ditemukan');
        return;
      }
      
      const response = await fetch('/api/netflix/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderItemId: orderItem.id,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Profil Netflix berhasil dialokasikan');
        // Reload halaman setelah berhasil
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.message || 'Gagal mengalokasikan profil');
      }
    } catch (error) {
      console.error('Error requesting profile:', error);
      toast.error('Terjadi kesalahan saat mencoba mengalokasikan profil');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="primary"
      onClick={handleRequestProfile}
      disabled={isLoading}
      size="sm"
      className="flex items-center"
    >
      {isLoading ? (
        <>
          <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Memproses...
        </>
      ) : (
        <>
          <FiRefreshCw className="h-4 w-4 mr-2" />
          Alokasikan Profil
        </>
      )}
    </Button>
  );
} 