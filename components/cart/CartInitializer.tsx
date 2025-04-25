'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

// Komponen ini hanya mendengarkan perubahan cart dan memperbarui komponen lain
const CartInitializer = () => {
  const { items } = useCart();
  
  useEffect(() => {
    // Trigger event untuk memastikan semua komponen terupdate
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }, [items]);
  
  // Komponen ini tidak merender apapun ke DOM
  return null;
};

export default CartInitializer; 