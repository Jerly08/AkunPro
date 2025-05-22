'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Helper function to check if URL is a data URL
  const isDataUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('data:');
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch profile image from API to avoid caching issues
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (session?.user) {
        try {
          // Tambahkan timestamp untuk mencegah cache
          const timestamp = Date.now();
          const response = await fetch(`/api/profileImage?t=${timestamp}`);
          if (response.ok) {
            const data = await response.json();
            setProfileImageUrl(data.imageUrl);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      }
    };

    fetchProfileImage();
    
    // Tambahkan interval untuk memperbarui gambar profil setiap 5 detik
    const intervalId = setInterval(fetchProfileImage, 5000);
    
    // Cleanup interval saat komponen unmount
    return () => clearInterval(intervalId);
  }, [session]);
  
  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold tracking-tight text-white">
                <span>Akun</span>
                <span>pro</span>
              </span>
            </Link>
            
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link href="/netflix" className="px-3 py-2 text-sm font-medium text-white hover:text-gray-200">
                Netflix
              </Link>
              <Link href="/spotify" className="px-3 py-2 text-sm font-medium text-white hover:text-gray-200">
                Spotify
              </Link>
              <Link href="/panduan" className="px-3 py-2 text-sm font-medium text-white hover:text-gray-200">
                Panduan
              </Link>
              <Link href="/help" className="px-3 py-2 text-sm font-medium text-white hover:text-gray-200">
                FAQ
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <div className="flex items-center bg-primary-dark rounded-lg px-3 py-2">
                <input
                  type="text"
                  placeholder="Cari akun..."
                  className="bg-transparent border-none focus:outline-none w-48 text-white placeholder-gray-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="button" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Cart Button */}
            <div className="relative">
              <Link href="/cart" className="text-white hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
            
            {/* Auth Buttons */}
            <div className="hidden sm:block">
              {!session ? (
                <div className="flex space-x-2">
                  <Link 
                    href="/auth/login" 
                    className="px-3 py-2 text-sm font-medium text-white border border-white rounded-lg hover:bg-primary-dark"
                  >
                    Masuk
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="px-3 py-2 text-sm font-medium text-primary bg-white rounded-lg hover:bg-gray-100"
                  >
                    Daftar
                  </Link>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="relative group">
                    <button className="flex items-center space-x-1 focus:outline-none">
                      <span className="text-sm font-medium text-white">
                        {session.user.name}
                      </span>
                      <div className="relative h-8 w-8">
                        <Image 
                          src={
                            profileImageUrl?.startsWith('data:') ? profileImageUrl :
                            profileImageUrl ? `${profileImageUrl}?t=${Date.now()}` :
                            session.user.image?.startsWith('data:') ? session.user.image :
                            session.user.image ? `${session.user.image}?t=${Date.now()}` :
                            "/images/avatar-placeholder.svg"
                          }
                          alt="Profile"
                          className="rounded-full object-cover"
                          fill
                          sizes="32px"
                          priority
                          style={{ objectFit: 'cover' }}
                          unoptimized={isDataUrl(profileImageUrl) || isDataUrl(session.user.image)}
                          referrerPolicy="no-referrer"
                          key={`navbar-img-${Date.now()}`} 
                        />
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="hidden group-hover:block absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl z-10">
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-text hover:bg-gray-light">
                        Dashboard
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-text hover:bg-gray-light">
                        Profil Saya
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm text-gray-text hover:bg-gray-light">
                        Pesanan Saya
                      </Link>
                      <Link href="/help" className="block px-4 py-2 text-sm text-gray-text hover:bg-gray-light">
                        FAQ
                      </Link>
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-text hover:bg-gray-light"
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div 
          className="sm:hidden bg-primary border-t border-opacity-20 border-white" 
          ref={menuRef}
        >
          <div className="flex justify-center py-4">
            <Image 
              src="/images/Logo.png" 
              alt="AkunPro Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/netflix" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
            >
              Netflix
            </Link>
            <Link 
              href="/spotify" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
            >
              Spotify
            </Link>
            <Link 
              href="/panduan" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
            >
              Panduan
            </Link>
            <Link 
              href="/help" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
            >
              FAQ
            </Link>
          </div>
          
          {!session ? (
            <div className="px-5 py-4 border-t border-primary-dark">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-center text-sm font-medium text-white border border-white rounded-md hover:bg-primary-dark"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-center text-sm font-medium text-primary bg-white rounded-md hover:bg-gray-100"
                >
                  Daftar
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-primary-dark">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="relative h-10 w-10">
                    <Image 
                      src={
                        profileImageUrl?.startsWith('data:') ? profileImageUrl :
                        profileImageUrl ? `${profileImageUrl}?t=${Date.now()}` :
                        session.user.image?.startsWith('data:') ? session.user.image :
                        session.user.image ? `${session.user.image}?t=${Date.now()}` :
                        "/images/avatar-placeholder.svg"
                      }
                      alt="Profile"
                      className="rounded-full object-cover"
                      fill
                      sizes="40px"
                      priority
                      style={{ objectFit: 'cover' }}
                      unoptimized={isDataUrl(profileImageUrl) || isDataUrl(session.user.image)}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{session.user.name}</div>
                  <div className="text-sm font-medium text-gray-200">{session.user.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/orders"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
                >
                  Pesanan Saya
                </Link>
                <button
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-dark"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
} 