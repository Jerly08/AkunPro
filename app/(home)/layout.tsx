import { Metadata } from 'next';
import { WebsiteJsonLd } from '@/components/SEO/JsonLd';

export const metadata: Metadata = {
  title: 'AkunPro - Marketplace Akun Premium | Netflix, Spotify dan Layanan Digital Lainnya',
  description: 'Beli akun premium Netflix, Spotify dan layanan digital lainnya dengan harga terjangkau, garansi, dan dukungan pelanggan 24/7. Nikmati pengalaman digital premium sekarang!',
  keywords: 'akun premium, marketplace akun, netflix murah, spotify murah, jual akun premium, beli akun streaming, akun digital bergaransi',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AkunPro - Marketplace Akun Premium | Netflix, Spotify dan Layanan Digital',
    description: 'Beli akun premium Netflix, Spotify dan layanan digital lainnya dengan harga terjangkau, garansi, dan dukungan pelanggan 24/7.',
    url: 'https://akunpro.com',
    type: 'website',
    siteName: 'AkunPro',
    locale: 'id_ID',
    images: [
      {
        url: '/images/akunpro-homepage-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'AkunPro Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AkunPro - Marketplace Akun Premium',
    description: 'Beli akun premium dengan harga terjangkau dan garansi.',
    images: ['/images/akunpro-twitter-image.jpg'],
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebsiteJsonLd
        url="https://akunpro.com"
        name="AkunPro - Marketplace Akun Premium"
      />
      {children}
    </>
  );
} 