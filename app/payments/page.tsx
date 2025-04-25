'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  FiUser, 
  FiShoppingBag, 
  FiCreditCard, 
  FiHelpCircle, 
  FiHome,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('payments');

  // Ambil riwayat pembayaran
  useEffect(() => {
    const fetchPayments = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/payments');
        
        if (!response.ok) {
          throw new Error('Gagal memuat riwayat pembayaran');
        }
        
        const data = await response.json();
        setPayments(data.payments || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [status]);

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
          label: 'Berhasil',
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <FiCheckCircle className="h-4 w-4" />,
        };
      case 'FAILED':
        return {
          label: 'Gagal',
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <FiXCircle className="h-4 w-4" />,
        };
      case 'REFUNDED':
        return {
          label: 'Dikembalikan',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: <FiDollarSign className="h-4 w-4" />,
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

  // Format metode pembayaran
  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank_transfer':
        return 'Transfer Bank';
      case 'gopay':
        return 'GoPay';
      case 'ovo':
        return 'OVO';
      case 'dana':
        return 'DANA';
      case 'credit_card':
        return 'Kartu Kredit';
      default:
        return method;
    }
  };

  // Tampilan sidebar navigasi
  const SidebarNav = () => (
    <aside className="w-full md:w-64 md:flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative h-12 w-12">
            <Image
              src={session?.user?.image || '/images/avatar-placeholder.svg'}
              alt={session?.user?.name || 'User'}
              className="rounded-full object-cover"
              fill
              sizes="48px"
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{session?.user?.name}</h3>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/profile"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiUser className="mr-3 h-5 w-5" />
            Profil Saya
          </Link>
          
          <Link 
            href="/orders"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiShoppingBag className="mr-3 h-5 w-5" />
            Pesanan Saya
          </Link>
          
          <Link 
            href="/payments"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'payments' 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            <FiCreditCard className="mr-3 h-5 w-5" />
            Pembayaran
          </Link>
          
          <Link 
            href="/help"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiHelpCircle className="mr-3 h-5 w-5" />
            Bantuan
          </Link>
        </nav>
      </div>
    </aside>
  );

  // Konten loading
  if (loading) {
    return (
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h1>
            <nav className="flex space-x-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                <FiHome className="mr-1" /> Beranda
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-700">Pembayaran</span>
            </nav>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <SidebarNav />
            
            <div className="flex-1">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <FiHome className="mr-1" /> Beranda
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">Pembayaran</span>
          </nav>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <SidebarNav />
          
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 mb-6">
                {error}
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Berhasil</p>
                        <p className="text-2xl font-bold text-green-600">
                          {payments.filter(p => p.status === 'PAID').length}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FiCheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Tertunda</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {payments.filter(p => p.status === 'PENDING').length}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FiClock className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Gagal</p>
                        <p className="text-2xl font-bold text-red-600">
                          {payments.filter(p => p.status === 'FAILED' || p.status === 'REFUNDED').length}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FiXCircle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
              
              {payments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-medium text-gray-900 mb-2">
                    Belum Ada Pembayaran
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Anda belum melakukan pembayaran apapun. Silakan jelajahi akun premium yang tersedia.
                  </p>
                  <Link href="/">
                    <Button variant="primary">
                      Jelajahi Produk
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID Transaksi
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metode
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Aksi</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => {
                          const statusInfo = getStatusInfo(payment.status);
                          
                          return (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{payment.id.substring(0, 8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                Rp {payment.amount.toLocaleString('id-ID')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatPaymentMethod(payment.paymentMethod)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                  {statusInfo.icon}
                                  <span className="ml-1">{statusInfo.label}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link 
                                  href={`/orders/${payment.orderId}`}
                                  className="text-primary hover:text-primary-dark flex items-center justify-end"
                                >
                                  <FiFileText className="h-4 w-4 mr-1" />
                                  <span>Detail</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 