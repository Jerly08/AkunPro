'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiMusic, FiUser, FiKey, FiCalendar, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

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

export default function SpotifySlotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<SpotifySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchSpotifySlots();
    }
  }, [status, router]);
  
  const fetchSpotifySlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/spotify-slots');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data slot Spotify');
      }
      
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching Spotify slots:', error);
      setError('Terjadi kesalahan saat mengambil data slot Spotify');
      toast.error('Gagal mengambil data slot Spotify', {
        duration: 4000
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={fetchSpotifySlots}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Slot Spotify Saya</h1>
      
      {slots.length === 0 ? (
        <div className="bg-yellow-50 rounded-lg p-8 border border-yellow-200 text-center">
          <FiMusic className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Belum Ada Slot Spotify</h2>
          <p className="text-gray-600 mb-4">Anda belum memiliki slot Spotify aktif saat ini.</p>
          <button
            onClick={() => router.push('/spotify')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Beli Spotify Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map(slot => (
            <div key={slot.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-green-600 px-4 py-5 text-white">
                <div className="flex items-center">
                  <FiMusic className="h-6 w-6 mr-2" />
                  <h2 className="text-xl font-bold">{slot.slotName}</h2>
                </div>
                <p className="text-green-100 text-sm mt-1">
                  {slot.isMainAccount ? 'Akun Utama' : 'Slot Anggota'}
                </p>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Akun Spotify</h3>
                    <div className="mt-1 flex items-center">
                      <FiUser className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{slot.account.accountEmail}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Password</h3>
                    <div className="mt-1 flex items-center">
                      <FiKey className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{slot.account.accountPassword}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tanggal Pembelian</h3>
                        <div className="mt-1 flex items-center">
                          <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-900">{formatDate(slot.orderItem.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Masa Aktif</h3>
                        <div className="mt-1 flex items-center">
                          <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-900">{slot.account.duration} bulan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Berlaku Hingga</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {calculateExpiryDate(slot.orderItem.createdAt, slot.account.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 bg-gray-50 -mx-4 -mb-4 px-4 py-3">
                  <div className="text-sm">
                    <h4 className="font-medium text-gray-900">Catatan Penggunaan:</h4>
                    <ul className="mt-2 list-disc pl-5 text-gray-600 space-y-1">
                      <li>Login ke aplikasi Spotify dengan email dan password di atas</li>
                      <li>Jika diminta lokasi, gunakan alamat yang sama dengan Akun Utama</li>
                      <li>Jangan mengubah password atau informasi akun</li>
                      <li>Hubungi admin jika mengalami masalah login</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 