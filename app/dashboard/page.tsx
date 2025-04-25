'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiShoppingBag, FiDollarSign, FiPackage, FiClock, FiUser, FiCreditCard } from 'react-icons/fi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderItem {
  type: string;
  price: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  activeSubscriptions: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    activeSubscriptions: 0,
    pendingOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await fetch('/api/orders');
        const data = await ordersResponse.json();
        
        // Pastikan kita memiliki array orders yang valid
        if (data && data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          
          // Calculate stats dari array orders yang valid
          const totalOrders = data.orders.length;
          const totalSpent = data.orders.reduce((sum: number, order: Order) => sum + order.totalAmount, 0);
          const activeSubscriptions = data.orders.filter((order: Order) => order.status === 'ACTIVE').length;
          const pendingOrders = data.orders.filter((order: Order) => order.status === 'PENDING').length;
          
          setStats({
            totalOrders,
            totalSpent,
            activeSubscriptions,
            pendingOrders
          });
        } else {
          console.error('Invalid orders data structure:', data);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Selamat Datang, {session?.user?.name}
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pesanan</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FiShoppingBag className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-2xl font-semibold text-gray-900">
                  Rp {stats.totalSpent.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Langganan Aktif</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pesanan Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: id })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'COMPLETED' ? 'Selesai' :
                          order.status === 'PENDING' ? 'Pending' :
                          order.status === 'ACTIVE' ? 'Aktif' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Belum ada pesanan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="bg-indigo-100 p-3 rounded-full mr-4">
              <FiUser className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">Profil Saya</h3>
              <p className="text-sm text-gray-500">Kelola informasi akun Anda</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/orders')}
            className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FiShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">Riwayat Pesanan</h3>
              <p className="text-sm text-gray-500">Lihat semua pesanan Anda</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/payment-methods')}
            className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FiCreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">Metode Pembayaran</h3>
              <p className="text-sm text-gray-500">Kelola metode pembayaran</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 