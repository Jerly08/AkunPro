import { Metadata } from 'next';
import { ProductJsonLd } from '@/components/SEO/JsonLd';

export const metadata: Metadata = {
  title: 'Akun Spotify Premium | Harga Terjangkau dengan Garansi | AkunPro',
  description: 'Beli akun Spotify premium original dengan harga terjangkau, garansi, dan berbagai pilihan paket. Nikmati musik tanpa iklan di AkunPro.',
  keywords: 'akun spotify, spotify premium, jual akun spotify, spotify murah, beli akun spotify, spotify bergaransi',
  alternates: {
    canonical: '/spotify',
  },
  openGraph: {
    title: 'Akun Spotify Premium | Harga Terjangkau dengan Garansi | AkunPro',
    description: 'Beli akun Spotify premium original dengan harga terjangkau, garansi, dan berbagai pilihan paket. Nikmati musik tanpa iklan di AkunPro.',
    url: 'https://akunpro.com/spotify',
    type: 'website',
    images: [
      {
        url: '/images/spotify-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Akun Spotify Premium',
      },
    ],
  },
};

export default function SpotifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd
        name="Akun Spotify Premium"
        description="Akun Spotify Premium bergaransi, akses ke semua fitur tanpa batasan, nikmati musik tanpa iklan"
        image="https://akunpro.com/images/spotify-product.jpg"
        price={29000}
        sku="spotify-premium-1"
      />
      {children}
    </>
  );
} 