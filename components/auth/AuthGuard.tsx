'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Komponen untuk mengamankan halaman di sisi klien
 * 
 * Gunakan komponen ini untuk melindungi rute yang hanya bisa diakses oleh user yang terautentikasi
 * atau user dengan role tertentu.
 * 
 * Contoh:
 * ```
 * // Hanya untuk user yang terautentikasi
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 * 
 * // Hanya untuk admin
 * <AuthGuard requiredRole="ADMIN">
 *   <AdminPage />
 * </AuthGuard>
 * ```
 */
const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Jika sedang memuat sesi, biarkan proses berlanjut
    if (status === 'loading') return;

    // Jika pengguna tidak terautentikasi, arahkan ke halaman login
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Jika user adalah admin dan mencoba mengakses dashboard user biasa, arahkan ke dashboard admin
    if (session?.user?.role === 'ADMIN' && pathname === '/dashboard') {
      router.push('/admin');
      return;
    }

    // Jika memerlukan role tertentu, periksa apakah pengguna memiliki role tersebut
    if (requiredRole && session?.user?.role !== requiredRole) {
      // Jika user bukan admin, arahkan ke dashboard user
      // Jika user adalah admin tapi mencoba mengakses halaman yang memerlukan role lain, arahkan ke dashboard admin
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, requiredRole, router, pathname]);

  // Tampilkan loading state jika status masih loading atau pengguna belum diautentikasi
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Jika memerlukan role tertentu dan pengguna tidak memiliki role tersebut, tampilkan loading
  if (requiredRole && session?.user?.role !== requiredRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Tampilkan children jika semua syarat terpenuhi
  return <>{children}</>;
};

export default AuthGuard; 