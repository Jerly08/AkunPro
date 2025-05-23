'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiArrowLeft, FiCalendar, FiClock, FiCreditCard, FiFileText, FiCheck, FiX, FiShoppingBag, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';

type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
type AccountType = 'NETFLIX' | 'SPOTIFY';

interface Account {
  id: string;
  type: AccountType;
  price: number;
  description: string;
  warranty: number;
  accountEmail?: string;
  accountPassword?: string;
}

interface OrderItem {
  id: string;
  price: number;
  account: Account;
}

interface Transaction {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  amount: number;
  paymentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paidAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  transaction: Transaction | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { data: session } = useSession();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching order details for ID:', orderId);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Terjadi kesalahan saat mengambil data pesanan');
        }
        
        const data = await response.json();
        console.log('Order data received:', data);
        
        // Validate that data has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error('Format data pesanan tidak valid');
        }
        
        // Check if the response has the expected structure with 'success' and 'order' fields
        if (data.success === true && data.order) {
          setOrder(data.order);
        } else if (data.success === false) {
          throw new Error(data.error || 'Terjadi kesalahan saat mengambil data pesanan');
        } else {
          // Handle legacy response format
          setOrder(data);
        }
        
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.message || 'Terjadi kesalahan saat mengambil data pesanan');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session && orderId) {
      fetchOrderDetail();
    }
  }, [session, orderId]);
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <FiClock className="mr-1 h-4 w-4" />;
      case 'PAID':
        return <FiCreditCard className="mr-1 h-4 w-4" />;
      case 'COMPLETED':
        return <FiCheck className="mr-1 h-4 w-4" />;
      case 'CANCELLED':
        return <FiX className="mr-1 h-4 w-4" />;
      default:
        return <FiShoppingBag className="mr-1 h-4 w-4" />;
    }
  };
  
  const getStatusText = (status: OrderStatus, order: Order) => {
    // Check for payment proof first
    if (status === 'PENDING' && order.transaction?.paymentUrl) {
      return 'Menunggu Verifikasi Pembayaran';
    }

    switch (status) {
      case 'PENDING':
        return 'Menunggu Verifikasi Pembayaran';
      case 'PAID':
        return 'Pembayaran Diterima';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Tidak tersedia';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Format tanggal tidak valid';
      
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Tidak tersedia';
    }
  };
  
  const formatCurrency = (amount: number) => {
    try {
      if (amount === undefined || amount === null || isNaN(amount)) {
        return 'Rp0';
      }
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return 'Rp0';
    }
  };
  
  if (!session) {
    return null;
  }
  
  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p>{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/orders')}
              className="mt-4"
            >
              Kembali ke Riwayat Pesanan
            </Button>
          </div>
        ) : order ? (
          <div className="space-y-8">
            {!order.items || !order.subtotalAmount || !order.totalAmount ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6">
                <p className="font-medium">Data pesanan tidak lengkap atau tidak valid.</p>
                <p className="text-sm mt-1">Beberapa informasi mungkin tidak dapat ditampilkan dengan benar.</p>
              </div>
            ) : null}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <FiFileText className="mr-2 h-5 w-5 text-indigo-500" />
                    Pesanan #{order.id || '(ID tidak valid)'}
                  </CardTitle>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <FiCalendar className="mr-1 h-4 w-4" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status, order)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="border-t border-gray-200 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-5">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Produk yang Dibeli</h4>
                  <div className="space-y-3">
                    {order.items && order.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between gap-2 pb-3">
                        <div className="w-full">
                          <p className="text-sm font-medium">{item.account.type} Premium</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)}
                          </p>
                          {(order.status === 'PAID' || order.status === 'COMPLETED') && item.account.accountEmail && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs break-words">
                              <p><strong>Email:</strong> {item.account.accountEmail}</p>
                              <p><strong>Password:</strong> {item.account.accountPassword}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Pajak (11%)</span>
                      <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-medium mt-4 pt-4 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 mt-5 pt-5">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pembayaran</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">Metode Pembayaran</p>
                      <p className="text-sm font-medium">{order.paymentMethod || 'Tidak tersedia'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status Pembayaran</p>
                      <p className="text-sm font-medium">
                        {order.transaction ? getStatusText(order.transaction.status as OrderStatus, order) : 'Belum ada transaksi'}
                      </p>
                    </div>
                    {order.paidAt && (
                      <div>
                        <p className="text-sm text-gray-500">Tanggal Pembayaran</p>
                        <p className="text-sm font-medium">{formatDate(order.paidAt)}</p>
                      </div>
                    )}
                    {order.expiresAt && order.status === 'PENDING' && (
                      <div>
                        <p className="text-sm text-gray-500">Batas Waktu Pembayaran</p>
                        <p className="text-sm font-medium">{formatDate(order.expiresAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 mt-5 pt-5">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pelanggan</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FiUser className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nama</p>
                        <p className="text-sm font-medium">{order.customerName || 'Tidak tersedia'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiMail className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium break-words">{order.customerEmail || 'Tidak tersedia'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiPhone className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telepon</p>
                        <p className="text-sm font-medium">{order.customerPhone || 'Tidak tersedia'}</p>
                      </div>
                    </div>
                    {order.customerAddress && (
                      <div className="flex items-start">
                        <FiMapPin className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Alamat</p>
                          <p className="text-sm font-medium break-words">{order.customerAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
} 