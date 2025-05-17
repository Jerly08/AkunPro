'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiShoppingCart, FiMenu, FiX, FiLogOut, FiList, FiUserCheck, FiShield, FiTrello, FiHelpCircle, FiMessageCircle } from 'react-icons/fi';
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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
    
    // Prevent body scroll when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Clean up body scroll lock
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Tutup menu saat path berubah
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 py-3 sm:py-4 transition-all duration-300 ${
        isScrolled ? 'bg-[#328E6E] shadow-md' : 'bg-[#328E6E]/95 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={isAdmin ? '/admin' : '/'} className="flex items-center space-x-2">
          <Image src="/images/Logo.png" alt="Akun Pro" width={40} height={40} />
          <span className="font-bold text-xl text-[#E1EEBC]">
            {isAdmin ? 'Admin Dashboard' : 'Akun Pro'}
          </span>
        </Link>

        {/* Desktop Navigation - hanya tampilkan jika bukan admin */}
        {!isAdmin && (
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`text-sm font-medium ${pathname === '/' ? 'text-[#E1EEBC] font-semibold' : 'text-[#E1EEBC] hover:text-white'}`}>
              Beranda
            </Link>
            <Link href="/account" className={`text-sm font-medium ${pathname === '/account' ? 'text-[#E1EEBC] font-semibold' : 'text-[#E1EEBC] hover:text-white'}`}>
              Layanan
            </Link>
            <Link href="/about" className={`text-sm font-medium ${pathname === '/about' ? 'text-[#E1EEBC] font-semibold' : 'text-[#E1EEBC] hover:text-white'}`}>
              Tentang Kami
            </Link>
            <Link href="/help" className={`text-sm font-medium ${pathname === '/help' ? 'text-[#E1EEBC] font-semibold' : 'text-[#E1EEBC] hover:text-white'}`}>
              FAQ
            </Link>
          </div>
        )}
        
        {/* Admin Navigation */}
        {isAdmin && (
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center text-[#E1EEBC] font-medium">
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
            <div className="relative" ref={profileMenuRef}>
              <button 
                className="flex items-center space-x-2 text-[#E1EEBC] hover:text-white"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <span className="text-sm font-medium">{session.user?.name}</span>
                <FiUser className="w-5 h-5" />
              </button>
              <div className={`absolute right-0 mt-2 w-48 bg-blue-50 border border-blue-100 rounded-md shadow-lg transition-all duration-200 ${
                isProfileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}>
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
                      <Link href="/dashboard/chat" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">
                        <FiMessageCircle className="mr-2 h-4 w-4" /> Chat
                      </Link>
                      <Link href="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">
                        <FiHelpCircle className="mr-2 h-4 w-4" /> FAQ
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
            <Link href="/cart" className="relative p-2 mr-2 text-[#E1EEBC]">
              <FiShoppingCart className="w-5 h-5" />
            </Link>
          )}
          <button 
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E1EEBC]/50 active:bg-[#E1EEBC]/10" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className={`absolute block h-0.5 w-5 bg-[#E1EEBC] transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
              <span className={`absolute block h-0.5 w-5 bg-[#E1EEBC] transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`absolute block h-0.5 w-5 bg-[#E1EEBC] transform transition-all duration-300 ease-in-out ${isMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Using fixed overlay with transition */}
      <div 
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={toggleMenu}
      ></div>
      <div 
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
        style={{ top: '60px', height: 'calc(100vh - 60px)' }}
      >
        <div className="px-4 py-6 h-full">
          {/* Navigasi untuk pengguna biasa */}
          {!isAdmin && (
            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-4">
              <Link 
                href="/" 
                className={`flex items-center text-base font-medium py-2.5 px-4 rounded-md ${
                  pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={toggleMenu}
              >
                Beranda
              </Link>
              <Link 
                href="/account" 
                className={`flex items-center text-base font-medium py-2.5 px-4 rounded-md ${
                  pathname === '/account' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={toggleMenu}
              >
                Layanan
              </Link>
              <Link 
                href="/about" 
                className={`flex items-center text-base font-medium py-2.5 px-4 rounded-md ${
                  pathname === '/about' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={toggleMenu}
              >
                Tentang Kami
              </Link>
              <Link 
                href="/help" 
                className={`flex items-center text-base font-medium py-2.5 px-4 rounded-md ${
                  pathname === '/help' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={toggleMenu}
              >
                FAQ
              </Link>
            </div>
          )}
          
          {/* Navigasi untuk admin */}
          {isAdmin && (
            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-4">
              <div className="flex items-center text-indigo-600 font-medium text-base py-2.5 px-4 bg-indigo-50 rounded-md">
                <FiShield className="mr-3 h-5 w-5" />
                Mode Admin
              </div>
            </div>
          )}

          <div className="pt-4">
            {session ? (
              <div className="space-y-5">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-600">{session.user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {/* Menu untuk admin di mobile */}
                  {isAdmin ? (
                    <button 
                      onClick={handleDashboardClick}
                      className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      <FiShield className="mr-3 h-5 w-5" /> Dashboard Admin
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleDashboardClick}
                        className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                      >
                        <FiTrello className="mr-3 h-5 w-5" /> Dashboard
                      </button>
                      <Link 
                        href="/profile" 
                        className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        onClick={toggleMenu}
                      >
                        <FiUserCheck className="mr-3 h-5 w-5" /> Profil Saya
                      </Link>
                      <Link 
                        href="/orders" 
                        className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        onClick={toggleMenu}
                      >
                        <FiList className="mr-3 h-5 w-5" /> Riwayat Pesanan
                      </Link>
                      <Link 
                        href="/dashboard/chat" 
                        className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        onClick={toggleMenu}
                      >
                        <FiMessageCircle className="mr-3 h-5 w-5" /> Chat
                      </Link>
                      <Link 
                        href="/help" 
                        className="flex items-center w-full py-2.5 px-4 text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        onClick={toggleMenu}
                      >
                        <FiHelpCircle className="mr-3 h-5 w-5" /> FAQ
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="flex items-center w-full text-left py-2.5 px-4 text-red-600 hover:bg-gray-100 rounded-md transition-colors duration-200 mt-2"
                  >
                    <FiLogOut className="mr-3 h-5 w-5" />
                    {isLoggingOut ? 'Mengeluarkan...' : 'Keluar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  href="/auth/login" 
                  variant="outline" 
                  className="w-full py-2.5"
                  onClick={toggleMenu}
                >
                  Masuk
                </Button>
                <Button 
                  href="/auth/register" 
                  variant="primary" 
                  className="w-full py-2.5"
                  onClick={toggleMenu}
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