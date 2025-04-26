'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMusic, FiUsers, FiShield, FiSmartphone, FiCheckCircle, FiDownload, FiRefreshCw, FiInfo } from 'react-icons/fi';
import AccountList from '@/components/account/AccountList';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

type Account = {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  duration?: number;
  stock?: number;
};

export default function SpotifyPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      console.log("Mengambil data akun Spotify...");
      
      // Tambahkan parameter timestamp untuk menghindari cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/accounts?type=SPOTIFY&_=${timestamp}&force=${forceRefresh ? 1 : 0}&array=true`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Force-Refresh': forceRefresh ? '1' : '0'
        }
      });
      
      if (response.status === 401) {
        console.log("Autentikasi diperlukan, tetapi akan menampilkan data publik");
        // Jika 401, kita tetap lanjutkan dengan menampilkan pesan khusus
        setError('Menampilkan data produk publik. Beberapa fitur mungkin terbatas.');
      } else if (!response.ok) {
        throw new Error('Gagal mengambil data akun Spotify');
      }
      
      let data = await response.json();
      console.log("Data akun Spotify:", data);
      
      // Extract accounts array from response
      let accountsData = Array.isArray(data) ? data : (data.accounts || []);
      
      // Filter untuk hanya menggunakan akun yang aktif saat menghitung stok
      const activeAccounts = accountsData.filter((account: Account) => account.isActive === true);
      console.log(`Total akun: ${accountsData.length}, Akun aktif: ${activeAccounts.length}`);
      
      // Jika ada durasi, buat paket berdasarkan durasi
      if (accountsData.length > 0 && accountsData[0].duration) {
        const durationsToAdd = [1, 2, 3, 6];
        const processedAccounts = [];
        
        for (const duration of durationsToAdd) {
          // Temukan semua akun dengan durasi ini
          const accountsWithDuration = accountsData.filter((acc: Account) => 
            (acc.duration || 1) === duration
          );
          
          // Hanya filter akun aktif untuk perhitungan stok
          const activeAccountsWithDuration = accountsWithDuration.filter((acc: Account) => 
            acc.isActive === true
          );
          
          if (accountsWithDuration.length > 0) {
            // Dapatkan akun dengan harga terbaik
            const bestAccount = accountsWithDuration.reduce((best: Account, current: Account) => {
              if (!best) return current;
              return current.price < best.price ? current : best;
            }, accountsWithDuration[0]);
            
            // Hitung total stok hanya dari akun yang aktif
            const totalStock = activeAccountsWithDuration.reduce((sum: number, account: Account) => {
              return sum + (account.stock || 0);
            }, 0);
            
            console.log(`Durasi ${duration} bulan, akun: ${accountsWithDuration.length}, akun aktif: ${activeAccountsWithDuration.length}, total stok: ${totalStock}`);
            
            // Periksa apakah ada akun aktif dengan stok > 0
            const hasActiveStock = activeAccountsWithDuration.some((acc: Account) => (acc.stock || 0) > 0);
            
            // Jangan override nilai isActive dari bestAccount jika memang sudah aktif dan punya stok
            processedAccounts.push({
              ...bestAccount,
              stock: totalStock,
              // Gunakan nilai isActive original dari akun jika memiliki stok
              isActive: totalStock > 0 ? bestAccount.isActive : false
            });
          } else {
            // Jika tidak ada, buat data baru berdasarkan durasi
            const baseAccount = accountsData[0];
            let price = 39000; // harga default
            if (duration === 2) price = 69000;
            if (duration === 3) price = 99000;
            if (duration === 6) price = 179000;
            
            processedAccounts.push({
              ...baseAccount,
              id: `spotify-${duration}-month`,
              duration: duration,
              price: price,
              stock: 0, // Tidak tersedia
              isActive: true // Tetap set sebagai aktif agar muncul di UI
            });
          }
        }
        
        // Pastikan semua durasi ada dalam processedAccounts
        // dengan mengurutkan berdasarkan durasi
        if (processedAccounts.length > 0) {
          accountsData = processedAccounts.sort((a: Account, b: Account) => (a.duration || 1) - (b.duration || 1));
        }
      }
      
      setAccounts(accountsData);
      
      // Update waktu terakhir diperbarui
      setLastUpdated(new Date());
      
      // Tampilkan toast jika ini adalah refresh manual
      if (forceRefresh) {
        toast({
          title: 'Data stok berhasil diperbarui!',
          variant: 'success'
        });
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat akun Spotify. Silakan coba lagi nanti.');
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fetchAccounts saat komponen dimuat
  useEffect(() => {
    fetchAccounts();
    
    // Perbarui data setiap 10 detik untuk sinkronisasi yang lebih cepat
    const intervalId = setInterval(() => {
      fetchAccounts();
    }, 10000);
    
    // Bersihkan interval saat komponen unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Tambahkan useEffect untuk reload saat localStorage berubah (saat ada update dari admin)
  useEffect(() => {
    // Fungsi yang dijalankan saat storage berubah
    const handleStorageChange = (e: StorageEvent) => {
      // Listener untuk perubahan dari pesanan yang dibatalkan
      if (e.key === 'refreshStockTimestamp') {
        console.log("Detected stock refresh event from another page");
        fetchAccounts(true);
      }
      
      // Listener untuk perubahan dari admin
      if (e.key === 'adminDataUpdated') {
        console.log("Detected admin data update event");
        fetchAccounts(true);
      }
      
      // Tambahkan listener khusus untuk perubahan status akun
      if (e.key === 'adminAccountStatusChanged') {
        console.log("Detected account status change from admin");
        // Force refresh dengan prioritas tinggi karena ini penting
        setTimeout(() => fetchAccounts(true), 100);
      }
    };
    
    // Check session storage saat halaman dimuat
    const stockUpdated = sessionStorage.getItem('stockUpdated');
    if (stockUpdated === 'true') {
      console.log("Stock was updated in another page, refreshing data");
      fetchAccounts(true);
      sessionStorage.removeItem('stockUpdated');
    }
    
    // Cek juga update dari admin saat halaman dimuat
    const lastAdminUpdate = localStorage.getItem('adminDataUpdated');
    if (lastAdminUpdate) {
      // Ambil timestamp terakhir yang diproses
      const lastProcessedUpdate = sessionStorage.getItem('lastProcessedAdminUpdate');
      
      // Jika timestamp berbeda, artinya ada pembaruan baru
      if (lastProcessedUpdate !== lastAdminUpdate) {
        console.log("Admin update detected on page load, refreshing data");
        fetchAccounts(true);
        // Simpan timestamp yang sudah diproses
        sessionStorage.setItem('lastProcessedAdminUpdate', lastAdminUpdate);
      }
    }
    
    // Subscribe ke event storage
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Tambahkan useEffect untuk refresh ketika halaman mendapat fokus
  useEffect(() => {
    // Fungsi yang dijalankan saat tab mendapat fokus kembali
    const handleFocus = () => {
      console.log("Spotify page got focus - refreshing data");
      fetchAccounts();
    };
    
    // Subscribe ke event visibilitychange dan focus
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Alih-alih memfilter akun berdasarkan stok dan status aktif,
  // kita pastikan semua durasi (1, 2, 3, 6 bulan) selalu tampil
  // dengan informasi ketersediaan stok yang sesuai
  const displayedAccounts = accounts;
  
  console.log("Total akun yang akan ditampilkan:", displayedAccounts.length);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Spotify Premium</h1>
        <p className="text-sm sm:text-base text-gray-600">Nikmati musik tanpa batas dengan Spotify Premium</p>
      </div>
      
      {/* Informasi Model Bisnis */}
      <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 mb-6 sm:mb-8 text-sm sm:text-base">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mt-0.5" aria-hidden="true" />
          </div>
          <div className="ml-2 sm:ml-3">
            <h3 className="text-xs sm:text-sm font-medium text-green-800">
              Informasi Penting: Anda membeli akses ke slot Spotify Premium Family
            </h3>
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-700">
              <p className="mb-1 sm:mb-2">
                Dengan membeli Spotify Premium dari kami, Anda <strong>mendapatkan akses ke satu slot dalam paket Family</strong>, bukan seluruh akun.
              </p>
              <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 pl-1">
                <li>Setiap slot dapat digunakan untuk 1 pengguna</li>
                <li>Email dan password akun digunakan untuk login</li>
                <li>Akses ke semua fitur premium tanpa batasan</li>
                <li>Jangan mengubah pengaturan akun atau profil lain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">Pilih Paket</h2>
        <Button 
          onClick={() => fetchAccounts(true)} 
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
        >
          {isLoading ? (
            <>
              <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
              Memuat...
            </>
          ) : (
            <>
              <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 sm:mb-6 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="w-full mx-auto py-4 sm:py-6 md:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Spotify Premium Sharing
          </h1>
          <p className="mt-3 sm:mt-4 max-w-xl mx-auto text-sm sm:text-base md:text-lg text-gray-500">
            Nikmati Spotify Premium dengan harga terjangkau, bebas iklan, dan akses unlimited ke jutaan lagu.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 sm:mb-12">
          <div className="bg-green-600 px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Keunggulan Spotify Premium Sharing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiMusic className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Bebas Iklan</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Dengarkan musik tanpa gangguan iklan untuk pengalaman mendengar yang lebih baik.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiDownload className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Download Musik</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Unduh dan dengarkan secara offline hingga 10.000 lagu di 5 perangkat berbeda.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiShield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Garansi Full</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Dapatkan garansi penuh selama masa aktif akun dengan layanan penggantian cepat.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiSmartphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Multi-Device</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Akses Spotify di smartphone, tablet, laptop, dan perangkat lainnya.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Legal & Aman</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Akun resmi dengan pembayaran asli, dijamin bebas masalah dan aman digunakan.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 sm:p-6 rounded-xl mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-xl font-bold text-gray-900">Pilih Paket Spotify Premium</h2>
            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => fetchAccounts(true)}
                variant="outline"
                className={`flex items-center gap-2 text-xs sm:text-sm ${
                  isLoading 
                    ? "bg-green-50 border-green-200 text-green-600" 
                    : "border-green-600 text-green-600 hover:bg-green-50"
                }`}
                disabled={isLoading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`${isLoading ? 'animate-spin' : ''}`}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.38-4.5M22 12.5a10 10 0 0 1-18.38 4.5"/>
                </svg>
                <span>{isLoading ? 'Memperbarui...' : 'Perbarui Stok'}</span>
              </Button>
              <div className="flex flex-col items-start sm:items-end text-[10px] sm:text-xs text-gray-500">
                <span>Data diperbarui secara otomatis setiap 10 detik</span>
                <span>Sinkron dengan panel admin</span>
                {lastUpdated && (
                  <span>
                    Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isLoading && accounts.length === 0 && (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-red-600 mb-3 sm:mb-4 text-sm">{error}</p>
              <Button 
                onClick={() => fetchAccounts(true)}
                variant="outline"
                className="text-xs sm:text-sm"
              >
                Coba Lagi
              </Button>
            </div>
          )}
          
          {(!isLoading || (isLoading && accounts.length > 0)) && !error && (
            <AccountList accounts={displayedAccounts} type="SPOTIFY" />
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8 sm:mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Pertanyaan Umum</h2>
          
          <div className="space-y-4 sm:space-y-6 text-sm sm:text-base">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Bagaimana cara kerja Spotify Premium sharing?</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Anda akan mendapatkan akses ke akun Spotify Premium yang sudah aktif. Anda cukup login menggunakan email dan password yang kami berikan setelah pembayaran berhasil.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Apakah saya bisa mengganti password?</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Tidak, Anda tidak bisa mengganti password karena akun ini berbagi dengan pelanggan lain. Namun, kami menjamin akun tetap aman dan berfungsi selama masa aktif.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Bagaimana jika akun bermasalah?</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Kami memberikan garansi penuh selama masa aktif. Jika akun bermasalah, silakan hubungi kami melalui halaman akun Anda, dan kami akan mengganti akun dalam waktu 24 jam.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Berapa lama proses aktivasi?</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Proses aktivasi dilakukan secara otomatis dan instan setelah pembayaran berhasil diverifikasi. Anda akan langsung mendapatkan detail akun Spotify Premium.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 