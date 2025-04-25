'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiEdit, FiPlus, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// Definisi tipe untuk data akun
interface Account {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  accountEmail: string;
  accountPassword: string;
  isActive: boolean;
  price: number;
  description: string;
  warranty: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'NETFLIX' | 'SPOTIFY'>('ALL');

  useEffect(() => {
    // Jika pengguna tidak terotentikasi atau bukan admin, redirect ke halaman login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchAccounts();
      }
    }
  }, [status, router, session]);

  // Fungsi untuk fetch data akun dari API
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      // Implementasi fetch data dari API
      const response = await fetch('/api/admin/accounts');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data akun');
      }
      
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Contoh data statis untuk demonstrasi
      setAccounts([
        {
          id: '1',
          type: 'NETFLIX',
          accountEmail: 'netflix1@example.com',
          accountPassword: '********',
          isActive: true,
          price: 150000,
          description: 'Netflix Premium 1 bulan',
          warranty: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'SPOTIFY',
          accountEmail: 'spotify1@example.com',
          accountPassword: '********',
          isActive: true,
          price: 75000,
          description: 'Spotify Premium 1 bulan',
          warranty: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter akun berdasarkan pencarian dan filter
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.accountEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'ALL' || account.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Fungsi untuk menghapus akun
  const handleDeleteAccount = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      try {
        const response = await fetch(`/api/admin/accounts/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Gagal menghapus akun');
        }
        
        // Refresh daftar akun
        setAccounts(accounts.filter(account => account.id !== id));
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Terjadi kesalahan saat menghapus akun');
      }
    }
  };

  // Fungsi untuk toggle status aktif
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengubah status akun');
      }
      
      // Update status di state lokal
      setAccounts(
        accounts.map(account => 
          account.id === id ? { ...account, isActive: !currentStatus } : account
        )
      );
    } catch (error) {
      console.error('Error updating account status:', error);
      alert('Terjadi kesalahan saat mengubah status akun');
    }
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Akun</h1>
          <p className="text-gray-600 mt-1">
            Kelola akun Netflix dan Spotify yang tersedia untuk dijual
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        >
          <FiPlus /> Tambah Akun
        </Link>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari akun..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'ALL' | 'NETFLIX' | 'SPOTIFY')}
              >
                <option value="ALL">Semua Tipe</option>
                <option value="NETFLIX">Netflix</option>
                <option value="SPOTIFY">Spotify</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <li key={account.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        account.type === 'NETFLIX' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {account.type === 'NETFLIX' ? 'N' : 'S'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
                        </div>
                        <div className="text-sm text-gray-500">{account.accountEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          account.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {account.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Rp {account.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Garansi {account.warranty} hari
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => handleToggleStatus(account.id, account.isActive)}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                        account.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <Link
                      href={`/dashboard/accounts/edit/${account.id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      <FiEdit className="mr-1" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      <FiTrash2 className="mr-1" /> Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 sm:px-6 text-center text-gray-500">
              {searchQuery || filter !== 'ALL' 
                ? 'Tidak ada akun yang sesuai dengan filter' 
                : 'Belum ada akun yang tersedia'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 