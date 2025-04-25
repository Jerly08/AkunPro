'use client';

import Link from 'next/link';
import { FiUser, FiShoppingBag, FiCreditCard, FiHelpCircle, FiHome, FiSettings, FiTrello, FiClock, FiPackage, FiCalendar, FiAlertCircle, FiCheckCircle, FiEye, FiDollarSign, FiFilm, FiMusic } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/Card';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  price: number;
  account: {
    type: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  netflixAccounts: number;
  spotifyAccounts: number;
  lastOrder: Order | undefined;
}

interface DashboardClientProps {
  user: User;
  stats: Stats;
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
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

  // Format tanggal bergabung
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <nav className="flex space-x-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
            <FiHome className="mr-1" /> Beranda
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-700">Dashboard</span>
        </nav>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 md:flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative h-12 w-12">
                <Image
                  src={user.image || '/images/avatar-placeholder.svg'}
                  alt={user.name}
                  className="rounded-full object-cover"
                  fill
                  sizes="48px"
                  priority
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link 
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-white"
              >
                <FiTrello className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
              
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
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
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
              
              <Link 
                href="/settings"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                <FiSettings className="mr-3 h-5 w-5" />
                Pengaturan
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* User Info Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Informasi Akun
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Detail Profil</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Nama:</span> {user.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Bergabung:</span> {formatJoinDate(user.createdAt)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Role:</span> {user.role}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Statistik Akun</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Total Pesanan:</span> {stats.totalOrders}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total Pengeluaran:</span> Rp {stats.totalSpent.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Akun Netflix:</span> {stats.netflixAccounts}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Akun Spotify:</span> {stats.spotifyAccounts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Pesanan</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Rp {stats.totalSpent.toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FiDollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Akun Netflix</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.netflixAccounts}</h3>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FiFilm className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Akun Spotify</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.spotifyAccounts}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FiMusic className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Order Section */}
          {stats.lastOrder && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiShoppingBag className="mr-2 h-5 w-5 text-primary" />
                      Pesanan Terakhir
                    </div>
                    <Link 
                      href="/orders" 
                      className="text-sm font-medium text-primary hover:text-primary-dark flex items-center"
                    >
                      Lihat Semua
                      <FiEye className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ID Pesanan:</span>
                    <span className="font-medium">{stats.lastOrder.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="font-medium">{formatDate(stats.lastOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium text-green-600">Selesai</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total:</span>
                      <span className="text-primary">
                        Rp {stats.lastOrder.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/profile">
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-6 flex items-center">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <FiUser className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Edit Profil</h3>
                    <p className="text-sm text-gray-500">Perbarui informasi dan foto profil Anda</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/products">
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-6 flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <FiShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Belanja Akun</h3>
                    <p className="text-sm text-gray-500">Jelajahi koleksi akun premium kami</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 