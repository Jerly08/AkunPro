# Railway Database Setup Guide for AkunPro

Follow these steps to set up your MySQL database on Railway:

## 1. Create a Railway Account

1. Go to [railway.app](https://railway.app/)
2. Sign up for an account or log in if you already have one

## 2. Create a New Project

1. Click "New Project" on your dashboard
2. Select "Provision MySQL" from the templates
3. Wait for the database to be created (usually takes less than a minute)

## 3. Get Your Database Connection String

1. Click on the MySQL service in your project
2. Go to the "Connect" tab
3. Find "MySQL Connection URL" (it should look like: `mysql://root:password@railwayhost.railway.app:port/railway`)
4. Copy this connection string - you'll need it for your Vercel deployment

## 4. Database Migration

For a one-time setup, you'll need to run your Prisma migrations and seed the database. 
You can do this locally by setting the correct DATABASE_URL in your .env file:

```bash
# Update your .env file with the Railway connection string
DATABASE_URL="mysql://root:your-password@railwayhost.railway.app:port/railway"

# Run migrations
npx prisma migrate deploy

# Seed the database
npm run prisma:seed
```

## 5. Variables You'll Need for Vercel

Make note of these from your Railway MySQL instance:
- Database Host: HOSTNAME.railway.app
- Database Port: PORT
- Database Name: railway
- Database Username: root
- Database Password: PASSWORD
- Full Connection URL: mysql://root:PASSWORD@HOSTNAME.railway.app:PORT/railway 