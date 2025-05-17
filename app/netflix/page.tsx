'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMonitor, FiUsers, FiShield, FiSmartphone, FiCheckCircle, FiInfo, FiRefreshCw } from 'react-icons/fi';
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

export default function NetflixPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      console.log("Mengambil data akun Netflix...");
      
      // Tambahkan parameter timestamp untuk menghindari cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/accounts?type=NETFLIX&_=${timestamp}&force=${forceRefresh ? 1 : 0}&array=true`, {
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
        throw new Error('Gagal mengambil data akun Netflix');
      }
      
      let responseData = await response.json();
      console.log("Data asli dari API:", responseData);
      
      // Extract accounts array from response
      let accountsData = Array.isArray(responseData) ? responseData : (responseData.accounts || []);
      
      // Tampilkan informasi stock untuk debugging
      accountsData.forEach((account: any) => {
        console.log(`Akun ID: ${account.id}, Type: ${account.type}, Duration: ${account.duration || 1}, Stock: ${account.stock || 0}, Active: ${account.isActive}`);
      });
      
      // Siapkan data untuk semua durasi
      if (accountsData.length > 0) {
        // Gunakan data dari database sebagai basis
        const baseAccount = accountsData[0];
        const durationsToAdd = [1, 2, 3, 6];
        const completeAccounts = [];
        
        // Tambahkan atau gunakan data untuk setiap durasi
        for (const duration of durationsToAdd) {
          // Cari semua akun dengan durasi ini (termasuk akun yang tidak aktif untuk debugging)
          const allAccountsWithDuration = accountsData.filter((acc: Account) => 
            (acc.duration || 1) === duration
          );
          
          console.log(`Durasi ${duration} bulan, total akun: ${allAccountsWithDuration.length}`);
          
          // Cari akun dengan durasi ini (termasuk yang tidak aktif)
          const accountsWithDuration = accountsData.filter((acc: Account) => 
            (acc.duration || 1) === duration
          );
          
          // Filter hanya akun yang aktif untuk perhitungan stok
          const activeAccountsWithDuration = accountsWithDuration.filter((acc: Account) => 
            acc.isActive === true
          );
          
          console.log(`Durasi ${duration} bulan, akun: ${accountsWithDuration.length}, akun aktif: ${activeAccountsWithDuration.length}`);
          
          if (accountsWithDuration.length > 0) {
            // Hitung total stok hanya dari akun yang aktif
            const totalStock = activeAccountsWithDuration.reduce((sum: number, account: Account) => {
              return sum + (account.stock || 0);
            }, 0);
            
            console.log(`Durasi ${duration} bulan, total stok (hanya akun aktif): ${totalStock}`);
            
            // Cek apakah ada akun dengan stok > 0
            const accountsWithStock = activeAccountsWithDuration.filter(acc => (acc.stock || 0) > 0);
            let bestAccount;
            
            if (accountsWithStock.length > 0) {
              // Gunakan akun yang memiliki stok, prioritaskan harga terendah
              console.log(`Durasi ${duration} bulan: Ditemukan ${accountsWithStock.length} akun dengan stok tersedia`);
              bestAccount = accountsWithStock.reduce((best, current) => {
                if (!best) return current;
                return current.price < best.price ? current : best;
              }, accountsWithStock[0]);
              
              console.log(`Durasi ${duration} bulan: Menggunakan akun ${bestAccount.id} dengan stok ${bestAccount.stock || 0}`);
            } else {
              // Tidak ada akun dengan stok, gunakan yang terbaik sebagai placeholder
              bestAccount = accountsWithDuration.reduce((best, current) => {
                if (!best) return current;
                return current.price < best.price ? current : best;
              }, accountsWithDuration[0]);
              
              console.log(`Durasi ${duration} bulan: Tidak ada akun dengan stok tersedia, gunakan placeholder`);
            }
            
            // Jangan override nilai isActive dari bestAccount jika memang sudah aktif dan punya stok
            completeAccounts.push({
              ...bestAccount,
              stock: totalStock,
              // Gunakan nilai isActive original dari akun jika memiliki stok
              isActive: totalStock > 0 ? bestAccount.isActive : false
            });
          } else {
            // Jika tidak ada, buat data baru berdasarkan durasi
            let price = 49000; // harga default
            if (duration === 2) price = 89000;
            if (duration === 3) price = 129000;
            if (duration === 6) price = 239000;
            
            completeAccounts.push({
              ...baseAccount,
              id: `netflix-${duration}-month`,
              duration: duration,
              price: price,
              stock: 0, // Tidak tersedia
              isActive: true // Tetap set sebagai aktif agar muncul di UI
            });
          }
        }
        
        // Pastikan semua durasi ada dalam completeAccounts
        // dengan mengurutkan berdasarkan durasi
        accountsData = completeAccounts.sort((a, b) => (a.duration || 1) - (b.duration || 1));
      }
      
      setAccounts(accountsData);
      // Perbarui waktu terakhir diperbarui
      setLastUpdated(new Date());
      
      // Tampilkan toast jika ini adalah refresh manual
      if (forceRefresh) {
        toast({
          title: 'Data stok berhasil diperbarui!',
          variant: 'success'
        });
      }
      
      // Bandingkan dengan data sebelumnya untuk beri notifikasi jika ada perubahan stok
      if (accounts.length > 0 && accountsData.length > 0 && !forceRefresh) {
        // Buat map untuk stok saat ini berdasarkan durasi
        const currentStockMap = accounts.reduce((map, account) => {
          map[account.duration || 1] = account.stock || 0;
          return map;
        }, {} as Record<number, number>);
        
        // Bandingkan dengan stok baru
        let hasStockChanged = false;
        accountsData.forEach((account: Account) => {
          const duration = account.duration || 1;
          const newStock = account.stock || 0;
          const currentStock = currentStockMap[duration] || 0;
          
          if (newStock !== currentStock) {
            hasStockChanged = true;
            console.log(`Stock changed for duration ${duration}: ${currentStock} -> ${newStock}`);
          }
        });
        
        // Notifikasi jika stok berubah
        if (hasStockChanged) {
          toast({
            title: 'Data stok telah diperbarui!',
            variant: 'success'
          });
        }
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat akun Netflix. Silakan coba lagi nanti.');
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

  // Alih-alih memfilter akun berdasarkan stok dan status aktif,
  // kita pastikan semua durasi (1, 2, 3, 6 bulan) selalu tampil
  // dengan informasi ketersediaan stok yang sesuai
  const displayedAccounts = accounts;
  
  console.log("Total akun yang akan ditampilkan:", displayedAccounts.length);

  // Tambahkan useEffect untuk reload saat localStorage berubah (saat pesanan dibatalkan dari halaman lain)
  useEffect(() => {
    // Fungsi yang dijalankan saat storage berubah
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshStockTimestamp') {
        console.log("Detected stock refresh event from another page");
        fetchAccounts(true);
      }
      
      // Tambahkan listener untuk perubahan dari admin
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
      console.log("Netflix page got focus - refreshing data");
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

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Netflix Premium</h1>
        <p className="text-sm sm:text-base text-gray-600">Nikmati hiburan tanpa batas dengan Netflix Premium</p>
      </div>
      
      {/* Informasi Model Bisnis */}
      <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-6 sm:mb-8 text-sm sm:text-base">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5" aria-hidden="true" />
          </div>
          <div className="ml-2 sm:ml-3">
            <h3 className="text-xs sm:text-sm font-medium text-red-800">
              Informasi Penting: Anda membeli akses ke satu profil Netflix
            </h3>
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">
              <p className="mb-1 sm:mb-2">
                Dengan membeli akun Netflix dari kami, Anda <strong>hanya mendapatkan akses ke satu profil</strong> dalam akun Netflix, bukan seluruh akun.
              </p>
              <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 pl-1">
                <li>Setiap profil dapat digunakan untuk 1 pengguna</li>
                <li>Email dan password akun digunakan untuk login</li>
                <li>Setelah login, gunakan profil yang telah dialokasikan untuk Anda</li>
                <li>Jangan mengubah pengaturan akun atau profil lain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">Pilih Paket</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 sm:mb-6 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="w-full mx-auto py-4 sm:py-6 md:py-8">
        {/* Banner Sinkronisasi */}
        <div className="mb-6 sm:mb-8 bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-md text-xs sm:text-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800">Informasi Stok Real-Time</h3>
              <div className="mt-1 text-xs sm:text-sm text-blue-700">
                <p>
                  Data stok pada halaman ini diperbarui secara otomatis setiap 10 detik dan sinkron dengan panel admin. 
                  Perubahan stok dari admin akan langsung terlihat di sini.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Netflix Premium Sharing
          </h1>
          <p className="mt-3 sm:mt-4 max-w-xl mx-auto text-sm sm:text-base md:text-lg text-gray-500">
            Nikmati Netflix dengan harga terjangkau, akses unlimited, dan garansi penuh selama masa aktif.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 sm:mb-12">
          <div className="bg-red-600 px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Keunggulan Netflix Premium Sharing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiMonitor className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Kualitas Ultra HD 4K</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Tonton film dan acara TV dengan kualitas gambar terbaik hingga 4K Ultra HD.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Sharing Aman</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Sistem sharing yang dijamin aman dan stabil dengan pantauan dari tim kami.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiShield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Garansi Full</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Dapatkan garansi penuh selama masa aktif akun dengan layanan penggantian cepat.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiSmartphone className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Multi-Device</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Akses Netflix di smartphone, tablet, laptop, smart TV, dan perangkat lainnya.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
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
            <h2 className="text-xl font-bold text-gray-900">Pilih Paket Netflix Premium</h2>
            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => fetchAccounts(true)}
                variant="outline"
                className={`flex items-center gap-2 text-xs sm:text-sm ${
                  isLoading 
                    ? "bg-red-50 border-red-200 text-red-600" 
                    : "border-red-600 text-red-600 hover:bg-red-50"
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
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-red-600"></div>
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
            <AccountList accounts={displayedAccounts} type="NETFLIX" />
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8 sm:mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Pertanyaan Umum</h2>
          
          <div className="space-y-4 sm:space-y-6 text-sm sm:text-base">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Bagaimana cara kerja Netflix sharing?</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Anda akan mendapatkan akses ke akun Netflix Premium yang sudah aktif. Anda cukup login menggunakan email dan password yang kami berikan setelah pembayaran berhasil.
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
                Proses aktivasi dilakukan secara otomatis dan instan setelah pembayaran berhasil diverifikasi. Anda akan langsung mendapatkan detail akun Netflix Premium.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 