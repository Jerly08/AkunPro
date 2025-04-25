'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import SpotifyFamilyForm from './components/SpotifyFamilyForm';

interface Account {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  accountEmail: string;
  accountPassword: string;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  stock: number;
  duration: number;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: {
    order: {
      id: string;
      status: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  isFamilyPlan?: boolean;
  maxSlots?: number;
}

// Tambahkan interface untuk NetflixProfile
interface NetflixProfile {
  id: string;
  name: string;
  pin: string | null;
  isKids: boolean;
  orderId: string | null;
  userId: string | null;
  inUse?: boolean;
}

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'NETFLIX' | 'SPOTIFY'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Tambahkan state untuk modal edit profil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAccountProfiles, setSelectedAccountProfiles] = useState<NetflixProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'NETFLIX',
    accountEmail: '',
    accountPassword: '',
    price: '',
    description: '',
    warranty: '',
    isActive: true,
    stock: '1',
    duration: '1',
  });

  // Tambahkan state untuk informasi stok Netflix
  const [netflixStockInfo, setNetflixStockInfo] = useState<any>(null);
  const [loadingStockInfo, setLoadingStockInfo] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Tambahkan state untuk informasi stok Spotify
  const [spotifyStockInfo, setSpotifyStockInfo] = useState<any>(null);
  const [loadingSpotifyStockInfo, setLoadingSpotifyStockInfo] = useState(false);
  const [showSpotifyStockModal, setShowSpotifyStockModal] = useState(false);

  // Tambahkan state untuk modal Spotify Family Plan
  const [showSpotifyFamilyModal, setShowSpotifyFamilyModal] = useState(false);

  // Tambahkan state untuk menampilkan modal family plan
  const [showFamilyPlanModal, setShowFamilyPlanModal] = useState(false);
  const [selectedSpotifyAccount, setSelectedSpotifyAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchAccounts();
      
      // Tambahkan pembaruan stok otomatis saat halaman dimuat
      fetchNetflixStockInfo().then(() => {
        return updateNetflixStock();
      }).then(() => {
        console.log("Netflix stock automatically updated on page load");
      }).catch(error => {
        console.error("Error updating Netflix stock automatically:", error);
      });
      
      fetchSpotifyStockInfo().then(() => {
        return updateSpotifyStock();
      }).then(() => {
        console.log("Spotify stock automatically updated on page load");
      }).catch(error => {
        console.error("Error updating Spotify stock automatically:", error);
      });
    }
  }, [session, status, router]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/accounts');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Gagal mengambil data akun');
      }
      
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Terjadi kesalahan saat mengambil data akun');
    } finally {
      setLoading(false);
    }
  };

  const syncWithClient = () => {
    // Broadcast ke semua tab bahwa ada perubahan data
    const timestamp = Date.now().toString();
    localStorage.setItem('adminDataUpdated', timestamp);
    console.log('Sinkronisasi dengan client: Data akun diperbarui pada', new Date().toLocaleTimeString());
    
    // Tambahkan notifikasi visual untuk admin
    toast.success('Data berhasil disinkronkan dengan halaman client', { 
      duration: 3000,
      icon: '🔄'
    });
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/admin/accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          warranty: Number(formData.warranty),
          stock: Number(formData.stock),
          duration: Number(formData.duration),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengupdate akun');
      }

      await fetchAccounts();
      setShowEditModal(false);
      setSelectedAccount(null);
      setFormData({
        type: 'NETFLIX',
        accountEmail: '',
        accountPassword: '',
        price: '',
        description: '',
        warranty: '',
        isActive: true,
        stock: '1',
        duration: '1',
      });
      
      // Tambahkan toast yang lebih menarik saat berhasil mengupdate akun
      toast.success(`Akun ${formData.accountEmail} berhasil diperbarui`, {
        duration: 4000,
        icon: '✏️',
        style: {
          border: '1px solid #22c55e',
          padding: '16px',
          color: '#166534',
        },
      });
      
      // Sinkronkan perubahan dengan client
      syncWithClient();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate akun', {
        duration: 5000,
        icon: '❌',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#b91c1c',
        },
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    // Tambahkan confirm dialog yang lebih informatif
    if (!confirm('Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait akun.')) return;

    try {
      // Tambahkan toast loading untuk menunjukkan proses sedang berjalan
      const toastLoading = toast.loading('Sedang menghapus akun...');
      
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
      });

      // Dismiss toast loading
      toast.dismiss(toastLoading);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus akun');
      }

      await fetchAccounts();
      
      // Tambahkan toast success yang lebih menarik
      toast.success('Akun berhasil dihapus', {
        duration: 4000,
        icon: '🗑️',
        style: {
          border: '1px solid #22c55e',
          padding: '16px',
          color: '#166534',
        },
      });
      
      // Sinkronkan perubahan dengan client
      syncWithClient();
    } catch (error) {
      // Tampilkan pesan error yang lebih jelas dan informatif
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus akun';
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#b91c1c',
        },
      });
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.accountEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || account.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && account.isActive) || 
      (filterStatus === 'INACTIVE' && !account.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Tambahkan fungsi untuk mengambil profil Netflix
  const fetchNetflixProfiles = async (accountId: string) => {
    try {
      setLoadingProfiles(true);
      setProfileError('');
      
      const response = await fetch(`/api/admin/accounts/${accountId}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data profil');
      }
      
      const accountData = await response.json();
      
      if (accountData.profiles) {
        const profilesWithUseStatus = accountData.profiles.map((profile: NetflixProfile) => ({
          ...profile,
          inUse: profile.orderId !== null || profile.userId !== null
        }));
        setSelectedAccountProfiles(profilesWithUseStatus);
      } else {
        setSelectedAccountProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfileError('Terjadi kesalahan saat mengambil data profil');
    } finally {
      setLoadingProfiles(false);
    }
  };
  
  // Fungsi untuk menambah profil baru
  const addNewProfile = () => {
    if (selectedAccountProfiles.length < 5) {
      setSelectedAccountProfiles([
        ...selectedAccountProfiles, 
        {
          id: 'new-' + Date.now(), // temporary id
          name: `Profil ${selectedAccountProfiles.length + 1}`,
          pin: '',
          isKids: false,
          orderId: null,
          userId: null
        }
      ]);
    } else {
      toast.error('Maksimal 5 profil per akun Netflix', {
        duration: 3000,
        icon: '⚠️'
      });
    }
  };
  
  // Fungsi untuk update profil
  const updateProfile = (profileIndex: number, field: keyof NetflixProfile, value: string | boolean) => {
    const updatedProfiles = [...selectedAccountProfiles];
    updatedProfiles[profileIndex] = { 
      ...updatedProfiles[profileIndex], 
      [field]: value 
    };
    setSelectedAccountProfiles(updatedProfiles);
  };
  
  // Fungsi untuk menghapus profil
  const removeProfile = (profileIndex: number) => {
    if (selectedAccountProfiles[profileIndex].inUse) {
      toast.error('Tidak dapat menghapus profil yang sedang digunakan', {
        duration: 3000,
        icon: '⚠️'
      });
      return;
    }
    
    // Jika profil baru (belum ada di database), hapus langsung
    if (selectedAccountProfiles[profileIndex].id.startsWith('new-')) {
      const updatedProfiles = [...selectedAccountProfiles];
      updatedProfiles.splice(profileIndex, 1);
      setSelectedAccountProfiles(updatedProfiles);
      return;
    }
    
    // Konfirmasi penghapusan untuk profil yang sudah ada
    if (window.confirm(`Apakah Anda yakin ingin menghapus profil "${selectedAccountProfiles[profileIndex].name}"?`)) {
      const updatedProfiles = [...selectedAccountProfiles];
      updatedProfiles.splice(profileIndex, 1);
      setSelectedAccountProfiles(updatedProfiles);
    }
  };
  
  // Fungsi untuk menyimpan perubahan profil
  const saveProfiles = async () => {
    if (!selectedAccount) return;
    
    try {
      const loadingToast = toast.loading('Sedang menyimpan profil...');
      
      const response = await fetch(`/api/admin/accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedAccount.type,
          profiles: selectedAccountProfiles.map(profile => ({
            id: profile.id.startsWith('new-') ? undefined : profile.id,
            name: profile.name,
            pin: profile.pin,
            isKids: profile.isKids
          }))
        }),
      });
      
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan profil');
      }
      
      // Sukses
      toast.success('Profil berhasil disimpan', {
        duration: 4000,
        icon: '✅',
        style: {
          border: '1px solid #22c55e',
          padding: '16px',
          color: '#166534',
          background: '#f0fdf4',
        },
      });
      
      setShowProfileModal(false);
      
      // Sinkronkan dengan client
      syncWithClient();
    } catch (error) {
      console.error('Error saving profiles:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan profil', {
        duration: 5000,
        icon: '❌',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#b91c1c',
          background: '#fef2f2',
        },
      });
    }
  };

  // Tambahkan fungsi untuk mendapatkan informasi stok Netflix
  const fetchNetflixStockInfo = async () => {
    try {
      setLoadingStockInfo(true);
      
      const response = await fetch('/api/netflix/stock');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil informasi stok Netflix');
      }
      
      const stockInfo = await response.json();
      setNetflixStockInfo(stockInfo);
      
    } catch (error) {
      console.error('Error fetching Netflix stock info:', error);
      toast.error('Gagal mengambil informasi stok Netflix', {
        duration: 3000,
        icon: '❌'
      });
    } finally {
      setLoadingStockInfo(false);
    }
  };
  
  // Tambahkan fungsi untuk memperbarui stok Netflix
  const updateNetflixStock = async (accountId?: string) => {
    try {
      setLoadingStockInfo(true);
      
      const response = await fetch('/api/netflix/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId
        })
      });
      
      if (!response.ok) {
        throw new Error('Gagal memperbarui stok Netflix');
      }
      
      const result = await response.json();
      
      // Refresh informasi stok
      await fetchNetflixStockInfo();
      
      // Refresh data akun
      await fetchAccounts();
      
      toast.success(accountId 
        ? `Stok akun ${accountId.substring(0, 8)}... berhasil diperbarui` 
        : 'Stok semua akun Netflix berhasil diperbarui', {
        duration: 3000,
        icon: '✅'
      });
      
    } catch (error) {
      console.error('Error updating Netflix stock:', error);
      toast.error('Gagal memperbarui stok Netflix', {
        duration: 3000,
        icon: '❌'
      });
    } finally {
      setLoadingStockInfo(false);
    }
  };

  // Tambahkan fungsi untuk mendapatkan informasi stok Spotify
  const fetchSpotifyStockInfo = async () => {
    try {
      setLoadingSpotifyStockInfo(true);
      
      const response = await fetch('/api/spotify/stock');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil informasi stok Spotify');
      }
      
      const stockInfo = await response.json();
      setSpotifyStockInfo(stockInfo);
      
    } catch (error) {
      console.error('Error fetching Spotify stock info:', error);
      toast.error('Gagal mengambil informasi stok Spotify', {
        duration: 3000,
        icon: '❌'
      });
    } finally {
      setLoadingSpotifyStockInfo(false);
    }
  };
  
  // Tambahkan fungsi untuk memperbarui stok Spotify
  const updateSpotifyStock = async (accountId?: string) => {
    try {
      setLoadingSpotifyStockInfo(true);
      
      const response = await fetch('/api/spotify/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId
        })
      });
      
      if (!response.ok) {
        throw new Error('Gagal memperbarui stok Spotify');
      }
      
      const result = await response.json();
      
      // Refresh informasi stok
      await fetchSpotifyStockInfo();
      
      // Refresh data akun
      await fetchAccounts();
      
      toast.success(accountId 
        ? `Stok akun ${accountId.substring(0, 8)}... berhasil diperbarui` 
        : 'Stok semua akun Spotify berhasil diperbarui', {
        duration: 3000,
        icon: '✅'
      });
      
    } catch (error) {
      console.error('Error updating Spotify stock:', error);
      toast.error('Gagal memperbarui stok Spotify', {
        duration: 3000,
        icon: '❌'
      });
    } finally {
      setLoadingSpotifyStockInfo(false);
    }
  };

  // Tambahkan fungsi untuk mengelola Family Plan
  const handleManageFamilyPlan = (account: Account) => {
    if (account.type !== 'SPOTIFY') {
      toast.error('Hanya akun Spotify yang dapat memiliki Family Plan');
      return;
    }
    
    setSelectedSpotifyAccount(account);
    setShowFamilyPlanModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          Manajemen Akun
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push('/admin/accounts/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" /> Tambah Akun Baru
          </button>
          
          {/* Tambahkan tombol untuk melihat dan mengelola stok Netflix */}
          <button
            onClick={() => {
              fetchNetflixStockInfo();
              setShowStockModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-purple-700 transition"
          >
            <span className="mr-2">🎬</span> Kelola Stok Netflix
          </button>
          
          {/* Tambahkan tombol untuk melihat dan mengelola stok Spotify */}
          <button
            onClick={() => {
              fetchSpotifyStockInfo();
              setShowSpotifyStockModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-green-700 transition"
          >
            <span className="mr-2">🎵</span> Kelola Stok Spotify
          </button>
        </div>
      </div>

      {/* Info tentang cara mengedit profil Netflix */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Perhatian:</span> Untuk mengedit profil Netflix, klik tombol "Edit Profil" yang tersedia di samping tombol Edit Cepat pada akun bertipe Netflix.
            </p>
          </div>
        </div>
      </div>

      {/* Banner informasi tentang status akun dan stok */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <div>
              <h3 className="font-semibold">Akun Aktif</h3>
              <p className="text-sm text-gray-600">
                {accounts.filter(a => a.isActive).length} dari {accounts.length} akun
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <span className="text-yellow-600 text-xl">!</span>
            </div>
            <div>
              <h3 className="font-semibold">Stok Tersedia</h3>
              <p className="text-sm text-gray-600">
                {accounts.filter(a => a.stock > 0).length} dari {accounts.length} akun
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <span className="text-blue-600 text-xl">i</span>
            </div>
            <div>
              <h3 className="font-semibold">Tipe Akun</h3>
              <p className="text-sm text-gray-600">
                Netflix: {accounts.filter(a => a.type === 'NETFLIX').length}, 
                Spotify: {accounts.filter(a => a.type === 'SPOTIFY').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Informasi penting */}
        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Informasi Penting: Status Akun dan Perhitungan Stok
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  <strong>Perhatian:</strong> Hanya akun dengan status "Aktif" yang akan dihitung stoknya pada halaman publik.
                  Akun dengan status "Tidak Aktif" tetap disimpan dalam database namun tidak akan terlihat oleh pengguna.
                </p>
                <p className="mt-2">
                  <strong>Perbaruan:</strong> Akun dengan stok 0 atau tidak aktif tidak akan ditampilkan di halaman publik.
                  Pastikan akun memiliki stok dan status aktif agar terlihat oleh pengguna.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="NETFLIX">Netflix</option>
            <option value="SPOTIFY">Spotify</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga (Rp)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Family Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${account.type === 'NETFLIX' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.accountEmail}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.accountPassword}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {account.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.type === 'SPOTIFY' && (
                    <button
                      onClick={() => handleManageFamilyPlan(account)}
                      className="inline-flex items-center px-2 py-1 mx-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      title="Kelola Slot Family Plan"
                    >
                      <FiUsers className="mr-1 h-3 w-3" />
                      Kelola Slots
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    {account.type === 'NETFLIX' ? (
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          fetchNetflixProfiles(account.id);
                          setShowProfileModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 mr-2"
                        title="Kelola profil Netflix"
                      >
                        <span className="text-xs px-2 py-1 bg-purple-50 border border-purple-100 rounded-md flex items-center">
                          <FiUsers className="mr-1" size={12} />
                          Profil
                        </span>
                      </button>
                    ) : null}
                    
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setFormData({
                          type: account.type,
                          accountEmail: account.accountEmail,
                          accountPassword: account.accountPassword,
                          price: account.price.toString(),
                          description: account.description,
                          warranty: account.warranty.toString(),
                          isActive: account.isActive,
                          stock: account.stock ? account.stock.toString() : '1',
                          duration: account.duration ? account.duration.toString() : '1',
                        });
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Edit akun"
                    >
                      <span className="text-xs px-2 py-1 bg-blue-50 border border-blue-100 rounded-md flex items-center">
                        <FiEdit2 className="mr-1" size={12} />
                        Edit
                      </span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Hapus akun"
                    >
                      <span className="text-xs px-2 py-1 bg-red-50 border border-red-100 rounded-md flex items-center">
                        <FiTrash2 className="mr-1" size={12} />
                        Hapus
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edit Akun */}
      {showEditModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Akun</h2>
            <form onSubmit={handleEditAccount}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipe Akun</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'NETFLIX' | 'SPOTIFY' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="NETFLIX">Netflix</option>
                    <option value="SPOTIFY">Spotify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Akun</label>
                  <input
                    type="email"
                    value={formData.accountEmail}
                    onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password Akun</label>
                  <input
                    type="text"
                    value={formData.accountPassword}
                    onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Garansi (hari)</label>
                  <input
                    type="number"
                    value={formData.warranty}
                    onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status Ketersediaan
                    <span className="ml-1 text-xs text-gray-500">(1 = tersedia, 0 = habis)</span>
                  </label>
                  <select
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="1">Tersedia</option>
                    <option value="0">Habis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Masa Berlaku (bulan)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="1">1 Bulan</option>
                    <option value="2">2 Bulan</option>
                    <option value="3">3 Bulan</option>
                    <option value="6">6 Bulan</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Aktif</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAccount(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Edit Profil Netflix */}
      {showProfileModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Edit Profil Netflix - {selectedAccount.accountEmail}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingProfiles ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : profileError ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{profileError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Setiap akun Netflix dapat memiliki hingga 5 profil. Anda dapat mengedit nama, PIN, dan status profil anak untuk masing-masing profil.
                </p>
                
                <div className="space-y-4 mb-6">
                  {selectedAccountProfiles.map((profile, index) => (
                    <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <span className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold mr-3 ${
                            profile.isKids ? 'bg-green-500' : 'bg-red-600'
                          }`}>
                            {index + 1}
                          </span>
                          <h6 className="text-sm font-medium">{profile.isKids ? 'Profil Anak' : 'Profil Reguler'}</h6>
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.inUse ? (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              Sedang digunakan
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeProfile(index)}
                              className="text-red-600 hover:text-red-800 px-2 py-1 text-xs rounded-full border border-red-200 bg-red-50 flex items-center"
                            >
                              <FiTrash2 className="h-3 w-3 mr-1" />
                              Hapus
                            </button>
                          )}
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={profile.isKids}
                              onChange={e => updateProfile(index, 'isKids', e.target.checked)}
                              className="mr-1.5 h-4 w-4 text-indigo-600"
                            />
                            <span className="text-xs text-gray-600">Profil Anak</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">
                            Nama Profil
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => updateProfile(index, 'name', e.target.value)}
                            placeholder="Nama Profil"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">
                            PIN (Opsional)
                          </label>
                          <input
                            type="text"
                            value={profile.pin || ''}
                            onChange={(e) => updateProfile(index, 'pin', e.target.value)}
                            placeholder="PIN 4 digit (opsional)"
                            maxLength={4}
                            pattern="[0-9]*"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      {profile.inUse && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="italic">
                            Catatan: Profil ini sudah ditautkan ke pengguna. Perubahan pada profil ini akan mempengaruhi pengalaman pengguna.
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedAccountProfiles.length < 5 && (
                    <button
                      type="button"
                      onClick={addNewProfile}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center"
                    >
                      <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Tambah Profil Baru (tersisa {5 - selectedAccountProfiles.length})
                    </button>
                  )}
                </div>
                
                <div className="flex justify-end mt-6 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={saveProfiles}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Simpan Profil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Spotify Family Plan */}
      {showFamilyPlanModal && selectedSpotifyAccount && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Kelola Family Plan - {selectedSpotifyAccount.accountEmail}
              </h3>
              <button
                onClick={() => {
                  setShowFamilyPlanModal(false);
                  setSelectedSpotifyAccount(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <SpotifyFamilyForm
                accountId={selectedSpotifyAccount.id}
                isFamilyPlan={selectedSpotifyAccount.isFamilyPlan || false}
                maxSlots={selectedSpotifyAccount.maxSlots || 6}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowFamilyPlanModal(false);
                  setSelectedSpotifyAccount(null);
                  fetchAccounts();
                }}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk mengelola stok Netflix */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manajemen Stok Netflix</h2>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Stok Netflix dihitung berdasarkan jumlah profil yang tersedia pada setiap akun. 
                Satu akun Netflix dapat memiliki hingga 5 profil yang masing-masing dapat dialokasikan ke pengguna yang berbeda.
              </p>
              
              <button
                onClick={() => updateNetflixStock()}
                disabled={loadingStockInfo}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md flex items-center justify-center hover:bg-green-700 transition disabled:bg-gray-400 text-sm"
              >
                {loadingStockInfo ? 'Memperbarui...' : 'Perbarui Semua Stok Netflix'}
              </button>
            </div>
            
            {loadingStockInfo ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Mengambil informasi stok...</span>
              </div>
            ) : (
              <>
                {netflixStockInfo ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                        <h3 className="font-semibold text-blue-800 mb-1">Total Akun Netflix</h3>
                        <p className="text-2xl font-bold">{netflixStockInfo.totalAccounts}</p>
                      </div>
                      
                      <div className="bg-green-50 border border-green-100 p-4 rounded-md">
                        <h3 className="font-semibold text-green-800 mb-1">Total Profil</h3>
                        <p className="text-2xl font-bold">{netflixStockInfo.totalProfiles}</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-100 p-4 rounded-md">
                        <h3 className="font-semibold text-purple-800 mb-1">Total Stok Tersedia</h3>
                        <p className="text-2xl font-bold">{netflixStockInfo.totalStock}</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Akun</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profil</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profil Tersedia</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {netflixStockInfo.accounts.map((account: any) => (
                            <tr key={account.accountId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-gray-900">{account.email}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {account.totalProfiles}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  account.availableProfiles > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {account.availableProfiles}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => updateNetflixStock(account.accountId)}
                                  disabled={loadingStockInfo}
                                  className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded border border-indigo-200 text-xs hover:bg-indigo-100 transition"
                                >
                                  Perbarui Stok
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Informasi stok belum dimuat. Klik tombol "Perbarui Semua Stok Netflix" untuk memuat data.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Spotify Stock */}
      {showSpotifyStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Stok Akun Spotify</h2>
                <button
                  onClick={() => setShowSpotifyStockModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              {loadingSpotifyStockInfo ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : spotifyStockInfo ? (
                <div>
                  <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Akun</p>
                        <p className="text-lg font-bold">{spotifyStockInfo.totalAccounts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Slot</p>
                        <p className="text-lg font-bold">{spotifyStockInfo.totalSlots}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Slot Tersedia</p>
                        <p className="text-lg font-bold">{spotifyStockInfo.totalAvailableSlots}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Stok</p>
                        <p className="text-lg font-bold">{spotifyStockInfo.totalStock}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => updateSpotifyStock()}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                      >
                        Perbarui Semua Stok
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family Plan</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Slot</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot Tersedia</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {spotifyStockInfo.accounts.map((account: any) => (
                          <tr key={account.accountId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{account.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{account.isFamilyPlan ? 'Ya' : 'Tidak'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{account.totalSlots}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{account.availableSlots}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {account.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button
                                onClick={() => updateSpotifyStock(account.accountId)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Perbarui
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p>Tidak ada data stok tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 