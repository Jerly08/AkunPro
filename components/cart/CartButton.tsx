'use client';

import { useRouter } from 'next/navigation';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';

export default function CartButton() {
  const router = useRouter();
  const { items } = useCart();

  return (
    <button
      onClick={() => router.push('/cart')}
      className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
    >
      <FiShoppingCart className="h-6 w-6" />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {items.length}
        </span>
      )}
    </button>
  );
} 