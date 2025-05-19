import { Metadata } from 'next';
import { ProductJsonLd } from '@/components/SEO/JsonLd';

export const metadata: Metadata = {
  title: 'Akun Netflix Premium | Harga Terjangkau dengan Garansi | AkunPro',
  description: 'Beli akun Netflix premium original dengan harga terjangkau, garansi, layanan 24/7, dan berbagai pilihan paket. Nikmati streaming tanpa batas di AkunPro.',
  keywords: 'akun netflix, netflix premium, jual akun netflix, netflix murah, beli akun netflix, netflix bergaransi',
  alternates: {
    canonical: '/netflix',
  },
  openGraph: {
    title: 'Akun Netflix Premium | Harga Terjangkau dengan Garansi | AkunPro',
    description: 'Beli akun Netflix premium original dengan harga terjangkau, garansi, layanan 24/7, dan berbagai pilihan paket. Nikmati streaming tanpa batas di AkunPro.',
    url: 'https://akunpro.com/netflix',
    type: 'website',
    images: [
      {
        url: '/images/netflix-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Akun Netflix Premium',
      },
    ],
  },
};

export default function NetflixLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd
        name="Akun Netflix Premium"
        description="Akun Netflix Premium bergaransi, akses ke semua fitur tanpa batasan, support 4 device"
        image="https://akunpro.com/images/netflix-product.jpg"
        price={49000}
        sku="netflix-premium-1"
      />
      {children}
    </>
  );
} 