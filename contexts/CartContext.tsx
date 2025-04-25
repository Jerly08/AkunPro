'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type CartItem = {
  id: string;
  type: string;
  price: number;
  description?: string;
  warranty?: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isItemInCart: (id: string) => boolean;
  validateCart: () => Promise<{ valid: boolean; unavailableItems?: string[] }>;
  isValidating: boolean;
  lastValidated: Date | null;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: async () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isItemInCart: () => false,
  validateCart: async () => ({ valid: true }),
  isValidating: false,
  lastValidated: null,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const { status } = useSession();
  const previousStatus = useRef(status);
  const isLoadingCart = useRef(false);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fungsi untuk memvalidasi status akun
  const validateAccountStatus = async (accountId: string): Promise<{ 
    isAvailable: boolean; 
    message?: string; 
    alternativeAccounts?: any[];
    currentAccount?: {
      id: string;
      price: number;
      description: string;
      warranty: number;
      stock: number;
      profiles?: Array<{
        id: string;
        name: string;
        isKids: boolean;
      }>;
    }
  }> => {
    try {
      console.log(`Validating account status for ID: ${accountId}`);
      
      const response = await fetch(`/api/accounts/${accountId}/status`);
      
      if (!response.ok) {
        console.error(`Error fetching account status: ${response.status} ${response.statusText}`);
        
        // Try to get error message from response if possible
        let errorMsg = `Error: ${response.statusText || 'Tidak dapat menghubungi server'}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          // Ignore error parsing JSON
        }
        
        return {
          isAvailable: false,
          message: errorMsg
        };
      }
      
      const data = await response.json();
      console.log('Account status response:', data);
      
      // Handle explicit isAvailable flag in response
      if (data.hasOwnProperty('isAvailable')) {
        // Return all data with proper defaults
        return {
          isAvailable: !!data.isAvailable,
          message: data.message || (data.isAvailable ? undefined : 'Akun tidak tersedia atau stok habis'),
          alternativeAccounts: data.alternativeAccounts || [],
          currentAccount: {
            id: accountId,
            price: Number(data.price || 0),
            description: data.description || '',
            warranty: Number(data.warranty || 0),
            stock: Number(data.stock || 0),
            profiles: data.profiles || []
          }
        };
      }
      
      // Fallback to older approach if isAvailable flag not present
      const isAvailable = data.status === 'active' && (Number(data.stock) > 0);
      
      return {
        isAvailable: isAvailable,
        message: !isAvailable ? (data.status !== 'active' ? 'Akun tidak aktif' : 'Stok akun habis') : undefined,
        alternativeAccounts: data.alternativeAccounts || [],
        currentAccount: {
          id: accountId,
          price: Number(data.price || 0),
          description: data.description || '',
          warranty: Number(data.warranty || 0),
          stock: Number(data.stock || 0),
          profiles: data.profiles || []
        }
      };
    } catch (error) {
      console.error('Error validating account status:', error);
      return {
        isAvailable: false,
        message: error instanceof Error ? error.message : 'Gagal memvalidasi status akun'
      };
    }
  };

  // Fungsi untuk memvalidasi semua item di keranjang
  const validateCart = useCallback(async () => {
    setIsValidating(true);
    try {
      const unavailableItems: string[] = [];
      
      for (const item of items) {
        const { isAvailable, message, alternativeAccounts, currentAccount } = await validateAccountStatus(item.id);
        if (!isAvailable) {
          unavailableItems.push(item.id);
          // Hapus item yang tidak tersedia dari keranjang
          removeFromCart(item.id);
          
          if (alternativeAccounts && alternativeAccounts.length > 0) {
            // Tampilkan notifikasi dengan opsi akun alternatif
            toast.error(
              <div>
                <p>{message}</p>
                <p className="mt-2">Akun alternatif tersedia:</p>
                <ul className="list-disc list-inside">
                  {alternativeAccounts.map(acc => (
                    <li key={acc.id}>
                      {acc.description} - Rp {acc.price.toLocaleString()}
                      {acc.type === 'NETFLIX' && acc.profiles ? ` (${acc.profiles.length} profil tersedia)` : ''}
                    </li>
                  ))}
                </ul>
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.error(message || 'Akun tidak tersedia');
          }
        } else if (currentAccount) {
          // Untuk akun Netflix, periksa apakah masih memiliki profil yang tersedia
          if (currentAccount.stock <= 0) {
            unavailableItems.push(item.id);
            removeFromCart(item.id);
            toast.error(`Akun ${item.type} tidak memiliki stok tersedia`);
          }
        }
      }
      
      setLastValidated(new Date());
      return {
        valid: unavailableItems.length === 0,
        unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined
      };
    } finally {
      setIsValidating(false);
    }
  }, [items]);

  const isItemInCart = useCallback((id: string) => {
    return items.some(item => item.id === id);
  }, [items]);

  const addToCart = async (item: CartItem) => {
    try {
      console.log(`Attempting to add item to cart: ${item.id} (${item.type})`);
      
      // Validasi status akun
      const { isAvailable, message, alternativeAccounts, currentAccount } = 
        await validateAccountStatus(item.id);
      
      console.log(`Account validation result: isAvailable=${isAvailable}, message=${message}`);
      
      if (!isAvailable) {
        console.error(`Cannot add item to cart: ${message}`);
        throw new Error(message || 'Akun tidak tersedia');
      }
      
      // Cek apakah item sudah ada di cart
      if (isItemInCart(item.id)) {
        console.warn(`Item ${item.id} already in cart`);
        throw new Error('Item sudah ada di keranjang');
      }
      
      // Tambahkan item ke cart dengan data terbaru jika tersedia
      const updatedItem = currentAccount ? {
        ...item,
        price: currentAccount.price || item.price,
        description: currentAccount.description || item.description,
        warranty: currentAccount.warranty || item.warranty
      } : item;
      
      console.log(`Adding item to cart:`, updatedItem);
      
      // Tambahkan item ke cart state
      setItems(prevItems => {
        const newItems = [...prevItems, updatedItem];
        // Simpan ke localStorage dengan state yang baru
        localStorage.setItem('cart', JSON.stringify(newItems));
        return newItems;
      });
      
      console.log('Item successfully added to cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      if (newItems.length !== prev.length) {
        toast.success('Item berhasil dihapus dari keranjang');
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };
  
  // Inisialisasi state cart dari localStorage saat komponen di-mount
  useEffect(() => {
    // Hanya jalankan di sisi klien
    if (typeof window !== 'undefined') {
      try {
        const storedItems = localStorage.getItem('cart');
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
        setMounted(true);
        
        // Validate existing cart on load
        if (status === 'authenticated') {
          validateCart();
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        // Jika ada error, buat cart kosong saja
        setItems([]);
        setMounted(true);
      }
    }
  }, [status]);
  
  // Track perubahan status dan update cart ketika user login/logout
  useEffect(() => {
    if (previousStatus.current !== status) {
      if (status === 'authenticated') {
        // User baru login, cek validasi cart
        validateCart();
      } else if (status === 'unauthenticated') {
        // User logout, kosongkan cart
        clearCart();
      }
      
      previousStatus.current = status;
    }
  }, [status]);

  // Menyimpan state cart ke localStorage setiap kali berubah
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);
  
  // Auto-refresh validasi cart secara berkala
  useEffect(() => {
    // Jangan auto-refresh jika user tidak login atau tidak ada item di cart
    if (status !== 'authenticated' || items.length === 0) {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      return;
    }
    
    // Auto-refresh validasi cart setiap 5 menit
    if (!autoRefreshTimerRef.current) {
      autoRefreshTimerRef.current = setInterval(() => {
        console.log('Auto-validating cart...');
        if (!isValidating && !isLoadingCart.current) {
          validateCart();
        }
      }, 5 * 60 * 1000); // 5 menit
    }
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [status, items.length, validateCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isItemInCart,
        validateCart,
        isValidating,
        lastValidated
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 