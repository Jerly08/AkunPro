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
      <div className="flex gap-4 mb-6">
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
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="PAID">Dibayar</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <button
                    onClick={() => handleViewOrderDetail(order)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Lihat Detail"
                  >
                    <FiEye className="inline-block" />
                  </button>
                  
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleForcePayment(order.id)}
                        disabled={processingOrder === order.id}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Update Status ke PAID"
                      >
                        <FiDollarSign className="inline-block" />
                      </button>
                    </>
                  )}
                  
                  {order.status === 'PAID' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      disabled={processingOrder === order.id}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="Tandai Selesai"
                    >
                      <FiCheck className="inline-block" />
                    </button>
                  )}
                  
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      disabled={processingOrder === order.id}
                      className="text-red-600 hover:text-red-900"
                      title="Batalkan"
                    >
                      <FiX className="inline-block" />
                    </button>
                  )}
                  
                  {processingOrder === order.id && (
                    <span className="ml-2 inline-block">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detail Pesanan #{selectedOrder.id.slice(0, 8)}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
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
                  
                  {selectedOrder.transaction?.paymentUrl && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-600">Bukti Pembayaran:</p>
                      <div className="mt-1 border rounded-md overflow-hidden">
                        <a 
                          href={selectedOrder.transaction.paymentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={selectedOrder.transaction.paymentUrl} 
                            alt="Bukti Pembayaran" 
                            className="w-full max-h-40 object-contain"
                          />
                        </a>
                        <div className="p-2 bg-gray-50 text-xs">
                          <p className="text-gray-500">
                            Diunggah: {selectedOrder.transaction.updatedAt 
                              ? new Date(selectedOrder.transaction.updatedAt).toLocaleString('id-ID')
                              : 'Tidak diketahui'
                            }
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <a 
                              href={selectedOrder.transaction.paymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 inline-block"
                            >
                              Lihat ukuran penuh
                            </a>
                            
                            {selectedOrder.status === 'PENDING' && (
                              <button
                                onClick={() => handleVerifyPayment(selectedOrder.id)}
                                disabled={verifyingPayment}
                                className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                              >
                                {verifyingPayment ? 'Memproses...' : 'Verifikasi Pembayaran'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Item Pesanan</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div key={item.id} className="mb-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
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
                                
                                {/* Tambahkan informasi slot yang dialokasikan */}
                                <div 
                                  id={`spotify-slot-info-${item.id}`} 
                                  className="mt-2 pt-2 border-t border-green-200"
                                >
                                  <p className="text-xs text-green-700">
                                    <i>Memuat informasi slot...</i>
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  // Tampilkan informasi slot Spotify yang dibeli oleh user
                                  fetch(`/api/admin/spotify-slots/order/${item.id}`)
                                    .then(res => res.json())
                                    .then(data => {
                                      console.log('Purchased Spotify slot data:', data);
                                      if (data.slot) {
                                        alert(`Informasi Slot Spotify yang dibeli:
Nama Slot: ${data.slot.slotName}
Status: ${data.slot.isAllocated ? 'Dialokasikan' : 'Belum Dialokasikan'}
User Email: ${data.slot.user ? data.slot.user.email : 'Belum ada user'}
Akun: ${data.slot.account?.accountEmail || 'Tidak tersedia'}`);
                                      } else {
                                        alert('Belum ada slot Spotify yang dibeli untuk order ini');
                                      }
                                    })
                                    .catch(err => {
                                      console.error('Error fetching purchased slot:', err);
                                      alert(`Error: Gagal mengambil informasi slot yang dibeli`);
                                    });
                                }}
                                className="text-xs bg-green-200 hover:bg-green-300 px-1 py-0.5 rounded text-green-800"
                              >
                                Info Pembelian
                              </button>
                            </div>
                          </div>

                          {/* Script untuk mengambil data slot saat komponen dimuat */}
                          <script
                            dangerouslySetInnerHTML={{
                              __html: `
                                (function() {
                                  const loadSlotInfo = () => {
                                    const slotInfoContainer = document.getElementById('spotify-slot-info-${item.id}');
                                    if (!slotInfoContainer) return;
                                    
                                    fetch('/api/admin/spotify-slots/order/${item.id}')
                                      .then(res => res.json())
                                      .then(data => {
                                        if (!slotInfoContainer) return;
                                        
                                        if (data.success && data.slot) {
                                          const slot = data.slot;
                                          
                                          slotInfoContainer.innerHTML = \`
                                            <p class="text-xs font-medium text-green-800 mb-1">Slot Dialokasikan:</p>
                                            <p class="text-xs text-green-700">Nama Slot: \${slot.slotName}</p>
                                            <p class="text-xs text-green-700">Status: \${slot.isAllocated ? 'Terhubung' : 'Belum Terhubung'}</p>
                                            \${slot.isMainAccount ? '<p class="text-xs text-green-700">Slot Utama: Ya</p>' : ''}
                                          \`;
                                        } else {
                                          slotInfoContainer.innerHTML = \`
                                            <p class="text-xs font-medium text-orange-800 mb-1">Status Slot:</p>
                                            <p class="text-xs text-orange-700">Belum ada slot yang dialokasikan</p>
                                          \`;
                                        }
                                      })
                                      .catch(err => {
                                        console.error('Error fetching slot info:', err);
                                        if (slotInfoContainer) {
                                          slotInfoContainer.innerHTML = '<p class="text-xs text-red-600">Gagal memuat info slot</p>';
                                        }
                                      });
                                  };
                                  
                                  // Jalankan ketika modal dibuka
                                  const observer = new MutationObserver((mutations) => {
                                    for (const mutation of mutations) {
                                      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                                        const modalElement = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
                                        if (modalElement) {
                                          loadSlotInfo();
                                          break;
                                        }
                                      }
                                    }
                                  });
                                  
                                  // Amati perubahan pada body untuk mendeteksi saat modal dibuka
                                  observer.observe(document.body, { attributes: true, childList: true, subtree: true });
                                  
                                  // Coba ambil data juga saat script dijalankan (jika modal sudah terbuka)
                                  setTimeout(loadSlotInfo, 500);
                                })();
                              `
                            }}
                          />

                          {/* Tambahkan Family Plan detail Section */}
                          {item.account?.type === 'SPOTIFY' && (
                            <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
                              <h4 className="text-sm font-medium text-green-800 mb-2">
                                Detail Family Plan - {item.account.accountEmail}
                              </h4>
                              
                              <div className="mb-3">
                                <p className="text-xs text-green-700 mb-2">
                                  Family Plan memungkinkan hingga 5 pengguna menggunakan satu akun Spotify Premium.
                                  Berikut daftar slot yang terkait dengan akun ini:
                                </p>
                              </div>
                              
                              <div id={`family-plan-slots-${item.id}`} className="mb-3">
                                <div className="flex justify-center">
                                  <div className="animate-pulse flex space-x-4">
                                    <div className="rounded-full bg-green-400 h-8 w-8"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                      <div className="h-2 bg-green-300 rounded w-3/4"></div>
                                      <div className="h-2 bg-green-300 rounded"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  const familyPlanContainer = document.getElementById(`family-plan-slots-${item.id}`);
                                  if (familyPlanContainer) {
                                    familyPlanContainer.innerHTML = '<div class="text-center text-xs text-green-600 py-3">Memuat data Family Plan...</div>';
                                    
                                    fetch(`/api/admin/spotify-slots?accountId=${item.accountId}`)
                                      .then(res => res.json())
                                      .then(data => {
                                        if (!familyPlanContainer) return;
                                        
                                        if (data.success && data.slots && data.slots.length > 0) {
                                          const slots = data.slots;
                                          let html = `
                                            <div class="mb-2">
                                              <div class="flex justify-between items-center">
                                                <p class="text-xs font-medium text-green-800">Slot yang Tersedia (${slots.length}/6)</p>
                                                <p class="text-xs text-gray-500">Akun utama ditandai dengan 👑</p>
                                              </div>
                                            </div>
                                          `;
                                          
                                          // Tampilkan slots yang tersedia
                                          html += '<div class="space-y-3">';
                                          slots.forEach((slot: any) => {
                                            const isUsed = slot.userId || slot.orderItemId;
                                            const isOrderSlot = slot.orderItemId === '${item.id}';
                                            const bgColor = isOrderSlot 
                                              ? 'bg-green-100 border-green-300' 
                                              : isUsed 
                                                ? 'bg-orange-50 border-orange-200' 
                                                : 'bg-white border-gray-200';
                                            
                                            html += `
                                              <div class="p-2 rounded border ${bgColor}">
                                                <div class="flex justify-between items-start mb-1">
                                                  <div>
                                                    <p class="text-sm font-medium">
                                                      ${slot.slotName || 'Slot ' + (slots.indexOf(slot) + 1)}
                                                      ${slot.isMainAccount ? ' 👑' : ''}
                                                      ${isOrderSlot ? ' <span class="text-xs bg-green-200 text-green-800 px-1 rounded">Slot Ini</span>' : ''}
                                                    </p>
                                                    <p className="text-xs text-gray-600">${slot.email || 'Email belum diatur'}</p>
                                                    <p className="text-xs text-gray-600">Password: ${slot.password || 'Belum diatur'}</p>
                                                  </div>
                                                </div>
                                                
                                                ${isUsed ? `
                                                  <div class="mt-1 pt-1 border-t border-gray-100">
                                                    <p class="text-xs text-gray-600">
                                                      Digunakan oleh: ${slot.userId 
                                                        ? 'User ID: ' + slot.userId.substring(0, 8) + '...' 
                                                        : 'Order Item: ' + (slot.orderItemId || 'Unknown').substring(0, 8) + '...'}
                                                    </p>
                                                  </div>
                                                ` : ''}
                                              </div>
                                            `;
                                          });
                                          html += '</div>';
                                          
                                          familyPlanContainer.innerHTML = html;
                                        } else {
                                          familyPlanContainer.innerHTML = '<div class="text-center text-xs text-red-600 py-3">Tidak ada data Family Plan tersedia</div>';
                                        }
                                      })
                                      .catch(err => {
                                        console.error('Error fetching Family Plan details:', err);
                                        if (familyPlanContainer) {
                                          familyPlanContainer.innerHTML = '<div class="text-center text-xs text-red-600 py-3">Gagal memuat data Family Plan</div>';
                                        }
                                      });
                                  }
                                }}
                                className="w-full text-xs bg-green-600 hover:bg-green-700 px-2 py-1.5 rounded text-white"
                              >
                                Lihat Detail Family Plan
                              </button>
                            </div>
                          )}
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