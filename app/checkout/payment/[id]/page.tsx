"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiArrowLeft, FiCopy, FiCheck, FiClock, FiCheckCircle, FiFileText, FiCreditCard, FiHelpCircle, FiDollarSign, FiAlertCircle, FiCalendar, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import Image from "next/image";
import { FAQ } from '@/components/ui/FAQ';
import OrderStatusBadge from '@/components/OrderStatusBadge';

interface OrderDetail {
  id: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  tax: number;
  paymentMethod: 'BANK_TRANSFER' | string;
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
  const [order, setOrder] = useState<OrderDetail>({
    id: '',
    status: 'PENDING',
    totalAmount: 0,
    tax: 0,
    paymentMethod: 'BANK_TRANSFER',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    items: []
  });
  const [loading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bank: 'BCA',
    accountNumber: '1234567890',
    accountName: 'PT Akun Pro Indonesia'
  });
  const [virtualAccountData, setVirtualAccountData] = useState<any>(null);
  const [isCreatingVA, setIsCreatingVA] = useState(false);
  
  // For clipboard functionality
  const [copied, setCopied] = useState(false);

  // Banks for virtual account
  const availableBanks = [
    { id: 'BCA', name: 'Bank Central Asia (BCA)' },
    { id: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
    { id: 'Mandiri', name: 'Bank Mandiri' },
    { id: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
    { id: 'CIMB', name: 'CIMB Niaga' }
  ];

  // FAQ items for payment page
  const paymentFaqItems = [
    {
      question: "Berapa lama proses verifikasi pembayaran?",
      answer: "Proses verifikasi pembayaran akan dilakukan dalam waktu 1x24 jam setelah Anda mengunggah bukti pembayaran.",
      icon: <FiClock size={20} />
    },
    {
      question: "Bagaimana jika pembayaran saya belum diverifikasi setelah 24 jam?",
      answer: "Jika pembayaran Anda belum diverifikasi setelah 24 jam, silakan hubungi customer service kami melalui halaman bantuan atau email ke support@akunpro.com.",
      icon: <FiAlertCircle size={20} />
    },
    {
      question: "Apakah saya akan menerima notifikasi setelah pembayaran berhasil?",
      answer: "Ya, Anda akan menerima notifikasi melalui email dan dapat melihat status pembayaran di halaman Pesanan Saya.",
      icon: <FiCheckCircle size={20} />
    },
    {
      question: "Bagaimana jika saya sudah transfer tapi lupa mengunggah bukti pembayaran?",
      answer: "Anda tetap bisa mengunggah bukti pembayaran selama order belum dibatalkan. Silakan login ke akun Anda dan buka halaman pembayaran ini untuk mengunggah bukti transfer.",
      icon: <FiFileText size={20} />
    },
    {
      question: "Berapa lama batas waktu pembayaran?",
      answer: "Batas waktu pembayaran adalah 24 jam sejak order dibuat. Jika melewati batas waktu, order akan otomatis dibatalkan dan Anda perlu melakukan pemesanan ulang.",
      icon: <FiCalendar size={20} />
    }
  ];

  // Fetch order details from the server
  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API success field first
      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch order data');
      }
      
      // Handle different API response formats
      if (data.success === true && data.order) {
        setOrder(data.order);
        setExpiresAt(new Date(data.order.expiresAt));
        
        // Check if there's transaction data with VA info
        if (data.order.transaction?.notes) {
          try {
            const notes = JSON.parse(data.order.transaction.notes);
            if (notes.virtualAccount) {
              setVirtualAccountData(notes);
            }
          } catch (e) {
            console.error('Error parsing transaction notes', e);
          }
        }
      } else if (data.id) {
        // Direct order object without wrapper
        setOrder(data);
        setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        
        // Check if there's transaction data with VA info
        if (data.transaction?.notes) {
          try {
            const notes = JSON.parse(data.transaction.notes);
            if (notes.virtualAccount) {
              setVirtualAccountData(notes);
            }
          } catch (e) {
            console.error('Error parsing transaction notes', e);
          }
        }
      } else {
        throw new Error('Order data structure is invalid or empty');
      }
      
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Terjadi kesalahan saat memuat data pesanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order details on first load
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
      const expiresAtDate = new Date(order.expiresAt || '');
      const timeDiff = expiresAtDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      
      // Calculate hours, minutes and seconds
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
    toast.success('Disalin ke clipboard!');
  };

  // Handle payment verification
  const handleCheckPayment = async () => {
    try {
      toast.loading('Memeriksa status pembayaran...');
      
      const response = await fetch(`/api/checkout/payment/verify/${id}?redirect=false`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      toast.dismiss();
      
      if (!response.ok) {
        throw new Error('Gagal memverifikasi pembayaran');
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchOrderDetails();
        
        if (data.order.transaction?.hasProofOfPayment) {
          toast.success('Bukti pembayaran Anda telah diterima dan sedang diverifikasi admin.');
        } else {
          toast('Silakan unggah bukti pembayaran Anda.');
        }
      } else {
        toast.error(data.message || 'Pembayaran belum terverifikasi.');
      }
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran.');
    }
  };

  // Handle form success
  const handlePaymentSuccess = () => {
    setSuccessMessage('Bukti pembayaran berhasil dikirim menunggu konfirmasi admin');
    setShowSuccessAlert(true);
    
    setTimeout(() => {
      setShowSuccessAlert(false);
      router.push(`/orders`);
    }, 2500);
  };

  // Calculate time left in seconds
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - new Date().getTime()) / 1000)) : 0;
  const isExpired = timeLeft <= 0 && order.status === 'PENDING';

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Memuat informasi pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly header with back button and order status */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <Link 
                href="/orders" 
                className="mr-3 text-gray-600 hover:text-gray-900 p-1"
                aria-label="Kembali"
              >
                <FiArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-medium">Pembayaran</h1>
            </div>
            
            <div className="flex items-center">
              {order.status && (
                <OrderStatusBadge status={order.status} size="sm" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={fetchOrderDetails}
                    className="text-sm font-medium text-red-800 hover:text-red-700"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment expired message */}
        {isExpired && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Pembayaran Kedaluwarsa</h3>
                <p className="mt-1 text-sm text-red-700">
                  Batas waktu pembayaran Anda telah berakhir. Silakan buat pesanan baru.
                </p>
                <div className="mt-3">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-red-800 hover:text-red-700"
                  >
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order ID and remaining time */}
        {!isExpired && order.status === 'PENDING' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <p className="text-sm text-gray-600">
              ID Pesanan: <span className="font-medium">{order.id}</span>
            </p>
            <div className="flex items-center bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-md border border-yellow-200">
              <FiClock className="mr-2" />
              <span className="text-sm font-medium">Bayar dalam: {countdown}</span>
            </div>
          </div>
        )}

        {/* Layout for desktop: 2 columns, for mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary - 1 column on mobile, 1 column on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Ringkasan Pesanan</h2>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Order items */}
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{item.type}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <span className="text-sm font-medium">
                        Rp {item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Order totals */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rp {(order.totalAmount - (order.tax || 0)).toLocaleString()}</span>
                  </div>
                  
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Pajak</span>
                      <span>Rp {order.tax.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-indigo-700">Rp {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Customer information */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-sm font-medium mb-2">Informasi Pelanggan</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-600">Nama:</span> {order.customerName}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Email:</span> {order.customerEmail}
                    </p>
                    {order.customerPhone && (
                      <p className="text-sm">
                        <span className="text-gray-600">Telepon:</span> {order.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Order date */}
                <div className="border-t border-gray-200 pt-3 mt-3 text-sm">
                  <span className="text-gray-600">Tanggal Pemesanan:</span>{' '}
                  {new Date(order.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Methods and Form - 1 column on mobile, 2 columns on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Metode Pembayaran</h2>
              </div>
              
              <div className="p-5">
                {/* Order completed message */}
                {(order.status === 'PAID' || order.status === 'COMPLETED') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">Pembayaran Berhasil</h3>
                        <p className="mt-1 text-sm text-green-700">
                          Pesanan Anda telah terkonfirmasi dan sedang diproses. Terima kasih!
                        </p>
                        <div className="mt-3">
                          <Link
                            href="/orders"
                            className="inline-flex items-center text-sm font-medium text-green-800 hover:text-green-700"
                          >
                            <span>Lihat Pesanan Saya</span>
                            <FiArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Order cancelled message */}
                {order.status === 'CANCELLED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Pesanan Dibatalkan</h3>
                        <p className="mt-1 text-sm text-red-700">
                          Pesanan ini telah dibatalkan dan tidak dapat diproses lagi.
                        </p>
                        <div className="mt-3">
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-red-800 hover:text-red-700"
                          >
                            <span>Kembali ke Dashboard</span>
                            <FiArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment method selection for pending orders */}
                {order.status === 'PENDING' && !isExpired && (
                  <>
                    {/* Bank Transfer option */}
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <FiCreditCard className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Transfer Bank Manual</h3>
                          <p className="text-sm text-gray-600">Transfer ke rekening berikut</p>
                        </div>
                      </div>
                      
                      {/* Bank account details */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex flex-wrap justify-between items-center mb-3">
                          <p className="font-medium text-gray-900">Bank {bankDetails.bank}</p>
                          <button
                            onClick={() => copyToClipboard(bankDetails.accountNumber)}
                            className="flex items-center text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md mt-2 sm:mt-0"
                          >
                            {copied ? (
                              <>
                                <FiCheck className="mr-1 h-3 w-3" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <FiCopy className="mr-1 h-3 w-3" />
                                <span>Salin Nomor</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Nomor Rekening:</p>
                            <p className="font-medium">{bankDetails.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Nama Pemilik:</p>
                            <p className="font-medium">{bankDetails.accountName}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-gray-600 mb-1">Jumlah Transfer:</p>
                            <p className="text-indigo-700 font-bold">Rp {order.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment proof upload form */}
                      <ManualPaymentForm 
                        orderId={order.id} 
                        totalAmount={order.totalAmount} 
                        onSuccess={handlePaymentSuccess} 
                      />
                      
                      {/* Check payment status button */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          onClick={handleCheckPayment}
                          className="justify-center"
                        >
                          <FiDollarSign className="mr-2" />
                          <span>Cek Status Pembayaran</span>
                        </Button>
                        
                        <Link href="/orders">
                          <Button
                            variant="secondary"
                            className="justify-center w-full sm:w-auto"
                          >
                            <span>Lihat Daftar Pesanan</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* FAQ section - Mobile-friendly */}
            <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium flex items-center">
                  <FiHelpCircle className="mr-2" />
                  <span>FAQ Pembayaran</span>
                </h2>
              </div>
              
              <div className="p-5">
                <FAQ items={paymentFaqItems} variant="payment" />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Success Alert - Mobile-friendly */}
      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-sm w-full overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                Bukti Pembayaran Terkirim
              </h3>
              <p className="text-center text-sm text-gray-600 mb-4">
                {successMessage || 'Bukti pembayaran Anda telah berhasil dikirim. Tim kami akan melakukan verifikasi dalam 1x24 jam.'}
              </p>
              <div className="text-center">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setShowSuccessAlert(false);
                    router.push(`/orders`);
                  }}
                >
                  Lihat Status Pesanan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 