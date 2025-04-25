'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

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

interface AutoAllocateProfilesProps {
  accountId: string;
  orderItems: OrderItem[];
}

export default function AutoAllocateProfiles({ accountId, orderItems }: AutoAllocateProfilesProps) {
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocated, setAllocated] = useState(false);

  useEffect(() => {
    // Skip if already allocated or already attempting to allocate
    if (allocated || isAllocating) return;
    
    // Check if there's any Netflix account without profile
    const needsAllocation = orderItems.some(item => !item.netflixProfile);
    if (!needsAllocation) {
      setAllocated(true);
      return;
    }
    
    // Auto-allocate profile
    const allocateProfile = async () => {
      setIsAllocating(true);
      console.log("Auto-allocating Netflix profile...");
      
      try {
        // Cari OrderItem yang sesuai
        const orderItem = orderItems[0]; // Ambil yang pertama jika ada beberapa
        
        if (!orderItem) {
          console.error("No order item found for allocation");
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
          console.log("Auto-allocation successful", data);
          setAllocated(true);
          toast.success('Profil Netflix berhasil dialokasikan', { 
            id: 'auto-allocate-success' 
          });
          
          // Reload halaman setelah berhasil untuk melihat perubahan
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          console.error("Auto-allocation failed", data);
          toast.error('Gagal mengalokasikan profil secara otomatis', { 
            id: 'auto-allocate-error' 
          });
        }
      } catch (error) {
        console.error('Error in auto allocation:', error);
      } finally {
        setIsAllocating(false);
      }
    };
    
    // Delay sedikit untuk menghindari race conditions dengan data loading
    const timer = setTimeout(() => {
      allocateProfile();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [accountId, orderItems, allocated, isAllocating]);

  // Komponen ini tidak me-render apapun di UI
  return null;
} 