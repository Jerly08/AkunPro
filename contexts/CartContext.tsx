'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Cache for account status data
const accountStatusCache = new Map<string, {
  data: any;
  timestamp: number;
}>();
const CACHE_TTL = 300000; // 5 minute cache time - meningkatkan dari 1 menit ke 5 menit

type CartItem = {
  id: string;
  type: string;
  price: number;
  description?: string;
  warranty?: number;
  quantity: number;
  stockAvailable?: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isItemInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
  validateCart: () => Promise<{ valid: boolean; unavailableItems?: string[] }>;
  isValidating: boolean;
  lastValidated: Date | null;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: async () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isItemInCart: () => false,
  getItemQuantity: () => 0,
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
  const validationInProgressRef = useRef<Set<string>>(new Set());
  const validationErrorsRef = useRef<Map<string, number>>(new Map());
  
  // Fungsi untuk memvalidasi status akun
  const validateAccountStatus = async (accountId: string, silent: boolean = false): Promise<{ 
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
      // Check if this account has had recent validation errors
      const errorCount = validationErrorsRef.current.get(accountId) || 0;
      if (errorCount > 3) {
        // If we've had multiple errors for this account recently, use cache if available
        const cachedData = accountStatusCache.get(accountId);
        if (cachedData) {
          console.log(`Using cached data for account ${accountId} due to previous errors`);
          return cachedData.data;
        }
      }
      
      // Check if this account is already being validated
      if (validationInProgressRef.current.has(accountId)) {
        console.log(`Validation already in progress for account ${accountId}`);
        
        // Return cached data or wait until fresh data is available
        const cachedData = accountStatusCache.get(accountId);
        if (cachedData) {
          return cachedData.data;
        }
        
        // If no cached data, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        return validateAccountStatus(accountId, silent);
      }
      
      // Check cache first
      const cachedData = accountStatusCache.get(accountId);
      const now = Date.now();
      
      // Use cached data if it's still valid
      if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
        console.log(`Using cached account status for ID: ${accountId}`);
        return cachedData.data;
      }
      
      // Skip actual validation if we've been rate limited recently, just use cache
      if (cachedData && validationErrorsRef.current.size > 2) {
        console.log(`Using cached data due to recent rate limiting`);
        return cachedData.data;
      }
      
      console.log(`Validating account status for ID: ${accountId}`);
      
      // Mark this account as being validated
      validationInProgressRef.current.add(accountId);
      
      try {
        const response = await fetch(`/api/accounts/${accountId}/status`);
        
        if (!response.ok) {
          console.error(`Error fetching account status: ${response.status} ${response.statusText}`);
          
          // Track validation errors for rate limiting purposes
          if (response.status === 429) {
            validationErrorsRef.current.set(accountId, (validationErrorsRef.current.get(accountId) || 0) + 1);
            
            // Clear error count after a timeout
            setTimeout(() => {
              validationErrorsRef.current.delete(accountId);
            }, 60000); // Clear after 1 minute
          }
          
          // If rate limited, use cached data if available
          if (response.status === 429 && cachedData) {
            console.log(`Rate limited, using cached data for account ${accountId}`);
            return cachedData.data;
          }
          
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
          
          const errorResult = {
            isAvailable: cachedData ? cachedData.data.isAvailable : false,
            message: errorMsg
          };
          
          // For silent validation, use cached data if available instead of returning error
          if (silent && cachedData) {
            return cachedData.data;
          }
          
          return errorResult;
        }
        
        const data = await response.json();
        // Reset error count on successful response
        validationErrorsRef.current.delete(accountId);
        
        let result;
        
        // Handle explicit isAvailable flag in response
        if (data.hasOwnProperty('isAvailable')) {
          // Return all data with proper defaults
          result = {
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
        } else {
          // Fallback to older approach if isAvailable flag not present
          const isAvailable = data.status === 'active' && (Number(data.stock) > 0);
          
          result = {
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
        }
        
        // Cache the successful result
        accountStatusCache.set(accountId, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      } finally {
        // Remove from in-progress set when done
        validationInProgressRef.current.delete(accountId);
      }
    } catch (error) {
      console.error('Error validating account status:', error);
      // Remove from in-progress set on error
      validationInProgressRef.current.delete(accountId);
      
      // Track validation errors
      validationErrorsRef.current.set(accountId, (validationErrorsRef.current.get(accountId) || 0) + 1);
      
      // For silent validation, use cached data if available
      if (silent) {
        const cachedData = accountStatusCache.get(accountId);
        if (cachedData) {
          return cachedData.data;
        }
      }
      
      return {
        isAvailable: false,
        message: error instanceof Error ? error.message : 'Gagal memvalidasi status akun'
      };
    }
  };

  // Modifikasi fungsi validateCart untuk memeriksa kuantitas
  const validateCart = useCallback(async (silent: boolean = false) => {
    // Skip validation if already in progress
    if (isValidating) {
      return { valid: true };
    }
    
    // Skip validation if validated recently (within last 2 minutes) for silent validation
    if (silent && lastValidated) {
      const timeSinceLastValidation = Date.now() - lastValidated.getTime();
      if (timeSinceLastValidation < 120000) { // 2 minutes
        console.log('Skipping silent validation - cart was validated recently');
        return { valid: true };
      }
    }
    
    setIsValidating(true);
    
    try {
      const unavailableItems: string[] = [];
      const updatedItems = [...items];
      let hasChanges = false;
      
      // Process items in smaller batches to avoid overwhelming the API
      const batchSize = 2; // Reduced batch size from 3 to 2
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Process each batch in parallel
        const results = await Promise.all(
          batch.map(async (item, batchIndex) => {
            const globalIndex = i + batchIndex;
            
            const { isAvailable, message, alternativeAccounts, currentAccount } = 
              await validateAccountStatus(item.id, silent);
            
            return {
              index: globalIndex,
              item,
              isAvailable,
              message,
              alternativeAccounts,
              currentAccount
            };
          })
        );
        
        // Process batch results
        for (const result of results) {
          const { index, item, isAvailable, message, alternativeAccounts, currentAccount } = result;
          
          if (!isAvailable) {
            unavailableItems.push(item.id);
            
            // Hanya hapus item yang tidak tersedia jika tidak silent mode
            if (!silent) {
              // Hapus item yang tidak tersedia dari keranjang
              removeFromCart(item.id);
              hasChanges = true;
              
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
            }
          } else if (currentAccount) {
            // Update stock information
            const stockAvailable = currentAccount.stock || 0;
            
            if (stockAvailable <= 0) {
              unavailableItems.push(item.id);
              
              // Hanya hapus item yang stok habis jika tidak silent mode
              if (!silent) {
                removeFromCart(item.id);
                hasChanges = true;
                toast.error(`Akun ${item.type} tidak memiliki stok tersedia`);
              }
            } else if (stockAvailable < item.quantity) {
              // Adjust quantity if less stock is available than currently in cart
              // Untuk silent mode, hanya update informasi stok tanpa mengubah kuantitas
              if (!silent) {
                updatedItems[index] = {
                  ...item,
                  quantity: stockAvailable,
                  stockAvailable
                };
                hasChanges = true;
                toast.error(`Kuantitas akun ${item.type} disesuaikan karena stok terbatas`);
              } else {
                // Pada silent mode, tetap update stockAvailable tanpa mengubah quantity
                updatedItems[index] = {
                  ...item,
                  stockAvailable
                };
                hasChanges = true;
              }
            } else {
              // Update stock information
              updatedItems[index] = {
                ...item,
                stockAvailable
              };
              hasChanges = true;
            }
          }
        }
        
        // Add small delay between batches to avoid rate limiting
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 300ms to 500ms
        }
      }
      
      if (hasChanges) {
        // Untuk silent mode, hanya filter item jika stok benar-benar habis
        if (silent) {
          // Jangan hapus item, hanya update informasi stoknya
          setItems(updatedItems);
        } else {
          // Mode normal, hapus item yang tidak tersedia
          setItems(updatedItems.filter(item => !unavailableItems.includes(item.id)));
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

  const getItemQuantity = useCallback((id: string) => {
    const item = items.find(item => item.id === id);
    return item ? item.quantity : 0;
  }, [items]);

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      if (newItems.length !== prev.length) {
        toast.success('Item berhasil dihapus dari keranjang');
      }
      return newItems;
    });
  };

  // Fungsi untuk mengosongkan keranjang
  const clearCart = () => {
    setItems([]);
  };

  // Fungsi untuk memperbarui kuantitas
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity };
        }
        return item;
      });
      return newItems;
    });
  }, []);

  // Fungsi untuk menambahkan item ke keranjang
  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    try {
      console.log(`Attempting to add item to cart: ${item.id} (${item.type}), quantity: ${quantity}`);
      
      // Validasi status akun
      const { isAvailable, message, alternativeAccounts, currentAccount } = 
        await validateAccountStatus(item.id);
      
      console.log(`Account validation result: isAvailable=${isAvailable}, message=${message}`);
      
      if (!isAvailable) {
        console.error(`Cannot add item to cart: ${message}`);
        throw new Error(message || 'Akun tidak tersedia');
      }
      
      // Get available stock
      const stockAvailable = currentAccount?.stock || 0;
      
      if (stockAvailable <= 0) {
        throw new Error('Stok akun habis');
      }
      
      // Cek apakah item sudah ada di cart, jika ya, tambahkan kuantitas
      const existingQuantity = getItemQuantity(item.id);
      const newQuantity = existingQuantity + quantity;
      
      // Pastikan tidak melebihi stok yang tersedia
      const finalQuantity = Math.min(newQuantity, stockAvailable);
      
      if (existingQuantity > 0) {
        // Update kuantitas jika item sudah ada
        updateQuantity(item.id, finalQuantity);
        return;
      }
      
      // Tambahkan item ke cart dengan data terbaru jika tersedia
      const updatedItem = currentAccount ? {
        ...item,
        price: currentAccount.price || item.price,
        description: currentAccount.description || item.description,
        warranty: currentAccount.warranty || item.warranty,
        quantity: finalQuantity,
        stockAvailable
      } : {
        ...item,
        quantity: finalQuantity,
        stockAvailable
      };
      
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
        
        // Validate existing cart on load, but in silent mode
        if (status === 'authenticated' && storedItems) {
          // Delay validation to improve initial experience
          setTimeout(() => {
            validateCart(true);
          }, 5000); // Delay 5 seconds before validating
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
        // User baru login, cek validasi cart dalam silent mode
        setTimeout(() => {
          validateCart(true);
        }, 3000); // Delay validation on login
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
    
    // Auto-refresh validasi cart setiap 15 menit dengan silent mode
    if (!autoRefreshTimerRef.current) {
      autoRefreshTimerRef.current = setInterval(() => {
        console.log('Auto-validating cart silently...');
        if (!isValidating && !isLoadingCart.current) {
          validateCart(true); // Silent validation for auto-refresh
        }
      }, 15 * 60 * 1000); // 15 menit, diperpanjang dari 5 menit
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
        updateQuantity,
        removeFromCart,
        clearCart,
        isItemInCart,
        getItemQuantity,
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