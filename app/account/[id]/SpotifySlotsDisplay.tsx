'use client';

import { useState, useEffect } from 'react';
import { FiMusic, FiUser, FiKey, FiCalendar, FiClock, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SpotifySlot {
  id: string;
  slotName: string;
  email: string | null;
  password: string | null;
  isActive: boolean;
  isAllocated: boolean;
  isMainAccount: boolean;
  accountId: string;
  createdAt: string;
  account: {
    accountEmail: string;
    accountPassword: string;
    description: string;
    warranty: number;
    duration: number;
  };
  orderItem: {
    orderId: string;
    price: number;
    createdAt: string;
  };
}

interface SpotifySlotsDisplayProps {
  accountId: string;
}

export default function SpotifySlotsDisplay({ accountId }: SpotifySlotsDisplayProps) {
  const [slots, setSlots] = useState<SpotifySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (accountId) {
      fetchSpotifySlots();
    }
  }, [accountId]);
  
  const fetchSpotifySlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/${accountId}/spotify-slots`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data slot Spotify');
      }
      
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching Spotify slots:', error);
      setError('Terjadi kesalahan saat mengambil data slot Spotify');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  const calculateExpiryDate = (createdAt: string, durationMonths: number) => {
    const startDate = new Date(createdAt);
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    return formatDate(expiryDate.toISOString());
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 mb-2 text-sm">{error}</p>
        <button 
          onClick={fetchSpotifySlots}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
  
  if (slots.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FiMusic className="mr-2 text-green-600" />
          Slot Spotify Anda
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-600 rounded-full">
            {slots.length} Slot
          </span>
        </h2>
        <button 
          onClick={fetchSpotifySlots}
          className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
        >
          <FiRefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
        <p className="text-sm text-yellow-700 flex items-center">
          <FiMusic className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            <strong>Slot Spotify Premium Anda.</strong> Gunakan informasi ini untuk login ke aplikasi Spotify pada perangkat Anda.
            {slots.some(slot => slot.isMainAccount) && 
              <> <strong>Perhatian:</strong> Slot dengan label "Akun Utama" adalah untuk akun owner. Jangan mengubah informasi akun utama.</>
            }
          </span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {slots.map(slot => (
          <div key={slot.id} className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-green-600 px-4 py-3 text-white">
              <div className="flex items-center">
                <FiMusic className="h-5 w-5 mr-2" />
                <h3 className="text-lg font-bold">{slot.slotName}</h3>
              </div>
              <p className="text-green-100 text-xs mt-0.5">
                {slot.isMainAccount ? 'Akun Utama' : 'Slot Anggota'}
              </p>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-500">Akun Spotify</h4>
                  <div className="mt-1 flex items-center">
                    <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {slot.email || slot.account.accountEmail}
                      {slot.isMainAccount && " (Akun Utama)"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">Password</h4>
                  <div className="mt-1 flex items-center">
                    <FiKey className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {slot.password || slot.account.accountPassword}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Tanggal Pembelian</h4>
                      <div className="mt-1 flex items-center">
                        <FiCalendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-900">{formatDate(slot.orderItem.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Berlaku Hingga</h4>
                      <div className="mt-1">
                        <span className="text-xs text-gray-900">
                          {calculateExpiryDate(slot.orderItem.createdAt, slot.account.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Penting:</strong> Gunakan informasi akun di atas untuk login ke aplikasi Spotify. 
          {slots.some(slot => slot.isMainAccount) ? (
            <>
              <br/><br/>
              <strong>Untuk Slot Utama/Akun Utama:</strong> Ini adalah akun pemilik family plan. Jika Anda mendapatkan
              akses ke akun ini, JANGAN mengubah password atau informasi profil, karena ini akan mempengaruhi semua pengguna.
              <br/><br/>
              <strong>Untuk Slot Anggota:</strong> Gunakan kredensial yang diberikan untuk login. Anda tidak perlu mengubah
              pengaturan apa pun. Setiap slot anggota memiliki kredensial login yang berbeda.
            </>
          ) : (
            <>
              Jangan mengubah password atau informasi profil. Slot ini merupakan bagian dari akun family plan.
            </>
          )}
          <br/><br/>
          Hubungi admin jika mengalami masalah saat login.
        </p>
      </div>
    </div>
  );
} 