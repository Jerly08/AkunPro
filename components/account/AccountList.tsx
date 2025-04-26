'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiPlay, FiMusic, FiShoppingCart, FiInfo, FiCheck, FiClock, FiEye, FiUsers } from 'react-icons/fi';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Definisi tipe secara manual
type AccountType = 'NETFLIX' | 'SPOTIFY';

interface Account {
  id: string;
  type: AccountType;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  duration?: number;
  stock?: number;
}

interface AccountListProps {
  accounts: Account[];
  type: AccountType;
}

const AccountList = ({ accounts, type }: AccountListProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart, isItemInCart } = useCart();
  
  const handleAddToCart = async (account: Account) => {
    try {
      // Tambahkan ke cart context
      await addToCart(account);
      
      // Tampilkan notifikasi
      toast.success('Produk berhasil ditambahkan ke keranjang belanja', {
        duration: 3000,
        position: 'top-center',
      });
      
      // Arahkan ke halaman keranjang
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Gagal menambahkan produk ke keranjang', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const getIcon = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return <FiPlay className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />;
      case 'SPOTIFY':
        return <FiMusic className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return 'Netflix Premium';
      case 'SPOTIFY':
        return 'Spotify Premium';
      default:
        return '';
    }
  };

  const getTypeColor = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return 'bg-red-100 text-red-800';
      case 'SPOTIFY':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateWarrantyEnd = (warrantyDays: number) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + warrantyDays);
    
    // Format tanggal ke format Indonesia
    return endDate.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow">
        <div className="mb-3 sm:mb-4">
          {type === 'NETFLIX' 
            ? <FiPlay className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-red-600" />
            : <FiMusic className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
          }
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
          Tidak ada akun {getTypeLabel(type)} yang tersedia saat ini
        </h3>
        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
          Saat ini semua akun {getTypeLabel(type)} sedang habis. Silakan coba lagi nanti atau hubungi kami untuk informasi lebih lanjut.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center border border-indigo-600 rounded-md px-3 py-2 text-sm sm:text-base">
            Kembali ke Beranda
          </Link>
          <Link href="/contact" className="bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md px-3 py-2 flex items-center justify-center text-sm sm:text-base">
            Hubungi Admin
          </Link>
        </div>
      </div>
    );
  }

  // Logging untuk debugging
  console.log("Original accounts:", accounts);
  
  // Urutkan account berdasarkan durasi
  accounts.sort((a, b) => (a.duration || 1) - (b.duration || 1));
  
  // Akun yang sudah diurutkan siap ditampilkan
  const uniqueAccounts = accounts;
  
  // Pastikan stok selalu tampil dengan menambahkan kondisi lebih permisif
  const shouldShowStock = true; // Gunakan ini alih-alih memeriksa account.stock !== undefined

  return (
    <div className="space-y-4 sm:space-y-6">
      {uniqueAccounts.map((account) => (
        <div key={account.id} className="border rounded-lg shadow-sm overflow-hidden">
          {/* Header dengan durasi dan stok */}
          <div className={`px-4 py-3 sm:px-6 sm:py-4 ${
            account.type === 'NETFLIX' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <div className="mr-2 sm:mr-3">{getIcon(account.type)}</div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold">{getTypeLabel(account.type)}</h3>
                  <div className="flex items-center mt-1">
                    <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                      Paket {account.duration || 1} Bulan
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                <div className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                  Harga: Rp {account.price.toLocaleString('id-ID')}
                </div>
                <div className="bg-white text-gray-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center">
                  <FiUsers className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Stok: {(account.stock || 0) > 0 ? (account.stock || 0) : 'Habis'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Konten dengan detail */}
          <div className="p-4 sm:p-6 bg-white">
            <div className="flex justify-end mb-3 sm:mb-4">
              {account.isActive ? (
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 flex items-center rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <FiCheck className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Akun Aktif
                </span>
              ) : (
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 flex items-center rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <FiClock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Tidak Aktif
                </span>
              )}
            </div>
            
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                {account.description.length > 150 
                  ? `${account.description.substring(0, 150)}...` 
                  : account.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <FiInfo className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <span>Garansi: <strong>{account.warranty} hari</strong></span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <span>Berakhir: <strong>{calculateWarrantyEnd(account.warranty)}</strong></span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-3 sm:mt-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {account.price.toLocaleString('id-ID')}
                  </div>
                  <div className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
                    Paket {account.duration || 1} Bulan
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Termasuk garansi {account.warranty} hari & support</div>
              </div>
              <div className="flex space-x-2 items-center mt-3 sm:mt-0">
                <Link href={`/account/${account.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:bg-gray-50 text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3"
                  >
                    <FiEye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Detail
                  </Button>
                </Link>
                <button 
                  disabled={(account.stock || 0) <= 0} 
                  className={cn(
                    "px-3 py-1 sm:px-4 sm:py-2 rounded-md text-white font-medium text-xs sm:text-sm",
                    account.type === "NETFLIX" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                    ((account.stock || 0) <= 0) && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleAddToCart(account)}
                >
                  {(account.stock || 0) <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountList; 