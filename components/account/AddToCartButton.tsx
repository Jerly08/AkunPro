'use client';

import { useState, useEffect } from 'react';
import { FiShoppingCart, FiCheckCircle } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface AddToCartButtonProps {
  accountId: string;
  isActive: boolean;
  accountType: string;
}

const AddToCartButton = ({ accountId, isActive, accountType }: AddToCartButtonProps) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    // Tambahkan ke localStorage untuk keranjang belanja
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Cek apakah item sudah ada di keranjang
    if (!cartItems.includes(accountId)) {
      const updatedCart = [...cartItems, accountId];
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));
      
      setIsAdded(true);
      
      // Dispatch custom event untuk update cart counter di navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
        // Juga trigger storage event untuk cross-tab sync
        window.dispatchEvent(new Event('storage'));
      }
      
      // Tampilkan alert sederhana
      alert('Produk berhasil ditambahkan ke keranjang belanja');
    } else {
      alert('Produk sudah ada di keranjang belanja');
    }
  };

  // Periksa apakah akun sudah ada di keranjang saat komponen dimount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      if (cartItems.includes(accountId)) {
        setIsAdded(true);
      }
    }
  }, [accountId]);

  const getButtonColor = () => {
    if (accountType === 'NETFLIX') {
      return 'bg-red-600 hover:bg-red-700';
    } else if (accountType === 'SPOTIFY') {
      return 'bg-green-600 hover:bg-green-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!isActive || isAdded}
      size="lg"
      className={`${getButtonColor()}`}
    >
      {isAdded ? (
        <>
          <FiCheckCircle className="mr-2" /> Sudah di Keranjang
        </>
      ) : (
        <>
          <FiShoppingCart className="mr-2" /> Tambah ke Keranjang
        </>
      )}
    </Button>
  );
};

export default AddToCartButton; 