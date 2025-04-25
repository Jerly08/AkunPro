'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiArrowLeft, FiCopy, FiCheck, FiClock, FiCheckCircle, FiFileText, FiCreditCard } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';

interface OrderDetail {
  id: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  tax: number;
  paymentMethod: 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  expiresAt: string;
  transaction?: {
    id: string;
    status: string;
    paymentMethod: string;
    notes?: string;
  };
  items: {
    id: string;
    type: string;
    price: number;
    description: string;
  }[];
}

interface PaymentParams {
  id: string;
  [key: string]: string;
}

const PaymentPage = () => {
  const params = useParams<PaymentParams>();
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState<string>('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  const MAX_POLLING_COUNT = 30; // Maksimal 30x cek (5 menit)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT'>('BANK_TRANSFER');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [virtualAccountDetails, setVirtualAccountDetails] = useState<any>(null);
  const [isLoadingVA, setIsLoadingVA] = useState(false);

  // Bank details
  const bankDetails = {
    bank: 'Bank Central Asia (BCA)',
    accountNumber: '1234567890',
    accountName: 'PT. NETFLIX SPOTIFY MARKETPLACE',
  };

  // Banks for virtual account
  const availableBanks = [
    { id: 'BCA', name: 'Bank Central Asia (BCA)' },
    { id: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
    { id: 'Mandiri', name: 'Bank Mandiri' },
    { id: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
    { id: 'CIMB', name: 'CIMB Niaga' }
  ];

  // Async fetch order details function used for refreshing data
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching order details for ID:', id);
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Gagal memuat detail pesanan');
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data) {
        console.log('Setting order state with:', data);
        
        // Set order data from API
        const orderData = {
          id: data.id,
          status: data.status,
          totalAmount: data.totalAmount,
          tax: data.taxAmount,
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt || '',
          transaction: data.transaction || null,
          items: data.items?.map((item: any) => ({
            id: item.id,
            type: item.account?.type || 'UNKNOWN',
            price: item.price,
            description: item.account?.accountEmail || ''
          })) || []
        };
        
        setOrder(orderData);
        
        // Set payment method based on order data
        if (data.paymentMethod === 'VIRTUAL_ACCOUNT') {
          setPaymentMethod('VIRTUAL_ACCOUNT');
        } else {
          setPaymentMethod('BANK_TRANSFER');
        }
      } else {
        console.error('Format data tidak sesuai:', data);
        throw new Error('Format data tidak sesuai');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch order details
  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Calculate remaining time for payment
  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(order.expiresAt || '');
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimer('Waktu pembayaran habis');
        return;
      }
      
      // Calculate hours, minutes and seconds
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerInterval);
  }, [order]);

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle payment verification
  const handleCheckPayment = async () => {
    try {
      console.log('Verifikasi pembayaran untuk order:', id);
      
      // Show loading toast
      toast.loading('Memeriksa status pembayaran...');
      
      const response = await fetch(`/api/checkout/payment/verify/${id}?redirect=true`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Dismiss loading toast
      toast.dismiss();
      
      // Jika response adalah redirect, ikuti redirect ke halaman konfirmasi
      if (response.redirected) {
        console.log('Received redirect response, following to:', response.url);
        window.location.href = response.url;
        return true;
      }
      
      if (!response.ok) {
        console.error('Verification API response not OK:', response.status, response.statusText);
        throw new Error('Gagal memverifikasi pembayaran');
      }
      
      const data = await response.json();
      console.log('Verification response:', data);
      
      // Cek apakah pembayaran berhasil dan ada URL redirect
      if (data.success && data.redirect) {
        console.log('Payment verified, redirecting to:', data.redirect);
        window.location.href = data.redirect;
        return true;
      }
      
      // Cek apakah pembayaran berhasil
      if (data.success && (data.order.status === 'PAID' || data.order.status === 'COMPLETED')) {
        console.log('Payment verified, redirecting to confirmation page');
        router.push(`/checkout/confirmation/${id}`);
        return true;
      }
      
      // Jika status berhasil diupdate
      if (data.order && data.order.updatedStatus === true) {
        toast.success('Status pembayaran berhasil diperbarui');
        
        // Perbarui state order jika status berubah
        setOrder(prevOrder => {
          if (!prevOrder) return null;
          return { ...prevOrder, status: data.order.status };
        });
        
        // Jika status berubah menjadi PAID/COMPLETED, redirect ke halaman konfirmasi
        if (data.order.status === 'PAID' || data.order.status === 'COMPLETED') {
          console.log('Status berubah menjadi sukses, redirecting to confirmation page');
          router.push(`/checkout/confirmation/${id}`);
        }
        return true;
      } else {
        toast.error(data.message || 'Pembayaran belum terverifikasi. Harap pastikan Anda telah melakukan pembayaran sesuai instruksi.');
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran. Silakan coba lagi nanti.');
      return false;
    }
  };

  // Handler untuk tombol cek pembayaran
  const handleCheckPaymentClick = () => {
    return handleCheckPayment();
  };

  // Handle form success
  const handlePaymentSuccess = () => {
    // Set success message for styled alert
    setSuccessMessage('Bukti pembayaran berhasil diunggah! Terima kasih, kami akan segera memproses pembayaran Anda.');
    setShowSuccessAlert(true);
    
    // Show toast notification
    toast.success('Bukti pembayaran berhasil diunggah', {
      duration: 5000,
      style: {
        background: '#10B981',
        color: '#FFFFFF',
        fontWeight: 'bold',
      }
    });
    
    // Add delay before redirecting to ensure user sees the success message
    setTimeout(() => {
      setShowSuccessAlert(false);
      router.push(`/checkout/confirmation/${id}`);
    }, 2500);
  };

  // Function to create virtual account
  const createVirtualAccount = async (bankName: string, updateExisting = false) => {
    try {
      setIsLoadingVA(true);
      toast.loading('Membuat virtual account...');
      
      const response = await fetch('/api/checkout/payment/virtual-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: id,
          bankName: bankName,
          updateExisting: updateExisting
        }),
      });
      
      toast.dismiss();
      
      if (!response.ok) {
        throw new Error('Gagal membuat virtual account');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVirtualAccountDetails(data.virtualAccount);
        toast.success(updateExisting ? 'Virtual account berhasil diubah' : 'Virtual account berhasil dibuat');
        
        // Update payment method
        setPaymentMethod('VIRTUAL_ACCOUNT');
        
        // Refresh order details to get updated transaction info
        fetchOrderDetails();
      } else {
        throw new Error(data.message || 'Gagal membuat virtual account');
      }
    } catch (error) {
      console.error('Error creating virtual account:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoadingVA(false);
    }
  };
  
  // Function to get virtual account details from order transaction notes
  useEffect(() => {
    if (order?.transaction?.notes && order.transaction.paymentMethod?.includes('Virtual Account')) {
      try {
        const notesData = JSON.parse(order.transaction.notes);
        if (notesData.virtualAccount) {
          setVirtualAccountDetails(notesData);
          setPaymentMethod('VIRTUAL_ACCOUNT');
          
          // Extract bank name from payment method
          const bankMethod = order.transaction.paymentMethod;
          const bankName = bankMethod.replace('Virtual Account ', '');
          setSelectedBank(bankName);
        }
      } catch (e) {
        console.error('Error parsing transaction notes:', e);
      }
    }
  }, [order]);
  
  // Function to handle bank selection
  const handleBankSelection = (bankId: string) => {
    setSelectedBank(bankId);
  };
  
  // Function to submit virtual account request
  const handleCreateVirtualAccount = async () => {
    if (!selectedBank) {
      toast.error('Pilih bank terlebih dahulu');
      return;
    }
    
    // Cek apakah ini update atau pembuatan baru
    const isUpdate = virtualAccountDetails !== null;
    
    await createVirtualAccount(selectedBank, isUpdate);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Terjadi Kesalahan</h1>
          <p className="text-red-600">{error || 'Data pesanan tidak ditemukan'}</p>
          <Link href="/orders" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
            Kembali ke daftar pesanan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Styled Success Alert Modal */}
      {showSuccessAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all animate-scaleIn">
            <div className="w-full flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3 animate-bounce">
                <FiCheckCircle size={40} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Pembayaran Berhasil!</h3>
            <p className="text-center text-gray-600 mb-6">{successMessage}</p>
            <div className="text-center">
              <button
                onClick={() => {
                  setShowSuccessAlert(false);
                  router.push(`/checkout/confirmation/${id}`);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-md hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors transform hover:scale-105 transition-transform"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link 
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" /> Kembali ke Pesanan Saya
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Pembayaran Pesanan
          </h1>
          <p className="text-gray-600">
            ID Pesanan: {order?.id || ''}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Metode Pembayaran
                  </h2>
                  
                  <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                    <FiClock className="text-yellow-600 mr-1" />
                    <span className="text-sm font-medium text-yellow-700">
                      {timer}
                    </span>
                  </div>
                </div>
                
                {/* Payment Method Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                      paymentMethod === 'BANK_TRANSFER' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FiCreditCard className="mr-2" /> Transfer Bank
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
                    className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                      paymentMethod === 'VIRTUAL_ACCOUNT' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FiCreditCard className="mr-2" /> Virtual Account
                  </button>
                </div>
                
                {/* Bank Transfer Instructions */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mb-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Transfer Bank
                      </h3>
                      
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Nama Bank</p>
                          <p className="text-lg font-medium">{bankDetails.bank}</p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Nomor Rekening</p>
                          <div className="flex items-center">
                            <p className="text-lg font-medium">{bankDetails.accountNumber}</p>
                            <button 
                              onClick={() => copyToClipboard(bankDetails.accountNumber)}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              {copied ? <FiCheck /> : <FiCopy />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Nama Pemilik Rekening</p>
                          <p className="text-lg font-medium">{bankDetails.accountName}</p>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                          <div className="flex items-center">
                            <p className="text-xl font-bold text-indigo-700">
                              Rp {order?.totalAmount.toLocaleString('id-ID')}
                            </p>
                            <button 
                              onClick={() => copyToClipboard(order?.totalAmount.toString() || '')}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              {copied ? <FiCheck /> : <FiCopy />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Virtual Account Section */}
                {paymentMethod === 'VIRTUAL_ACCOUNT' && (
                  <div className="mb-6">
                    {virtualAccountDetails ? (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Virtual Account {virtualAccountDetails.bankName}
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Bank</p>
                            <p className="text-lg font-medium">{virtualAccountDetails.bankName}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Nomor Virtual Account</p>
                            <div className="flex items-center">
                              <p className="text-lg font-medium">{virtualAccountDetails.virtualAccount}</p>
                              <button 
                                onClick={() => copyToClipboard(virtualAccountDetails.virtualAccount)}
                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                                type="button"
                                aria-label="Copy virtual account number"
                              >
                                {copied ? <FiCheck /> : <FiCopy />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                            <div className="flex items-center">
                              <p className="text-xl font-bold text-indigo-700">
                                Rp {typeof virtualAccountDetails.amount === 'number' 
                                  ? virtualAccountDetails.amount.toLocaleString('id-ID')
                                  : virtualAccountDetails.amount}
                              </p>
                              <button 
                                onClick={() => copyToClipboard(virtualAccountDetails.amount.toString())}
                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                                type="button"
                                aria-label="Copy amount"
                              >
                                {copied ? <FiCheck /> : <FiCopy />}
                              </button>
                            </div>
                          </div>
                          
                          {virtualAccountDetails.expiryDate && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Batas Waktu Pembayaran</p>
                              <p className="text-md font-medium">
                                {new Date(virtualAccountDetails.expiryDate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}

                          {/* Tambah tombol untuk mengubah bank */}
                          <div className="pt-3 mt-2 border-t border-gray-200">
                            <Button
                              onClick={() => setVirtualAccountDetails(null)}
                              variant="secondary"
                              className="w-full justify-center"
                            >
                              Ubah Bank
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Pilih Bank untuk Virtual Account
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {availableBanks.map(bank => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => handleBankSelection(bank.id)}
                              className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                                selectedBank === bank.id 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {bank.name}
                            </button>
                          ))}
                        </div>
                        
                        <Button
                          onClick={handleCreateVirtualAccount}
                          disabled={!selectedBank || isLoadingVA}
                          className="w-full justify-center mt-4"
                          variant="primary"
                        >
                          {isLoadingVA ? 'Memproses...' : 'Buat Virtual Account'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload proof for bank transfer */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Upload Bukti Pembayaran
                    </h3>
                    
                    <ManualPaymentForm 
                      orderId={order.id} 
                      totalAmount={order.totalAmount}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                )}
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Langkah-langkah Pembayaran
                  </h3>
                  
                  {paymentMethod === 'BANK_TRANSFER' ? (
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Lakukan pembayaran sesuai dengan instruksi di atas.</li>
                      <li>Pastikan jumlah transfer sesuai dengan total pembayaran.</li>
                      <li>Setelah melakukan pembayaran, upload bukti transfer pada form di atas.</li>
                      <li>Jika pembayaran terverifikasi, Anda akan diarahkan ke halaman konfirmasi.</li>
                      <li>Detail akun akan dikirimkan ke email Anda setelah pembayaran dikonfirmasi.</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Lakukan pembayaran ke nomor virtual account yang tertera di atas.</li>
                      <li>Pastikan jumlah transfer sesuai dengan total pembayaran.</li>
                      <li>Setelah melakukan pembayaran, sistem akan otomatis memverifikasi transaksi Anda.</li>
                      <li>Jika pembayaran terverifikasi, Anda akan mendapatkan notifikasi.</li>
                      <li>Detail akun akan dikirimkan ke email Anda setelah pembayaran dikonfirmasi.</li>
                    </ol>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-center space-x-4">
                <Button 
                  onClick={handleCheckPaymentClick} 
                  variant="secondary"
                  className="flex items-center"
                >
                  <FiCheckCircle className="mr-2" /> Cek Status Pembayaran
                </Button>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="flex items-center text-lg font-medium text-blue-800 mb-2">
                <FiFileText className="mr-2" /> Catatan Penting
              </h3>
              <ul className="text-blue-700 text-sm space-y-1 ml-6 list-disc">
                <li>Pastikan untuk mentransfer tepat sesuai jumlah yang ditentukan.</li>
                <li>Pembayaran akan diverifikasi dalam waktu 5-10 menit setelah Anda mengunggah bukti transfer.</li>
                <li>Jika Anda mengalami masalah, silakan hubungi tim dukungan kami.</li>
                <li>Pesanan akan otomatis dibatalkan jika pembayaran tidak dilakukan dalam batas waktu.</li>
              </ul>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ringkasan Pesanan
              </h2>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Tanggal Pesanan</p>
                <p className="font-medium">
                  {new Date(order?.createdAt || '').toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-gray-900">Item</h3>
                
                {order?.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.type}</span>
                    <span>Rp {item.price.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rp {(order?.totalAmount - (order?.tax || 0)).toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Pajak (11%)</span>
                  <span>Rp {order?.tax.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>Rp {order?.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="mt-4 bg-indigo-50 p-3 rounded-md">
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    order?.status === 'PENDING' ? 'bg-yellow-500' : 
                    order?.status === 'PAID' ? 'bg-green-500' : 
                    order?.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                  } mr-2`}></span>
                  <span className="text-sm font-medium text-indigo-800">
                    Status: {
                      order?.status === 'PENDING' ? 'Menunggu Pembayaran' : 
                      order?.status === 'PAID' ? 'Dibayar' : 
                      order?.status === 'COMPLETED' ? 'Selesai' : 
                      'Dibatalkan'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 