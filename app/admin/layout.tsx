'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiDatabase, FiUsers, FiShoppingBag, FiSettings, FiLogOut, FiMessageCircle, FiMenu, FiX } from 'react-icons/fi';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const { status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check window size on component mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <FiHome /> },
    { href: '/admin/accounts', label: 'Akun', icon: <FiDatabase /> },
    { href: '/admin/orders', label: 'Pesanan', icon: <FiShoppingBag /> },
    { href: '/admin/users', label: 'Pengguna', icon: <FiUsers /> },
    { href: '/admin/chat', label: 'Chat Support', icon: <FiMessageCircle /> },
    { href: '/admin/settings', label: 'Pengaturan', icon: <FiSettings /> },
  ];

  // Tampilkan loading saat mengecek session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
        <Link href="/admin" className="flex items-center">
          <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
        </Link>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(!sidebarOpen);
          }}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar - Mobile: Absolute positioned overlay, Desktop: Fixed sidebar */}
        <div 
          className={`${
            isMobile 
              ? `fixed inset-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : 'w-64 fixed h-full z-10'
          } bg-white shadow-md transition-transform duration-300 ease-in-out`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 hidden md:block">
            <Link href="/admin" className="flex items-center">
              <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
            </Link>
          </div>
          
          <nav className="mt-6 px-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
              <li className="md:hidden mt-8">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3"><FiLogOut /></span>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Overlay for mobile when sidebar is open */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 