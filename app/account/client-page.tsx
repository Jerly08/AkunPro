'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  FiPlay, FiMusic, FiClock, FiShield, FiAlertCircle, 
  FiRefreshCw, FiFilter, FiList, FiUser
} from 'react-icons/fi';
import Button from '@/components/ui/Button';

// Definisi tipe
type AccountType = 'NETFLIX' | 'SPOTIFY' | 'ALL';

type Account = {
  id: string;
  type: AccountType;
  accountEmail: string;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  createdAt: string;
  orderItems: Array<{
    id: string;
    orderId: string;
  }>;
};

const AccountClientPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<AccountType>('ALL');

  useEffect(() => {
    // Cek URL param type jika ada
    const typeParam = searchParams.get('type') as AccountType | null;
    if (typeParam && (typeParam === 'NETFLIX' || typeParam === 'SPOTIFY')) {
      setActiveType(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    const fetchMyAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/accounts');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data akun Anda');
        }
        
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        setError('Terjadi kesalahan saat memuat akun. Silakan coba lagi nanti.');
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyAccounts();
  }, [router, status]);

  // Filter akun berdasarkan tipe
  const filteredAccounts = accounts.filter(account => {
    if (activeType === 'ALL') return true;
    return account.type === activeType;
  });

  const setFilterType = (type: AccountType) => {
    setActiveType(type);
    
    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'ALL') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    router.push(`/account?${params.toString()}`);
  };

  // Fungsi untuk format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fungsi untuk menghitung tanggal berakhir garansi
  const calculateWarrantyEnd = (startDate: string, warrantyDays: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + warrantyDays);
    return formatDate(date.toISOString());
  };

  // Cek apakah garansi masih aktif
  const isWarrantyActive = (startDate: string, warrantyDays: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + warrantyDays);
    return new Date() < date;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Akun Saya
        </h1>
        <div className="flex space-x-2">
          <Link href="/netflix">
            <Button variant="outline" size="sm">
              <FiPlay className="mr-1 text-red-600" />
              Beli Netflix
            </Button>
          </Link>
          <Link href="/spotify">
            <Button variant="outline" size="sm">
              <FiMusic className="mr-1 text-green-600" />
              Beli Spotify
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Akun Premium Saya
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Kelola semua akun premium yang Anda miliki
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={activeType === 'ALL' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('ALL')}
              >
                <FiList className="mr-1" />
                Semua
              </Button>
              <Button 
                variant={activeType === 'NETFLIX' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('NETFLIX')}
                className={activeType === 'NETFLIX' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <FiPlay className="mr-1" />
                Netflix
              </Button>
              <Button 
                variant={activeType === 'SPOTIFY' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('SPOTIFY')}
                className={activeType === 'SPOTIFY' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <FiMusic className="mr-1" />
                Spotify
              </Button>
            </div>
          </div>
        </div>
        
        {filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100">
              <FiUser className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">
              {activeType === 'ALL' 
                ? 'Anda belum memiliki akun premium' 
                : `Anda belum memiliki akun ${activeType === 'NETFLIX' ? 'Netflix' : 'Spotify'}`}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Silakan beli akun premium untuk menikmati layanan streaming dengan harga terjangkau
            </p>
            <div className="mt-6">
              <Link href={activeType === 'SPOTIFY' ? '/spotify' : '/netflix'}>
                <Button variant="primary">
                  Beli Akun {activeType === 'SPOTIFY' ? 'Spotify' : 'Netflix'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <div key={account.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start mb-4 md:mb-0">
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      account.type === 'NETFLIX' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {account.type === 'NETFLIX' ? (
                        <FiPlay className="h-6 w-6 text-red-600" />
                      ) : (
                        <FiMusic className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {account.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        {account.accountEmail}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock className="mr-1 h-4 w-4" />
                          <span>Dibeli: {formatDate(account.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiShield className="mr-1 h-4 w-4" />
                          <span>Garansi: {account.warranty} hari</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {isWarrantyActive(account.createdAt, account.warranty) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Garansi Aktif sampai {calculateWarrantyEnd(account.createdAt, account.warranty)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Garansi Berakhir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Link href={`/account/${account.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Lihat Detail
                      </Button>
                    </Link>
                    
                    {!isWarrantyActive(account.createdAt, account.warranty) && (
                      <Link href={account.type === 'NETFLIX' ? '/netflix' : '/spotify'}>
                        <Button
                          variant="primary"
                          size="sm"
                          className={account.type === 'NETFLIX' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                          }
                        >
                          <FiRefreshCw className="mr-1" />
                          Perpanjang
                        </Button>
                      </Link>
                    )}
                    
                    {isWarrantyActive(account.createdAt, account.warranty) && (
                      <Link href={`/account/${account.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <FiAlertCircle className="mr-1" />
                          Laporkan Masalah
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-indigo-50 rounded-lg p-6">
        <h2 className="text-lg font-medium text-indigo-900 mb-2">Butuh Bantuan?</h2>
        <p className="text-indigo-700 mb-4">
          Jika mengalami kesulitan atau masalah dengan akun premium Anda, jangan ragu untuk menghubungi tim dukungan kami.
        </p>
        <Link href="/contact">
          <Button variant="outline" className="bg-white">
            Hubungi Kami
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AccountClientPage; 