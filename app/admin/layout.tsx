'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiDatabase, FiUsers, FiShoppingBag, FiSettings, FiLogOut, FiMessageCircle } from 'react-icons/fi';
import { signOut, useSession } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const { status } = useSession();
  
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
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md z-10 fixed h-full">
          <div className="p-6 border-b border-gray-200">
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
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 