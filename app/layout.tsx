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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Akunpro",
  description: "Marketplace untuk akun premium",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
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
