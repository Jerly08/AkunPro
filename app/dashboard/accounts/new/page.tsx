'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

export default function NewAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'NETFLIX',
    name: '',
    accountEmail: '',
    accountPassword: '',
    price: '',
    description: '',
    warranty: '30',
    stock: '1',
    duration: '1',
  });

  // Jika pengguna tidak terotentikasi atau bukan admin, redirect ke login
  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validasi data
      if (!formData.name || !formData.accountEmail || !formData.accountPassword || !formData.price || !formData.description) {
        throw new Error('Semua field harus diisi');
      }

      if (!/^\S+@\S+\.\S+$/.test(formData.accountEmail)) {
        throw new Error('Format email tidak valid');
      }

      // Konversi price ke number
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Harga harus berupa angka lebih dari 0');
      }

      // Konversi warranty ke number
      const warranty = parseInt(formData.warranty);
      if (isNaN(warranty) || warranty < 0) {
        throw new Error('Garansi harus berupa angka lebih dari atau sama dengan 0');
      }

      // Konversi stock ke number
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock <= 0) {
        throw new Error('Stock harus berupa angka lebih dari 0');
      }

      // Konversi duration ke number
      const duration = parseInt(formData.duration);
      if (isNaN(duration) || ![1, 2, 3, 6].includes(duration)) {
        throw new Error('Masa berlaku harus 1, 2, 3, atau 6 bulan');
      }

      // Debug data yang dikirim
      console.log("Data yang dikirim ke API:", {
        ...formData,
        price,
        warranty,
        stock,
        duration,
      });
      
      // Kirim data ke API
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price,
          warranty,
          stock,
          duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error dari API:", errorData);
        throw new Error(errorData.message || 'Gagal menambahkan akun');
      }

      // Redirect ke halaman daftar akun
      router.push('/dashboard/accounts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Akun Baru</h1>
        <Link
          href="/dashboard/accounts"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Kembali
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Akun Baru</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Akun
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="NETFLIX">Netflix</option>
                  <option value="SPOTIFY">Spotify</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Akun
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="cth: Netflix Premium 1 Bulan"
                />
              </div>

              <div>
                <label htmlFor="accountEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  id="accountEmail"
                  name="accountEmail"
                  value={formData.accountEmail}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="accountPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password Akun
                </label>
                <input
                  type="text"
                  id="accountPassword"
                  name="accountPassword"
                  value={formData.accountPassword}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label htmlFor="warranty" className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Garansi (hari)
                </label>
                <input
                  type="number"
                  id="warranty"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Berlaku (bulan)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="1">1 Bulan</option>
                  <option value="2">2 Bulan</option>
                  <option value="3">3 Bulan</option>
                  <option value="6">6 Bulan</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/accounts"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 