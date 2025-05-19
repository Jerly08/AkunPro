import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan | 404 Error | AkunPro',
  description: 'Maaf, halaman yang Anda cari tidak ditemukan di situs AkunPro. Silakan kembali ke halaman utama untuk melanjutkan.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Maaf, halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak tersedia.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition duration-200"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
} 