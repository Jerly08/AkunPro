'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiShoppingBag, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiHome } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface OrderItem {
  id: string;
  price: number;
  account: {
    type: string;
  };
}

interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default:
        return {
          label: 'Status Tidak Diketahui',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FiClock className="h-4 w-4" />,
        };
    }
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

      <div className="bg-white rounded-lg shadow-md">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
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
          <div className="divide-y divide-gray-200">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        ID Pesanan: {order.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tanggal: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    
                    <div className={`mt-4 sm:mt-0 flex items-center px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.icon}
                      <span className="ml-1 text-sm font-medium">{statusInfo.label}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Detail Pesanan</h3>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span className="text-gray-900">
                            {item.account.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
                          </span>
                          <span className="text-gray-900 font-medium">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-medium text-gray-900">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    {order.status === 'PENDING' && (
                      <Link href={`/checkout/payment/${order.id}`}>
                        <Button variant="primary" size="sm" className="flex items-center">
                          Lanjutkan Pembayaran <FiArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    )}
                    
                    <Link href={`/orders/${order.id}`} className={order.status === 'PENDING' ? 'ml-3' : ''}>
                      <Button 
                        variant={order.status === 'PENDING' ? 'outline' : 'primary'}
                        size="sm"
                        className="flex items-center"
                      >
                        Lihat Detail <FiArrowRight className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 