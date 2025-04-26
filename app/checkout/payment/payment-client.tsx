'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiCheck, FiAlertTriangle, FiCreditCard, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface OrderData {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  expiresAt: string;
  paymentData: any;
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'>('PENDING');

  // Memeriksa id dan mengambil data pesanan
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) {
        setError('ID Pesanan tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          throw new Error('Gagal memuat data pesanan');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Gagal memuat data pesanan');
        }
        
        setOrderData(data.order);
        setPaymentStatus(data.order.status);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Gagal memuat data pesanan. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  // Hitung countdown waktu pembayaran
  useEffect(() => {
    if (!orderData?.expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiresAt = new Date(orderData.expiresAt);
      const difference = expiresAt.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown('Waktu pembayaran habis');
        setPaymentStatus('EXPIRED');
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [orderData]);

  // Polling untuk status pembayaran
  useEffect(() => {
    if (!id || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED') return;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${id}/status`);
        const data = await response.json();
        
        if (data.success && data.status) {
          setPaymentStatus(data.status);
          
          if (data.status === 'PAID') {
            toast.success('Pembayaran berhasil!');
            // Redirect ke halaman sukses setelah beberapa detik
            setTimeout(() => {
              router.push(`/checkout/confirmation?id=${id}`);
            }, 3000);
          } else if (data.status === 'FAILED') {
            toast.error('Pembayaran gagal');
          } else if (data.status === 'EXPIRED') {
            toast.error('Waktu pembayaran telah habis');
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    const pollingInterval = setInterval(pollPaymentStatus, 5000);
    
    return () => clearInterval(pollingInterval);
  }, [id, paymentStatus, router]);

  // Fungsi untuk menyalin teks ke clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p>Data pesanan tidak ditemukan</p>
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div className="mb-4 sm:mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm sm:text-base">
          <FiArrowLeft className="mr-2" /> Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header dengan status pembayaran - Better mobile spacing */}
        <div className={`p-4 sm:p-6 ${
          paymentStatus === 'PAID' ? 'bg-green-50' : 
          paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED' ? 'bg-red-50' : 
          'bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold">
              {paymentStatus === 'PAID' ? 'Pembayaran Berhasil' : 
               paymentStatus === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' :
               paymentStatus === 'FAILED' ? 'Pembayaran Gagal' :
               'Menunggu Pembayaran'}
            </h1>
            <div className={`rounded-full p-2 ${
              paymentStatus === 'PAID' ? 'bg-green-200 text-green-700' : 
              paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED' ? 'bg-red-200 text-red-700' : 
              'bg-blue-200 text-blue-700'
            }`}>
              {paymentStatus === 'PAID' ? <FiCheck className="h-5 w-5" /> : 
               paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED' ? <FiAlertTriangle className="h-5 w-5" /> : 
               <FiClock className="h-5 w-5" />}
            </div>
          </div>
          
          {paymentStatus === 'PENDING' && (
            <div className="mt-2 text-sm text-blue-700 flex items-center">
              <FiClock className="mr-1" /> Bayar sebelum: <span className="font-medium ml-1">{countdown}</span>
            </div>
          )}
          
          {paymentStatus === 'PAID' && (
            <p className="mt-2 text-sm text-green-700">
              Terima kasih atas pembayaran Anda. Pesanan Anda sedang diproses.
            </p>
          )}
          
          {(paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED') && (
            <p className="mt-2 text-sm text-red-700">
              Pembayaran tidak berhasil. Silakan kembali ke dashboard untuk membuat pesanan baru.
            </p>
          )}
        </div>

        {/* Informasi pesanan - Better for mobile */}
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium mb-4">Informasi Pesanan</h2>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 mb-1 sm:mb-0">ID Pesanan</span>
              <span className="font-medium text-sm break-all">{orderData.id}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 mb-1 sm:mb-0">Total Pembayaran</span>
              <span className="font-medium text-base text-indigo-700">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(orderData.amount)}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2">
              <span className="text-sm text-gray-500 mb-1 sm:mb-0">Metode Pembayaran</span>
              <span className="font-medium inline-flex items-center text-sm">
                <FiCreditCard className="mr-1 text-gray-500" />
                {orderData.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' :
                 orderData.paymentMethod === 'E_WALLET' ? 'E-Wallet' :
                 orderData.paymentMethod === 'QRIS' ? 'QRIS' : orderData.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Instruksi pembayaran - Improved for mobile */}
        {paymentStatus === 'PENDING' && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <h2 className="text-base sm:text-lg font-medium mb-4">Instruksi Pembayaran</h2>
            
            {orderData.paymentMethod === 'QRIS' && orderData.paymentData?.qrisData && (
              <div className="flex flex-col items-center">
                <img 
                  src={orderData.paymentData.qrisData.qrCode || '/images/qr-placeholder.png'} 
                  alt="QR Code" 
                  className="max-w-full w-64 h-64 object-contain mb-4"
                />
                <div className="text-center mt-2 p-3 bg-gray-50 rounded-md w-full">
                  <p className="text-sm text-gray-600">
                    Scan QR Code di atas menggunakan aplikasi mobile banking atau e-wallet Anda untuk menyelesaikan pembayaran.
                  </p>
                </div>
              </div>
            )}
            
            {orderData.paymentMethod === 'BANK_TRANSFER' && orderData.paymentData?.bankAccounts && (
              <div className="space-y-4">
                {orderData.paymentData.bankAccounts.map((account: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    {/* Bank details heading with better mobile spacing */}
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">{account.bank}</h3>
                      {index === 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Direkomendasikan
                        </span>
                      )}
                    </div>
                    
                    {/* Account details with better touch targets for mobile */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-sm text-gray-500 mb-1 sm:mb-0">Nomor Rekening</span>
                        <div className="flex items-center">
                          <span className="font-mono mr-2">{account.accountNumber}</span>
                          <button 
                            onClick={() => copyToClipboard(account.accountNumber)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 -m-2" // Larger touch target
                            aria-label="Salin nomor rekening"
                          >
                            <FiCopy size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-sm text-gray-500 mb-1 sm:mb-0">Atas Nama</span>
                        <span className="font-medium">{account.accountName}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="rounded-md p-4 bg-yellow-50 text-yellow-700 text-sm">
                  <p className="font-medium mb-2">Penting:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Pastikan mentransfer tepat sesuai jumlah pembayaran hingga digit terakhir</li>
                    <li>Setelah transfer, simpan bukti pembayaran</li>
                    <li>Sistem akan memverifikasi pembayaran Anda secara otomatis</li>
                  </ul>
                </div>
              </div>
            )}
            
            {orderData.paymentMethod === 'E_WALLET' && (
              <div className="space-y-4">
                <p className="text-center text-gray-600 text-sm sm:text-base">
                  Silakan pilih e-wallet yang ingin Anda gunakan untuk pembayaran:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['DANA', 'OVO', 'GoPay'].map((wallet) => (
                    <button
                      key={wallet}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 flex justify-center items-center"
                      onClick={() => router.push(`/checkout/payment/e-wallet?id=${id}&wallet=${wallet}`)}
                    >
                      <div className="text-center">
                        <span className="block font-medium">{wallet}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Tombol tindakan - Mobile friendly button sizing */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-center">
          {paymentStatus === 'PENDING' && (
            <Button 
              variant="outline"
              className="w-full sm:w-auto sm:mx-2 mb-3 sm:mb-0"
              onClick={() => router.push('/dashboard')}
            >
              Bayar Nanti
            </Button>
          )}
          
          {(paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED') && (
            <Button 
              variant="primary"
              className="w-full sm:w-auto sm:mx-2"
              onClick={() => router.push('/dashboard')}
            >
              Kembali ke Dashboard
            </Button>
          )}
          
          {paymentStatus === 'PAID' && (
            <Button 
              variant="primary"
              className="w-full sm:w-auto sm:mx-2"
              onClick={() => router.push(`/checkout/confirmation?id=${id}`)}
            >
              Lihat Detail Pesanan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 