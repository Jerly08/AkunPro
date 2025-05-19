# PowerShell script untuk setup dan deploy AkunPro di Windows
# Script ini digunakan untuk pengembangan, tidak untuk production deployment

# Fungsi pembantu untuk menampilkan pesan berwarna
function Write-ColorMessage {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Periksa apakah Docker sudah terinstall
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ColorMessage "Error: Docker tidak ditemukan. Silakan install Docker Desktop." -ForegroundColor "Red"
    Write-Host "Download dari: https://www.docker.com/products/docker-desktop/"
    exit 1
}

# Create directories if they don't exist
Write-ColorMessage "Membuat direktori yang diperlukan..." -ForegroundColor "Green"
if (-not (Test-Path -Path ".\nginx\ssl")) {
    New-Item -ItemType Directory -Force -Path ".\nginx\ssl" | Out-Null
}
if (-not (Test-Path -Path ".\nginx\conf")) {
    New-Item -ItemType Directory -Force -Path ".\nginx\conf" | Out-Null
}
if (-not (Test-Path -Path ".\nginx\www")) {
    New-Item -ItemType Directory -Force -Path ".\nginx\www" | Out-Null
}

# Create nginx default.conf if it doesn't exist
if (-not (Test-Path -Path ".\nginx\conf\default.conf")) {
    Write-ColorMessage "Membuat konfigurasi nginx default..." -ForegroundColor "Green"
    @"
server {
    listen 80;
    server_name myakunpro.com www.myakunpro.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://`$host`$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name myakunpro.com www.myakunpro.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy Next.js application
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
}
"@ | Out-File -FilePath ".\nginx\conf\default.conf" -Encoding utf8
}

# Create .env file if it doesn't exist
if (-not (Test-Path -Path ".\.env")) {
    Write-ColorMessage "File .env tidak ditemukan. Membuat file .env baru..." -ForegroundColor "Green"
    
    # Generate random password and secret
    $DBPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    $NextAuthSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
    
    @"
# Database
MYSQL_ROOT_PASSWORD=$DBPassword
DATABASE_URL=mysql://root:$DBPassword@db:3306/akunpro

# Next Auth
NEXTAUTH_URL=https://myakunpro.com
NEXTAUTH_SECRET=$NextAuthSecret

# Application - Untuk development di localhost
# (Gunakan http://localhost:3000 untuk pengembangan lokal)
NODE_ENV=development
"@ | Out-File -FilePath ".\.env" -Encoding utf8
    
    Write-ColorMessage "File .env berhasil dibuat dengan kredensial acak." -ForegroundColor "Green"
    Write-ColorMessage "PENTING: Simpan password dan secret ini untuk keperluan mendatang!" -ForegroundColor "Yellow"
}

# Create self-signed SSL certificates for development
if ((-not (Test-Path -Path ".\nginx\ssl\fullchain.pem")) -or (-not (Test-Path -Path ".\nginx\ssl\privkey.pem"))) {
    Write-ColorMessage "Sertifikat SSL tidak ditemukan. Membuat sertifikat self-signed untuk development..." -ForegroundColor "Yellow"
    
    try {
        # Check if OpenSSL exists
        if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
            Write-ColorMessage "OpenSSL tidak ditemukan. Untuk development, Anda dapat menggunakan Next.js secara langsung tanpa Docker." -ForegroundColor "Yellow"
            Write-ColorMessage "Untuk production, pastikan SSL certificate sudah tersedia di server VPS." -ForegroundColor "Yellow"
        } else {
            # Create self-signed certificate
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout .\nginx\ssl\privkey.pem -out .\nginx\ssl\fullchain.pem -subj "/CN=localhost"
            Write-ColorMessage "Sertifikat self-signed berhasil dibuat!" -ForegroundColor "Green"
        }
    } catch {
        Write-ColorMessage "Gagal membuat sertifikat SSL: $_" -ForegroundColor "Red"
        Write-ColorMessage "Lanjutkan tanpa sertifikat untuk development" -ForegroundColor "Yellow"
    }
}

# Choose between local development and Docker
Write-ColorMessage "`nPilih mode deployment:" -ForegroundColor "Cyan"
Write-ColorMessage "1. Local Development (Next.js development server)" -ForegroundColor "White"
Write-ColorMessage "2. Docker Development (Container dengan hot-reload)" -ForegroundColor "White"
Write-ColorMessage "3. Docker Production (Container untuk simulasi production)" -ForegroundColor "White"
$choice = Read-Host "Pilihan Anda (1-3)"

switch ($choice) {
    "1" {
        Write-ColorMessage "`nMemulai Next.js development server..." -ForegroundColor "Green"
        npm install
        npx prisma generate
        npm run dev
    }
    "2" {
        Write-ColorMessage "`nMemulai Docker development environment..." -ForegroundColor "Green"
        docker-compose -f docker-compose.dev.yml up -d --build
        Write-ColorMessage "Server berjalan di http://localhost:3000" -ForegroundColor "Green"
    }
    "3" {
        Write-ColorMessage "`nMemulai Docker production environment..." -ForegroundColor "Green"
        docker-compose up -d --build
        Write-ColorMessage "Server berjalan di https://localhost (gunakan sertifikat self-signed)" -ForegroundColor "Green"
    }
    default {
        Write-ColorMessage "Pilihan tidak valid. Keluar dari script." -ForegroundColor "Red"
        exit 1
    }
}

Write-ColorMessage "`nSiap untuk development!" -ForegroundColor "Green"
Write-ColorMessage "Petunjuk deployment production di VPS tersedia di VPS-DEPLOYMENT.md" -ForegroundColor "Cyan" 