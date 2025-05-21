'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiSearch, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  isForNewUsers: boolean;
  createdAt: string;
  updatedAt: string;
}

const VouchersAdminPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state for creating/editing voucher
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: '',
    isForNewUsers: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a random code with more options
  const generateRandomCode = (prefix = 'AKUNPRO') => {
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${randomPart}`;
  };

  // Generate a timed code (with expiry date in the code)
  const generateTimedCode = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear().toString().substring(2);
    return `PROMO${month}${year}${Math.floor(Math.random() * 100)}`;
  };

  // Generate a themed code
  const generateThemedCode = (theme) => {
    const themes = {
      'newuser': 'NEWUSER',
      'diskon': 'DISKON',
      'hemat': 'HEMAT',
      'spesial': 'SPESIAL'
    };
    
    const prefix = themes[theme] || 'PROMO';
    return `${prefix}${Math.floor(Math.random() * 100)}`;
  };

  // Template descriptions
  const getTemplateDescription = (type) => {
    const templates = {
      'newuser': 'Voucher spesial untuk pengguna baru dengan diskon eksklusif',
      'percent': 'Diskon persentase untuk pembelian Netflix dan Spotify',
      'fixed': 'Potongan langsung untuk pembelian akun premium',
      'netflix': 'Diskon spesial untuk pembelian akun Netflix',
      'spotify': 'Diskon khusus untuk pembelian akun Spotify',
      'combo': 'Diskon combo untuk pembelian Netflix dan Spotify sekaligus'
    };
    
    return templates[type] || '';
  };

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vouchers');
      if (!response.ok) {
        throw new Error('Failed to fetch vouchers');
      }
      const data = await response.json();
      setVouchers(data.vouchers);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Gagal memuat daftar voucher');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchVouchers();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/vouchers');
    }
  }, [status, session, router]);

  // Filter vouchers based on search query
  const filteredVouchers = vouchers.filter(voucher => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const voucherData = `${voucher.code} ${voucher.description}`.toLowerCase();
    return searchTerms.every(term => voucherData.includes(term));
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Open modal for creating new voucher
  const handleCreateNew = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const monthLater = new Date();
    monthLater.setMonth(monthLater.getMonth() + 1);

    setFormData({
      id: '',
      code: generateRandomCode(),
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: monthLater.toISOString().split('T')[0],
      isActive: true,
      usageLimit: '100',
      isForNewUsers: false
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing a voucher
  const handleEdit = (voucher: Voucher) => {
    setFormData({
      id: voucher.id,
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minPurchaseAmount: voucher.minPurchaseAmount?.toString() || '',
      maxDiscountAmount: voucher.maxDiscountAmount?.toString() || '',
      startDate: new Date(voucher.startDate).toISOString().split('T')[0],
      endDate: new Date(voucher.endDate).toISOString().split('T')[0],
      isActive: voucher.isActive,
      usageLimit: voucher.usageLimit?.toString() || '',
      isForNewUsers: voucher.isForNewUsers
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create payload
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      };

      // Send request
      const url = isEditing 
        ? `/api/admin/vouchers/${formData.id}` 
        : '/api/admin/vouchers';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error saving voucher');
      }

      // Success
      toast.success(isEditing ? 'Voucher berhasil diperbarui' : 'Voucher baru berhasil dibuat');
      setIsModalOpen(false);
      fetchVouchers();

    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voucher deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vouchers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete voucher');
      }

      toast.success('Voucher berhasil dihapus');
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Gagal menghapus voucher');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Manajemen Voucher</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari voucher..."
              className="border rounded-md pl-10 pr-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            <FiPlus /> Tambah Voucher
          </button>
        </div>
      </div>

      {/* Voucher list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diskon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validitas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penggunaan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentVouchers.length > 0 ? (
                currentVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{voucher.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{voucher.description}</div>
                      {voucher.isForNewUsers && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Pengguna Baru
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.discountType === 'PERCENTAGE' 
                          ? `${voucher.discountValue}%` 
                          : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`}
                      </div>
                      {voucher.minPurchaseAmount && (
                        <div className="text-xs text-gray-500">
                          Min: Rp {voucher.minPurchaseAmount.toLocaleString('id-ID')}
                        </div>
                      )}
                      {voucher.maxDiscountAmount && (
                        <div className="text-xs text-gray-500">
                          Max: Rp {voucher.maxDiscountAmount.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.usageCount} / {voucher.usageLimit || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {voucher.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(voucher)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada voucher yang cocok dengan pencarian' : 'Belum ada voucher yang dibuat'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiChevronLeft className="mr-2" /> Sebelumnya
              </button>
              <div className="hidden md:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium mx-1 ${
                      currentPage === page
                        ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } rounded-md`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <div className="md:hidden text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Selanjutnya <FiChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating/editing voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {isEditing ? 'Edit Voucher' : 'Buat Voucher Baru'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kode Voucher */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Voucher
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateRandomCode() }))}
                        className="bg-gray-200 hover:bg-gray-300 px-3 rounded-r-md border border-gray-300 flex items-center justify-center text-gray-700"
                        title="Generate Kode Baru"
                      >
                        <FiRefreshCw size={16} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Kode ini akan dimasukkan pengguna saat checkout.</p>
                  </div>

                  {/* Tambahkan bagian untuk menambah tombol "Generate Custom Code" */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generate Kode Custom
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateThemedCode('newuser') }))}
                        className="bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-md border border-indigo-200 text-sm text-indigo-700"
                      >
                        User Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateThemedCode('diskon') }))}
                        className="bg-green-50 hover:bg-green-100 px-3 py-2 rounded-md border border-green-200 text-sm text-green-700"
                      >
                        Diskon
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateThemedCode('hemat') }))}
                        className="bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md border border-blue-200 text-sm text-blue-700"
                      >
                        Hemat
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, code: generateTimedCode() }))}
                        className="bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-md border border-purple-200 text-sm text-purple-700"
                      >
                        Waktu
                      </button>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <div className="flex flex-col space-y-2">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, description: getTemplateDescription('newuser') }))}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 text-indigo-700"
                        >
                          User Baru
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, description: getTemplateDescription('percent') }))}
                          className="text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 text-blue-700"
                        >
                          Diskon %
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, description: getTemplateDescription('fixed') }))}
                          className="text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded border border-green-200 text-green-700"
                        >
                          Diskon Tetap
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, description: getTemplateDescription('netflix') }))}
                          className="text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 text-red-700"
                        >
                          Netflix
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, description: getTemplateDescription('spotify') }))}
                          className="text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded border border-green-200 text-green-700"
                        >
                          Spotify
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tipe Diskon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Diskon
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="PERCENTAGE">Persentase (%)</option>
                      <option value="FIXED">Nilai Tetap (Rp)</option>
                    </select>
                  </div>

                  {/* Nilai Diskon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai Diskon {formData.discountType === 'PERCENTAGE' ? '(%)' : '(Rp)'}
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Pembelian Minimum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pembelian Minimum (Rp)
                    </label>
                    <input
                      type="number"
                      name="minPurchaseAmount"
                      value={formData.minPurchaseAmount}
                      onChange={handleInputChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Kosongkan jika tidak ada minimum.</p>
                  </div>

                  {/* Maksimum Diskon */}
                  {formData.discountType === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksimum Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        min="0"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Kosongkan jika tidak ada batas.</p>
                    </div>
                  )}

                  {/* Tanggal Mulai */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Tanggal Akhir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Berakhir
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Batas Penggunaan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batas Penggunaan
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Kosongkan untuk penggunaan tak terbatas.</p>
                  </div>

                  {/* Checkboxes */}
                  <div className="col-span-2 space-y-4">
                    {/* Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Voucher Aktif
                      </label>
                    </div>

                    {/* Untuk Pengguna Baru */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isForNewUsers"
                        name="isForNewUsers"
                        checked={formData.isForNewUsers}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isForNewUsers" className="ml-2 block text-sm text-gray-700">
                        Hanya untuk pengguna baru
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </span>
                    ) : (
                      <>Simpan</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VouchersAdminPage; 