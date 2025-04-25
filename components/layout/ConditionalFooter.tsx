'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Cek apakah pengguna adalah admin atau sedang berada di halaman admin
  const isAdmin = session?.user?.role === 'ADMIN';
  const isAdminPage = pathname?.startsWith('/admin');

  // Jika pengguna adalah admin atau sedang di halaman admin, tidak tampilkan footer
  if (isAdmin || isAdminPage) {
    return null;
  }

  // Untuk pengguna lain, tampilkan footer seperti biasa
  return <Footer />;
};

export default ConditionalFooter; 