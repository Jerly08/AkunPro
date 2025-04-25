'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface CartItem {
  id: string;
  type: string;
  price: number;
  description: string;
}

const CartSummary = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setIsLoading(true);
        
        // Ambil ID dari localStorage
        const cartItemIds = JSON.parse(localStorage.getItem('cartItems') || '[]');
        
        if (cartItemIds.length === 0) {
          setCartItems([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch data akun dari API
        const response = await fetch('/api/accounts?ids=' + cartItemIds.join(','));
        const data = await response.json();
        
        if (data.accounts) {
          setCartItems(data.accounts);
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);
  
  const removeFromCart = (id: string) => {
    // Hapus dari state
    setCartItems(cartItems.filter(item => item.id !== id));
    
    // Hapus dari localStorage
    const cartItemIds = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const updatedCart = cartItemIds.filter((itemId: string) => itemId !== id);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };
  
  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };
  
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keranjang Belanja Kosong</h3>
        <p className="text-gray-600 mb-4">
          Anda belum menambahkan produk apapun ke keranjang belanja.
        </p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Jelajahi Produk
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Ringkasan Keranjang</h3>
        <p className="text-gray-600 text-sm mt-1">{cartItems.length} item dalam keranjang</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {cartItems.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {item.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {item.description.length > 60 
                  ? `${item.description.substring(0, 60)}...` 
                  : item.description}
              </p>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-4">
                <span className="font-medium text-gray-900">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Hapus dari keranjang"
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 bg-gray-50">
        <div className="flex justify-between mb-4">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-bold text-gray-900">
            Rp {getTotal().toLocaleString('id-ID')}
          </span>
        </div>
        
        <Link href="/checkout">
          <Button fullWidth size="lg">
            Lanjutkan ke Pembayaran <FiArrowRight className="ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CartSummary; 