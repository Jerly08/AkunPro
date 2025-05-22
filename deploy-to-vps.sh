#!/bin/bash

# Build aplikasi
echo "Building application..."
npm run build

# Add all changes to git
echo "Adding changes to git..."
git add .

# Commit changes
echo "Committing changes..."
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"

# Push to repository
echo "Pushing to repository..."
git push origin main

echo "Deployment finished!"
echo ""
echo "=== PETUNJUK DEPLOYMENT KE VPS ==="
echo "1. SSH ke VPS:"
echo "   ssh user@vps_ip"
echo ""
echo "2. Masuk ke direktori project:"
echo "   cd AkunPro"
echo ""
echo "3. Pull perubahan terbaru:"
echo "   git pull"
echo ""
echo "4. Rebuild dan restart container:"
echo "   docker compose down"
echo "   docker compose build --no-cache"
echo "   docker compose up -d"
echo ""
echo "5. Jalankan migrasi Prisma (jika ada):"
echo "   docker exec -it akunpro-app-1 sh -c 'npx prisma migrate deploy'"
echo ""
echo "6. Jika masih ada masalah izin upload, jalankan:"
echo "   docker exec -it akunpro-app-1 sh -c 'mkdir -p /app/public/uploads/payments && chown -R nextjs:nodejs /app/public/uploads && chmod -R 755 /app/public/uploads'"
echo ""
echo "7. Pastikan direktori uploads memiliki izin yang benar:"
echo "   docker exec -it akunpro-app-1 ls -la /app/public/uploads"
echo ""
echo "8. Restart container aplikasi jika diperlukan:"
echo "   docker restart akunpro-app-1"
echo ""
echo "Selesai!" 