'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingCart, FiInfo } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/cart/CartItem';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleClearCart = () => {
    clearCart();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };
  
  const getTotalItems = () => {
    return items.reduce((count, item) => count + (item.quantity || 1), 0);
  };
  
  if (!mounted) {
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
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2" /> Kembali ke Beranda
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
          Keranjang Belanja
        </h1>
        <p className="text-gray-600">
          {getTotalItems()} akun dalam keranjang ({items.length} jenis akun)
        </p>
      </div>
      
      {items.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FiShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">
            Anda belum menambahkan item ke keranjang.
          </p>
          <Button 
            variant="primary"
            onClick={() => router.push('/')}
          >
            Jelajahi Akun
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Detail Keranjang
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Kosongkan Keranjang
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <CartItem key={item.id} item={item as any} />
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Ringkasan Pesanan
                </h2>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Akun</span>
                  <span className="font-medium">{getTotalItems()} akun</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Pajak (11%)</span>
                  <span className="font-medium">{formatCurrency(calculateTotal() * 0.11)}</span>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200 mb-4">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {formatCurrency(calculateTotal() * 1.11)}
                  </span>
                </div>
                
                <Button
                  variant="primary"
                  onClick={() => router.push('/checkout')}
                  className="w-full"
                >
                  Lanjut ke Checkout
                </Button>
                
                <div className="mt-4 p-3 bg-blue-50 rounded text-blue-800 text-sm flex">
                  <FiInfo className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>
                    Dengan melanjutkan ke checkout, Anda setuju dengan syarat dan ketentuan kami.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 