'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiHome, 
  FiPackage, 
  FiUsers, 
  FiSettings, 
  FiMessageCircle,
  FiList,
  FiDatabase,
  FiLogOut 
} from 'react-icons/fi';

type AdminLayoutProps = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    // Set current path
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: FiHome },
    { label: 'Orders', href: '/admin/orders', icon: FiPackage },
    { label: 'Users', href: '/admin/users', icon: FiUsers },
    { label: 'Accounts', href: '/admin/accounts', icon: FiDatabase },
    { label: 'Chat Support', href: '/admin/chat', icon: FiMessageCircle },
    { label: 'Products', href: '/admin/products', icon: FiList },
    { label: 'Settings', href: '/admin/settings', icon: FiSettings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-teal-800 text-white shadow-lg hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>

        <div className="mt-6">
          <nav>
            <ul>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-6 py-3 hover:bg-teal-700 transition-colors ${
                        currentPath === item.href ? 'bg-teal-700' : ''
                      }`}
                    >
                      <Icon className="mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6">
          <Link
            href="/"
            className="flex items-center px-4 py-2 text-teal-300 hover:text-white hover:bg-teal-700 rounded-lg transition-colors"
          >
            <FiLogOut className="mr-3" />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 md:hidden bg-teal-800 text-white shadow-lg">
        <div className="flex justify-around">
          {menuItems.slice(0, 5).map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className="flex flex-col items-center p-4 hover:bg-teal-700 transition-colors"
              >
                <Icon className="text-xl" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        <header className="bg-teal-50 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">
                {session?.user?.name}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 