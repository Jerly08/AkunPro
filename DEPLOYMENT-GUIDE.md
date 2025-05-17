# Panduan Deployment AkunPro

Dokumen ini memberikan panduan lengkap untuk deployment aplikasi AkunPro dengan domain myakunpro.com, baik untuk pengembangan lokal maupun deployment ke VPS.

## 1. Pengembangan Lokal (Windows)

Untuk pengembangan di Windows, gunakan PowerShell script yang disediakan:

```powershell
.\deploy-windows.ps1
```

Script ini akan memberikan opsi:
1. **Local Development** - Menjalankan Next.js development server
2. **Docker Development** - Menjalankan aplikasi dalam container dengan hot-reload
3. **Docker Production** - Simulasi environment production dengan HTTPS

### Persyaratan Local Development

- Node.js 18+ terinstall
- npm terinstall
- MySQL (opsional, dapat menggunakan Docker)

### Persyaratan Docker Development

- Docker Desktop terinstall
- WSL2 terinstall (untuk Windows)

## 2. Deployment ke VPS

Untuk deployment ke VPS (Ubuntu/Debian Linux), ikuti langkah-langkah berikut:

### Persiapan

1. Server VPS dengan minimal:
   - 2GB RAM
   - 2 CPU Cores
   - 40GB Storage
2. Domain yang mengarah ke IP VPS Anda (`myakunpro.com` & `www.myakunpro.com`)
3. Akses SSH ke server

### Langkah Deployment

1. SSH ke server VPS Anda
2. Clone repository:
   ```bash
   mkdir -p ~/apps
   cd ~/apps
   git clone https://github.com/YOURUSERNAME/netflix-spotify-marketplace.git akunpro
   cd akunpro
   ```

3. Jalankan script deployment:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

Script deployment akan otomatis:
- Memeriksa instalasi Docker & Docker Compose
- Membuat struktur folder yang diperlukan
- Membuat file `.env` jika belum ada
- Menawarkan setup SSL dengan Certbot
- Menjalankan aplikasi dengan Docker Compose

### Konfigurasi Lanjutan

Petunjuk lebih detail tersedia di:
- [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) - Panduan lengkap deployment di VPS
- [DEPLOYMENT.md](DEPLOYMENT.md) - Dokumentasi deployment lainnya

## 3. Deployment dengan GitHub Actions

Untuk otomatisasi deployment, konfigurasikan GitHub Actions:

1. Di repository GitHub, tambahkan Secrets berikut:
   - `SSH_PRIVATE_KEY`: Private key untuk SSH ke VPS
   - `SSH_USER`: Username SSH di VPS
   - `VPS_HOST`: Hostname/IP VPS
   - `DEPLOY_DIR`: Path ke direktori aplikasi di VPS

2. Workflow GitHub Actions akan menjalankan deployment otomatis saat ada push ke branch `main`.

## 4. Pembaruan Aplikasi

### Di Windows (Development)

Jalankan:
```powershell
git pull
.\deploy-windows.ps1
```

### Di VPS (Production)

```bash
cd ~/apps/akunpro
git pull
./deploy.sh
```

## 5. Monitoring & Maintenance

### Log Aplikasi

```bash
# Di VPS
docker compose logs -f app
```

### Backup Database

```bash
# Di VPS
docker compose exec -T db mysqldump -uroot -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)" akunpro > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Bantuan & Troubleshooting

Lihat [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) untuk panduan troubleshooting dan bantuan lebih lanjut. 