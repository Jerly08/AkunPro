import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/hooks/useToast";
import CartInitializer from "@/components/cart/CartInitializer";
import { CartProvider } from '@/contexts/CartContext';
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import FloatingChat from "@/components/chat/FloatingChat";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/SEO/JsonLd";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AkunPro - Marketplace Premium Accounts | Netflix, Spotify dan lainnya",
  description: "AkunPro adalah marketplace terpercaya untuk membeli akun premium Netflix, Spotify dan layanan digital lainnya dengan harga terjangkau dan garansi.",
  keywords: "akun premium, netflix, spotify, marketplace akun, akun digital, jual beli akun premium",
  authors: [{ name: "AkunPro", url: "https://akunpro.com" }],
  creator: "AkunPro",
  publisher: "AkunPro",
  formatDetection: {
    email: false,
    telephone: false,
  },
  metadataBase: new URL("https://akunpro.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "AkunPro - Marketplace Premium Accounts | Netflix, Spotify dan lainnya",
    description: "AkunPro adalah marketplace terpercaya untuk membeli akun premium Netflix, Spotify dan layanan digital lainnya dengan harga terjangkau dan garansi.",
    url: "https://akunpro.com",
    siteName: "AkunPro",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/akunpro-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AkunPro Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AkunPro - Marketplace Premium Accounts",
    description: "Marketplace terpercaya untuk membeli akun premium dengan harga terjangkau dan garansi.",
    images: ["/images/akunpro-twitter-image.jpg"],
  },
  verification: {
    google: "google-site-verification-code", // Replace with your Google verification code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark-content-preserve">
      <head>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <CartInitializer />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow pt-20">{children}</main>
                <ConditionalFooter />
              </div>
              <FloatingChat />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
