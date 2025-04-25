'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMusic, FiUsers, FiShield, FiSmartphone, FiCheckCircle, FiDownload } from 'react-icons/fi';
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
      const response = await fetch(`/api/accounts?type=SPOTIFY&_=${timestamp}&force=${forceRefresh ? 1 : 0}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Force-Refresh': forceRefresh ? '1' : '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data akun Spotify');
      }
      
      let data = await response.json();
      console.log("Data akun Spotify:", data);
      
      // Filter untuk hanya menggunakan akun yang aktif saat menghitung stok
      const activeAccounts = data.filter((account: Account) => account.isActive === true);
      console.log(`Total akun: ${data.length}, Akun aktif: ${activeAccounts.length}`);
      
      // Jika ada durasi, buat paket berdasarkan durasi
      if (data.length > 0 && data[0].duration) {
        const durationsToAdd = [1, 2, 3, 6];
        const processedAccounts = [];
        
        for (const duration of durationsToAdd) {
          // Temukan semua akun dengan durasi ini
          const accountsWithDuration = data.filter((acc: Account) => 
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
            const baseAccount = data[0];
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
          data = processedAccounts.sort((a: Account, b: Account) => (a.duration || 1) - (b.duration || 1));
        }
      }
      
      setAccounts(data);
      
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Spotify Premium Sharing
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Nikmati Spotify Premium dengan harga terjangkau, bebas iklan, dan akses unlimited ke jutaan lagu.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
        <div className="bg-green-600 px-6 py-10 sm:px-10">
          <h2 className="text-2xl font-bold text-white">Keunggulan Spotify Premium Sharing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 sm:p-10">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiMusic className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Bebas Iklan</h3>
              <p className="mt-2 text-gray-600">Dengarkan musik tanpa gangguan iklan untuk pengalaman mendengar yang lebih baik.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiDownload className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Download Musik</h3>
              <p className="mt-2 text-gray-600">Unduh dan dengarkan secara offline hingga 10.000 lagu di 5 perangkat berbeda.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiShield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Garansi Full</h3>
              <p className="mt-2 text-gray-600">Dapatkan garansi penuh selama masa aktif akun dengan layanan penggantian cepat.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiSmartphone className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Multi-Device</h3>
              <p className="mt-2 text-gray-600">Akses Spotify di smartphone, tablet, laptop, dan perangkat lainnya.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Legal & Aman</h3>
              <p className="mt-2 text-gray-600">Akun resmi dengan pembayaran asli, dijamin bebas masalah dan aman digunakan.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-xl mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Pilih Paket Spotify Premium</h2>
          <div className="flex flex-col items-end gap-2">
            <Button 
              onClick={() => fetchAccounts(true)}
              variant="outline"
              className={`flex items-center gap-2 ${
                isLoading 
                  ? "bg-green-50 border-green-200 text-green-600" 
                  : "border-green-600 text-green-600 hover:bg-green-50"
              }`}
              disabled={isLoading}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
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
            <div className="flex flex-col items-end text-xs text-gray-500">
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
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchAccounts(true)}
              variant="outline"
            >
              Coba Lagi
            </Button>
          </div>
        )}
        
        {(!isLoading || (isLoading && accounts.length > 0)) && !error && (
          <AccountList accounts={displayedAccounts} type="SPOTIFY" />
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pertanyaan Umum</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bagaimana cara kerja Spotify Premium sharing?</h3>
            <p className="mt-2 text-gray-600">
              Anda akan mendapatkan akses ke akun Spotify Premium yang sudah aktif. Anda cukup login menggunakan email dan password yang kami berikan setelah pembayaran berhasil.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Apakah saya bisa mengganti password?</h3>
            <p className="mt-2 text-gray-600">
              Tidak, Anda tidak bisa mengganti password karena akun ini berbagi dengan pelanggan lain. Namun, kami menjamin akun tetap aman dan berfungsi selama masa aktif.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bagaimana jika akun bermasalah?</h3>
            <p className="mt-2 text-gray-600">
              Kami memberikan garansi penuh selama masa aktif. Jika akun bermasalah, silakan hubungi kami melalui halaman akun Anda, dan kami akan mengganti akun dalam waktu 24 jam.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Berapa lama proses aktivasi?</h3>
            <p className="mt-2 text-gray-600">
              Proses aktivasi dilakukan secara otomatis dan instan setelah pembayaran berhasil diverifikasi. Anda akan langsung mendapatkan detail akun Spotify Premium.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 