"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiArrowLeft, FiCopy, FiCheck, FiClock, FiCheckCircle, FiFileText, FiCreditCard, FiHelpCircle, FiDollarSign, FiAlertCircle, FiCalendar, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import Image from "next/image";
import { FAQ } from '@/components/ui/FAQ';

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
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
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
      console.log(`Fetching order details for ID: ${id}`);
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API response not OK: ${response.status} - ${response.statusText}`);
        console.error(`Error response body: ${errorText}`);
        throw new Error(`Failed to fetch order data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API Response received:", data);
      
      // Check for API success field first (new format)
      if (data.success === false) {
        console.error('API returned error:', data.error);
        throw new Error(data.error || 'Failed to fetch order data');
      }
      
      // Check if data is in the expected format with {order} wrapper or direct object
      if (data.success === true && data.order) {
        console.log("Setting order data from data.order (new format):", data.order);
        setOrder(data.order);
        setExpiresAt(new Date(data.order.expiresAt));
        
        // Always ensure payment method is BANK_TRANSFER
        if (data.order.paymentMethod !== 'BANK_TRANSFER') {
          console.log("Setting payment method to BANK_TRANSFER");
          // Update the order payment method via API
          try {
            const updateResponse = await fetch(`/api/orders/${id}/payment-method`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ paymentMethod: 'BANK_TRANSFER' }),
            });
            
            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              console.log("Payment method updated successfully:", updateData);
            }
          } catch (updateErr) {
            console.error("Error updating payment method:", updateErr);
          }
        }
        
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
        console.log("Setting order data directly from response:", data);
        setOrder(data);
        setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        
        // Always ensure payment method is BANK_TRANSFER
        if (data.paymentMethod !== 'BANK_TRANSFER') {
          console.log("Setting payment method to BANK_TRANSFER");
          // Update the order payment method via API
          try {
            const updateResponse = await fetch(`/api/orders/${id}/payment-method`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ paymentMethod: 'BANK_TRANSFER' }),
            });
            
            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              console.log("Payment method updated successfully:", updateData);
            }
          } catch (updateErr) {
            console.error("Error updating payment method:", updateErr);
          }
        }
        
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
      } else if (data.error) {
        console.error('API returned error:', data.error);
        throw new Error(data.error);
      } else {
        console.error('Order data structure is invalid:', data);
        throw new Error('Order data structure is invalid or empty');
      }
      
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Terjadi kesalahan saat memuat data pesanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order details
  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Add a retry mechanism if the initial fetch fails
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    
    if (error && id) {
      console.log("Setting up retry for order fetch...");
      retryTimeout = setTimeout(() => {
        console.log("Retrying order fetch...");
        fetchOrderDetails();
      }, 2000); // Retry after 2 seconds
    }
    
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [error, id]);

  // Calculate remaining time for payment
  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(order.expiresAt || '');
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setCountdown('Waktu pembayaran habis');
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
    toast.success('Copied to clipboard!');
  };

  // Handle payment verification
  const handleCheckPayment = async () => {
    try {
      console.log('Verifikasi pembayaran untuk order:', id);
      
      // Show loading toast
      toast.loading('Memeriksa status pembayaran...');
      
      const response = await fetch(`/api/checkout/payment/verify/${id}?redirect=false`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Dismiss loading toast
      toast.dismiss();
      
      if (!response.ok) {
        console.error('Verification API response not OK:', response.status, response.statusText);
        throw new Error('Gagal memverifikasi pembayaran');
      }
      
      const data = await response.json();
      console.log('Verification response:', data);
      
      // Tampilkan status pembayaran berdasarkan respons API
      if (data.success) {
        // Refresh order data to get latest status
        fetchOrderDetails();
        
        // Tampilkan pesan sesuai status
        if (data.order.transaction?.hasProofOfPayment) {
          toast.success('Bukti pembayaran Anda telah diterima dan sedang diverifikasi admin.');
        } else {
          toast('Silakan unggah bukti pembayaran Anda.');
        }
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
    setSuccessMessage('Bukti pembayaran berhasil di kirim menunngu konfirmasi admin');
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
      router.push(`/orders`);
    }, 2500);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push(`/checkout/complete/${id}`);
  };

  // Create virtual account for payment
  const createVirtualAccount = async (bankName: string) => {
    setIsCreatingVA(true);
    
    try {
      const response = await fetch('/api/checkout/payment/virtual-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          bankName: bankName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create virtual account');
      }
      
      if (data.virtualAccount) {
        setVirtualAccountData(data.virtualAccount);
        toast.success(data.message || 'Virtual account berhasil dibuat');
      }
      
    } catch (error) {
      console.error('Error creating virtual account:', error);
      toast.error('Gagal membuat virtual account. Silakan coba lagi.');
    } finally {
      setIsCreatingVA(false);
    }
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
          <p className="text-red-600 mb-4">{error || 'Data pesanan tidak ditemukan'}</p>
          
          <div className="space-y-4">
            <p className="text-gray-700">Silakan coba beberapa opsi berikut:</p>
            <ul className="list-disc ml-5 text-gray-600 space-y-2">
              <li>Refresh halaman ini untuk memuat ulang data pesanan</li>
              <li>Pastikan Anda telah melakukan login dengan akun yang benar</li>
              <li>Periksa apakah ID pesanan dalam URL sudah benar</li>
            </ul>
            
            <div className="flex space-x-4 mt-6">
              <button 
                onClick={() => fetchOrderDetails()} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Coba Lagi
              </button>
              
              <Link href="/dashboard" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Order Information */}
        <section className="mb-8 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Informasi Pembayaran</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Detail Pesanan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan</p>
                  <p className="text-gray-900 font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pembayaran</p>
                  <p className="text-gray-900 font-medium text-xl">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(order.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${
                    order.status === 'PAID' ? 'text-green-600' : 
                    order.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {order.status === 'PAID' ? 'Lunas' : 
                     order.status === 'PENDING' ? 'Menunggu Pembayaran' : 'Dibatalkan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Pesanan</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Metode Pembayaran</h3>
              
              <div className="mt-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Transfer Bank</h4>
                      <p className="text-sm text-gray-500">Bayar melalui transfer bank manual</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">Petunjuk Pembayaran</h4>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Silakan transfer ke rekening berikut:</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Bank</span>
                      <span className="font-medium">{bankDetails.bank}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">No. Rekening</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{bankDetails.accountNumber}</span>
                        <button 
                          onClick={() => copyToClipboard(bankDetails.accountNumber)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Salin Nomor Rekening"
                        >
                          {copied ? (
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Atas Nama</span>
                      <span className="font-medium">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Total Pembayaran</span>
                      <span className="font-bold text-indigo-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-gray-600">
                  <p className="font-medium">Langkah-langkah:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Transfer sesuai jumlah yang tertera ke rekening di atas</li>
                    <li>Simpan bukti transfer</li>
                    <li>Upload bukti transfer pada form di bawah ini</li>
                    <li>Tim kami akan memverifikasi pembayaran Anda (1x24 jam)</li>
                    <li>Setelah terverifikasi, produk akan segera dikirimkan ke email Anda</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Upload Proof Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Bukti Pembayaran</h3>
              
              {order.status === 'PAID' ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        Pembayaran Anda telah dikonfirmasi. Terima kasih!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ManualPaymentForm 
                  orderId={order.id} 
                  totalAmount={order.totalAmount}
                  onSuccess={() => {
                    setSuccessMessage('Bukti pembayaran berhasil di kirim menunngu konfirmasi admin');
                    setShowSuccessAlert(true);
                    // Refresh order data after successful upload
                    fetchOrderDetails();
                  }}
                />
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto mb-8 mt-12">
          {/* FAQ Header */}
          <div className="relative mb-8 bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-xl p-8 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid-pattern)" />
              </svg>
            </div>
            
            {/* Header content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  FAQ Pembayaran
                </h2>
                <p className="text-indigo-100">
                  Hal yang perlu Anda ketahui tentang pembayaran
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="p-3 bg-white/20 rounded-full">
                  <FiCreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* FAQ Content */}
          <div className="bg-white rounded-xl shadow-xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-indigo-100 opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-purple-100 opacity-50"></div>
            
            {/* FAQ Items */}
            <div className="relative z-10">
              <FAQ items={paymentFaqItems} variant="payment" />
              
              {/* Need more help prompt */}
              <div className="mt-10 text-center">
                <p className="text-gray-600 mb-4">Butuh bantuan lainnya?</p>
                <Link href="/help" className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  Hubungi Layanan Pelanggan
                  <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black opacity-40"></div>
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-center text-gray-900 mb-2">
                Bukti Pembayaran Terkirim
              </h3>
              <p className="text-center text-gray-600 mb-6">
                {successMessage || 'Bukti pembayaran Anda telah berhasil dikirim. Tim kami akan melakukan verifikasi dalam 1x24 jam.'}
              </p>
              <div className="text-center">
                <button
                  onClick={() => {
                    setShowSuccessAlert(false);
                    router.push(`/orders`);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-md hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors transform hover:scale-105 transition-transform"
                >
                  Lihat Status Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 