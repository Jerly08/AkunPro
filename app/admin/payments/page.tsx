'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiEye, FiLoader, FiDownload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Transaction {
  id: string;
  status: string;
  paymentMethod: string;
  amount: number;
  paymentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    status: string;
  }
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchTransactions();
    }
  }, [session, status, router, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/transactions?method=BANK_TRANSFER&status=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (id: string, approved: boolean) => {
    try {
      setProcessingId(id);
      
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: id,
          approved
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }
      
      const result = await response.json();
      
      toast.success(
        approved 
          ? 'Pembayaran berhasil diverifikasi' 
          : 'Pembayaran ditolak'
      );
      
      // Refresh the transactions list
      fetchTransactions();
      
      // Close modal if open
      if (showProofModal) {
        setShowProofModal(false);
        setSelectedTransaction(null);
      }
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Gagal memproses verifikasi pembayaran');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-lg text-gray-700">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Verifikasi Pembayaran Manual</h1>
      
      <div className="mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              filter === 'PENDING' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200`}
          >
            Menunggu Verifikasi
          </button>
          <button
            type="button"
            onClick={() => setFilter('PAID')}
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'PAID' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-200`}
          >
            Terverifikasi
          </button>
          <button
            type="button"
            onClick={() => setFilter('FAILED')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              filter === 'FAILED' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200`}
          >
            Ditolak
          </button>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Tidak ada transaksi {filter === 'PENDING' ? 'yang menunggu verifikasi' : filter === 'PAID' ? 'yang terverifikasi' : 'yang ditolak'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bukti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{transaction.order.customerName}</div>
                    <div className="text-xs text-gray-400">{transaction.order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : transaction.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status === 'PENDING' ? 'Menunggu' : 
                       transaction.status === 'PAID' ? 'Terverifikasi' : 'Ditolak'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentUrl ? (
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowProofModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                    ) : (
                      <span className="text-gray-400">Tidak ada</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {transaction.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVerifyPayment(transaction.id, true)}
                            disabled={processingId === transaction.id}
                            className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition-colors"
                            title="Terima Pembayaran"
                          >
                            {processingId === transaction.id ? (
                              <FiLoader className="h-5 w-5 animate-spin" />
                            ) : (
                              <FiCheck className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(transaction.id, false)}
                            disabled={processingId === transaction.id}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                            title="Tolak Pembayaran"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal for displaying payment proof */}
      {showProofModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Bukti Pembayaran</h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">
                Order: {selectedTransaction.order.id}
              </p>
              <p className="text-sm text-gray-500 mb-1">
                Customer: {selectedTransaction.order.customerName} ({selectedTransaction.order.customerEmail})
              </p>
              <p className="text-sm text-gray-500">
                Total: Rp {selectedTransaction.amount.toLocaleString()}
              </p>
            </div>
            
            <div className="mb-6 flex justify-center">
              {selectedTransaction.paymentUrl && (
                <div className="relative">
                  <Image
                    src={selectedTransaction.paymentUrl}
                    alt="Bukti pembayaran"
                    width={500}
                    height={400}
                    className="max-h-96 object-contain"
                  />
                  <a
                    href={selectedTransaction.paymentUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Download bukti pembayaran"
                  >
                    <FiDownload className="h-5 w-5 text-gray-700" />
                  </a>
                </div>
              )}
            </div>
            
            {selectedTransaction.status === 'PENDING' && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleVerifyPayment(selectedTransaction.id, false)}
                  disabled={processingId === selectedTransaction.id}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                >
                  {processingId === selectedTransaction.id ? 'Memproses...' : 'Tolak Pembayaran'}
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedTransaction.id, true)}
                  disabled={processingId === selectedTransaction.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {processingId === selectedTransaction.id ? 'Memproses...' : 'Terima Pembayaran'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 