'use client';

import Link from 'next/link';
import { FiPlay, FiMusic, FiArrowLeft, FiCalendar, FiShield, FiClock } from 'react-icons/fi';
import AddToCartButton from '@/components/cart/AddToCartButton';

interface Account {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
}

interface AccountDetailClientProps {
  account: Account;
}

export default function AccountDetailClient({ account }: AccountDetailClientProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return <FiPlay className="h-8 w-8 text-red-600" />;
      case 'SPOTIFY':
        return <FiMusic className="h-8 w-8 text-green-600" />;
      default:
        return null;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return 'Netflix Premium';
      case 'SPOTIFY':
        return 'Spotify Premium';
      default:
        return '';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return 'from-red-600 to-red-700';
      case 'SPOTIFY':
        return 'from-green-600 to-green-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };
  
  const calculateWarrantyEnd = (warrantyDays: number) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + warrantyDays);
    
    return endDate.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        href={`/account?type=${account.type}`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Kembali ke Daftar Akun
      </Link>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-lg">
        <div className={`bg-gradient-to-r ${getTypeColor(account.type)} p-8 text-white`}>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{getTypeLabel(account.type)}</h1>
            {getIcon(account.type)}
          </div>
          <div className="mt-2 text-white/80">
            ID: {account.id.substring(0, 8)}...
          </div>
        </div>
        
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Detail Akun</h2>
            <p className="text-gray-700 mb-6">{account.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <FiShield className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Garansi</h3>
                  <p className="text-gray-600">{account.warranty} hari</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <FiClock className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Berakhir Pada</h3>
                  <p className="text-gray-600">{calculateWarrantyEnd(account.warranty)}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <FiCalendar className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <p className="text-gray-600">{account.isActive ? 'Tersedia' : 'Tidak Tersedia'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <p className="text-gray-500 text-sm">Harga</p>
              <div className="text-3xl font-bold text-gray-900">
                Rp {account.price.toLocaleString('id-ID')}
              </div>
              <p className="text-gray-500 text-sm mt-1">Termasuk garansi selama {account.warranty} hari</p>
            </div>
            
            <AddToCartButton 
              account={{
                id: account.id,
                type: account.type,
                price: account.price,
              }}
              disabled={!account.isActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 