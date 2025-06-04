# Panduan Memperbaiki Error Deployment Vercel dengan Railway

Jika deployment Vercel mengalami error saat menggunakan database Railway, ikuti langkah-langkah berikut:

## 1. Periksa Environment Variables

Pastikan Anda telah mengatur environment variables berikut di dashboard Vercel:

```
# Database Configuration dari Railway
DATABASE_URL=mysql://root:jnMllEWZWFHLDQiwvElYiYgVZxOFQzyD@shuttle.proxy.rlwy.net:32165/railway
DATABASE_HOST=shuttle.proxy.rlwy.net
DATABASE_USER=root
DATABASE_PASSWORD=jnMllEWZWFHLDQiwvElYiYgVZxOFQzyD
DATABASE_NAME=railway
DATABASE_PORT=32165

# NextAuth Configuration
NEXTAUTH_URL=https://[DOMAIN-VERCEL-ANDA].vercel.app
NEXTAUTH_SECRET=supersecretkeyforthisapplicationdevelopment12345

# Node Environment
NODE_ENV=production
```

## 2. Perbaiki Script Build

Jika ada error terkait Prisma, perbarui script `vercel-build` di `package.json`:

```json
"vercel-build": "npx prisma generate && npx prisma db push --accept-data-loss && next build"
```

Ini menggunakan `db push` sebagai pengganti `migrate deploy`, yang lebih toleran terhadap error.

## 3. Update `vercel.json`

Jika build command di `vercel.json` menyebabkan error, ubah menjadi:

```json
"buildCommand": "npm run vercel-build",
```

## 4. Penanganan Error Umum

### Error: "Prisma failed to initialize"
- Periksa koneksi database: DATABASE_URL harus benar
- Pastikan database MySQL di Railway aktif
- Pastikan Railway mengizinkan koneksi dari Vercel

### Error: "Table already exists"
- Gunakan `db push` dengan flag `--accept-data-loss` untuk menangani konflik skema

### Error: "Database connection failed"
- Periksa apakah Railway membatasi koneksi dari IP eksternal
- Coba ubah parameter koneksi di DATABASE_URL

### Error: "NextAuth configuration error"
- Pastikan NEXTAUTH_URL sudah sesuai dengan URL deployment Vercel
- Pastikan NEXTAUTH_SECRET sudah diatur

## 5. Log Error Lengkap

Jika masih mengalami error:

1. Salin log error lengkap dari dashboard Vercel
2. Cek bagian yang menunjukkan pesan error spesifik
3. Bandingkan dengan petunjuk di atas

## 6. Redeploy dengan Konfigurasi Baru

Setelah melakukan perubahan di atas:

1. Push perubahan ke repository GitHub
2. Atau klik "Redeploy" di dashboard Vercel