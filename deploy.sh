#!/bin/bash

# Script untuk melakukan deployment di VPS
set -e

# Warna untuk output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}====== Memulai deployment AkunPro ======${NC}"

# Cek apakah docker dan docker-compose terinstall
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: Docker tidak terinstall.${NC}" >&2
  echo "Silakan install docker terlebih dahulu:"
  echo "curl -fsSL https://get.docker.com -o get-docker.sh"
  echo "sh get-docker.sh"
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ] && ! [ -x "$(command -v docker compose)" ]; then
  echo -e "${RED}Error: Docker Compose tidak terinstall.${NC}" >&2
  echo "Silakan install docker-compose terlebih dahulu:"
  echo "apt install docker-compose-plugin"
  exit 1
fi

# Clone atau pull repository
if [ -d "netflix-spotify-marketplace" ]; then
  echo -e "${GREEN}Mengupdate repository...${NC}"
  cd netflix-spotify-marketplace
  git pull
else
  echo -e "${GREEN}Melakukan clone repository...${NC}"
  git clone https://github.com/YOURUSERNAME/netflix-spotify-marketplace.git
  cd netflix-spotify-marketplace
fi

# Pastikan folder nginx/ssl ada
mkdir -p nginx/ssl
mkdir -p nginx/conf
mkdir -p nginx/www

# Cek file .env
if [ ! -f ".env" ]; then
  echo -e "${RED}File .env tidak ditemukan!${NC}"
  echo "Membuat file .env dari template..."
  echo "# Database
MYSQL_ROOT_PASSWORD=strong_password_here
DATABASE_URL=mysql://root:strong_password_here@db:3306/akunpro
NEXTAUTH_URL=https://myakunpro.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env
  echo -e "${GREEN}File .env dibuat. Silakan edit file tersebut dengan nilai yang sesuai.${NC}"
  echo -e "${RED}PENTING: Edit file .env sebelum melanjutkan!${NC}"
  exit 1
fi

# Meminta SSL
echo -e "${GREEN}Apakah Anda ingin setup SSL dengan Certbot? (y/n)${NC}"
read setup_ssl

if [ "$setup_ssl" = "y" ]; then
  # Install certbot jika belum ada
  if ! [ -x "$(command -v certbot)" ]; then
    echo -e "${GREEN}Menginstall certbot...${NC}"
    apt update
    apt install -y certbot
  fi
  
  echo -e "${GREEN}Membuat sertifikat SSL untuk myakunpro.com...${NC}"
  certbot certonly --standalone -d myakunpro.com -d www.myakunpro.com
  
  # Copy sertifikat ke folder nginx/ssl
  echo -e "${GREEN}Menyalin sertifikat SSL...${NC}"
  cp /etc/letsencrypt/live/myakunpro.com/fullchain.pem ./nginx/ssl/
  cp /etc/letsencrypt/live/myakunpro.com/privkey.pem ./nginx/ssl/
  
  echo -e "${GREEN}Sertifikat SSL berhasil dibuat dan disalin.${NC}"
else
  echo -e "${RED}Peringatan: Anda harus menyediakan sertifikat SSL secara manual di folder nginx/ssl/${NC}"
  echo "fullchain.pem dan privkey.pem diperlukan untuk HTTPS."
fi

# Start Docker Compose
echo -e "${GREEN}Menjalankan docker-compose...${NC}"
docker-compose up -d --build

echo -e "${GREEN}====== Deployment berhasil! ======${NC}"
echo "Aplikasi Anda sekarang tersedia di https://myakunpro.com" 