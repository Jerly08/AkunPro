'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  items: {
    id: string;
    account: {
      type: 'NETFLIX' | 'SPOTIFY';
      description: string;
    };
    price: number;
  }[];
}

export default function OrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // Implementasi fetch data dari API
      // Contoh data statis untuk demo
      setOrders([
        {
          id: '12345',
          totalAmount: 120000,
          paymentStatus: 'PENDING',
          createdAt: '2023-03-12T10:30:00Z',
          items: [
            {
              id: '1',
              account: {
                type: 'NETFLIX',
                description: 'Netflix Premium - 1 bulan',
              },
              price: 120000,
            },
          ],
        },
        {
          id: '12344',
          totalAmount: 150000,
          paymentStatus: 'PAID',
          createdAt: '2023-03-10T14:20:00Z',
          items: [
            {
              id: '2',
              account: {
                type: 'SPOTIFY',
                description: 'Spotify Premium - 3 bulan',
              },
              price: 150000,
            },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'PAID':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <FiXCircle className="h-5 w-5 text-red-500" />;
      case 'REFUNDED':
        return <FiRefreshCw className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Tertunda';
      case 'PAID':
        return 'Dibayar';
      case 'FAILED':
        return 'Gagal';
      case 'REFUNDED':
        return 'Dikembalikan';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Saya</h1>
        <p className="text-gray-600">
          Lihat dan kelola semua pesanan Anda
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <div className="flex items-center">
                    {getStatusIcon(order.paymentStatus)}
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {getStatusText(order.paymentStatus)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">
                    Tanggal Pemesanan: {formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: Rp {order.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Item Pesanan</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.account.description}</p>
                          <p className="text-sm text-gray-500">
                            Tipe: {item.account.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
                          </p>
                        </div>
                        <p className="font-medium">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.paymentStatus === 'PENDING' && (
                  <div className="mt-6 flex justify-end">
                    <Button variant="primary">
                      Lanjutkan Pembayaran
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Anda belum memiliki pesanan</p>
            <Button
              onClick={() => router.push('/')}
              variant="primary"
            >
              Mulai Berbelanja
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 