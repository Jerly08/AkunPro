'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingCart, FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiSmartphone, FiGrid } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  type: string;
  price: number;
  description?: string;
  warranty?: number;
}

const CheckoutPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, removeFromCart, clearCart, validateCart, isValidating, lastValidated } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'BANK_TRANSFER'
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Redirect to cart if cart is empty, kecuali setelah checkout berhasil
  useEffect(() => {
    if (items.length === 0 && !isLoading && !checkoutSuccess) {
      toast.error('Keranjang belanja kosong');
      router.push('/cart');
    }
  }, [items, router, isLoading, checkoutSuccess]);

  // Pre-fill form with user data if available
  useEffect(() => {
    if (session?.user) {
      setFormData(prevData => ({
        ...prevData,
        name: session.user.name || prevData.name,
        email: session.user.email || prevData.email
      }));
    }
  }, [session]);

  // Validasi ketersediaan item saat halaman dimuat
  useEffect(() => {
    if (items.length > 0 && status === 'authenticated') {
      validateCart().then(result => {
        if (!result.valid) {
          toast.error(
            'Beberapa item tidak tersedia dan telah dihapus dari keranjang Anda', 
            { duration: 5000 }
          );
        }
      });
    }
  }, [items, status, validateCart]);

  const calculateTotal = () => {
    // Subtotal
    const subtotal = items.reduce((total, item) => total + item.price, 0);
    // Tax (11%)
    const tax = Math.round(subtotal * 0.11);
    // Grand total
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear form error when user makes changes
    if (formError) setFormError('');
  };

  const validateForm = () => {
    // Validasi dasar
    if (!formData.name.trim()) return 'Nama harus diisi';
    if (!formData.email.trim()) return 'Email harus diisi';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Format email tidak valid';
    if (!formData.phone.trim()) return 'Nomor telepon harus diisi';
    if (!/^[0-9+\-\s]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) return 'Format nomor telepon tidak valid';
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi formulir
    const errorMessage = validateForm();
    if (errorMessage) {
      setFormError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (items.length === 0) {
      toast.error('Keranjang belanja kosong');
      router.push('/cart');
      return;
    }

    try {
      // Validasi ketersediaan item sebelum checkout
      setIsSubmitting(true);
      toast.loading('Memvalidasi ketersediaan item...');
      
      const validationResult = await validateCart();
      
      toast.dismiss();
      
      if (!validationResult.valid) {
        toast.error('Beberapa item tidak tersedia dan telah dihapus dari keranjang Anda');
        setIsSubmitting(false);
        return;
      }
      
      toast.loading('Memproses checkout...');
      
      const totals = calculateTotal();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => item.id),
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            paymentMethod: formData.paymentMethod
          },
        }),
      });

      toast.dismiss();
      
      const data = await response.json();

      if (!response.ok) {
        // Jika error karena booking oleh pengguna lain
        if (data.isBookedError) {
          toast.error('Beberapa akun sedang dalam proses checkout oleh pengguna lain. Silakan pilih akun lain.');
          
          // Tampilkan akun mana yang tidak tersedia
          if (data.unavailableItems && data.unavailableItems.length > 0) {
            // Hapus item yang tidak tersedia dari keranjang
            data.unavailableItems.forEach((itemId: string) => {
              // Hapus item dengan ID tersebut
              removeFromCart(itemId);
            });
            
            // Tampilkan pesan ke pengguna
            toast.error("Beberapa item tidak tersedia dan telah dihapus dari keranjang Anda");
          }
          
          setIsSubmitting(false);
          return;
        }
        
        throw new Error(data.message || 'Terjadi kesalahan saat checkout');
      }

      // Set flag checkout berhasil sebelum mengosongkan cart
      setCheckoutSuccess(true);
      
      // Jika berhasil, kosongkan keranjang
      clearCart();
      
      // Simpan ID pesanan ke localStorage untuk digunakan di halaman konfirmasi
      localStorage.setItem('currentOrderId', data.id);
      
      console.log('Redirecting to payment page...');
      
      // Redirect ke halaman pembayaran dengan ID pesanan
      router.push(`/checkout/payment/${data.id}`);
      toast.success('Pesanan berhasil dibuat!');
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      setFormError(error.message || 'Terjadi kesalahan saat checkout');
      toast.error(error.message || 'Terjadi kesalahan saat checkout');
    } finally {
      toast.dismiss();
      setIsSubmitting(false);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  // Menampilkan loading saat status autentikasi sedang dimuat
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  // Menampilkan halaman saat status autentikasi sudah selesai dimuat
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/cart" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <FiArrowLeft className="mr-2" /> Kembali ke Keranjang
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Checkout */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Informasi Pengiriman</h2>
            
            {formError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Nama lengkap Anda"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="contoh@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat (Opsional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="text-gray-400" />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Alamat lengkap (opsional)"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih metode pembayaran
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className={`
                        relative flex items-center p-4 border rounded-lg cursor-pointer
                        ${formData.paymentMethod === 'BANK_TRANSFER' 
                          ? 'border-indigo-600 bg-indigo-50' 
                          : 'border-gray-300 hover:bg-gray-50'}
                      `}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BANK_TRANSFER"
                          checked={formData.paymentMethod === 'BANK_TRANSFER'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <FiCreditCard className={`h-6 w-6 ${formData.paymentMethod === 'BANK_TRANSFER' ? 'text-indigo-600' : 'text-gray-400'}`} />
                          <div className="ml-3">
                            <span className={`block font-medium ${formData.paymentMethod === 'BANK_TRANSFER' ? 'text-indigo-700' : 'text-gray-700'}`}>
                              Transfer Bank
                            </span>
                            <span className="block text-sm text-gray-500">
                              Upload bukti pembayaran
                            </span>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`
                        relative flex items-center p-4 border rounded-lg cursor-pointer
                        ${formData.paymentMethod === 'VIRTUAL_ACCOUNT' 
                          ? 'border-indigo-600 bg-indigo-50' 
                          : 'border-gray-300 hover:bg-gray-50'}
                      `}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="VIRTUAL_ACCOUNT"
                          checked={formData.paymentMethod === 'VIRTUAL_ACCOUNT'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <FiCreditCard className={`h-6 w-6 ${formData.paymentMethod === 'VIRTUAL_ACCOUNT' ? 'text-indigo-600' : 'text-gray-400'}`} />
                          <div className="ml-3">
                            <span className={`block font-medium ${formData.paymentMethod === 'VIRTUAL_ACCOUNT' ? 'text-indigo-700' : 'text-gray-700'}`}>
                              Virtual Account
                            </span>
                            <span className="block text-sm text-gray-500">
                              Pembayaran otomatis
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit" 
                  className="w-full justify-center"
                  disabled={isSubmitting || isValidating || items.length === 0}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Ringkasan Pesanan */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            
            {/* Status validasi keranjang */}
            {items.length > 0 && (
              <div className="mb-4 text-xs text-gray-500">
                {isValidating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-700 mr-2"></div>
                    Memvalidasi ketersediaan item...
                  </div>
                ) : (
                  <>
                    {lastValidated && (
                      <div className="text-green-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Tervalidasi: {lastValidated.toLocaleTimeString()}
                        <button 
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                          onClick={() => validateCart()}
                          type="button"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <p className="text-gray-400 mt-1">Item diperbarui otomatis setiap 30 detik</p>
                  </>
                )}
              </div>
            )}
            
            {items.length > 0 ? (
              <div>
                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.type} - {item.description?.substring(0, 30)}{item.description && item.description.length > 30 ? '...' : ''}</span>
                      <span>Rp {item.price.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
    
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak (11%)</span>
                    <span>Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
    
                <button
                  type="submit"
                  form="checkout-form"
                  className={`w-full mt-6 py-3 px-4 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex justify-center items-center`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    'Lanjutkan ke Pembayaran'
                  )}
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Keranjang belanja kosong</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 