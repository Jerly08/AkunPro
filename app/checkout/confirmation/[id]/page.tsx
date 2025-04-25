'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiCheckCircle, FiMail, FiKey, FiAlertCircle, FiExternalLink, FiCreditCard, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';

interface AccountDetail {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  accountEmail: string;
  accountPassword: string;
  price: number;
  description: string;
  warranty: number;
}

interface OrderItem {
  id: string;
  price: number;
  account: AccountDetail;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function ConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          throw new Error('Terjadi kesalahan saat mengambil detail pesanan');
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        // API sekarang mengembalikan data order langsung, bukan dalam properti order
        if (!data || !data.id) {
          throw new Error('Data pesanan tidak ditemukan');
        }
        
        // Pastikan pesanan sudah dibayar
        if (data.status !== 'PAID' && data.status !== 'COMPLETED') {
          router.push(`/checkout/payment/${id}`);
          return;
        }
        
        setOrder(data);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.message || 'Terjadi kesalahan saat mengambil data pesanan');
      } finally {
        setLoading(false);
      }
    };
    
    if (session && id) {
      fetchOrderDetails();
    }
  }, [id, router, session]);
  
  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <FiAlertCircle className="h-10 w-10 mb-4 text-red-500" />
          <h1 className="text-xl font-semibold mb-2">{error}</h1>
          <p>Silakan coba lagi nanti atau hubungi layanan pelanggan kami.</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => router.push('/orders')}
          >
            Lihat Riwayat Pesanan
          </Button>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return null;
  }
  
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full inline-block">
              <FiCheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
            Pembayaran Berhasil!
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Terima kasih atas pembelian Anda. Detail akun Anda sudah siap digunakan.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detail Akun
            </h2>
            
            <div className="space-y-6">
              {order.items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.account.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-start">
                        <FiMail className="mt-0.5 h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Email Akun</p>
                          <p className="text-sm font-medium break-all">{item.account.accountEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-start">
                        <FiKey className="mt-0.5 h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Password Akun</p>
                          <p className="text-sm font-medium break-all">{item.account.accountPassword}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Deskripsi: {item.account.description}</p>
                    <p className="mt-1">Garansi: {item.account.warranty} hari</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <p className="text-sm text-gray-500 mb-2 sm:mb-0">
                        Harga: <span className="font-medium text-gray-900">{formatCurrency(item.price)}</span>
                      </p>
                      
                      {item.account.type === 'NETFLIX' && (
                        <a 
                          href="https://www.netflix.com/login" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Login ke Netflix <FiExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      )}
                      
                      {item.account.type === 'SPOTIFY' && (
                        <a 
                          href="https://accounts.spotify.com/login" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Login ke Spotify <FiExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Pembayaran</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-3">
                  <FiCreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Metode Pembayaran</p>
                    <p className="text-sm font-medium">{order.paymentMethod}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Pembayaran</p>
                    <p className="text-sm font-medium">{formatDate(order.paidAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-l-0 md:border-l border-gray-200 md:pl-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="text-sm font-medium">{formatCurrency(order.subtotalAmount)}</p>
                </div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-500">Pajak</p>
                  <p className="text-sm font-medium">{formatCurrency(order.taxAmount)}</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <p className="text-base font-medium">Total</p>
                  <p className="text-base font-bold text-indigo-600">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button 
            variant="outline"
            onClick={() => window.print()}
          >
            Cetak Bukti Pembayaran
          </Button>
          
          <Button 
            variant="primary"
            onClick={() => router.push('/orders')}
          >
            Lihat Riwayat Pesanan
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
} 