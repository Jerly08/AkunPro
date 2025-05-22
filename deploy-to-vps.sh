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
echo "Now connect to your VPS and run the following commands:"
echo "cd AkunPro"
echo "git pull"
echo "docker compose down"
echo "docker compose build --no-cache"
echo "docker compose up -d"
echo "docker exec -it akunpro-app-1 sh -c 'npx prisma migrate deploy'"
echo "Done!" 