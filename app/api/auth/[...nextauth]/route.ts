import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

// Konfigurasi NextAuth untuk Next.js 15
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              image: true,
            },
          });

          if (!user) {
            return null;
          }

          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/login",
    newUser: "/auth/register",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Handle URL redirects properly
      if (url.startsWith('/')) {
        // Make sure relative URLs are properly prefixed with baseUrl
        return `${baseUrl}${url}`;
      } else if (url.startsWith(baseUrl)) {
        // If URL is absolute but still in our domain, allow it
        return url;
      }
      // Default back to homepage
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      if (code === 'NO_SECRET') {
        console.error('CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is not set');
        // Log ke sistem monitoring
      }
      console.error(code, metadata);
    },
  },
};

// Periksa secret sebelum menyiapkan handler
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is not set. Application startup aborted for security.');
}

// Menggunakan handler sederhana untuk Next.js 15 App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 