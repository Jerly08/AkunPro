'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiShoppingBag, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiHome, FiDollarSign, FiCalendar, FiPackage, FiCreditCard, FiMail, FiLock, FiUser } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface NetflixProfile {
  id: string;
  accountId: string;
  name: string;
  pin: string | null;
  isKids: boolean;
}

interface SpotifySlot {
  id: string;
  accountId: string;
  slotName: string;
  email: string | null;
  password: string | null;
  isActive: boolean;
  isAllocated: boolean;
  isMainAccount: boolean;
  account: {
    accountEmail: string;
    accountPassword: string;
    isFamilyPlan: boolean;
  } | null;
}

interface OrderItem {
  id: string;
  price: number;
  expiryDate?: Date;
  createdAt: string;
  account: {
    id: string;
    type: string;
    accountEmail: string;
    accountPassword: string;
    price: number;
    description: string;
    warranty: number;
    duration?: number;
  };
  netflixProfile?: NetflixProfile | null;
  spotifySlot?: SpotifySlot | null;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED' | 'PROCESSING';
  totalAmount: number;
  createdAt: string;
  paymentMethod: string;
  paidAt: string | null;
  items: OrderItem[];
}

interface OrderHistoryClientProps {
  orders: Order[];
}

export default function OrderHistoryClient({ orders: initialOrders }: OrderHistoryClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Format tanggal
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'd MMMM yyyy', { locale: id });
  };
  
  // Memastikan createdAt tersedia di item
  const getItemCreatedAt = (item: OrderItem, order: Order) => {
    return item.createdAt || order.createdAt;
  };
  
  // Helper untuk mendapatkan tanggal order
  const getOrderDate = (order: Order) => {
    return order.createdAt;
  };

  // Get status label and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Menunggu Pembayaran',
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <FiClock className="h-4 w-4" />,
        };
      case 'PAID':
        return {
          label: 'Telah Dibayar',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: <FiCheckCircle className="h-4 w-4" />,
        };
      case 'COMPLETED':
        return {
          label: 'Selesai',
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <FiCheckCircle className="h-4 w-4" />,
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <FiXCircle className="h-4 w-4" />,
        };
      case 'REFUNDED':
        return {
          label: 'Dana Dikembalikan',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FiDollarSign className="h-4 w-4" />,
        };
      case 'EXPIRED':
        return {
          label: 'Kedaluwarsa',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FiClock className="h-4 w-4" />,
        };
      case 'PROCESSING':
        return {
          label: 'Diproses',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FiClock className="h-4 w-4" />,
        };
      default:
        return {
          label: 'Status Tidak Diketahui',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FiClock className="h-4 w-4" />,
        };
    }
  };

  // Get account type summary
  const getAccountSummary = (items: OrderItem[]) => {
    const types = items.map(item => item.account.type);
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.map(type => {
      const count = types.filter(t => t === type).length;
      return `${type === 'NETFLIX' ? 'Netflix' : 'Spotify'} (${count})`;
    }).join(', ');
  };
  
  // Render account details
  const renderAccountDetails = (item: OrderItem) => {
    if (item.account.type === 'SPOTIFY') {
      return renderSpotifyDetails(item);
    } else if (item.account.type === 'NETFLIX') {
      return renderNetflixDetails(item);
    }
    return null;
  };
  
  // Render Spotify details
  const renderSpotifyDetails = (item: OrderItem) => {
    const spotifySlot = item.spotifySlot;
    const mainAccountEmail = spotifySlot?.account?.accountEmail || item.account.accountEmail;
    const mainAccountPassword = spotifySlot?.account?.accountPassword || item.account.accountPassword;
    const slotEmail = spotifySlot?.email;
    const slotPassword = spotifySlot?.password;
    
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
        <h3 className="font-medium text-gray-800 mb-3">Akun Spotify</h3>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <FiMail className="mt-1 mr-2 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm">{slotEmail || mainAccountEmail}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FiLock className="mt-1 mr-2 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-sm">{slotPassword || mainAccountPassword}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FiCalendar className="mt-1 mr-2 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Tanggal Pembelian</p>
              <p className="text-sm">{formatDate(getItemCreatedAt(item, orders[0]))}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FiCalendar className="mt-1 mr-2 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Berlaku Hingga</p>
              <p className="text-sm">{item.expiryDate ? formatDate(item.expiryDate) : 'Selamanya'}</p>
            </div>
          </div>
          
          {spotifySlot && spotifySlot.isMainAccount && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs text-green-700">
                <strong>Info:</strong> Ini adalah akun utama Spotify Family. Anda dapat menggunakan kredensial ini untuk login.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render Netflix details
  const renderNetflixDetails = (item: OrderItem) => {
    const profile = item.netflixProfile;
    
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
        <h3 className="font-medium text-gray-800 mb-3">Akun Netflix</h3>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <FiMail className="mt-1 mr-2 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm">{item.account.accountEmail}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FiLock className="mt-1 mr-2 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-sm">{item.account.accountPassword}</p>
            </div>
          </div>
          
          {profile && (
            <div className="flex items-start">
              <FiUser className="mt-1 mr-2 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Profil</p>
                <p className="text-sm">{profile.name} {profile.isKids && '(Kids)'}</p>
              </div>
            </div>
          )}
          
          {profile && profile.pin && (
            <div className="flex items-start">
              <FiLock className="mt-1 mr-2 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">PIN Profil</p>
                <p className="text-sm">{profile.pin}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start">
            <FiCalendar className="mt-1 mr-2 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Tanggal Pembelian</p>
              <p className="text-sm">{formatDate(getItemCreatedAt(item, orders[0]))}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FiCalendar className="mt-1 mr-2 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Berlaku Hingga</p>
              <p className="text-sm">{item.expiryDate ? formatDate(item.expiryDate) : 'Selamanya'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <nav className="flex space-x-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
            <FiHome className="mr-1" /> Beranda
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-700">Pesanan Saya</span>
        </nav>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
          <button 
            className="ml-2 text-red-700 underline" 
            onClick={() => setError(null)}
          >
            Tutup
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Belum Ada Pesanan
          </h2>
          <p className="text-gray-600 mb-6">
            Anda belum melakukan pembelian apapun. Silakan jelajahi akun premium yang tersedia.
          </p>
          <Link href="/">
            <Button variant="primary">
              Jelajahi Produk
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isCompleted = order.status === 'COMPLETED';
            
            return (
              <div key={order.id} className={`bg-white rounded-lg shadow-md p-6 flex flex-col h-full border-2 ${isCompleted ? 'border-green-200' : 'border-l-4 border-gray-300'}`}>
                {/* Header dengan status dan ID */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`flex items-center px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.icon}
                    <span className="ml-1 text-sm font-medium">{statusInfo.label}</span>
                  </span>
                  <span className="text-gray-600 text-sm">ID: {order.id.slice(0, 8)}</span>
                </div>
                
                {/* Main Content - Flex Grow untuk konsistensi tinggi */}
                <div className="flex-grow">
                  {isCompleted ? (
                    // Tampilkan detail lengkap untuk pesanan COMPLETED
                    <>
                      {/* Render Account Details */}
                      {order.items.map((item) => (
                        <div key={item.id}>
                          {renderAccountDetails(item)}
                        </div>
                      ))}
                    </>
                  ) : (
                    // Untuk pesanan yang tidak COMPLETED, tampilkan hanya rincian pembatalan
                    <div className="mb-4">
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h3 className="font-medium text-gray-700 mb-2">Rincian Status</h3>
                        
                        {order.status === 'CANCELLED' && (
                          <div className="text-red-600 text-sm mb-2">
                            Pesanan ini telah dibatalkan
                          </div>
                        )}
                        
                        {order.status === 'PENDING' && (
                          <div className="text-yellow-600 text-sm mb-2">
                            Menunggu pembayaran
                          </div>
                        )}
                        
                        {order.status === 'PAID' && (
                          <div className="text-blue-600 text-sm mb-2">
                            Pembayaran telah diterima, menunggu aktivasi akun
                          </div>
                        )}
                        
                        {order.status === 'REFUNDED' && (
                          <div className="text-gray-600 text-sm mb-2">
                            Dana telah dikembalikan ke akun Anda
                          </div>
                        )}
                        
                        {order.status === 'EXPIRED' && (
                          <div className="text-gray-600 text-sm mb-2">
                            Pesanan telah kedaluwarsa karena tidak ada pembayaran
                          </div>
                        )}
                        
                        {order.status === 'PROCESSING' && (
                          <div className="text-blue-600 text-sm mb-2">
                            Pesanan sedang diproses
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Tanggal pesanan: {formatDate(getOrderDate(order))}
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Untuk detail pesanan ini, silakan hubungi customer service.</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer - Selalu di bagian bawah kartu */}
                <div className="mt-auto">
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between font-medium mb-2">
                      <span className="text-gray-800">Total Pembayaran:</span>
                      <span className="text-gray-800">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    
                    {/* Status dan Tanggal */}
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>
                        Tanggal: {formatDate(getOrderDate(order))}
                      </span>
                      <span>
                        {order.paymentMethod}
                      </span>
                    </div>
                  
                    {/* Tombol Aksi */}
                    {order.status === 'PENDING' && (
                      <div className="mt-4 flex justify-end">
                        <Link href={`/checkout/payment/${order.id}`}>
                          <Button variant="primary" size="sm">
                            Bayar Sekarang
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 