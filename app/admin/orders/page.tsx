'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiCheck, FiX, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';

interface NetflixProfile {
  id: string;
  name: string;
  isKids: boolean;
  orderId?: string;
  userId?: string;
}

interface OrderItem {
  id: string;
  accountId: string;
  price: number;
  account: {
    id: string;
    type: 'NETFLIX' | 'SPOTIFY';
    accountEmail: string;
    profiles?: NetflixProfile[];
  };
  netflixProfile?: {
    id: string;
    name: string;
    isKids: boolean;
  } | null;
  profiles?: NetflixProfile[];
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
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  paidAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  transaction?: {
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    paymentUrl?: string;
    paymentMethod?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) throw new Error('Gagal mengambil data pesanan');
      const data = await response.json();
      console.log('Data orders yang diterima:', data);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Menampilkan detail order ke console saat modal dibuka
  const handleViewOrderDetail = (order: Order) => {
    console.log('Order detail:', order);
    console.log('Items dengan profil Netflix:', order.items.filter(item => item.account.type === 'NETFLIX'));
    
    // Debug profil Netflix secara lebih detail
    order.items.forEach((item, index) => {
      if (item.account?.type === 'NETFLIX') {
        console.log(`Item ${index} (Netflix):`, {
          id: item.id,
          accountEmail: item.account.accountEmail,
          netflixProfile: item.netflixProfile,
          profiles: item.profiles
        });
      }
    });
    
    setSelectedOrder(order);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setProcessingOrder(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Gagal mengupdate status pesanan');
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleForcePayment = async (orderId: string) => {
    try {
      if (!confirm('Paksa update status order ini menjadi PAID (sudah dibayar)?')) {
        return;
      }
      
      setProcessingOrder(orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Kosong, hanya untuk memastikan format JSON valid
      });
      
      console.log(`Memperbarui order ${orderId} ke status PAID`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw new Error(`Gagal memperbarui order: ${errorData.message || errorData.error || response.statusText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        result = { success: true, message: 'Order berhasil diupdate' };
      }
      
      await fetchOrders();
      
      alert(result.message || 'Order berhasil diupdate menjadi PAID');
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      alert(`Error: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleMidtransForceUpdate = async (orderId: string) => {
    try {
      if (!confirm('Konfirmasi pembayaran menggunakan data dari notifikasi Midtrans?')) {
        return;
      }
      
      setProcessingOrder(orderId);
      
      // Gunakan metode direct update melalui admin API yang sudah terbukti berfungsi
      console.log(`Memperbarui order ${orderId} melalui API admin`);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gagal memperbarui status pembayaran: ${errorData.message || errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      await fetchOrders();
      
      // Tampilkan pesan sukses dengan status Midtrans
      let message = `Status berhasil diubah: ${result.message || 'Pembayaran berhasil diupdate'}`;
      
      // Tambahkan informasi status Midtrans jika tersedia
      if (result.midtrans) {
        message += `\n\nStatus Midtrans: ${result.midtrans.connected ? 'Terhubung' : 'Tidak terhubung'}`;
        if (result.midtrans.connected) {
          message += `\nStatus Transaksi: ${result.midtrans.status || 'Tidak diketahui'}`;
          message += `\nPesan: ${result.midtrans.message || '-'}`;
        } else {
          message += `\n${result.midtrans.message}`;
        }
      }
      
      alert(message);
    } catch (err) {
      console.error('Error updating payment:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      alert(`Error: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      if (!confirm('Konfirmasi bukti pembayaran ini dan ubah status menjadi PAID?')) {
        return;
      }
      
      setVerifyingPayment(true);
      setProcessingOrder(orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          verifyManualPayment: true 
        }),
      });
      
      // Tambahkan log
      console.log(`Verifikasi pembayaran untuk order ${orderId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          // Coba parse sebagai JSON
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Jika tidak valid JSON, gunakan text
          errorData = { error: errorText };
        }
        
        throw new Error(`Gagal memverifikasi pembayaran: ${errorData.message || errorData.error || response.statusText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        result = { success: true, message: 'Pembayaran berhasil diverifikasi' };
      }
      
      await fetchOrders();
      
      // Refresh selected order data
      const updatedOrderResponse = await fetch(`/api/admin/orders/${orderId}`);
      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        setSelectedOrder(updatedOrder);
      }
      
      alert(`Bukti pembayaran berhasil diverifikasi. ${result.message || ''}`);
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
    } finally {
      setVerifyingPayment(false);
      setProcessingOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Kelola Pesanan</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pesanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center">
          <FiFilter className="text-gray-400 mr-2" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="PAID">Dibayar</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders Table for desktop and tablets */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pesanan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.customerName}</div>
                  <div className="text-sm text-gray-500">{order.customerEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp {order.totalAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'PENDING' ? 'Menunggu' :
                     order.status === 'PAID' ? 'Dibayar' :
                     order.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => handleViewOrderDetail(order)}
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Lihat Detail"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                    
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleForcePayment(order.id)}
                          disabled={processingOrder === order.id}
                          className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-full transition-colors"
                          title="Update Status ke PAID"
                        >
                          <FiDollarSign className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {order.status === 'PAID' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        disabled={processingOrder === order.id}
                        className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-full transition-colors"
                        title="Tandai Selesai"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                    )}
                    
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        disabled={processingOrder === order.id}
                        className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                        title="Batalkan"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                    
                    {processingOrder === order.id && (
                      <span className="inline-block">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Orders View - Scrollable Table */}
      <div className="sm:hidden">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Pelanggan</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    {order.id.slice(0, 6)}...
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <div className="text-gray-900">{order.customerName.length > 10 ? order.customerName.substring(0, 10) + '...' : order.customerName}</div>
                    <div className="text-gray-500">{order.customerEmail.length > 10 ? order.customerEmail.substring(0, 10) + '...' : order.customerEmail}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    Rp {order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'PENDING' ? 'Menunggu' :
                       order.status === 'PAID' ? 'Dibayar' :
                       order.status === 'COMPLETED' ? 'Selesai' : 'Batal'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewOrderDetail(order)}
                        className="text-indigo-600 bg-indigo-50 p-1.5 rounded-full"
                        title="Lihat Detail"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                      </button>
                      
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleForcePayment(order.id)}
                            disabled={processingOrder === order.id}
                            className="text-green-600 bg-green-50 p-1.5 rounded-full"
                            title="Update Status ke PAID"
                          >
                            <FiDollarSign className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            disabled={processingOrder === order.id}
                            className="text-red-600 bg-red-50 p-1.5 rounded-full"
                            title="Batalkan"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      
                      {order.status === 'PAID' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                          disabled={processingOrder === order.id}
                          className="text-green-600 bg-green-50 p-1.5 rounded-full"
                          title="Tandai Selesai"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {processingOrder === order.id && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-indigo-600"></div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Detail Pesanan #{selectedOrder.id.slice(0, 8)}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Informasi Pelanggan</h3>
                <div className="mt-1">
                  <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  {selectedOrder.customerAddress && (
                    <p className="text-sm text-gray-500">{selectedOrder.customerAddress}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Informasi Pembayaran</h3>
                <div className="mt-1">
                  <p className="text-sm text-gray-900">Rp {selectedOrder.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Metode: {selectedOrder.paymentMethod}</p>
                  <p className="text-sm text-gray-500">
                    Status: {selectedOrder.transaction?.status || 'Belum ada transaksi'}
                  </p>
                  
                  {/* Enhanced payment proof display section */}
                  {selectedOrder.transaction?.paymentUrl && (
                    <div className="mt-3 border rounded-md overflow-hidden bg-white">
                      <div className="p-2 bg-indigo-50 border-b">
                        <h4 className="text-sm font-medium text-indigo-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          Bukti Pembayaran
                        </h4>
                      </div>
                      <div className="p-3 flex justify-center">
                        <a 
                          href={selectedOrder.transaction.paymentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={selectedOrder.transaction.paymentUrl} 
                            alt="Bukti Pembayaran" 
                            className="max-w-full max-h-64 object-contain border rounded"
                          />
                        </a>
                      </div>
                      <div className="p-3 bg-gray-50 flex flex-wrap justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">
                            Diunggah: {selectedOrder.transaction.updatedAt 
                              ? new Date(selectedOrder.transaction.updatedAt).toLocaleString('id-ID')
                              : 'Tidak diketahui'
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Metode Pembayaran: {selectedOrder.transaction.paymentMethod || selectedOrder.paymentMethod}
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <a 
                            href={selectedOrder.transaction.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-xs flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Lihat Gambar Penuh
                          </a>
                          
                          {selectedOrder.status === 'PENDING' && (
                            <button
                              onClick={() => handleVerifyPayment(selectedOrder.id)}
                              disabled={verifyingPayment}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center"
                            >
                              {verifyingPayment ? 
                                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg> : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              }
                              {verifyingPayment ? 'Memproses...' : 'Verifikasi Pembayaran'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment action buttons */}
                  {selectedOrder.status === 'PENDING' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleForcePayment(selectedOrder.id)}
                        disabled={processingOrder === selectedOrder.id}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Force Update PAID
                      </button>
                      
                      {selectedOrder.paymentMethod === 'MIDTRANS' && (
                        <button
                          onClick={() => handleMidtransForceUpdate(selectedOrder.id)}
                          disabled={processingOrder === selectedOrder.id}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded text-xs flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Check Midtrans
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Item Pesanan Section - restored */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Item Pesanan</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div key={item.id} className="mb-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.account?.type || 'Unknown'} - {item.account?.accountEmail || 'No Email'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900">
                          Rp {item.price.toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Tampilkan informasi profil Netflix jika tersedia */}
                      {item.account?.type === 'NETFLIX' && (
                        <div className="mt-2">
                          <div className="bg-blue-50 p-2 rounded-md mb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-medium text-blue-800 mb-1">Informasi Akun Netflix</p>
                                <p className="text-xs text-blue-700">Email: {item.account.accountEmail}</p>
                                <p className="text-xs text-blue-700">Account ID: {item.accountId}</p>
                                {item.netflixProfile && (
                                  <p className="text-xs text-blue-700 mt-1">
                                    Profil Aktif: {item.netflixProfile.name}
                                    {item.netflixProfile.isKids && ' (Anak-anak)'}
                                  </p>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  // Tampilkan informasi debug langsung di alert
                                  const debugInfo = {
                                    id: item.id,
                                    accountId: item.accountId,
                                    profiles: item.profiles,
                                    account: item.account,
                                    netflixProfile: item.netflixProfile
                                  };
                                  console.log('Debug item:', debugInfo);
                                  
                                  // Ambil profil langsung dari API untuk debugging
                                  fetch(`/api/admin/accounts/${item.accountId}`)
                                    .then(res => res.json())
                                    .then(data => {
                                      console.log('Account API data:', data);
                                      alert(`Debug info:\n${JSON.stringify({
                                        itemId: item.id,
                                        accountType: item.account?.type,
                                        hasProfiles: Array.isArray(item.profiles),
                                        profilesCount: Array.isArray(item.profiles) ? item.profiles.length : 0,
                                        accountProfiles: data.profiles?.length || 0
                                      }, null, 2)}`);
                                    })
                                    .catch(err => {
                                      console.error('Error fetching account:', err);
                                      alert(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
                                    });
                                }}
                                className="text-xs bg-blue-200 hover:bg-blue-300 px-1 py-0.5 rounded text-blue-800"
                              >
                                Debug
                              </button>
                            </div>
                          </div>
                          
                          {/* Tampilkan profil dari account.profiles jika tersedia */}
                          {item.account.profiles && item.account.profiles.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">
                                Daftar Semua Profil ({item.account.profiles.length}):
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {item.account.profiles.map(profile => (
                                  <div 
                                    key={profile.id} 
                                    className={`p-2 rounded-md text-xs ${
                                      profile.orderId || profile.userId 
                                        ? 'bg-green-50 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>
                                        {profile.name}
                                        {profile.isKids && ' 👶'}
                                      </span>
                                      {(profile.orderId || profile.userId) && (
                                        <span className="text-xs bg-green-200 px-1 rounded text-green-800">
                                          Digunakan
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-orange-500 bg-orange-50 p-2 rounded">
                              <p className="font-medium">Tidak ada data profil</p>
                              <p className="mt-1">Kemungkinan penyebab:</p>
                              <ul className="list-disc pl-4 mt-1">
                                <li>Akun belum memiliki profil yang dibuat</li>
                                <li>API tidak berhasil mengambil data profil</li>
                                <li>Ada kesalahan integrasi data</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tambahkan informasi detail untuk Spotify */}
                      {item.account?.type === 'SPOTIFY' && (
                        <div className="mt-2">
                          <div className="bg-green-50 p-2 rounded-md mb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-medium text-green-800 mb-1">Informasi Akun Spotify</p>
                                <p className="text-xs text-green-700">Email: {item.account.accountEmail}</p>
                                <p className="text-xs text-green-700">Account ID: {item.accountId}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Tidak ada item dalam pesanan ini
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 