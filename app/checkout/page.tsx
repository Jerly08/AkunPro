'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingCart, FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiSmartphone, FiGrid, FiServer, FiTag, FiX } from 'react-icons/fi';
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
  quantity?: number;
}

interface VoucherData {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
}

const CheckoutPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, removeFromCart, clearCart, validateCart, isValidating, lastValidated } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [lastInputTime, setLastInputTime] = useState(0);
  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  
  // Tambahkan log debugging
  useEffect(() => {
    console.log("Debug checkout state:", { 
      isLoading, 
      isSubmitting, 
      itemsCount: items.length, 
      authStatus: status 
    });
  }, [isLoading, isSubmitting, items, status]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'BANK_TRANSFER'
  });

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

  // Validasi cart hanya sekali saat halaman dimuat
  useEffect(() => {
    if (items.length > 0 && status === 'authenticated' && shouldValidate === false) {
      setShouldValidate(true);
      setIsLoading(true); // Set loading sebelum validasi
      console.log("Starting cart validation...");
      
      // Delay validation to prevent UI stutter when loading page
      const timeoutId = setTimeout(() => {
        validateCart().then(result => {
          console.log("Cart validation complete:", result);
          if (!result.valid) {
            toast.error(
              'Beberapa item tidak tersedia dan telah dihapus dari keranjang Anda', 
              { duration: 5000 }
            );
          }
          setIsLoading(false);
        }).catch(err => {
          console.error("Validation error:", err);
          setIsLoading(false);
        });
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    } else if (!shouldValidate) {
      console.log("Skipping validation, setting isLoading to false");
      setIsLoading(false);
    }
  }, [items, status, validateCart, shouldValidate]);

  // Tambahkan timer keamanan untuk reset isLoading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Force resetting isLoading after timeout");
        setIsLoading(false);
      }
    }, 5000); // Reset setelah 5 detik
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  const calculateTotal = () => {
    // Subtotal
    const subtotal = items.reduce((total, item) => {
      const quantity = item.quantity || 1;
      return total + (item.price * quantity);
    }, 0);
    // Tax (11%)
    const tax = Math.round(subtotal * 0.11);
    // Discount from voucher
    const discount = voucherData ? voucherData.discountAmount : 0;
    // Grand total
    const total = Math.max(subtotal + tax - discount, 0);
    
    return {
      subtotal,
      tax,
      discount,
      total
    };
  };

  // Debounced input handler to prevent excessive re-renders
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLastInputTime(Date.now());
    
    // Debounce form updates to prevent UI lag
    setTimeout(() => {
      // Only update if this is still the most recent input
      if (Date.now() - lastInputTime >= 100) {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear form error when user makes changes
        if (formError) setFormError('');
      }
    }, 100);
  }, [formError, lastInputTime]);

  const validateForm = () => {
    // Validasi dasar
    if (!formData.name.trim()) return 'Nama harus diisi';
    if (!formData.email.trim()) return 'Email harus diisi';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Format email tidak valid';
    if (!formData.phone.trim()) return 'Nomor telepon harus diisi';
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Submit checkout form triggered");
    
    // Cek autentikasi, jika belum login arahkan ke login
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout');
      return;
    }
    
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
      // Tandai sebagai sedang dalam proses
      setIsSubmitting(true);
      toast.loading('Memproses checkout...');
      
      const totals = calculateTotal();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity || 1
          })),
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            paymentMethod: formData.paymentMethod
          },
          voucherId: voucherData?.id || null,
          discountAmount: voucherData?.discountAmount || 0
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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Masukkan kode voucher');
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherError(null);
      
      const { subtotal, tax } = calculateTotal();
      const amount = subtotal + tax;

      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: voucherCode.trim(),
          amount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVoucherError(data.message || 'Voucher tidak valid');
        setVoucherData(null);
        return;
      }

      setVoucherData(data.voucher);
      toast.success('Voucher berhasil diterapkan!');
    } catch (error: any) {
      console.error('Voucher error:', error);
      setVoucherError(error.message || 'Terjadi kesalahan saat validasi voucher');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherData(null);
    setVoucherCode('');
    setVoucherError(null);
  };

  const { subtotal, tax, discount, total } = calculateTotal();

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
            
            {/* Tambahkan pesan debug jika tombol dikunci */}
            {(isSubmitting || items.length === 0) && (
              <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-4">
                <p>Status tombol checkout:</p>
                <ul className="list-disc ml-4">
                  {isSubmitting && <li>Sedang memproses pembayaran</li>}
                  {items.length === 0 && <li>Keranjang belanja kosong</li>}
                </ul>
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
                      defaultValue={formData.name}
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
                      defaultValue={formData.email}
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
                      defaultValue={formData.phone}
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
                      defaultValue={formData.address}
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
                    
                    <div className="grid grid-cols-1 gap-3">
                      <label className="relative flex items-center p-4 border rounded-lg border-indigo-600 bg-indigo-50 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BANK_TRANSFER"
                          checked={true}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <FiCreditCard className="h-6 w-6 text-indigo-600" />
                          <div className="ml-3">
                            <span className="block font-medium text-indigo-700">
                              Transfer Bank
                            </span>
                            <span className="block text-sm text-gray-500">
                              Upload bukti pembayaran
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
                  disabled={isSubmitting || items.length === 0}
                  onClick={() => console.log("Checkout button clicked")}
                >
                  {isSubmitting ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                </Button>
                
                {/* Tambahkan tombol reset debug */}
                {isLoading && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      console.log("Manually resetting isLoading state"); 
                      setIsLoading(false); 
                    }}
                    className="mt-2 w-full py-2 px-4 text-sm text-gray-600 underline"
                  >
                    Reset Loading State (Debug)
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Ringkasan Pesanan */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            
            {/* Status validasi keranjang - disederhanakan */}
            {items.length > 0 && isValidating && (
              <div className="mb-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-700 mr-2"></div>
                  Memvalidasi keranjang...
                </div>
              </div>
            )}
            
            {items.length > 0 ? (
              <div>
                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.type} {item.quantity > 1 ? `(${item.quantity}x)` : ''} - {item.description?.substring(0, 25)}{item.description && item.description.length > 25 ? '...' : ''}
                      </span>
                      <span>Rp {(item.price * (item.quantity || 1)).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
    
                {/* Voucher Input */}
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <div className="mb-2">
                    <label htmlFor="voucher" className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Voucher
                    </label>
                    {voucherData ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <FiTag className="text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-green-700">{voucherData.code}</span>
                            <p className="text-xs text-green-600">
                              {voucherData.discountType === 'PERCENTAGE' 
                                ? `${voucherData.discountValue}% off` 
                                : `Rp ${voucherData.discountValue.toLocaleString('id-ID')} off`}
                            </p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleRemoveVoucher}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiTag className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="voucher"
                            value={voucherCode}
                            onChange={(e) => {
                              setVoucherCode(e.target.value);
                              setVoucherError(null);
                            }}
                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Masukkan kode voucher"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleApplyVoucher}
                          disabled={isApplyingVoucher || !voucherCode.trim()}
                          className="whitespace-nowrap"
                        >
                          {isApplyingVoucher ? 'Proses...' : 'Gunakan'}
                        </Button>
                      </div>
                    )}
                    {voucherError && (
                      <p className="mt-1 text-sm text-red-600">{voucherError}</p>
                    )}
                  </div>
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
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon</span>
                      <span>- Rp {discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
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