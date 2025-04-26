'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  FiPlay, FiMusic, FiClock, FiShield, FiAlertCircle, 
  FiRefreshCw, FiFilter, FiList, FiUser, FiArrowRight,
  FiHelpCircle, FiDownload, FiSettings, FiMonitor, FiUsers,
  FiKey, FiSmartphone, FiLock, FiCreditCard, FiShare2
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { FAQ } from '@/components/ui/FAQ';

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

  // Fetch account data jika user sudah login, atau tampilkan halaman publik jika belum
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated') {
      fetchMyAccounts();
    } else {
      // User belum login, tampilkan konten publik
      setIsLoading(false);
    }
  }, [status]);

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

  // Netflix FAQ items
  const netflixFaqItems = [
    {
      question: "Bagaimana cara mengakses akun Netflix yang dibeli?",
      answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima informasi login (email dan password) melalui email dan di halaman pesanan Anda. Gunakan informasi tersebut untuk login ke Netflix melalui browser atau aplikasi.",
      icon: <FiKey size={20} />
    },
    {
      question: "Berapa lama masa garansi akun Netflix?",
      answer: "Masa garansi akun Netflix bervariasi tergantung paket yang Anda beli, biasanya berkisar antara 1 bulan hingga 1 tahun. Selama masa garansi, jika terjadi masalah dengan akun, kami akan menggantinya dengan yang baru.",
      icon: <FiShield size={20} />
    },
    {
      question: "Apakah saya bisa mengubah pengaturan di akun Netflix?",
      answer: "Kami menyarankan untuk tidak mengubah pengaturan akun seperti password, profil, atau informasi lainnya karena dapat menyebabkan akun tidak berfungsi. Jika Anda membutuhkan bantuan, silakan hubungi customer service kami.",
      icon: <FiSettings size={20} />
    },
    {
      question: "Apakah akun Netflix ini bisa digunakan di Smart TV?",
      answer: "Ya, Anda bisa menggunakan akun Netflix di berbagai perangkat termasuk Smart TV, smartphone, tablet, laptop, dan perangkat streaming lainnya.",
      icon: <FiMonitor size={20} />
    },
    {
      question: "Berapa banyak profil yang bisa dibuat dalam satu akun Netflix?",
      answer: "Akun Netflix Premium memungkinkan Anda membuat hingga 5 profil berbeda. Namun, untuk menjaga kestabilan akun, kami sarankan untuk hanya menggunakan profil yang sudah ada.",
      icon: <FiUsers size={20} />
    }
  ];

  // Spotify FAQ items
  const spotifyFaqItems = [
    {
      question: "Bagaimana cara mengakses akun Spotify yang dibeli?",
      answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima informasi login (email dan password) melalui email dan di halaman pesanan Anda. Gunakan informasi tersebut untuk login ke Spotify melalui browser atau aplikasi.",
      icon: <FiKey size={20} />
    },
    {
      question: "Berapa lama masa garansi akun Spotify?",
      answer: "Masa garansi akun Spotify bervariasi tergantung paket yang Anda beli, biasanya berkisar antara 1 bulan hingga 1 tahun. Selama masa garansi, jika terjadi masalah dengan akun, kami akan menggantinya dengan yang baru.",
      icon: <FiShield size={20} />
    },
    {
      question: "Apakah saya bisa mengubah pengaturan di akun Spotify?",
      answer: "Kami menyarankan untuk tidak mengubah pengaturan akun seperti password, profil, atau informasi lainnya karena dapat menyebabkan akun tidak berfungsi. Jika Anda membutuhkan bantuan, silakan hubungi customer service kami.",
      icon: <FiSettings size={20} />
    },
    {
      question: "Apakah akun Spotify ini bisa digunakan di beberapa perangkat?",
      answer: "Ya, Anda bisa menggunakan akun Spotify di berbagai perangkat termasuk smartphone, tablet, laptop, dan smart speaker. Namun, Spotify Premium hanya mengizinkan streaming aktif di satu perangkat pada satu waktu.",
      icon: <FiSmartphone size={20} />
    },
    {
      question: "Apakah saya bisa download lagu untuk didengarkan offline?",
      answer: "Ya, dengan Spotify Premium Anda bisa download hingga 10.000 lagu di 5 perangkat berbeda untuk didengarkan secara offline.",
      icon: <FiDownload size={20} />
    }
  ];

  // General FAQ items
  const generalFaqItems = [
    {
      question: "Bagaimana cara mengakses akun premium yang dibeli?",
      answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima informasi login (email dan password) melalui email dan di halaman pesanan Anda. Gunakan informasi tersebut untuk login ke layanan yang dibeli.",
      icon: <FiKey size={20} />
    },
    {
      question: "Berapa lama masa garansi akun premium?",
      answer: "Masa garansi akun bervariasi tergantung paket yang Anda beli, biasanya berkisar antara 1 bulan hingga 1 tahun. Selama masa garansi, jika terjadi masalah dengan akun, kami akan menggantinya dengan yang baru.",
      icon: <FiShield size={20} />
    },
    {
      question: "Apa yang harus dilakukan jika akun bermasalah?",
      answer: "Jika akun Anda bermasalah selama masa garansi, silakan hubungi customer service kami melalui halaman bantuan atau email ke support@akunpro.com dengan menyertakan nomor pesanan Anda.",
      icon: <FiAlertCircle size={20} />
    },
    {
      question: "Apakah saya bisa berbagi akun dengan orang lain?",
      answer: "Tergantung jenis akun yang Anda beli. Beberapa akun mungkin sudah dalam bentuk Family/Group yang memang untuk digunakan bersama. Namun untuk akun Personal, kami sarankan untuk tidak membagikan akun dengan orang lain untuk menjaga kestabilan akun.",
      icon: <FiShare2 size={20} />
    },
    {
      question: "Apakah akun premium akan diperbarui secara otomatis?",
      answer: "Tidak, akun premium yang Anda beli memiliki masa aktif sesuai dengan paket yang dipilih. Jika masa aktif habis, Anda perlu membeli kembali untuk melanjutkan layanan premium.",
      icon: <FiRefreshCw size={20} />
    }
  ];

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
          {status === 'authenticated' ? 'Akun Saya' : 'Akun Premium'}
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
      
      {/* Tampilkan informasi akun hanya untuk pengguna yang sudah login */}
      {status === 'authenticated' ? (
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
      ) : (
        // Konten untuk pengguna yang belum login
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 mb-4">
                <FiUser className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lihat Akun Premium Anda</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Login untuk melihat akun premium yang sudah Anda beli dan mengelola akun Anda.
              </p>
              <div className="mt-6">
                <Link href="/auth/login">
                  <Button variant="primary">Login ke Akun</Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Informasi produk untuk pengguna yang belum login */}
          <h2 className="text-2xl font-bold text-gray-900 my-6">Paket Premium Tersedia</h2>
          
          {/* Netflix Packages */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Netflix Premium</h3>
                <FiPlay className="h-6 w-6" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">1 Bulan</div>
                    <div className="text-lg font-bold text-red-600">Rp 45.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 30 hari</div>
                    <Link href="/netflix">
                      <button className="mt-4 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">2 Bulan</div>
                    <div className="text-lg font-bold text-red-600">Rp 89.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 60 hari</div>
                    <Link href="/netflix">
                      <button className="mt-4 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">3 Bulan</div>
                    <div className="text-lg font-bold text-red-600">Rp 129.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 90 hari</div>
                    <Link href="/netflix">
                      <button className="mt-4 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">6 Bulan</div>
                    <div className="text-lg font-bold text-red-600">Rp 239.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 180 hari</div>
                    <Link href="/netflix">
                      <button className="mt-4 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Link href="/netflix" className="text-red-600 hover:text-red-800 font-medium flex items-center justify-center">
                  Lihat detail paket Netflix <FiArrowRight className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Spotify Packages */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Spotify Premium</h3>
                <FiMusic className="h-6 w-6" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">1 Bulan</div>
                    <div className="text-lg font-bold text-green-600">Rp 35.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 30 hari</div>
                    <Link href="/spotify">
                      <button className="mt-4 w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">2 Bulan</div>
                    <div className="text-lg font-bold text-green-600">Rp 69.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 60 hari</div>
                    <Link href="/spotify">
                      <button className="mt-4 w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">3 Bulan</div>
                    <div className="text-lg font-bold text-green-600">Rp 99.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 90 hari</div>
                    <Link href="/spotify">
                      <button className="mt-4 w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center hover:shadow-md">
                    <div className="text-xl font-bold text-gray-900 mb-1">6 Bulan</div>
                    <div className="text-lg font-bold text-green-600">Rp 189.000</div>
                    <div className="text-sm text-gray-500 mt-2">Garansi 180 hari</div>
                    <Link href="/spotify">
                      <button className="mt-4 w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Pilih
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Link href="/spotify" className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center">
                  Lihat detail paket Spotify <FiArrowRight className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

      {/* FAQ Section */}
      <section className="mt-16 mb-10">
        <div className="max-w-4xl mx-auto">
          {/* Dynamic Header based on type */}
          <div className={`relative mb-8 rounded-xl p-8 overflow-hidden ${
            activeType === 'NETFLIX' 
              ? 'bg-gradient-to-r from-red-800 to-red-600' 
              : activeType === 'SPOTIFY' 
                ? 'bg-gradient-to-r from-green-800 to-green-600' 
                : 'bg-gradient-to-r from-indigo-800 to-indigo-600'
          }`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid-pattern)" />
              </svg>
            </div>
            
            {/* Header content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {activeType === 'NETFLIX' 
                    ? 'FAQ Netflix Premium' 
                    : activeType === 'SPOTIFY' 
                      ? 'FAQ Spotify Premium' 
                      : 'FAQ Akun Premium'}
                </h2>
                <p className="text-white/80">
                  Temukan jawaban untuk pertanyaan yang sering ditanyakan
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="p-3 bg-white/20 rounded-full">
                  {activeType === 'NETFLIX' 
                    ? <FiPlay className="h-8 w-8 text-white" />
                    : activeType === 'SPOTIFY' 
                      ? <FiMusic className="h-8 w-8 text-white" />
                      : <FiHelpCircle className="h-8 w-8 text-white" />}
                </div>
              </div>
            </div>
          </div>
          
          {/* FAQ Content */}
          <div className="bg-white rounded-xl shadow-xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full opacity-50 ${
              activeType === 'NETFLIX' 
                ? 'bg-red-100' 
                : activeType === 'SPOTIFY' 
                  ? 'bg-green-100' 
                  : 'bg-indigo-100'
            }`}></div>
            <div className={`absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full opacity-50 ${
              activeType === 'NETFLIX' 
                ? 'bg-red-100/50' 
                : activeType === 'SPOTIFY' 
                  ? 'bg-green-100/50' 
                  : 'bg-indigo-100/50'
            }`}></div>
            
            {/* FAQ Items */}
            <div className="relative z-10">
              {activeType === 'NETFLIX' 
                ? <FAQ items={netflixFaqItems} variant="netflix" /> 
                : activeType === 'SPOTIFY' 
                  ? <FAQ items={spotifyFaqItems} variant="spotify" /> 
                  : <FAQ items={generalFaqItems} variant="default" />}
              
              {/* Need more help prompt */}
              <div className="mt-10 text-center">
                <p className="text-gray-600 mb-4">Masih punya pertanyaan lain?</p>
                <Link href="/help" className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  activeType === 'NETFLIX' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : activeType === 'SPOTIFY' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                }`}>
                  Hubungi Layanan Pelanggan
                  <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountClientPage; 