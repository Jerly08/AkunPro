#!/bin/bash

# Script untuk melakukan deployment di VPS
set -e

# Warna untuk output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
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

# Check if docker-compose is available (either standalone or as docker compose plugin)
if ! [ -x "$(command -v docker-compose)" ] && ! [ -x "$(command -v docker)" ] && ! docker compose version > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker Compose tidak terinstall.${NC}" >&2
  echo "Silakan install docker-compose terlebih dahulu:"
  echo "apt install docker-compose-plugin"
  exit 1
fi

# Define docker compose command based on what's available
if [ -x "$(command -v docker-compose)" ]; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# Backup database if exists
if $DOCKER_COMPOSE ps db 2>&1 | grep -q "Up"; then
  echo -e "${YELLOW}Backing up database before deployment...${NC}"
  BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
  mkdir -p ./backups
  $DOCKER_COMPOSE exec -T db mysqldump -uroot -p"${MYSQL_ROOT_PASSWORD}" akunpro > ./backups/akunpro_${BACKUP_DATE}.sql
  echo -e "${GREEN}Database backup created: backups/akunpro_${BACKUP_DATE}.sql${NC}"
fi

# Pastikan folder nginx/ssl ada
mkdir -p nginx/ssl
mkdir -p nginx/conf
mkdir -p nginx/www

# Update default Nginx config if not exists
if [ ! -f "nginx/conf/default.conf" ]; then
  echo -e "${GREEN}Creating nginx default.conf...${NC}"
  cat > nginx/conf/default.conf << 'EOF'
server {
    listen 80;
    server_name myakunpro.com www.myakunpro.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
fi

# Cek file .env
if [ ! -f ".env" ]; then
  echo -e "${RED}File .env tidak ditemukan!${NC}"
  echo "Membuat file .env dari template..."
  
  # Generate secure random password and secret
  DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  
  cat > .env << EOF
# Database
MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
DATABASE_URL=mysql://root:${DB_PASSWORD}@db:3306/akunpro

# Next Auth
NEXTAUTH_URL=https://myakunpro.com
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Application
NODE_ENV=production
EOF

  echo -e "${GREEN}File .env dibuat dengan nilai password dan secret otomatis.${NC}"
  echo -e "${YELLOW}PENTING: Pastikan untuk mencatat password dan secret yang dibuat!${NC}"
fi

# Meminta SSL
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
  echo -e "${YELLOW}Sertifikat SSL tidak ditemukan.${NC}"
  echo -e "${GREEN}Apakah Anda ingin setup SSL dengan Certbot? (y/n)${NC}"
  read -r setup_ssl

  if [ "$setup_ssl" = "y" ]; then
    # Stop Nginx jika berjalan (untuk membebaskan port 80)
    $DOCKER_COMPOSE down nginx 2>/dev/null || true
    
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
    
    # Set proper permissions
    chmod 644 ./nginx/ssl/*.pem
    
    echo -e "${GREEN}Sertifikat SSL berhasil dibuat dan disalin.${NC}"
    echo -e "${YELLOW}Setting up auto-renewal cron job...${NC}"
    
    CURRENT_DIR=$(pwd)
    # Create renewal script
    cat > renew-ssl.sh << EOF
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/myakunpro.com/fullchain.pem $CURRENT_DIR/nginx/ssl/
cp /etc/letsencrypt/live/myakunpro.com/privkey.pem $CURRENT_DIR/nginx/ssl/
cd $CURRENT_DIR && $DOCKER_COMPOSE restart nginx
EOF
    
    chmod +x renew-ssl.sh
    
    # Check if crontab entry exists
    if ! (crontab -l 2>/dev/null | grep -q "$CURRENT_DIR/renew-ssl.sh"); then
      (crontab -l 2>/dev/null; echo "0 3 * * * $CURRENT_DIR/renew-ssl.sh") | crontab -
      echo -e "${GREEN}Cron job untuk auto-renewal berhasil ditambahkan.${NC}"
    fi
  else
    echo -e "${RED}Peringatan: Anda harus menyediakan sertifikat SSL secara manual di folder nginx/ssl/${NC}"
    echo "fullchain.pem dan privkey.pem diperlukan untuk HTTPS."
    exit 1
  fi
fi

# Pull latest Docker images to ensure we have the latest versions
echo -e "${GREEN}Pulling latest Docker images...${NC}"
$DOCKER_COMPOSE pull

# Start Docker Compose
echo -e "${GREEN}Menjalankan docker-compose...${NC}"
$DOCKER_COMPOSE up -d --build

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Run Prisma migrations
echo -e "${GREEN}Running database migrations...${NC}"
$DOCKER_COMPOSE exec app npx prisma migrate deploy

echo -e "${GREEN}====== Deployment berhasil! ======${NC}"
echo "Aplikasi Anda sekarang tersedia di https://myakunpro.com"
echo -e "${YELLOW}Untuk melihat logs: ${NC}$DOCKER_COMPOSE logs -f"
echo -e "${YELLOW}Untuk restart aplikasi: ${NC}$DOCKER_COMPOSE restart"
echo -e "${YELLOW}Untuk menghentikan aplikasi: ${NC}$DOCKER_COMPOSE down" 