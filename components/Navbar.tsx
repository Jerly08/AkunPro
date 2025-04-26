'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Helper function to check if URL is a data URL
  const isDataUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('data:');
  };

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
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-dark">Akun</span>
                <span className="text-primary">pro</span>
              </span>
            </Link>
            
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link href="/netflix" className="px-3 py-2 text-sm font-medium text-gray-text hover:text-primary">
                Netflix
              </Link>
              <Link href="/spotify" className="px-3 py-2 text-sm font-medium text-gray-text hover:text-primary">
                Spotify
              </Link>
              <Link href="/panduan" className="px-3 py-2 text-sm font-medium text-gray-text hover:text-primary">
                Panduan
              </Link>
              <Link href="/help" className="px-3 py-2 text-sm font-medium text-gray-text hover:text-primary">
                FAQ
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <div className="flex items-center bg-gray-light rounded-lg px-3 py-2">
                <input
                  type="text"
                  placeholder="Cari akun..."
                  className="bg-transparent border-none focus:outline-none w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="button" className="text-gray-text">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Cart Button */}
            <div className="relative">
              <Link href="/cart" className="text-dark hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
            
            {/* Auth Buttons */}
            {!session ? (
              <div className="flex space-x-2">
                <Link 
                  href="/auth/login" 
                  className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-blue-50"
                >
                  Masuk
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
                >
                  Daftar
                </Link>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="relative group">
                  <button className="flex items-center space-x-1 focus:outline-none">
                    <span className="text-sm font-medium text-dark">
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
        </div>
      </div>
    </nav>
  );
} 