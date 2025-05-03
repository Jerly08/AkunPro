'use client';

import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CartItemProps {
  item: {
    id: string;
    type: 'NETFLIX' | 'SPOTIFY';
    price: number;
    description: string;
    warranty: number;
    quantity?: number;
    stockAvailable?: number;
  };
}

const CartItem = ({ item }: CartItemProps) => {
  const { removeFromCart, updateQuantity } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity || 1);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handler untuk menambah kuantitas
  const incrementQuantity = () => {
    if (!isUpdating) {
      const newQuantity = localQuantity + 1;
      
      // Batasi berdasarkan stok yang tersedia
      if (item.stockAvailable && newQuantity > item.stockAvailable) {
        toast.error('Kuantitas telah mencapai batas stok yang tersedia');
        return;
      }
      
      setIsUpdating(true);
      setLocalQuantity(newQuantity);
      updateQuantity(item.id, newQuantity);
      setIsUpdating(false);
    }
  };

  // Handler untuk mengurangi kuantitas
  const decrementQuantity = () => {
    if (!isUpdating && localQuantity > 1) {
      setIsUpdating(true);
      const newQuantity = localQuantity - 1;
      setLocalQuantity(newQuantity);
      updateQuantity(item.id, newQuantity);
      setIsUpdating(false);
    }
  };

  // Hitung total harga berdasarkan kuantitas
  const totalPrice = item.price * (localQuantity || 1);
  
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
      <div className="flex-1 mb-3 sm:mb-0">
        <h3 className="text-lg font-medium text-gray-900">
          {item.type === 'NETFLIX' ? 'Netflix Premium' : 'Spotify Premium'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        <p className="text-sm text-gray-500 mt-1">
          Garansi: {item.warranty} hari
        </p>
        {item.stockAvailable && (
          <p className="text-sm text-gray-500 mt-1">
            Stok tersedia: <span className="font-medium">{item.stockAvailable}</span>
          </p>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-4">
        {/* Pengaturan kuantitas */}
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden mb-2 sm:mb-0">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={localQuantity <= 1 || isUpdating}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            aria-label="Kurangi kuantitas"
          >
            <FiMinus size={14} />
          </button>
          <span className="w-10 text-center text-sm">{localQuantity}</span>
          <button
            type="button"
            onClick={incrementQuantity}
            disabled={(item.stockAvailable !== undefined && localQuantity >= item.stockAvailable) || isUpdating}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            aria-label="Tambah kuantitas"
          >
            <FiPlus size={14} />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-base sm:text-lg font-medium text-gray-900">
            {formatCurrency(totalPrice)}
            {localQuantity > 1 && (
              <span className="text-xs text-gray-500 block text-right">
                {formatCurrency(item.price)} x {localQuantity}
              </span>
            )}
          </div>
          
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Hapus item"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem; 