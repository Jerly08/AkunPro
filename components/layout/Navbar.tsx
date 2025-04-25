'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiShoppingCart, FiMenu, FiX, FiLogOut, FiList, FiUserCheck, FiShield, FiTrello } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { usePathname, useRouter } from 'next/navigation';
import CartButton from '@/components/cart/CartButton';
import { useCart } from '@/contexts/CartContext';

// Komponen Loading terpisah
const NavbarLoading = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/80 backdrop-blur-md">
    <div className="container mx-auto px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
    </div>
  </nav>
);

const NavbarContent = () => {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { clearCart } = useCart();
  
  // Cek apakah user adalah admin
  const isAdmin = session?.user?.role === 'ADMIN';

  // Redirect admin ke dashboard jika mencoba mengakses halaman lain
  // atau ketika pertama kali login
  useEffect(() => {
    if (isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, router]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Hapus data cart dari localStorage dan state sebelum logout
    localStorage.removeItem('cartItems');
    clearCart();
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Handle navigasi ke dashboard
  const handleDashboardClick = () => {
    if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Tutup menu saat path berubah
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 ${
        isScrolled ? 'bg-blue-100 shadow-md' : 'bg-blue-50/90 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={isAdmin ? '/admin' : '/'} className="flex items-center space-x-2">
          <Image src="/images/logo.png" alt="Akun Pro" width={40} height={40} />
          <span className="font-bold text-xl text-gray-900">
            {isAdmin ? 'Admin Dashboard' : 'Akun Pro'}
          </span>
        </Link>

        {/* Desktop Navigation - hanya tampilkan jika bukan admin */}
        {!isAdmin && (
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`text-sm font-medium ${pathname === '/' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
              Beranda
            </Link>
            <Link href="/account?type=NETFLIX" className={`text-sm font-medium ${pathname === '/account' && pathname.includes('type=NETFLIX') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
              Netflix
            </Link>
            <Link href="/account?type=SPOTIFY" className={`text-sm font-medium ${pathname === '/account' && pathname.includes('type=SPOTIFY') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
              Spotify
            </Link>
            <Link href="/about" className={`text-sm font-medium ${pathname === '/about' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
              Tentang Kami
            </Link>
          </div>
        )}
        
        {/* Admin Navigation */}
        {isAdmin && (
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center text-indigo-600 font-medium">
              <FiShield className="mr-2" />
              Mode Admin
            </div>
          </div>
        )}

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Shopping Cart - hanya tampilkan jika bukan admin */}
          {!isAdmin && <CartButton />}

          {session ? (
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600">
                <span className="text-sm font-medium">{session.user?.name}</span>
                <FiUser className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-blue-50 border border-blue-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="py-1">
                  {/* Menu untuk admin */}
                  {isAdmin ? (
                    <button 
                      onClick={handleDashboardClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100"
                    >
                      <FiShield className="mr-2 h-4 w-4" /> Dashboard Admin
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleDashboardClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-100"
                      >
                        <FiTrello className="mr-2 h-4 w-4" /> Dashboard
                      </button>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">
                        <FiUserCheck className="mr-2 h-4 w-4" /> Profil Saya
                      </Link>
                      <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">
                        <FiList className="mr-2 h-4 w-4" /> Riwayat Pesanan
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-blue-100"
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Mengeluarkan...' : 'Keluar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button href="/auth/login" variant="outline" size="sm">
                Masuk
              </Button>
              <Button href="/auth/register" variant="primary" size="sm">
                Daftar
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {/* Shopping Cart - hanya tampilkan jika bukan admin */}
          {!isAdmin && (
            <Link href="/cart" className="relative p-2 mr-2 text-gray-700">
              <FiShoppingCart className="w-5 h-5" />
            </Link>
          )}
          <button 
            className="p-2 text-gray-700 focus:outline-none" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden fixed inset-0 z-40 bg-blue-50/95 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{ top: '64px' }}
      >
        <div className="container mx-auto px-6 py-8 space-y-6">
          {/* Navigasi untuk pengguna biasa */}
          {!isAdmin && (
            <div className="flex flex-col space-y-6">
              <Link 
                href="/" 
                className={`text-lg font-medium py-2 transition-colors duration-200 ${
                  pathname === '/' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link 
                href="/account?type=NETFLIX" 
                className={`text-lg font-medium py-2 transition-colors duration-200 ${
                  pathname === '/account' && pathname.includes('type=NETFLIX') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Netflix
              </Link>
              <Link 
                href="/account?type=SPOTIFY" 
                className={`text-lg font-medium py-2 transition-colors duration-200 ${
                  pathname === '/account' && pathname.includes('type=SPOTIFY') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Spotify
              </Link>
              <Link 
                href="/about" 
                className={`text-lg font-medium py-2 transition-colors duration-200 ${
                  pathname === '/about' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Tentang Kami
              </Link>
            </div>
          )}
          
          {/* Navigasi untuk admin */}
          {isAdmin && (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center text-indigo-600 font-medium text-lg py-2">
                <FiShield className="mr-3 h-5 w-5" />
                Mode Admin
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            {session ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 py-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-sm text-gray-500">{session.user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Menu untuk admin di mobile */}
                  {isAdmin ? (
                    <button 
                      onClick={handleDashboardClick}
                      className="flex items-center w-full py-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                    >
                      <FiShield className="mr-3 h-5 w-5" /> Dashboard Admin
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleDashboardClick}
                        className="flex items-center w-full py-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                      >
                        <FiTrello className="mr-3 h-5 w-5" /> Dashboard
                      </button>
                      <Link 
                        href="/profile" 
                        className="flex items-center py-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FiUserCheck className="mr-3 h-5 w-5" /> Profil Saya
                      </Link>
                      <Link 
                        href="/orders" 
                        className="flex items-center py-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FiList className="mr-3 h-5 w-5" /> Riwayat Pesanan
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="flex items-center w-full py-3 text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    <FiLogOut className="mr-3 h-5 w-5" />
                    {isLoggingOut ? 'Mengeluarkan...' : 'Keluar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4 pt-4">
                <Button 
                  href="/auth/login" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Masuk
                </Button>
                <Button 
                  href="/auth/register" 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Daftar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Komponen utama yang menggunakan dynamic import
const Navbar = () => {
  const { status } = useSession();
  
  // Tampilkan loading state saat status masih loading
  if (status === 'loading') {
    return <NavbarLoading />;
  }
  
  // Tampilkan konten navbar setelah status selesai loading
  return <NavbarContent />;
};

export default Navbar; 