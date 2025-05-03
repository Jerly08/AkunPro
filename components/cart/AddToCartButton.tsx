'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiShoppingCart, FiCheck, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

// Cache for stock information
const stockCache = new Map<string, { value: number; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache time

type AddToCartButtonProps = {
  account: {
    id: string;
    type: string;
    price: number;
    description?: string;
    warranty?: number;
  };
  disabled?: boolean;
};

export default function AddToCartButton({ account, disabled }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, addToCart, removeFromCart, isItemInCart, getItemQuantity, updateQuantity } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stockAvailable, setStockAvailable] = useState(10); // Default value, will be updated
  const fetchingRef = useRef(false);
  
  const isInCart = isItemInCart(account.id);
  const existingQuantity = getItemQuantity(account.id);

  // Fetch stock information when component mounts
  useEffect(() => {
    // Skip if we're already fetching
    if (fetchingRef.current) return;
    
    const fetchStockInfo = async () => {
      // Check cache first
      const cachedData = stockCache.get(account.id);
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
        // Use cached data if it's still valid
        setStockAvailable(cachedData.value);
        return;
      }
      
      // Set fetching flag to prevent multiple calls
      fetchingRef.current = true;
      
      try {
        const response = await fetch(`/api/accounts/${account.id}/status`);
        if (response.ok) {
          const data = await response.json();
          const stockValue = data.stock || 0;
          setStockAvailable(stockValue);
          
          // Update cache
          stockCache.set(account.id, { 
            value: stockValue, 
            timestamp: Date.now() 
          });
        }
      } catch (error) {
        console.error('Error fetching stock info:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchStockInfo();
  }, [account.id]);

  // Handler untuk menambah kuantitas
  const incrementQuantity = () => {
    if (quantity < stockAvailable) {
      setQuantity(prev => prev + 1);
    } else {
      toast.error('Kuantitas telah mencapai batas stok yang tersedia');
    }
  };

  // Handler untuk mengurangi kuantitas
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleClick = async () => {
    // Cek apakah pengguna sudah login
    if (!session) {
      // Jika belum login, arahkan ke halaman login
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isInCart) {
        removeFromCart(account.id);
      } else {
        await addToCart({
          id: account.id,
          type: account.type,
          price: account.price,
          description: account.description,
          warranty: account.warranty,
        }, quantity);
        
        toast.success(`${quantity} akun ${account.type} berhasil ditambahkan ke keranjang`);
        setQuantity(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Gagal menambahkan ke keranjang');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk memperbarui kuantitas jika sudah ada di keranjang
  const handleUpdateQuantity = (newQuantity: number) => {
    setIsLoading(true);
    try {
      updateQuantity(account.id, newQuantity);
      toast.success('Kuantitas berhasil diperbarui');
      setQuantity(newQuantity);
    } catch (error) {
      toast.error('Gagal memperbarui kuantitas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Info stok */}
      <div className="text-sm text-gray-600">
        {stockAvailable > 0 ? (
          <span>Stok tersedia: <span className="font-semibold">{stockAvailable}</span></span>
        ) : (
          <span className="text-red-500 font-semibold">Stok habis</span>
        )}
      </div>

      {/* Pengaturan kuantitas */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={quantity <= 1 || isLoading || disabled || stockAvailable <= 0}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <FiMinus size={16} />
          </button>
          <span className="w-12 text-center">{isInCart ? existingQuantity : quantity}</span>
          <button
            type="button"
            onClick={incrementQuantity}
            disabled={quantity >= stockAvailable || isLoading || disabled || stockAvailable <= 0}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <FiPlus size={16} />
          </button>
        </div>

        {/* Tombol tambah ke keranjang / update kuantitas */}
        {isInCart ? (
          <Button
            onClick={() => handleUpdateQuantity(quantity)}
            disabled={isLoading || disabled || stockAvailable <= 0 || quantity === existingQuantity}
            variant="outline"
          >
            <FiCheck className="mr-2" /> Update Kuantitas
          </Button>
        ) : (
          <Button
            onClick={handleClick}
            disabled={isLoading || disabled || stockAvailable <= 0}
            variant="primary"
          >
            {isLoading ? 'Menambahkan...' : (
              <>
                <FiShoppingCart className="mr-2" /> Tambah ke Keranjang
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
} 