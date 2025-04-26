# AkunPro - Marketplace Akun Premium

![AkunPro Logo](public/akunpro-logo.png)

AkunPro adalah platform marketplace yang menyediakan akun premium Netflix dan Spotify dengan harga terjangkau dan jaminan kualitas.

## 🚀 Fitur Utama

- **Penjualan Akun Premium**: Akun Netflix dan Spotify berkualitas dengan garansi
- **Autentikasi Aman**: Sistem login dan registrasi dengan NextAuth
- **Dashboard Admin**: Panel admin untuk manajemen produk dan pengguna
- **Keranjang Belanja**: Keranjang belanja dengan penyimpanan lokal
- **Pembayaran**: Integrasi dengan sistem pembayaran (Midtrans)
- **Manajemen Order**: Pelacakan dan pengelolaan order
- **Desain Responsif**: Antarmuka yang responsif dan user-friendly

## 🛠️ Teknologi

- **Frontend**: Next.js 15 dengan App Router
- **Backend**: API Routes Next.js
- **Database**: MySQL dengan Prisma ORM
- **Autentikasi**: NextAuth.js
- **CSS**: TailwindCSS
- **State Management**: Zustand
- **Notifikasi**: React Hot Toast

## 📋 Prasyarat

- Node.js (versi 18.x atau yang lebih baru)
- MySQL Server
- NPM atau Yarn

## 🔧 Instalasi

1. **Clone repositori**
   ```bash
   git clone https://github.com/username/akunpro.git
   cd akunpro
   ```

2. **Instal dependensi**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Siapkan variabel lingkungan**
   Salin file `.env.example` ke `.env` dan isi dengan kredensial Anda:
   ```
   # Database connection for Prisma
   DATABASE_URL="mysql://username:password@localhost:3306/netflix_spotify_marketplace"
   
   # Direct database connection parameters (fallback)
   DATABASE_HOST="localhost"
   DATABASE_USER="root"
   DATABASE_PASSWORD=""
   DATABASE_NAME="netflix_spotify_marketplace"
   DATABASE_PORT=3306
   
   # NextAuth configuration
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   Untuk petunjuk selengkapnya tentang pengaturan variabel lingkungan, lihat [ENV-SETUP.md](ENV-SETUP.md).
   
   Validasi konfigurasi database Anda dengan menjalankan:
   ```bash
   node scripts/check-db-env.js
   ```

4. **Jalankan migrasi Prisma**
   ```bash
   npx prisma migrate dev
   ```

   Atau gunakan script database migration yang mendukung environment variables:
   ```bash
   node lib/db-migrate-env.js
   ```

5. **Isi database dengan data awal**
   ```bash
   npx prisma db seed
   ```

6. **Jalankan aplikasi dalam mode development**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

7. **Buka aplikasi**
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📊 Struktur Proyek

```
akunpro/
├── app/                # App Router Next.js
│   ├── api/            # API Routes
│   ├── admin/          # Halaman admin
│   ├── auth/           # Halaman autentikasi
│   └── ...             # Halaman dan komponen lainnya
├── components/         # Komponen React
├── contexts/           # Context Providers
├── hooks/              # Custom Hooks
├── lib/                # Utilitas dan konfigurasi
├── prisma/             # Skema dan migrasi Prisma
├── public/             # Aset statis
└── types/              # Definisi tipe TypeScript
```

## 🔒 Autentikasi dan Otorisasi

- **Registrasi Pengguna**: Pengguna dapat mendaftar dengan email dan password
- **Login**: Autentikasi aman dengan NextAuth
- **Role-Based Access**: Perbedaan akses antara admin dan pengguna biasa

## 🛒 Fitur Marketplace

- **Katalog Produk**: Tampilan produk yang intuitif
- **Filter dan Pencarian**: Pencarian produk berdasarkan kategori dan filter
- **Proses Checkout**: Proses pembelian yang mudah dan aman
- **Detail Transaksi**: Manajemen dan pelacakan transaksi

## 🧑‍💻 Pengembang

- [Nama Anda](https://github.com/username)

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
