# Petunjuk Deployment AkunPro di VPS

Dokumen ini berisi petunjuk lengkap untuk melakukan deployment aplikasi AkunPro di VPS dengan domain myakunpro.com menggunakan Docker dan HTTPS.

## Kebutuhan Sistem

- VPS dengan minimal 2GB RAM
- OS: Ubuntu 20.04 atau yang lebih baru
- Docker dan Docker Compose terinstall
- Domain myakunpro.com telah dikonfigurasi untuk mengarah ke IP VPS Anda
- Port 80 dan 443 terbuka

## Langkah-langkah Deployment

### 1. Persiapan Server

```bash
# Update sistem
apt update && apt upgrade -y

# Install Docker jika belum ada
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose jika belum ada
apt install docker-compose-plugin -y

# Install Git
apt install git -y
```

### 2. Clone Repository

```bash
# Clone repository
git clone https://github.com/YOURUSERNAME/netflix-spotify-marketplace.git
cd netflix-spotify-marketplace
```

### 3. Konfigurasi Deployment

```bash
# Beri izin eksekusi pada script deployment
chmod +x deploy.sh

# Jalankan script deployment
./deploy.sh
```

Script deployment akan:
- Mengecek apakah Docker dan Docker Compose terinstall
- Melakukan clone atau update repository
- Membuat struktur folder yang diperlukan
- Membuat file .env jika belum ada
- Menawarkan setup SSL menggunakan Certbot
- Menjalankan aplikasi dengan Docker Compose

### 4. Konfigurasi Tambahan

#### File .env

Pastikan untuk mengubah nilai pada file `.env` sesuai dengan kebutuhan Anda:

```
MYSQL_ROOT_PASSWORD=<password_database_yang_aman>
DATABASE_URL=mysql://root:<password_database_yang_aman>@db:3306/akunpro
NEXTAUTH_URL=https://myakunpro.com
NEXTAUTH_SECRET=<secret_key_yang_aman>
```

#### Sertifikat SSL

Jika Anda memilih untuk tidak menggunakan Certbot, pastikan untuk menempatkan sertifikat SSL Anda sendiri di folder `nginx/ssl`:
- `fullchain.pem` - Sertifikat lengkap
- `privkey.pem` - Private key

### 5. Manajemen Aplikasi

```bash
# Melihat status container
docker-compose ps

# Melihat logs
docker-compose logs -f

# Restart aplikasi
docker-compose restart

# Menghentikan aplikasi
docker-compose down

# Menjalankan aplikasi kembali
docker-compose up -d
```

### 6. Auto-Renewal Sertifikat SSL

Jika Anda menggunakan Certbot, tambahkan cron job untuk memperpanjang sertifikat secara otomatis:

```bash
crontab -e
```

Tambahkan baris berikut:

```
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/myakunpro.com/fullchain.pem /path/to/netflix-spotify-marketplace/nginx/ssl/ && cp /etc/letsencrypt/live/myakunpro.com/privkey.pem /path/to/netflix-spotify-marketplace/nginx/ssl/ && docker-compose restart nginx
```

## Troubleshooting

### Masalah Database

Jika aplikasi tidak dapat terhubung ke database:

1. Pastikan nilai `DATABASE_URL` di file `.env` benar
2. Periksa apakah container database berjalan: `docker-compose ps`
3. Periksa logs database: `docker-compose logs db`

### Masalah SSL

Jika HTTPS tidak berfungsi:

1. Pastikan sertifikat SSL terletak di folder `nginx/ssl`
2. Periksa nama domain di file `nginx/conf/default.conf` sesuai dengan domain Anda
3. Periksa logs nginx: `docker-compose logs nginx`

### Masalah Aplikasi

Jika aplikasi tidak berjalan dengan baik:

1. Periksa logs aplikasi: `docker-compose logs app`
2. Pastikan semua environment variables sudah benar di file `.env`
3. Rebuild aplikasi jika diperlukan: `docker-compose up -d --build`

## Bantuan

Jika Anda memerlukan bantuan lebih lanjut, silakan hubungi tim pengembang. 