'use client';

import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface RefreshProfileButtonProps {
  accountId: string;
  profileId?: string;
}

export default function RefreshProfileButton({ accountId, profileId }: RefreshProfileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRefreshProfile = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast.loading('Menyegarkan data profil...', { id: 'refresh-profile' });
    
    try {
      const response = await fetch('/api/netflix/refresh-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          profileId
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Profil berhasil disegarkan (${data.fixes?.length || 0} perubahan)`, {
          id: 'refresh-profile',
        });
        
        // Reload halaman untuk melihat perubahan
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.message || 'Gagal menyegarkan profil', {
          id: 'refresh-profile',
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Terjadi kesalahan saat menyegarkan profil', {
        id: 'refresh-profile',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="secondary"
      onClick={handleRefreshProfile}
      disabled={isLoading}
      size="sm"
      className="flex items-center"
    >
      {isLoading ? (
        <>
          <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Menyegarkan...
        </>
      ) : (
        <>
          <FiRefreshCw className="h-4 w-4 mr-2" />
          Segarkan Profil
        </>
      )}
    </Button>
  );
} 