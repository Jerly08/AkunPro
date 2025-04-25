'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';

type AddToCartButtonProps = {
  account: {
    id: string;
    type: string;
    price: number;
  };
  disabled?: boolean;
};

export default function AddToCartButton({ account, disabled }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, addToCart, removeFromCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  
  const isInCart = items.some(item => item.id === account.id);

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
        addToCart(account);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || disabled}
      variant={isInCart ? 'outline' : 'primary'}
    >
      {isInCart ? (
        <>
          <FiCheck className="mr-2" />
          Hapus dari Keranjang
        </>
      ) : (
        <>
          <FiShoppingCart className="mr-2" />
          Tambah ke Keranjang
        </>
      )}
    </Button>
  );
} 