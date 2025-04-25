'use client';

import { FiTrash2 } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';

interface CartItemProps {
  item: {
    id: string;
    type: 'NETFLIX' | 'SPOTIFY';
    price: number;
    description: string;
    warranty: number;
  };
}

const CartItem = ({ item }: CartItemProps) => {
  const { removeFromCart } = useCart();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900">
          {item.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        <p className="text-sm text-gray-500 mt-1">
          Garansi: {item.warranty} hari
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-lg font-medium text-gray-900">
          {formatCurrency(item.price)}
        </span>
        
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-600 hover:text-red-800 transition-colors"
          aria-label="Hapus item"
        >
          <FiTrash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CartItem; 