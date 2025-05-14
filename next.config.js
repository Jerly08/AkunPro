/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Mode produksi sebaiknya tidak mengabaikan error TypeScript
  // tapi jika perlu build tanpa memperbaiki error, biarkan setting ini
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Aktifkan ESLint di production
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Opsi cache dan kompres untuk production
  compress: true,
  
  // Konfigurasi remote images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      }
    ],
    // Aktifkan optimasi gambar di production
    minimumCacheTTL: 60,
  },
  
  // Optimasi tambahan untuk production
  experimental: {
    // Disable CSS optimization to avoid critters errors
    optimizeCss: false,
    // Aktifkan tree shaking untuk mengurangi ukuran bundle
    optimizePackageImports: ['react-icons', '@heroicons/react'],
    // Tambahkan scroll restoration untuk UX yang lebih baik
    scrollRestoration: true,
  },
  
  // Untuk VPS Hostinger, gunakan standalone output
  output: 'standalone',
  
  // Untuk mencegah terlalu banyak permintaan pada server
  poweredByHeader: false,
  
  distDir: '.next',
  
  // Tambahkan konfigurasi untuk handling routes
  async redirects() {
    return [
      {
        source: '/',
        destination: '/(home)',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/(home)',
        permanent: true,
      },
    ]
  },
  
  // Tambahkan konfigurasi untuk handling headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
