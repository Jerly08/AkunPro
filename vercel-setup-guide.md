# Vercel Deployment Guide for AkunPro

Follow these steps to deploy your Next.js application on Vercel:

## 1. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com/)
2. Sign up for an account or log in if you already have one

## 2. Install Vercel CLI (Optional)

If you prefer using the command line:

```bash
npm install -g vercel
vercel login
```

## 3. Prepare Your Repository

1. Make sure your code is committed to GitHub
2. Push to the GitHub repository: https://github.com/Jerly08/AkunPro.git

## 4. Deploy to Vercel

### Method 1: Via Vercel Website (Recommended)

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository (you may need to connect GitHub if you haven't already)
4. Find and select "AkunPro" repository
5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

## 5. Environment Variables

Click "Environment Variables" and add the following:

```
# Database Configuration from Railway
DATABASE_URL=mysql://root:password@hostname.railway.app:port/railway
DATABASE_HOST=hostname.railway.app
DATABASE_USER=root
DATABASE_PASSWORD=your-railway-password
DATABASE_NAME=railway
DATABASE_PORT=port-from-railway

# NextAuth Configuration
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=generate-a-secure-random-string-here

# Node Environment
NODE_ENV=production
```

## 6. Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually takes a few minutes)
3. Once deployed, Vercel will provide you with a URL for your application

## 7. Custom Domain (Optional)

1. Go to "Settings" > "Domains"
2. Add your custom domain and follow the instructions

## 8. Troubleshooting

If you encounter issues with the database connection:
- Double-check your DATABASE_URL environment variable
- Ensure your Railway database is accessible from external services
- Check the Vercel deployment logs for specific errors

## 9. Continuous Deployment

Vercel automatically deploys when you push changes to your GitHub repository. To disable this:
1. Go to "Settings" > "Git"
2. Configure your deployment preferences 