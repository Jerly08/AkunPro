# Panduan Lengkap Deployment AkunPro di VPS

## Prasyarat

- VPS dengan minimal spesifikasi:
  - 2GB RAM
  - 2 CPU Cores
  - 40GB Storage
- Domain `myakunpro.com` yang sudah dikonfigurasi mengarah ke IP VPS
- Akses SSH ke VPS

## Langkah 1: Siapkan VPS

1. Login ke VPS Anda:

```bash
ssh user@your_server_ip
```

2. Update sistem:

```bash
sudo apt update && sudo apt upgrade -y
```

3. Install Docker dan Docker Compose:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Tambahkan user ke group docker (agar tidak perlu sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y
```

## Langkah 2: Download dan Setup Aplikasi

1. Clone repository dari GitHub:

```bash
# Buat direktori untuk aplikasi
mkdir -p ~/apps
cd ~/apps

# Clone repository (gunakan URL repository Anda)
git clone https://github.com/YOURUSERNAME/netflix-spotify-marketplace.git akunpro
cd akunpro
```

2. Pastikan script deployment memiliki izin eksekusi:

```bash
chmod +x deploy.sh
```

## Langkah 3: Konfigurasi DNS

Sebelum menjalankan deployment, pastikan domain `myakunpro.com` sudah dikonfigurasi dengan benar di provider DNS Anda:

1. Buat A record yang mengarahkan `myakunpro.com` ke IP VPS Anda
2. Buat A record yang mengarahkan `www.myakunpro.com` ke IP VPS Anda

Perubahan DNS bisa memakan waktu hingga 24-48 jam untuk disebarkan secara global, tetapi biasanya hanya beberapa menit hingga beberapa jam.

## Langkah 4: Deployment

Jalankan script deployment:

```bash
./deploy.sh
```

Script ini akan:
- Memeriksa apakah Docker dan Docker Compose terinstall
- Membuat folder yang diperlukan
- Membuat file konfigurasi NGINX jika belum ada
- Membuat file `.env` dengan nilai acak jika belum ada
- Menawarkan setup SSL dengan Certbot
- Menjalankan aplikasi dengan Docker Compose

## Langkah 5: Keamanan dan Maintenance

### Firewall (UFW)

Aktifkan firewall dan buka port yang diperlukan:

```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Auto Update SSL

Script deployment otomatis mengatur auto-renewal sertifikat SSL. Konfigurasi ini dijalankan setiap hari pada pukul 3 pagi.

### Monitoring

Untuk memantau aplikasi:

```bash
# Melihat semua container
docker ps

# Melihat logs aplikasi
docker compose logs -f app

# Melihat logs database
docker compose logs -f db

# Melihat logs NGINX
docker compose logs -f nginx
```

### Backup Database

Backup otomatis database dilakukan saat deployment, tapi Anda juga bisa melakukannya secara manual:

```bash
docker compose exec -T db mysqldump -uroot -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)" akunpro > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Langkah 6: Scaling (Opsional)

Jika Anda membutuhkan performa yang lebih baik, bisa mempertimbangkan:

1. Menambah jumlah replika aplikasi:

Edit file `docker-compose.yml` dan tambahkan bagian `deploy`:

```yaml
services:
  app:
    # ... konfigurasi lainnya
    deploy:
      replicas: 3
```

2. Menggunakan Load Balancer seperti Traefik atau HAProxy.

## Troubleshooting

### SSL tidak berfungsi

1. Periksa apakah sertifikat ada:

```bash
ls -la nginx/ssl/
```

2. Restart NGINX:

```bash
docker compose restart nginx
```

### Aplikasi tidak dapat diakses

1. Periksa status container:

```bash
docker compose ps
```

2. Periksa logs:

```bash
docker compose logs -f
```

3. Restart aplikasi:

```bash
docker compose restart app
```

### Database tidak dapat diakses

1. Periksa logs database:

```bash
docker compose logs db
```

2. Pastikan volume database sudah dibuat:

```bash
docker volume ls
```

## Pembaruan Aplikasi

Untuk update aplikasi ke versi terbaru:

```bash
cd ~/apps/akunpro
git pull
./deploy.sh
```

Script deployment akan otomatis membackup database sebelum update dan menjalankan migrasi database setelah update.

## Bantuan Lebih Lanjut

Jika Anda memerlukan bantuan lebih lanjut, silakan hubungi tim pengembang di support@myakunpro.com. 