import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FiDatabase, FiUsers, FiShoppingBag, FiSettings, FiBarChart2, FiMessageCircle } from 'react-icons/fi';
import { authOptions } from '@/lib/auth';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import prisma from '@/lib/prisma';
import ClientDatabaseStatus from '@/components/admin/ClientDatabaseStatus';

export default async function AdminDashboardPage() {
  // Periksa sesi pengguna (auth) dengan authOptions
  const session = await getServerSession(authOptions);
  
  // Jika pengguna tidak login atau bukan admin, redirect ke halaman login
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  try {
    // Ambil data statistik
    const [
      totalAccounts,
      totalUsers,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.account.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        }
      })
    ]);

    return (
      <div className="w-full">
        <AdminHeader title="Dashboard Admin" />
        
        {/* Database Status Component */}
        <ClientDatabaseStatus />
        
        {/* Stats Cards - Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <AdminStats 
            title="Total Akun" 
            value={totalAccounts.toString()} 
            description="Akun tersedia untuk dijual" 
            icon={<FiDatabase className="h-6 w-6 text-blue-600" />} 
          />
          <AdminStats 
            title="Total Pengguna" 
            value={totalUsers.toString()} 
            description="Pengguna terdaftar" 
            icon={<FiUsers className="h-6 w-6 text-green-600" />} 
          />
          <AdminStats 
            title="Total Pesanan" 
            value={totalOrders.toString()} 
            description="Pesanan masuk" 
            icon={<FiShoppingBag className="h-6 w-6 text-purple-600" />} 
          />
          <AdminStats 
            title="Total Pendapatan" 
            value={`Rp ${(totalRevenue._sum?.totalAmount || 0).toLocaleString('id-ID')}`} 
            description="Total pendapatan" 
            icon={<FiBarChart2 className="h-6 w-6 text-red-600" />} 
          />
        </div>

        {/* Admin Menu Cards - Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/admin/accounts" className="group">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-300 group-hover:shadow-lg h-full">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <FiDatabase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Kelola Akun</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Tambah, edit, dan hapus akun Netflix dan Spotify. Kelola ketersediaan dan harga.
              </p>
              <span className="text-blue-600 text-xs sm:text-sm font-medium group-hover:underline">
                Kelola Akun
              </span>
            </div>
          </Link>
          
          <Link href="/admin/orders" className="group">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-300 group-hover:shadow-lg h-full">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <FiShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Pesanan</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Kelola pesanan masuk, konfirmasi pembayaran, dan atur pengiriman akun ke pelanggan.
              </p>
              <span className="text-purple-600 text-xs sm:text-sm font-medium group-hover:underline">
                Kelola Pesanan
              </span>
            </div>
          </Link>
          
          <Link href="/admin/users" className="group">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-300 group-hover:shadow-lg h-full">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <FiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Pengguna</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Kelola pengguna, reset password, dan ubah peran pengguna (admin/user).
              </p>
              <span className="text-green-600 text-xs sm:text-sm font-medium group-hover:underline">
                Kelola Pengguna
              </span>
            </div>
          </Link>
          
          <Link href="/admin/settings" className="group">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-300 group-hover:shadow-lg h-full">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="bg-gray-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <FiSettings className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Pengaturan</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Konfigurasi situs, pengaturan pembayaran, dan preferensi notifikasi.
              </p>
              <span className="text-gray-600 text-xs sm:text-sm font-medium group-hover:underline">
                Buka Pengaturan
              </span>
            </div>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/chat" className="bg-white overflow-hidden shadow rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2 sm:p-3">
                  <FiMessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Chat Support</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Manage customer chat support</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return (
      <div className="w-full">
        <AdminHeader title="Dashboard Admin" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Terjadi kesalahan saat memuat data dashboard. Silakan coba lagi nanti.</p>
        </div>
      </div>
    );
  }
} 